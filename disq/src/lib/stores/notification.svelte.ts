import { SvelteDate } from "svelte/reactivity"

export type AppNotification = {
    id: string
    type: 'FRIEND_REQUEST_RECEIVED' | 'FRIEND_REQUEST_ACCEPTED'
    fromUserId: string
    fromUserName: string
    timestamp: number
}

let _notifications = $state<AppNotification[]>([])
let _pendingFriendRequests = $state(0)
let socket: WebSocket | null = null

export const notifications = {
    get current() { return _notifications },
    remove(id: string) {
        _notifications = _notifications.filter(n => n.id !== id)
    }
}

export const pendingFriendRequests = {
    get count() { return _pendingFriendRequests },
    set count(val: number) { _pendingFriendRequests = val }
}

export async function initNotifications(userId: string) {
    if (socket || !userId) return

    // Fetch initial pending count
    try {
        const res = await fetch('/api/friends?type=pending')
        if (res.ok) {
            const data = await res.json()
            _pendingFriendRequests = data.pending.length
        }
    } catch (e) {
        console.error('[Notification-Store] Failed to fetch initial pending requests', e)
    }

    const WS_BASE = import.meta.env.VITE_WS_URL ?? 'ws://localhost:3000'
    socket = new WebSocket(`${WS_BASE}/ws/notifications/${userId}`)

    socket.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data) as {
                type: 'FRIEND_REQUEST_RECEIVED' | 'FRIEND_REQUEST_ACCEPTED'
                friendshipId: string
                fromUserId: string
                fromUserName: string
            }

            const newNotification: AppNotification = {
                id: Math.random().toString(36).substring(2),
                type: data.type,
                fromUserId: data.fromUserId,
                fromUserName: data.fromUserName,
                timestamp: Date.now()
            }

            _notifications = [..._notifications, newNotification]

            if (data.type === 'FRIEND_REQUEST_RECEIVED') {
                _pendingFriendRequests++
            }
        } catch (e) {
            console.error('[Notification-Store] Failed to parse message', e)
        }
    }

    socket.onclose = () => {
        socket = null
        // Simple reconnect logic after 5s
        setTimeout(() => initNotifications(userId), 5000)
    }
}
