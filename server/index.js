import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handler } from '../build/handler.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room } from '../src/lib/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import pg from 'pg';

const { Pool } = pg;

const port = process.env.PORT || 3000;
const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000;

// In-memory player state only — room metadata lives in the DB
// rooms[roomId] = { players: {}, emptyTimer: null }
const rooms = {};

const app = express();
const server = createServer(app);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const io = new Server(server, {
	cors: { origin: '*' },
	connectionStateRecovery: {}
});

// ── Room helpers ──────────────────────────────────────────────────────────────

async function closeRoom(roomId) {
	if (!rooms[roomId]) return;
	console.log(`Room ${roomId} closed due to inactivity.`);
	io.to(roomId).emit('room_closed', { roomId });
	io.socketsLeave(roomId);
	delete rooms[roomId];
	await db.delete(room).where(eq(room.id, roomId));
}

function resetEmptyTimer(roomId) {
	if (!rooms[roomId]) return;
	if (rooms[roomId].emptyTimer) {
		clearTimeout(rooms[roomId].emptyTimer);
		rooms[roomId].emptyTimer = null;
	}
	if (Object.keys(rooms[roomId].players).length === 0) {
		rooms[roomId].emptyTimer = setTimeout(() => closeRoom(roomId), EMPTY_ROOM_TIMEOUT);
	}
}

async function updatePlayerCount(roomId) {
	const count = rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;
	await db
		.update(room)
		.set({ playerCount: count })
		.where(eq(room.id, roomId));
}

// ── Socket.IO ─────────────────────────────────────────────────────────────────

io.on('connection', (socket) => {
	const uuid = crypto.randomUUID();

	// ── Join room ─────────────────────────────────────────────────────────────
	socket.on('join_room', async ({ roomId }) => {
		// Validate room exists in DB
		const [found] = await db
			.select({ id: room.id, maxPlayers: room.maxPlayers })
			.from(room)
			.where(eq(room.id, roomId));

		if (!found) {
			socket.emit('room_error', { error: 'Room does not exist.' });
			return;
		}

		// Initialise in-memory state for this room if first player
		if (!rooms[roomId]) {
			rooms[roomId] = { players: {}, emptyTimer: null };
		}

		// Enforce max players
		if (Object.keys(rooms[roomId].players).length >= found.maxPlayers) {
			socket.emit('room_error', { error: 'Room is full.' });
			return;
		}

		socket.join(roomId);

		const character = {
			id: uuid,
			sprite: 'cat',
			x: Math.random() * 400,
			y: Math.random() * 300
		};

		rooms[roomId].players[uuid] = character;

		if (rooms[roomId].emptyTimer) {
			clearTimeout(rooms[roomId].emptyTimer);
			rooms[roomId].emptyTimer = null;
		}

		await updatePlayerCount(roomId);

		socket.emit('character_assigned', character);
		socket.emit('existing_players', rooms[roomId].players);
		socket.to(roomId).emit('player_joined', character);
	});

	// ── Move ──────────────────────────────────────────────────────────────────
	socket.on('move', ({ roomId, x, y }) => {
		if (!rooms[roomId]?.players[uuid]) return;

		const clampedX = Math.max(0, Math.min(800, x));
		const clampedY = Math.max(0, Math.min(600, y));

		rooms[roomId].players[uuid].x = clampedX;
		rooms[roomId].players[uuid].y = clampedY;

		socket.to(roomId).emit('player_moved', { id: uuid, x: clampedX, y: clampedY });
	});

	// ── Chat ──────────────────────────────────────────────────────────────────
	socket.on('chat_message', ({ roomId, message }) => {
		if (!rooms[roomId]) return;
		io.to(roomId).emit('chat_message', { sender: uuid, text: message });
	});

	// ── Disconnect ────────────────────────────────────────────────────────────
	socket.on('disconnect', async () => {
		for (const roomId in rooms) {
			if (rooms[roomId].players[uuid]) {
				delete rooms[roomId].players[uuid];
				socket.to(roomId).emit('player_left', uuid);
				resetEmptyTimer(roomId);
				await updatePlayerCount(roomId);
			}
		}
	});
});

app.use(handler);

server.listen(port, () => {
	console.log(`Server running on port ${port}`);
});