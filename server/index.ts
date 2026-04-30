import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from '../build/handler.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room } from '../src/lib/server/db/schema.js'; // FIX: import from actual schema, not inline
import { eq } from 'drizzle-orm';
import pg from 'pg';
import argon2 from 'argon2';
import 'dotenv/config';
import { gameModes } from '../src/lib/game-modes/index.js'; // FIX: correct import path

const { Pool } = pg;

const port = process.env.PORT || 3000;
const EMPTY_ROOM_TIMEOUT = 60 * 1000;

type RoomPlayer = {
	id: string;
	username: string;
	joined: boolean;
	lives: number;
	imageUrl: string;
};

const rooms: Record<
	number,
	{
		players: Record<string, RoomPlayer>;
		timer: ReturnType<typeof setTimeout> | null;
		started: boolean;
		roomType: string;
		gameState: any;
		owner: RoomPlayer | null;
		prompts: Array<string> | null;
		countdown: boolean;
		closing: boolean; // FIX: guard against double closeRoom
	}
> = {};

const roomUserSockets = new Map<number, Map<string, string>>();

// FIX: pool max set to avoid connection exhaustion under burst load
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
	max: 10
});

const db = drizzle(pool);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
	cors: {
		origin: process.env.CLIENT_ORIGIN ?? '*',
		methods: ['GET', 'POST'],
		credentials: true
	}
});

setInterval(() => {
	for (const [roomIdString, currentRoom] of Object.entries(rooms)) {
		if (!currentRoom.started) continue;
		const roomId = Number(roomIdString);
		const mode = gameModes[currentRoom.roomType as keyof typeof gameModes];
		mode?.onTick?.({ roomId, room: currentRoom, io });
	}
}, 250);

const getPlayerCount = (roomId: number) =>
	rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;

const updatePlayerCount = async (roomId: number) => {
	await db.update(room).set({ playerCount: getPlayerCount(roomId) }).where(eq(room.id, roomId));
};

const updateOwner = async (roomId: number, ownerId: string | null) => {
	await db.update(room).set({ ownerId }).where(eq(room.id, roomId));
};

const getMode = (roomId: number) => {
	const currentRoom = rooms[roomId];
	if (!currentRoom) return null;
	return gameModes[currentRoom.roomType as keyof typeof gameModes] ?? null;
};

const emitRoomState = (roomId: number) => {
	const currentRoom = rooms[roomId];
	if (!currentRoom) return;
	io.to(String(roomId)).emit('room_state', {
		players: Object.values(currentRoom.players),
		started: currentRoom.started,
		roomType: currentRoom.roomType,
		owner: currentRoom.owner
	});
};

const closeRoom = async (roomId: number) => {
	const currentRoom = rooms[roomId];
	// FIX: guard against double-close (timer fires while player is mid-join async gap)
	if (!currentRoom || currentRoom.closing) return;
	currentRoom.closing = true;

	io.to(String(roomId)).emit('room_closed', { roomId });
	io.socketsLeave(String(roomId));
	delete rooms[roomId];
	roomUserSockets.delete(roomId);
	await db.delete(room).where(eq(room.id, roomId));
};

const handleEmptyRoom = (roomId: number) => {
	const currentRoom = rooms[roomId];
	if (!currentRoom) return;
	if (currentRoom.timer) {
		clearTimeout(currentRoom.timer);
		currentRoom.timer = null;
	}
	if (Object.keys(currentRoom.players).length === 0) {
		currentRoom.timer = setTimeout(() => closeRoom(roomId), EMPTY_ROOM_TIMEOUT);
	}
};

const removePlayerFromRoom = async (socket: any) => {
	const roomId = Number(socket.data.roomId);
	const userId = socket.data.userId;

	if (!roomId || !userId || !rooms[roomId]?.players[userId]) {
		socket.data.roomId = undefined;
		return;
	}

	const currentRoom = rooms[roomId];
	const mode = getMode(roomId);
	mode?.onPlayerLeave?.({ roomId, room: currentRoom, io }, userId);

	const roomSockets = roomUserSockets.get(roomId);
	if (roomSockets?.get(userId) === socket.id) {
		roomSockets.delete(userId);
		if (roomSockets.size === 0) roomUserSockets.delete(roomId);
	}

	if (currentRoom.owner?.id === userId) {
		const remaining = Object.values(currentRoom.players).filter((p) => p.id !== userId);
		currentRoom.owner = remaining[0] ?? null;
		await updateOwner(roomId, currentRoom.owner?.id ?? null);
	}

	delete currentRoom.players[userId];
	socket.leave(String(roomId));
	socket.data.roomId = undefined;

	handleEmptyRoom(roomId);
	await updatePlayerCount(roomId);
	emitRoomState(roomId);
};

