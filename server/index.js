import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from '../build/handler.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, integer, text, boolean, timestamp, varchar } from 'drizzle-orm/pg-core';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import argon2 from 'argon2';
import 'dotenv/config';
import { gameModes } from '../src/lib/game-modes/index.ts';

const { Pool } = pg;

const room = pgTable('room', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	name: text('name').notNull(),
	maxPlayers: integer('max_players').notNull().default(10),
	playerCount: integer('player_count').notNull().default(0),
	isPrivate: boolean('is_private').notNull().default(false),
	passwordHash: text('password_hash'),
	type: text('type').notNull().default('BOMB'),
	ownerId: text('owner_id'),
	createdAt: timestamp('created_at').defaultNow().notNull()
});

const character = pgTable('character', {
	id: integer().primaryKey().generatedAlwaysAsIdentity(),
	userId: text('user_id').notNull().unique(),
	bodyColor: varchar('body_color', { length: 7 }).notNull().default('#ffffff'),
	hatId: integer('hat_id').default(0),
	shirtId: integer('shirt_id').default(0),
	eyesId: integer('eyes_id').default(0)
});

const port = process.env.PORT || 3000;
const EMPTY_ROOM_TIMEOUT = 60 * 1000;

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

const getMode = (roomId) => {
	const currentRoom = rooms[roomId];
	if (!currentRoom) return null;
	return gameModes[currentRoom.roomType] ?? null;
};

const emitRoomState = (roomId) => {
	const currentRoom = rooms[roomId];
	if (!currentRoom) return;

	io.to(String(roomId)).emit('room_state', {
		players: Object.values(currentRoom.players),
		started: currentRoom.started,
		roomType: currentRoom.roomType,
		owner: currentRoom.owner
	});
};

const updatePlayerCount = async (roomId) => {
	await db
		.update(room)
		.set({ playerCount: getPlayerCount(roomId) })
		.where(eq(room.id, roomId));
};

const updateOwner = async (roomId, ownerId) => {
	await db
		.update(room)
		.set({ ownerId })
		.where(eq(room.id, roomId));
};

const closeRoom = async (roomId) => {
	if (!rooms[roomId]) return;

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

const removePlayerFromRoom = async (socket, options = {}) => {
	const roomId = Number(socket.data.roomId);
	const userId = socket.data.userId;

	if (options.clearActiveUser && userId && activeUsers.get(userId) === socket.id) {
		activeUsers.delete(userId);
	}

	if (!roomId || !userId || !rooms[roomId]?.players[userId]) {
		socket.data.roomId = undefined;
		return;
	}

	const currentRoom = rooms[roomId];
	const mode = getMode(roomId);

	mode?.onPlayerLeave?.(
		{
			roomId,
			room: currentRoom,
			io
		},
		userId
	);

	if (currentRoom.owner?.id === userId) {
		const remaining = Object.values(currentRoom.players).filter((p) => p.id !== userId);
		currentRoom.owner = remaining[0] ?? null;

		if (currentRoom.owner) {
			await updateOwner(roomId, currentRoom.owner.id);
		} else {
			await updateOwner(roomId, null);
		}
	}

	delete currentRoom.players[userId];

	socket.leave(String(roomId));
	socket.data.roomId = undefined;

	handleEmptyRoom(roomId);
	await updatePlayerCount(roomId);
	emitRoomState(roomId);
};

// ── Game loop ─────────────────────────────────────────────────────────────────

setInterval(() => {
	for (const [roomIdString, currentRoom] of Object.entries(rooms)) {
		if (!currentRoom.started) continue;

		const roomId = Number(roomIdString);
		const mode = gameModes[currentRoom.roomType];

		mode?.onTick?.({
			roomId,
			room: currentRoom,
			io
		});
	}
}, 250);

// ── Socket.IO ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
	const { userId, username } = socket.handshake.auth ?? {};

	if (!userId || !username) {
		socket.disconnect();
		return;
	}

	socket.data.userId = String(userId);
	socket.data.username = String(username);

	const existingSocketId = activeUsers.get(String(userId));
	if (existingSocketId && existingSocketId !== socket.id) {
		socket.emit('room_error', { error: 'Game session already exists' });
		socket.disconnect();
		return;
	}

	activeUsers.set(String(userId), socket.id);

	// ── Join room ─────────────────────────────────────────────────────────────

	socket.on('join_room', async ({ roomId, password }) => {
		const currentRoomId = Number(socket.data.roomId);

		if (currentRoomId && currentRoomId !== roomId) {
			await removePlayerFromRoom(socket, { clearActiveUser: false });
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

		if (foundRoom.isPrivate && foundRoom.passwordHash) {
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
			eyesId: dbCharacter?.eyesId ?? 0,
			joined: existingPlayer?.joined ?? false
		};

		currentRoom.players[socket.data.userId] = player;

		if (!currentRoom.owner) {
			currentRoom.owner = currentRoom.players[socket.data.userId];
			await updateOwner(roomId, currentRoom.owner.id);
		}

		if (currentRoom.timer) {
			clearTimeout(currentRoom.timer);
			currentRoom.timer = null;
		}

		await updatePlayerCount(roomId);

		socket.emit('character_assigned', player);
		socket.emit('existing_players', currentRoom.players);
		socket.to(String(roomId)).emit('player_joined', player);
		emitRoomState(roomId);
	});

	// ── Leave room ────────────────────────────────────────────────────────────

	socket.on('leave_room', async () => {
		await removePlayerFromRoom(socket, { clearActiveUser: false });
		socket.emit('left_room');
	});

	// ── Join game ─────────────────────────────────────────────────────────────

	socket.on('join_game', async () => {
		const roomId = Number(socket.data.roomId);
		const joinedUserId = socket.data.userId;
		const currentRoom = rooms[roomId];

		if (!joinedUserId || activeUsers.get(joinedUserId) !== socket.id || !currentRoom) return;
		if (currentRoom.started) return;
		if (!currentRoom.players[joinedUserId]) return;

		currentRoom.players[joinedUserId].joined = true;

		const joinedCount = Object.values(currentRoom.players).filter((p) => p.joined).length;

		emitRoomState(roomId);

		if (joinedCount > 1) {
			currentRoom.started = true;

			const mode = getMode(roomId);
			mode?.onGameStart?.({
				room: currentRoom,
				roomId,
				io
			});
		}
	});

	// ── Wordbomb submit ───────────────────────────────────────────────────────

	socket.on('wordbomb_submit', async ({ word }) => {
		const roomId = Number(socket.data.roomId);
		const userId = socket.data.userId;
		const currentRoom = rooms[roomId];
		const mode = getMode(roomId);

		if (!currentRoom || !mode) return;

		mode.onWordSubmitted?.(
			{
				roomId,
				room: currentRoom,
				io
			},
			userId,
			word
		);
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
		await removePlayerFromRoom(socket, { clearActiveUser: true });

		const currentRoomId = Number(socket.data.roomId);
		emitRoomState(currentRoomId);
	});
});

app.use(handler);

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});