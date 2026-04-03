// src/lib/socket/room-socket.ts
import io from 'socket.io-client';

let socket: ReturnType<typeof io> | null = null;

export function createRoomSocket(userId: string, username: string) {
	if (socket) return socket;

	socket = io({
		auth: {
			userId,
			username
		}
	});

	return socket;
}

export function getRoomSocket() {
	return socket;
}

export function destroyRoomSocket() {
	socket?.disconnect();
	socket = null;
}