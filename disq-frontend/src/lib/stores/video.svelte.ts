import {
	collection, doc, setDoc, addDoc, onSnapshot,
	deleteDoc, getDocs, serverTimestamp, type Unsubscribe
} from 'firebase/firestore'
import { db } from '$lib/firebase'
import { SvelteMap } from 'svelte/reactivity'

export type VideoParticipant = {
	memberId: string
	displayName: string
	userProfileImage?: string | null
	stream: MediaStream | null
	isLocal: boolean
	audioEnabled: boolean
	videoEnabled: boolean
	isScreenSharing?: boolean
}

// Reactive state
let _participants = $state<VideoParticipant[]>([])
let _localStream = $state<MediaStream | null>(null)
let _screenStream = $state<MediaStream | null>(null)
let _audioEnabled = $state(true)
let _videoEnabled = $state(true)
let _isScreenSharing = $state(false)
let _isJoined = $state(false)
let _error = $state<string | null>(null)

export const videoState = {
	get participants() { return _participants },
	get localStream() { return _localStream },
	get audioEnabled() { return _audioEnabled },
	get videoEnabled() { return _videoEnabled },
	get isScreenSharing() { return _isScreenSharing },
	get isJoined() { return _isJoined },
	get error() { return _error },
}

// ICE Server
const ICE_SERVERS: RTCConfiguration = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
	],
}

type LocalMember = {
	memberId: string
	displayName: string
	userProfileImage?: string | null
}

let localMember: LocalMember | null = null
let currentChannelId: string | null = null
const peerConnections = new SvelteMap<string, RTCPeerConnection>()
const unsubscribes: Unsubscribe[] = []

// Join Channel
export async function joinVideoChannel(
	channelId: string,
	member: {
		memberId: string
		displayName: string | null
		username: string
		userProfileImage?: string | null
	}
) {
	// Avoid rejoining same channel
	if (currentChannelId === channelId && _isJoined) return

	localMember = {
		memberId: member.memberId,
		displayName: member.displayName ?? member.username,
		userProfileImage: member.userProfileImage,
	}
	currentChannelId = channelId
	_error = null

	// Get local media
	try {
		_localStream = await navigator.mediaDevices.getUserMedia({
			video: { width: 1280, height: 720, facingMode: 'user' },
			audio: { echoCancellation: true, noiseSuppression: true },
		})
		_audioEnabled = true
		_videoEnabled = true
	} catch {
		console.warn('[Video] Camera/mic unavailable, trying audio only')
		try {
			_localStream = await navigator.mediaDevices.getUserMedia({ audio: true })
			_videoEnabled = false
			_audioEnabled = true
		} catch {
			_localStream = null
			_audioEnabled = false
			_videoEnabled = false
		}
	}

	// Add self as local participant
	_participants = [{
		memberId: localMember.memberId,
		displayName: localMember.displayName,
		userProfileImage: localMember.userProfileImage ?? null,
		stream: _localStream,
		isLocal: true,
		audioEnabled: _audioEnabled,
		videoEnabled: _videoEnabled,
		isScreenSharing: false,
	}]

	// Register presence in Firestore
	const peerDocRef = doc(db, 'video-calls', channelId, 'peers', localMember.memberId)
	await setDoc(peerDocRef, {
		displayName: localMember.displayName,
		userProfileImage: localMember.userProfileImage ?? null,
		isScreenSharing: false,
		joinedAt: serverTimestamp(),
	})

	// Create offers to all peers already in the room
	const peersSnap = await getDocs(collection(db, 'video-calls', channelId, 'peers'))
	for (const peerDocSnap of peersSnap.docs) {
		if (peerDocSnap.id === localMember.memberId) continue
		const peerData = peerDocSnap.data()
		await createOffer(channelId, peerDocSnap.id, peerData.displayName, peerData.userProfileImage)
	}

	// Watch for peers joining/leaving/updating after us
	const peersUnsub = onSnapshot(
		collection(db, 'video-calls', channelId, 'peers'),
		(snap) => {
			snap.docChanges().forEach((change) => {
				const data = change.doc.data()
				const peerId = change.doc.id

				if (change.type === 'added' && peerId !== localMember!.memberId) {
					addParticipantPlaceholder(peerId, data.displayName, data.userProfileImage)
				}

				if (change.type === 'modified' && peerId !== localMember!.memberId) {
					_participants = _participants.map(p =>
						p.memberId === peerId
							? { ...p, isScreenSharing: data.isScreenSharing ?? false }
							: p
					)
				}

				if (change.type === 'removed') {
					removePeer(peerId)
				}
			})
		}
	)
	unsubscribes.push(peersUnsub)

	// Watch for offers addressed to us
	const offersUnsub = onSnapshot(
		collection(db, 'video-calls', channelId, 'offers'),
		(snap) => {
			snap.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					const data = change.doc.data()
					if (data.to === localMember!.memberId && !peerConnections.has(data.from)) {
						await handleOffer(channelId, change.doc.id, data.from, data.sdp)
					}
				}
			})
		}
	)
	unsubscribes.push(offersUnsub)

	_isJoined = true
}

