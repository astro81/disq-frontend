import {
	collection,
	doc,
	setDoc,
	addDoc,
	onSnapshot,
	deleteDoc,
	getDocs,
	serverTimestamp,
	type Unsubscribe
} from 'firebase/firestore';
import { db } from '$lib/firebase';
import { SvelteMap } from 'svelte/reactivity';

export type VoiceParticipant = {
	memberId: string;
	displayName: string;
	userProfileImage?: string | null;
	audioEnabled: boolean;
	isLocal: boolean;
	isSpeaking: boolean;
};

let _participants = $state<VoiceParticipant[]>([]);
let _localStream = $state<MediaStream | null>(null);
let _audioEnabled = $state(true);
let _isJoined = $state(false);
let _error = $state<string | null>(null);

export const voiceState = {
	get participants() {
		return _participants;
	},
	get audioEnabled() {
		return _audioEnabled;
	},
	get isJoined() {
		return _isJoined;
	},
	get error() {
		return _error;
	}
};

// Ice Servers
const ICE_SERVERS: RTCConfiguration = {
	iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }]
};

type LocalMember = {
	memberId: string;
	displayName: string;
	userProfileImage?: string | null;
};

let localMember: LocalMember | null = null;
let currentChannelId: string | null = null;
const peerConnections = new SvelteMap<string, RTCPeerConnection>();
const audioAnalysers = new SvelteMap<
	string,
	{ analyser: AnalyserNode; interval: ReturnType<typeof setInterval> }
>();
const unsubscribes: Unsubscribe[] = [];

// Audio detection
function startSpeakingDetection(memberId: string, stream: MediaStream) {
	try {
		const ctx = new AudioContext();
		const source = ctx.createMediaStreamSource(stream);
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 512;
		source.connect(analyser);

		const data = new Uint8Array(analyser.frequencyBinCount);
		const interval = setInterval(() => {
			analyser.getByteFrequencyData(data);
			const avg = data.reduce((a, b) => a + b, 0) / data.length;
			const speaking = avg > 10;
			_participants = _participants.map((p) =>
				p.memberId === memberId ? { ...p, isSpeaking: speaking } : p
			);
		}, 100);

		audioAnalysers.set(memberId, { analyser, interval });
	} catch {
		// AudioContext unavailable
	}
}

function stopSpeakingDetection(memberId: string) {
	const entry = audioAnalysers.get(memberId);
	if (entry) {
		clearInterval(entry.interval);
		audioAnalysers.delete(memberId);
	}
}

// Join voice channel
export async function joinVoiceChannel(
	channelId: string,
	member: {
		memberId: string;
		displayName: string | null;
		username: string;
		userProfileImage?: string | null;
	}
) {
	if (currentChannelId === channelId && _isJoined) return;

	localMember = {
		memberId: member.memberId,
		displayName: member.displayName ?? member.username,
		userProfileImage: member.userProfileImage
	};
	currentChannelId = channelId;
	_error = null;

	// Get audio-only stream
	try {
		_localStream = await navigator.mediaDevices.getUserMedia({
			audio: { echoCancellation: true, noiseSuppression: true },
			video: false
		});

		_audioEnabled = true;
	} catch {
		_localStream = null;
		_audioEnabled = false;
		_error = 'Microphone unavailable';
	}

	// Add self as local participant
	_participants = [
		{
			memberId: localMember.memberId,
			displayName: localMember.displayName,
			userProfileImage: localMember.userProfileImage ?? null,
			audioEnabled: _audioEnabled,
			isLocal: true,
			isSpeaking: false
		}
	];

	if (_localStream) {
		startSpeakingDetection(localMember.memberId, _localStream);
	}

	// Register presence
	const peerDocRef = doc(db, 'voice-calls', channelId, 'peers', localMember.memberId);
	await setDoc(peerDocRef, {
		displayName: localMember.displayName,
		userProfileImage: localMember.userProfileImage ?? null,
		joinedAt: serverTimestamp()
	});

	// Offer to existing peers
	const peersSnap = await getDocs(collection(db, 'voice-calls', channelId, 'peers'));
	for (const peerDocSnap of peersSnap.docs) {
		if (peerDocSnap.id === localMember.memberId) continue;
		const d = peerDocSnap.data();
		await createOffer(channelId, peerDocSnap.id, d.displayName, d.userProfileImage);
	}

	// Watch peers
	const peersUnsub = onSnapshot(collection(db, 'voice-calls', channelId, 'peers'), (snap) => {
		snap.docChanges().forEach((change) => {
			const data = change.doc.data();
			const peerId = change.doc.id;
			if (change.type === 'added' && peerId !== localMember!.memberId) {
				addParticipantPlaceholder(peerId, data.displayName, data.userProfileImage);
			}
			if (change.type === 'removed') {
				removePeer(peerId);
			}
		});
	});
	unsubscribes.push(peersUnsub);

	// Watch offers addressed to us
	const offersUnsub = onSnapshot(collection(db, 'voice-calls', channelId, 'offers'), (snap) => {
		snap.docChanges().forEach(async (change) => {
			if (change.type === 'added') {
				const data = change.doc.data();
				if (data.to === localMember!.memberId && !peerConnections.has(data.from)) {
					await handleOffer(channelId, change.doc.id, data.from, data.sdp);
				}
			}
		});
	});
	unsubscribes.push(offersUnsub);

	_isJoined = true;
}

