import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from '../build/handler.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import argon2 from 'argon2';
import 'dotenv/config';
import { gameModes } from './src/lib/game-modes/index.js';

const { Pool } = pg;

const app = express();
const server = createServer(app);

const io = new Server(server, {
	cors: { origin: '*' },
	connectionStateRecovery: true
});

const pool = new Pool({
	connectionString: process.env.DATABASE_URL
});

const db = drizzle(pool);

const PORT = process.env.PORT || 3000;
const EMPTY_ROOM_TIMEOUT = 60 * 1000;

const rooms = {};
const activeUsers = new Map();
const roomUserSockets = new Map();

const getPlayerCount = (roomId) =>
	rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;

const getMode = (roomId) => {
	const r = rooms[roomId];
	if (!r) return null;
	return gameModes[r.roomType] ?? null;
};

const emitRoomState = (roomId) => {
	const r = rooms[roomId];
	if (!r) return;

	io.to(String(roomId)).emit('room_state', {
		players: Object.values(r.players),
		started: r.started,
		roomType: r.roomType,
		owner: r.owner
	});
};

const updatePlayerCount = async (roomId) => {
	await db
		.update(room)
		.set({ playerCount: getPlayerCount(roomId) })
		.where(eq(room.id, roomId));
};

const updateOwner = async (roomId, ownerId) => {
	await db.update(room).set({ ownerId }).where(eq(room.id, roomId));
};

const closeRoom = async (roomId) => {
	if (!rooms[roomId]) return;

	io.to(String(roomId)).emit('room_closed', { roomId });
	io.socketsLeave(String(roomId));

	delete rooms[roomId];
	roomUserSockets.delete(roomId);

	await db.delete(room).where(eq(room.id, roomId));
};

const handleEmptyRoom = (roomId) => {
	const r = rooms[roomId];
	if (!r) return;

	if (r.timer) clearTimeout(r.timer);

	if (Object.keys(r.players).length === 0) {
		r.timer = setTimeout(() => closeRoom(roomId), EMPTY_ROOM_TIMEOUT);
	}
};

const removePlayerFromRoom = async (socket) => {
	const roomId = Number(socket.data.roomId);
	const userId = socket.data.userId;

	if (!roomId || !userId || !rooms[roomId]?.players[userId]) {
		socket.data.roomId = undefined;
		return;
	}

	const r = rooms[roomId];
	const mode = getMode(roomId);

	mode?.onPlayerLeave?.({ roomId, room: r, io }, userId);

	const roomSockets = roomUserSockets.get(roomId);
	if (roomSockets?.get(userId) === socket.id) {
		roomSockets.delete(userId);
		if (roomSockets.size === 0) roomUserSockets.delete(roomId);
	}

	if (r.owner?.id === userId) {
		const remaining = Object.values(r.players).filter((p) => p.id !== userId);
		r.owner = remaining[0] ?? null;
		await updateOwner(roomId, r.owner?.id ?? null);
	}

	delete r.players[userId];

	socket.leave(String(roomId));
	socket.data.roomId = undefined;

	handleEmptyRoom(roomId);
	await updatePlayerCount(roomId);
	emitRoomState(roomId);
};

setInterval(() => {
	for (const [roomIdString, r] of Object.entries(rooms)) {
		if (!r.started) continue;

		const roomId = Number(roomIdString);
		const mode = getMode(roomId);

		mode?.onTick?.({
			roomId,
			room: r,
			io
		});
	}
}, 250);

io.on('connection', (socket) => {
	const { userId, username, imageUrl } = socket.handshake.auth ?? {};

	if (!userId || !username) {
		socket.disconnect();
		return;
	}

	socket.data.userId = String(userId);
	socket.data.username = String(username);
	socket.data.imageUrl = imageUrl ? String(imageUrl) : '';

	const existing = activeUsers.get(socket.data.userId);
	if (existing && existing !== socket.id) {
		socket.disconnect();
		return;
	}
	activeUsers.set(socket.data.userId, socket.id);

	socket.on('join_room', async ({ roomId, password }) => {
		const currentRoomId = Number(socket.data.roomId);

		if (currentRoomId && currentRoomId !== roomId) {
			await removePlayerFromRoom(socket);
		}

		const [foundRoom] = await db
			.select()
			.from(room)
			.where(eq(room.id, roomId));

		if (!foundRoom) {
			socket.emit('room_error', { error: 'Room not found' });
			return;
		}

		if (!rooms[roomId]) {
			const mode = gameModes[foundRoom.type];

			rooms[roomId] = {
				players: {},
				timer: null,
				started: false,
				roomType: foundRoom.type,
				gameState: mode?.initMode?.() ?? null,
				owner: null
			};
		}

		const r = rooms[roomId];

		let roomSockets = roomUserSockets.get(roomId);
		if (!roomSockets) {
			roomSockets = new Map();
			roomUserSockets.set(roomId, roomSockets);
		}

		const alreadyInRoom = !!r.players[socket.data.userId];

		if (!alreadyInRoom && Object.keys(r.players).length >= foundRoom.maxPlayers) {
			socket.emit('room_error', { error: 'Room full' });
			return;
		}

		socket.join(String(roomId));
		socket.data.roomId = roomId;

		roomSockets.set(socket.data.userId, socket.id);

		r.players[socket.data.userId] = {
			id: socket.data.userId,
			username: socket.data.username,
			joined: false,
			imageUrl: socket.data.imageUrl
		};

		if (!r.owner) {
			r.owner = r.players[socket.data.userId];
			await updateOwner(roomId, r.owner.id);
		}

		if (r.timer) {
			clearTimeout(r.timer);
			r.timer = null;
		}

		await updatePlayerCount(roomId);
		emitRoomState(roomId);
	});

	socket.on('disconnect', async () => {
		await removePlayerFromRoom(socket);
	});

	socket.on('leave_room', async () => {
		await removePlayerFromRoom(socket);
		socket.emit('left_room');
	});

	socket.on('join_game', async () => {
		const roomId = Number(socket.data.roomId);
		const userId = socket.data.userId;
		const r = rooms[roomId];

		if (!r || !r.players[userId]) return;

		r.players[userId].joined = true;

		const joined = Object.values(r.players).filter((p) => p.joined).length;

		emitRoomState(roomId);

		if (joined > 1) {
			r.started = true;

			const mode = getMode(roomId);
			mode?.onGameStart?.({ room: r, roomId, io });
		}
	});

	socket.on('wordbomb_submit', ({ word }) => {
		const roomId = Number(socket.data.roomId);
		const userId = socket.data.userId;
		const r = rooms[roomId];
		const mode = getMode(roomId);

		if (!r || !mode) return;

		mode.onWordSubmitted?.(
			{ roomId, room: r, io },
			word,
			userId
		);
	});
});

app.use(handler);

server.listen(PORT, () => {
	console.log(`Server running on ${PORT}`);
});