// Create connection Offer
async function createOffer(
	channelId: string,
	remoteMemberId: string,
	displayName: string,
	userProfileImage: string | null,
) {
	addParticipantPlaceholder(remoteMemberId, displayName, userProfileImage)

	const pc = createPeerConnection(remoteMemberId)
	const offerRef = doc(collection(db, 'video-calls', channelId, 'offers'))

	pc.onicecandidate = async (e) => {
		if (e.candidate) {
			await addDoc(
				collection(db, 'video-calls', channelId, 'offers', offerRef.id, 'offerCandidates'),
				e.candidate.toJSON()
			)
		}
	}

	const offer = await pc.createOffer()
	await pc.setLocalDescription(offer)

	await setDoc(offerRef, {
		from: localMember!.memberId,
		to: remoteMemberId,
		sdp: pc.localDescription!.toJSON(),
	})

	// Watch for answer
	const answerUnsub = onSnapshot(offerRef, async (snap) => {
		const data = snap.data()
		if (data?.answer && !pc.currentRemoteDescription) {
			await pc.setRemoteDescription(new RTCSessionDescription(data.answer))
		}
	})
	unsubscribes.push(answerUnsub)

	// Watch for answer-side ICE candidates
	const answerCandUnsub = onSnapshot(
		collection(db, 'video-calls', channelId, 'offers', offerRef.id, 'answerCandidates'),
		(snap) => {
			snap.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					await pc.addIceCandidate(new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit))
				}
			})
		}
	)
	unsubscribes.push(answerCandUnsub)
}

// Handle Answer
async function handleOffer(
	channelId: string,
	offerId: string,
	fromMemberId: string,
	sdp: RTCSessionDescriptionInit,
) {
	const pc = createPeerConnection(fromMemberId)
	const offerRef = doc(db, 'video-calls', channelId, 'offers', offerId)

	pc.onicecandidate = async (e) => {
		if (e.candidate) {
			await addDoc(
				collection(db, 'video-calls', channelId, 'offers', offerId, 'answerCandidates'),
				e.candidate.toJSON()
			)
		}
	}

	await pc.setRemoteDescription(new RTCSessionDescription(sdp))
	const answer = await pc.createAnswer()
	await pc.setLocalDescription(answer)

	await setDoc(offerRef, { answer: pc.localDescription!.toJSON() }, { merge: true })

	// Watch for offerer's ICE candidates
	const offerCandUnsub = onSnapshot(
		collection(db, 'video-calls', channelId, 'offers', offerId, 'offerCandidates'),
		(snap) => {
			snap.docChanges().forEach(async (change) => {
				if (change.type === 'added') {
					await pc.addIceCandidate(new RTCIceCandidate(change.doc.data() as RTCIceCandidateInit))
				}
			})
		}
	)
	unsubscribes.push(offerCandUnsub)
}

// PeerConnection factory
function createPeerConnection(remoteMemberId: string): RTCPeerConnection {
	const pc = new RTCPeerConnection(ICE_SERVERS)

	// Add all local tracks
	_localStream?.getTracks().forEach(track => pc.addTrack(track, _localStream!))

	pc.ontrack = (e) => {
		const stream = e.streams[0]
		_participants = _participants.map(p =>
			p.memberId === remoteMemberId ? { ...p, stream } : p
		)
	}

	pc.onconnectionstatechange = () => {
		console.log(`[Video] Peer ${remoteMemberId} state: ${pc.connectionState}`)
		if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
			removePeer(remoteMemberId)
		}
	}

	peerConnections.set(remoteMemberId, pc)
	return pc
}

