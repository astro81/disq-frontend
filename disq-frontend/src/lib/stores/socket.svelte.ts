import { SvelteDate, SvelteURLSearchParams } from "svelte/reactivity"

export type WSMessage = {
	messageId: string | null
	channelId: string
	memberId: string
	userId: string

	message: string

	// File attachment (optional)
	messageFileUrl?: string | null
	messageFileName?: string | null
	messageFileType?: string | null
	messageFileSize?: number | null

	timestamp: number

	username: string
	displayName: string
	userProfileImage?: string | null
	userBannerImage?: string | null

	role?: string | null
	// for history messages loaded from DB
	createdAt?: string
}

export type SocketState = 'connecting' | 'open' | 'closed' | 'error'


/** Represents a successfully uploaded file, ready to attach to a message */
export type FileAttachment = {
	url: string
	publicId: string
	name: string
	size: number
	mimeType: string
}

/** Internal wire format sent over the WebSocket */
type OutgoingPayload = {
	text: string
	fileUrl?: string
	fileName?: string
	filePublicId?: string
	fileSize?: number
	fileType?: string
}


// Global reactive state using runes
let _socketState = $state<SocketState>('closed')
let _messages = $state<WSMessage[]>([])

let _isLoadingHistory = $state(false)
let _hasMoreHistory = $state(false)
let _nextCursor = $state<string | null>(null)


// Exported as getters so components can read reactively
export const socketState = {
	get current() { return _socketState }
}

export const messages = {
	get current() { return _messages }
}

export const historyState = {
	get isLoading() { return _isLoadingHistory },
	get hasMore() { return _hasMoreHistory },
}


let socket: WebSocket | null = null
let destroyed = false
let currentChannelId: string | null = null


// Fetch chat history via SvelteKit proxy
export async function loadMessageHistory(channelId: string, cursor?: string) {
	if (_isLoadingHistory) return

	_isLoadingHistory = true

	try {
		const params = new SvelteURLSearchParams()
		if (cursor) params.set('cursor', cursor)

		const query = params.size ? `?${params}` : ''
		const res = await fetch(`/api/messages/${channelId}${query}`)

		if (!res.ok) {
			console.error('[WS] Message history fetch failed:', res.status)
			return
		}

		const data: {
			messages: {
				messageId: string
				memberId: string
				userId: string

				messageContent: string

				messageFileUrl: string | null
				messageFileName: string | null
				messageFileType: string | null
				messageFileSize?: number | null

				username: string
				displayName: string | null
				userProfileImage: string | null
				userBannerImage: string | null

				role: string
				createdAt: string
			}[]
			nextCursor: string | null
		} = await res.json()

		const normalized: WSMessage[] = data.messages.map(m => ({
			messageId: m.messageId,
			channelId,
			memberId: m.memberId,
			userId: m.userId,

			message: m.messageContent,

			messageFileUrl: m.messageFileUrl,
			messageFileName: m.messageFileName,
			messageFileType: m.messageFileType,
			messageFileSize: m.messageFileSize ?? null,

			username: m.username,
			displayName: m.displayName ?? m.username,
			userProfileImage: m.userProfileImage,
			userBannerImage: m.userBannerImage,

			role: m.role ?? null,

			timestamp: new SvelteDate(m.createdAt).getTime(),
			createdAt: m.createdAt,
		}))

		_messages = (cursor) ? [...normalized, ..._messages] : normalized

		_nextCursor = data.nextCursor
		_hasMoreHistory = data.nextCursor !== null
	} catch (e) {
		console.error('[WS] Failed to load message history:', e)
	} finally {
		_isLoadingHistory = false
	}
}

export async function loadMoreHistory() {
	if (!currentChannelId || !_nextCursor) return
	await loadMessageHistory(currentChannelId, _nextCursor)
}


export function connectToChannel(channelId: string, member: {
	memberId: string
	displayName: string | null
	username: string
	userProfileImage?: string | null
	userBannerImage?: string | null
	role?: string | null
}) {
	if (currentChannelId === channelId && socket?.readyState === WebSocket.OPEN) return

	disconnectChannel()

	if (!channelId || channelId === 'undefined') {
		_socketState = 'closed'
		return
	}

	currentChannelId = channelId
	destroyed = false

	_messages = []
	_socketState = 'connecting'

	_nextCursor = null
	_hasMoreHistory = false

	const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000'

	const params = new SvelteURLSearchParams({
		memberId: member.memberId,
		displayName: member.displayName ?? member.username,
		...(member.userProfileImage ? { userProfileImage: member.userProfileImage } : {}),
		...(member.userBannerImage ? { userBannerImage: member.userBannerImage } : {}),
		...(member.role ? { role: member.role } : {}),
	})

	socket = new WebSocket(`${WS_BASE}/ws/channel/${channelId}?${params}`)

	socket.onopen = () => {
		_socketState = 'open'
		// Load after socket opens - avoids mutating state mid-effect
		loadMessageHistory(channelId)
	}

	socket.onclose = () => { if (!destroyed) _socketState = 'closed' }

	socket.onerror = () => { if (!destroyed) _socketState = 'error' }

	socket.onmessage = (event) => {
		try {
			const data: WSMessage = JSON.parse(event.data)

			// avoid double-rendering your own confirmed message
			_messages = _messages.some(m => m.messageId && m.messageId === data.messageId)
				? _messages
				: [..._messages, data]
		} catch (e) {
			console.error('[WS] Failed to parse message', e)
		}
	}
}

export function disconnectChannel() {
	destroyed = true
	currentChannelId = null
	socket?.close()
	socket = null
	_socketState = 'closed'
}



function emit(payload: OutgoingPayload) {
	if (socket?.readyState === WebSocket.OPEN) {
		socket.send(JSON.stringify(payload))
	}
}

/** Send a plain-text-only message */
export function sendMessage(text: string) {
	emit({ text })
}

/**
 * Send a file-only message (no caption).
 * Kept separate so callers don't have to pass an empty string.
 */
export function sendFile(file: FileAttachment) {
	emit({
		text: '',
		fileUrl: file.url,
		fileName: file.name,
		filePublicId: file.publicId,
		fileSize: file.size,
		fileType: file.mimeType,
	})
}

/**
 * Send a message that may have both text and an optional file attachment.
 * Use this when the user typed a caption alongside a file.
 */
export function sendMessageWithFile(text: string, file?: FileAttachment) {
	emit({
		text,
		...(file ? {
			fileUrl: file.url,
			fileName: file.name,
			filePublicId: file.publicId,
			fileSize: file.size,
			fileType: file.mimeType,
		} : {})
	})
}