// Offer / Answer (audio only)
async function createOffer(
	channelId: string,
	remoteMemberId: string,
	displayName: string,
	userProfileImage: string | null
) {
	addParticipantPlaceholder(remoteMemberId, displayName, userProfileImage);
	const pc = createPeerConnection(remoteMemberId);
	const offerRef = doc(collection(db, 'voice-calls', channelId, 'offers'));

	pc.onicecandidate = async (e) => {
		if (e.candidate) {
			await addDoc(
				collection(db, 'voice-calls', channelId, 'offers', offerRef.id, 'offerCandidates'),
				e.candidate.toJSON()
			);
		}
	};

	const offer = await pc.createOffer();
	await pc.setLocalDescription(offer);
	await setDoc(offerRef, {
		from: localMember!.memberId,
		to: remoteMemberId,
		sdp: pc.localDescription!.toJSON()
	});

	const answerUnsub = onSnapshot(offerRef, async (snap) => {
		const data = snap.data();
		if (data?.answer && !pc.currentRemoteDescription) {
			await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
		}
	});
	unsubscribes.push(answerUnsub);

	const answerCandUnsub = onSnapshot(
		collection(db, 'voice-calls', channelId, 'offers', offerRef.id, 'answerCandidates'),
		(snap) => {
			snap.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					await pc.addIceCandidate(new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit));
				}
			});
		}
	);
	unsubscribes.push(answerCandUnsub);
}

async function handleOffer(
	channelId: string,
	offerId: string,
	fromMemberId: string,
	sdp: RTCSessionDescriptionInit
) {
	const pc = createPeerConnection(fromMemberId);
	const offerRef = doc(db, 'voice-calls', channelId, 'offers', offerId);

	pc.onicecandidate = async (e) => {
		if (e.candidate) {
			await addDoc(
				collection(db, 'voice-calls', channelId, 'offers', offerId, 'answerCandidates'),
				e.candidate.toJSON()
			);
		}
	};

	await pc.setRemoteDescription(new RTCSessionDescription(sdp));
	const answer = await pc.createAnswer();
	await pc.setLocalDescription(answer);
	await setDoc(offerRef, { answer: pc.localDescription!.toJSON() }, { merge: true });

	const offerCandUnsub = onSnapshot(
		collection(db, 'voice-calls', channelId, 'offers', offerId, 'offerCandidates'),
		(snap) => {
			snap.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					await pc.addIceCandidate(new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit));
				}
			});
		}
	);
	unsubscribes.push(offerCandUnsub);
}

// PeerConnection factory (audio only)
function createPeerConnection(remoteMemberId: string): RTCPeerConnection {
	const pc = new RTCPeerConnection(ICE_SERVERS);

	_localStream?.getAudioTracks().forEach((track) => pc.addTrack(track, _localStream!));

	pc.ontrack = (e) => {
		const stream = e.streams[0];
		// Play remote audio via a detached <audio> element
		const audio = new Audio();
		audio.srcObject = stream;
		audio.autoplay = true;

		//* stram takcing
		console.log('[Voice] Remote track received:', stream.getAudioTracks());
		audio.onplay = () => console.log('[Voice] Audio playing for', remoteMemberId);
		audio.onerror = (err) => console.error('[Voice] Audio error:', err);

		startSpeakingDetection(remoteMemberId, stream);
	};

	pc.onconnectionstatechange = () => {
		console.log(`[Voice] Peer ${remoteMemberId}: ${pc.connectionState}`);

		if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
			removePeer(remoteMemberId);
		}
	};

	peerConnections.set(remoteMemberId, pc);
	return pc;
}

function addParticipantPlaceholder(
	memberId: string,
	displayName: string,
	userProfileImage: string | null
) {
	if (_participants.find((p) => p.memberId === memberId)) return;
	_participants = [
		..._participants,
		{
			memberId,
			displayName,
			userProfileImage: userProfileImage ?? null,
			audioEnabled: true,
			isLocal: false,
			isSpeaking: false
		}
	];
}

function removePeer(memberId: string) {
	stopSpeakingDetection(memberId);
	peerConnections.get(memberId)?.close();
	peerConnections.delete(memberId);
	_participants = _participants.filter((p) => p.memberId !== memberId);
}

// Controls
export function toggleAudio() {
	_audioEnabled = !_audioEnabled;
	_localStream?.getAudioTracks().forEach((t) => {
		t.enabled = _audioEnabled;
	});
	_participants = _participants.map((p) => (p.isLocal ? { ...p, audioEnabled: _audioEnabled } : p));
}

// Leave
export async function leaveVoiceChannel() {
	if (!currentChannelId || !localMember) return;

	unsubscribes.forEach((u) => u());
	unsubscribes.length = 0;

	audioAnalysers.forEach(({ interval }) => clearInterval(interval));
	audioAnalysers.clear();

	await deleteDoc(doc(db, 'voice-calls', currentChannelId, 'peers', localMember.memberId));

	peerConnections.forEach((pc) => pc.close());
	peerConnections.clear();

	_localStream?.getTracks().forEach((t) => t.stop());

	_participants = [];
	_localStream = null;
	_isJoined = false;
	_audioEnabled = true;
	localMember = null;
	currentChannelId = null;
}