function addParticipantPlaceholder(
	memberId: string,
	displayName: string,
	userProfileImage: string | null,
) {
	if (_participants.find(p => p.memberId === memberId)) return
	_participants = [..._participants, {
		memberId,
		displayName,
		userProfileImage: userProfileImage ?? null,
		stream: null,
		isLocal: false,
		audioEnabled: true,
		videoEnabled: true,
		isScreenSharing: false,
	}]
}

function removePeer(memberId: string) {
	peerConnections.get(memberId)?.close()
	peerConnections.delete(memberId)
	_participants = _participants.filter(p => p.memberId !== memberId)
}

// Controls
export function toggleAudio() {
	_audioEnabled = !_audioEnabled
	_localStream?.getAudioTracks().forEach(t => { t.enabled = _audioEnabled })
	_participants = _participants.map(p =>
		p.isLocal ? { ...p, audioEnabled: _audioEnabled } : p
	)
}

export function toggleVideo() {
	_videoEnabled = !_videoEnabled
	_localStream?.getVideoTracks().forEach(t => { t.enabled = _videoEnabled })
	_participants = _participants.map(p =>
		p.isLocal ? { ...p, videoEnabled: _videoEnabled } : p
	)
}

export async function toggleScreenShare() {
	if (_isScreenSharing) {
		// ── Stop screen share, restore camera ──
		_screenStream?.getTracks().forEach(t => t.stop())
		_screenStream = null
		_isScreenSharing = false

		const camTrack = _localStream?.getVideoTracks()[0]
		if (camTrack) {
			await Promise.all(
				Array.from(peerConnections.values()).map(pc => {
					const sender = pc.getSenders().find(s => s.track?.kind === 'video')
					return sender?.replaceTrack(camTrack)
				})
			)
		}

		// Restore local preview to camera stream
		_participants = _participants.map(p =>
			p.isLocal ? { ...p, stream: _localStream, isScreenSharing: false } : p
		)

		// Update Firestore presence
		if (currentChannelId && localMember) {
			await setDoc(
				doc(db, 'video-calls', currentChannelId, 'peers', localMember.memberId),
				{ isScreenSharing: false },
				{ merge: true }
			)
		}
	} else {
		// Start screen share
		try {
			_screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: { width: 1920, height: 1080, frameRate: 30 },
				audio: true,
			})
			_isScreenSharing = true

			const screenTrack = _screenStream.getVideoTracks()[0]

			// Replace video track in all peer connections
			await Promise.all(
				Array.from(peerConnections.values()).map(pc => {
					const sender = pc.getSenders().find(s => s.track?.kind === 'video')
					return sender?.replaceTrack(screenTrack)
				})
			)

			// Build composite stream for local preview (screen video + local audio)
			const compositeStream = new MediaStream()
			compositeStream.addTrack(screenTrack)
			_localStream?.getAudioTracks().forEach(t => compositeStream.addTrack(t))

			_participants = _participants.map(p =>
				p.isLocal ? { ...p, stream: compositeStream, isScreenSharing: true } : p
			)

			// Update Firestore presence
			if (currentChannelId && localMember) {
				await setDoc(
					doc(db, 'video-calls', currentChannelId, 'peers', localMember.memberId),
					{ isScreenSharing: true },
					{ merge: true }
				)
			}

			// Auto-stop when browser native "Stop sharing" is clicked
			screenTrack.onended = () => {
				if (_isScreenSharing) toggleScreenShare()
			}
		} catch (e: unknown) {
			if (e instanceof DOMException && e.name === 'NotAllowedError') return
			console.error('[Video] Screen share failed:', e)
			_isScreenSharing = false
		}
	}
}

// Leave Channel
export async function leaveVideoChannel() {
	if (!currentChannelId || !localMember) return

	unsubscribes.forEach(u => u())
	unsubscribes.length = 0

	await deleteDoc(doc(db, 'video-calls', currentChannelId, 'peers', localMember.memberId))

	peerConnections.forEach(pc => pc.close())
	peerConnections.clear()

	_localStream?.getTracks().forEach(t => t.stop())
	_screenStream?.getTracks().forEach(t => t.stop())

	_participants = []
	_localStream = null
	_screenStream = null
	_isScreenSharing = false
	_isJoined = false
	_audioEnabled = true
	_videoEnabled = true
	localMember = null
	currentChannelId = null
}