io.on('connection', async (socket) => {
	const userId = socket.handshake.auth?.userId;
	const username = socket.handshake.auth?.username;
	const imageUrl = socket.handshake.auth?.imageUrl ?? '';

	if (!userId || !username) {
		socket.disconnect();
		return;
	}

	socket.data.userId = String(userId);
	socket.data.username = String(username);
	socket.data.imageUrl = String(imageUrl);

	socket.on('join_room', async ({ roomId, password }) => {
		const currentRoomId = Number(socket.data.roomId);
		if (currentRoomId && currentRoomId !== roomId) {
			await removePlayerFromRoom(socket);
		}

		const [foundRoom] = await db
			.select({
				id: room.id,
				maxPlayers: room.maxPlayers,
				isPrivate: room.isPrivate,
				passwordHash: room.passwordHash,
				type: room.type,
				ownerId: room.ownerId
			})
			.from(room)
			.where(eq(room.id, roomId));

		if (!foundRoom) {
			socket.emit('room_error', { error: 'Room not found' });
			return;
		}

		// FIX: don't re-init a room that's in the middle of closing
		if (!rooms[roomId] || rooms[roomId].closing) {
			const mode = gameModes[foundRoom.type as keyof typeof gameModes];
			rooms[roomId] = {
				players: {},
				timer: null,
				started: false,
				roomType: foundRoom.type,
				gameState: mode?.initMode() ?? null,
				owner: null,
				prompts: null,
				countdown: false,
				closing: false
			};
		}

		if (foundRoom.isPrivate && foundRoom.passwordHash) {
			if (!password) {
				socket.emit('room_error', { error: 'Password required' });
				return;
			}
			const ok = await argon2.verify(foundRoom.passwordHash, password);
			if (!ok) {
				socket.emit('room_error', { error: 'Wrong password' });
				return;
			}
		}

		const currentRoom = rooms[roomId];

		let roomSockets = roomUserSockets.get(roomId);
		if (!roomSockets) {
			roomSockets = new Map();
			roomUserSockets.set(roomId, roomSockets);
		}

		const existingSocketId = roomSockets.get(socket.data.userId);
		if (existingSocketId && existingSocketId !== socket.id) {
			const existingSocket = io.sockets.sockets.get(existingSocketId);
			if (existingSocket) existingSocket.disconnect(true);
		}

		const alreadyInRoom = !!currentRoom.players[socket.data.userId];
		if (!alreadyInRoom && Object.keys(currentRoom.players).length >= foundRoom.maxPlayers) {
			socket.emit('room_error', { error: 'Room is full' });
			return;
		}

		socket.join(String(roomId));
		socket.data.roomId = roomId;
		roomSockets.set(socket.data.userId, socket.id);

		// FIX: include lives: 0 on init (was missing in server/index.js, caused undefined in game mode)
		currentRoom.players[socket.data.userId] = {
			id: socket.data.userId,
			username: socket.data.username,
			joined: false,
			lives: 0,
			imageUrl: socket.data.imageUrl
		};

		if (!currentRoom.owner) {
			currentRoom.owner = currentRoom.players[socket.data.userId];
			await updateOwner(roomId, currentRoom.owner.id);
		}

		if (currentRoom.timer) {
			clearTimeout(currentRoom.timer);
			currentRoom.timer = null;
		}

		await updatePlayerCount(roomId);
		emitRoomState(roomId);
	});

	socket.on('disconnect', async () => {
		const currentRoomId = Number(socket.data.roomId);
		await removePlayerFromRoom(socket);
		if (currentRoomId) emitRoomState(currentRoomId);
	});

	socket.on('leave_room', async () => {
		await removePlayerFromRoom(socket);
		socket.emit('left_room');
	});

	socket.on('join_game', async () => {
		const roomId = Number(socket.data.roomId);
		const userId = socket.data.userId;
		const currentRoom = rooms[roomId];

		if (!userId || !currentRoom) return;

		const roomSockets = roomUserSockets.get(roomId);
		if (roomSockets?.get(userId) !== socket.id) return;
		if (currentRoom.started || !currentRoom.players[userId]) return;

		currentRoom.players[userId].joined = true;
		emitRoomState(roomId);

		const joinedCount = Object.values(currentRoom.players).filter((p) => p.joined).length;

		// FIX: was starting game immediately — restored countdown from vite config
		if (joinedCount > 1 && !currentRoom.countdown) {
			let countdown = 2;
			currentRoom.countdown = true;
			io.to(String(roomId)).emit('game_countdown', { countdown });

			const tick = setInterval(() => {
				const joined = Object.values(currentRoom.players).filter((p) => p.joined).length;
				if (joined < 2) {
					clearInterval(tick);
					currentRoom.countdown = false;
					io.to(String(roomId)).emit('game_countdown_cancelled');
					return;
				}
				countdown--;
				io.to(String(roomId)).emit('game_countdown', { countdown });
				if (countdown <= 0) {
					clearInterval(tick);
					currentRoom.countdown = false;
					currentRoom.started = true;
					getMode(roomId)?.onGameStart?.({ room: currentRoom, roomId, io });
				}
			}, 1000);
		}
	});

	socket.on('wordbomb_submit', async ({ word }) => {
		const roomId = Number(socket.data.roomId);
		const userId = socket.data.userId;
		const currentRoom = rooms[roomId];
		const mode = getMode(roomId);
		if (!currentRoom || !mode) return;
		const roomSockets = roomUserSockets.get(roomId);
		if (roomSockets?.get(userId) !== socket.id) return;
		mode.onWordSubmitted?.({ roomId, room: currentRoom, io }, userId, word);
	});

	socket.on('wordbomb_letter', async ({ word }) => {
		const roomId = Number(socket.data.roomId);
		const userId = socket.data.userId;
		const currentRoom = rooms[roomId];
		const mode = getMode(roomId);
		if (!currentRoom || !mode) return;
		const roomSockets = roomUserSockets.get(roomId);
		if (roomSockets?.get(userId) !== socket.id) return;
		// FIX: was completely empty — never forwarded to game mode
		mode.onLetterWritten?.({ roomId, room: currentRoom, io }, word, userId);
	});
});

// SvelteKit handler — must come after socket.io setup
app.use(handler);

httpServer.listen(port, () => {
	console.log(`Server running on port ${port}`);
});