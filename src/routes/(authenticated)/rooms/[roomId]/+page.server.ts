import type { PageServerLoad } from './$types'

// Room validation is now handled server-side via Socket.IO (room_error event).
// We just pass the roomId through to the page.
export function load({ params }): ReturnType<PageServerLoad> {
    return { roomId: params.roomId }
}