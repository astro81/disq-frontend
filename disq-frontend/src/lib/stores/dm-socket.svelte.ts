import { SvelteDate, SvelteURLSearchParams } from "svelte/reactivity"

export type DmWSMessage = {
    dmMessageId: string | null
    conversationId: string
    userId: string

    message: string

    timestamp: number

    username: string
    displayName: string
    userProfileImage?: string | null
    userBannerImage?: string | null

    // for history messages loaded from DB
    createdAt?: string
}

export type DmSocketState = 'connecting' | 'open' | 'closed' | 'error'


// Global reactive state using runes
let _dmSocketState = $state<DmSocketState>('closed')
let _dmMessages = $state<DmWSMessage[]>([])

let _isLoadingDmHistory = $state(false)
let _hasMoreDmHistory = $state(false)
let _dmNextCursor = $state<string | null>(null)


// Exported as getters so components can read reactively
export const dmSocketState = {
    get current() { return _dmSocketState }
}

export const dmMessages = {
    get current() { return _dmMessages }
}

export const dmHistoryState = {
    get isLoading() { return _isLoadingDmHistory },
    get hasMore() { return _hasMoreDmHistory },
}


let dmSocket: WebSocket | null = null
let dmDestroyed = false
let currentConversationId: string | null = null


// Fetch DM history via SvelteKit proxy
export async function loadDmHistory(conversationId: string, cursor?: string) {
    if (_isLoadingDmHistory) return

    _isLoadingDmHistory = true

    try {
        const params = new SvelteURLSearchParams()
        if (cursor) params.set('cursor', cursor)

        const query = params.size ? `?${params}` : ''
        const res = await fetch(`/api/dm-messages/${conversationId}${query}`)

        if (!res.ok) {
            console.error('[DM-WS] DM history fetch failed:', res.status)
            return
        }

        const data: {
            messages: {
                dmMessageId: string
                content: string
                userId: string
                username: string
                displayName: string | null
                userProfileImage: string | null
                userBannerImage: string | null
                createdAt: string
            }[]
            nextCursor: string | null
        } = await res.json()

        const normalized: DmWSMessage[] = data.messages.map(m => ({
            dmMessageId: m.dmMessageId,
            conversationId,
            userId: m.userId,

            message: m.content,

            username: m.username,
            displayName: m.displayName ?? m.username,
            userProfileImage: m.userProfileImage,
            userBannerImage: m.userBannerImage,

            timestamp: new SvelteDate(m.createdAt).getTime(),
            createdAt: m.createdAt,
        }))

        _dmMessages = (cursor) ? [...normalized, ..._dmMessages] : normalized

        _dmNextCursor = data.nextCursor
        _hasMoreDmHistory = data.nextCursor !== null
    } catch (e) {
        console.error('[DM-WS] Failed to load DM history:', e)
    } finally {
        _isLoadingDmHistory = false
    }
}

export async function loadMoreDmHistory() {
    if (!currentConversationId || !_dmNextCursor) return
    await loadDmHistory(currentConversationId, _dmNextCursor)
}


export function connectToDm(conversationId: string, userInfo: {
    userId: string
    displayName: string
    username: string
    userProfileImage?: string | null
    userBannerImage?: string | null
}) {
    if (currentConversationId === conversationId && dmSocket?.readyState === WebSocket.OPEN) return

    disconnectDm()

    if (!conversationId || conversationId === 'undefined') {
        _dmSocketState = 'closed'
        return
    }

    currentConversationId = conversationId
    dmDestroyed = false

    _dmMessages = []
    _dmSocketState = 'connecting'

    _dmNextCursor = null
    _hasMoreDmHistory = false

    const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000'

    const params = new SvelteURLSearchParams({
        userId: userInfo.userId,
        username: userInfo.username,
        displayName: userInfo.displayName,
        ...(userInfo.userProfileImage ? { userProfileImage: userInfo.userProfileImage } : {}),
        ...(userInfo.userBannerImage ? { userBannerImage: userInfo.userBannerImage } : {}),
    })

    dmSocket = new WebSocket(`${WS_BASE}/ws/dm/${conversationId}?${params}`)

    dmSocket.onopen = () => {
        _dmSocketState = 'open'
        loadDmHistory(conversationId)
    }

    dmSocket.onclose = () => { if (!dmDestroyed) _dmSocketState = 'closed' }

    dmSocket.onerror = () => { if (!dmDestroyed) _dmSocketState = 'error' }

    dmSocket.onmessage = (event) => {
        try {
            const data: DmWSMessage = JSON.parse(event.data)

            // avoid double-rendering your own confirmed message
            _dmMessages = _dmMessages.some(m => m.dmMessageId && m.dmMessageId === data.dmMessageId)
                ? _dmMessages
                : [..._dmMessages, data]
        } catch (e) {
            console.error('[DM-WS] Failed to parse DM message', e)
        }
    }
}

export function disconnectDm() {
    dmDestroyed = true
    currentConversationId = null
    dmSocket?.close()
    dmSocket = null
    _dmSocketState = 'closed'
}


export function sendDmMessage(text: string) {
    if (dmSocket?.readyState === WebSocket.OPEN) {
        dmSocket.send(JSON.stringify({ text }))
    }
}
