import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from '../build/handler.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room, character } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import argon2 from 'argon2';
import 'dotenv/config';

const { Pool } = pg;

const port = process.env.PORT || 3000;
const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000;

const rooms = {};
const activeUsers = new Map();

const app = express();
const server = createServer(app);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const io = new Server(server, {
	cors: { origin: '*' },
	connectionStateRecovery: {}
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const getPlayerCount = (roomId) =>
	rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;

const updatePlayerCount = async (roomId) => {
	await db
		.update(room)
		.set({ playerCount: getPlayerCount(roomId) })
		.where(eq(room.id, roomId));
};

const closeRoom = async (roomId) => {
	if (!rooms[roomId]) return;
	console.log(`Room ${roomId} closed due to inactivity.`);
	io.to(String(roomId)).emit('room_closed', { roomId });
	io.socketsLeave(String(roomId));
	delete rooms[roomId];
	await db.delete(room).where(eq(room.id, roomId));
};

const handleEmptyRoom = (roomId) => {
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

// ── Socket.IO ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
	const { userId, username } = socket.handshake.auth ?? {};

	if (!userId || !username) {
		socket.disconnect();
		return;
	}

	socket.data.userId = String(userId);
	socket.data.username = String(username);

	// Block duplicate tabs / sessions
	const existingSocketId = activeUsers.get(String(userId));
	if (existingSocketId && existingSocketId !== socket.id) {
		socket.emit('room_error', { error: 'Game session already exists' });
		socket.disconnect();
		return;
	}

	activeUsers.set(String(userId), socket.id);

	// ── Join room ─────────────────────────────────────────────────────────────
	socket.on('join_room', async ({ roomId, password }) => {
		const [foundRoom] = await db
			.select({ id: room.id, maxPlayers: room.maxPlayers, isPrivate: room.isPrivate, passwordHash: room.passwordHash })
			.from(room)
			.where(eq(room.id, roomId));

		if (!foundRoom) {
			socket.emit('room_error', { error: 'Room not found' });
			return;
		}

		if (!rooms[roomId]) {
			rooms[roomId] = { players: {}, timer: null };
		}

		if (foundRoom.isPrivate && foundRoom.passwordHash != null) {
			if (!password) {
				socket.emit('room_error', { error: 'Password required to join this room' });
				return;
			}
			const ok = await argon2.verify(foundRoom.passwordHash, password);
			if (!ok) {
				socket.emit('room_error', { error: 'Wrong password' });
				return;
			}
		}

		const currentRoom = rooms[roomId];
		const alreadyInRoom = !!currentRoom.players[socket.data.userId];
		const currentCount = Object.keys(currentRoom.players).length;

		if (!alreadyInRoom && currentCount >= foundRoom.maxPlayers) {
			socket.emit('room_error', { error: 'Room is full' });
			return;
		}

		socket.join(String(roomId));
		socket.data.roomId = roomId;

		let [dbCharacter] = await db
			.select()
			.from(character)
			.where(eq(character.userId, socket.data.userId));

		if (!dbCharacter) {
			await db.insert(character).values({
				userId: socket.data.userId,
				hatId: 0,
				shirtId: 0,
				eyesId: 0
			});
			[dbCharacter] = await db
				.select()
				.from(character)
				.where(eq(character.userId, socket.data.userId));
		}

		const existingPlayer = currentRoom.players[socket.data.userId];

		const player = {
			id: socket.data.userId,
			username: socket.data.username,
			x: existingPlayer?.x ?? Math.random() * 400,
			y: existingPlayer?.y ?? Math.random() * 300,
			bodyColor: dbCharacter?.bodyColor ?? '#ffffff',
			hatId: dbCharacter?.hatId ?? 0,
			shirtId: dbCharacter?.shirtId ?? 0,
			eyesId: dbCharacter?.eyesId ?? 0
		};

		currentRoom.players[socket.data.userId] = player;

		if (currentRoom.timer) {
			clearTimeout(currentRoom.timer);
			currentRoom.timer = null;
		}

		await updatePlayerCount(roomId);

		socket.emit('character_assigned', player);
		socket.emit('existing_players', currentRoom.players);
		socket.to(String(roomId)).emit('player_joined', player);
	});

	// ── Move ──────────────────────────────────────────────────────────────────
	socket.on('move', ({ roomId, x, y }) => {
		const currentRoom = rooms[roomId];
		if (!currentRoom?.players[socket.data.userId]) return;

		const nx = Math.max(0, Math.min(800, x));
		const ny = Math.max(0, Math.min(600, y));

		currentRoom.players[socket.data.userId].x = nx;
		currentRoom.players[socket.data.userId].y = ny;

		socket.to(String(roomId)).emit('player_moved', {
			id: socket.data.userId,
			x: nx,
			y: ny
		});
	});

	// ── Chat ──────────────────────────────────────────────────────────────────
	socket.on('chat_message', ({ roomId, message }) => {
		if (!rooms[roomId]) return;
		io.to(String(roomId)).emit('chat_message', {
			sender: socket.data.username,
			text: message
		});
	});

	// ── Disconnect ────────────────────────────────────────────────────────────
	socket.on('disconnect', async () => {
		const roomId = socket.data.roomId;
		const joinedUserId = socket.data.userId;

		if (joinedUserId && activeUsers.get(joinedUserId) === socket.id) {
			activeUsers.delete(joinedUserId);
		}

		if (!roomId || !joinedUserId || !rooms[roomId]?.players[joinedUserId]) return;

		delete rooms[roomId].players[joinedUserId];
		socket.to(String(roomId)).emit('player_left', joinedUserId);

		handleEmptyRoom(Number(roomId));
		await updatePlayerCount(Number(roomId));
	});
});

app.use(handler);

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});