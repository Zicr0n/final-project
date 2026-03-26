import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';
import { Server } from 'socket.io';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const EMPTY_ROOM_TIMEOUT = 1 * 60 * 1000;

// In-memory gameplay state only — room metadata lives in the DB
const rooms: Record<
	string,
	{
		players: Record<string, any>;
		emptyTimer: ReturnType<typeof setTimeout> | null;
	}
> = {};

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;

		const pool = new Pool({ connectionString: process.env.DATABASE_URL });
		const db = drizzle(pool);

		const io = new Server(server.httpServer);

		async function updatePlayerCount(roomId: number) {
			const count = rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;
			await db.update(room).set({ playerCount: count }).where(eq(room.id, roomId));
		}

		async function closeRoom(roomId: number) {
			if (!rooms[roomId]) return;
			console.log(`Room ${roomId} closed due to inactivity.`);
			io.to(String(roomId)).emit('room_closed', { roomId });
			io.socketsLeave(String(roomId));
			delete rooms[roomId];
			await db.delete(room).where(eq(room.id, roomId));
		}

		function resetEmptyTimer(roomId: number) {
			if (!rooms[roomId]) return;
			if (rooms[roomId].emptyTimer) {
				clearTimeout(rooms[roomId].emptyTimer!);
				rooms[roomId].emptyTimer = null;
			}
			if (Object.keys(rooms[roomId].players).length === 0) {
				rooms[roomId].emptyTimer = setTimeout(() => closeRoom(roomId), EMPTY_ROOM_TIMEOUT);
			}
		}

		io.on('connection', (socket) => {
			const uuid = crypto.randomUUID();

			socket.on('join_room', async ({ roomId }: { roomId: number }) => {
				const [found] = await db
					.select({ id: room.id, maxPlayers: room.maxPlayers })
					.from(room)
					.where(eq(room.id, roomId));

				if (!found) {
					socket.emit('room_error', { error: 'Room does not exist.' });
					return;
				}

				if (!rooms[roomId]) {
					rooms[roomId] = { players: {}, emptyTimer: null };
				}

				if (Object.keys(rooms[roomId].players).length >= found.maxPlayers) {
					socket.emit('room_error', { error: 'Room is full!' });
					return;
				}

				socket.join(String(roomId));

				const character = {
					id: uuid,
					sprite: 'cat',
					x: Math.random() * 400,
					y: Math.random() * 300
				};

				rooms[roomId].players[uuid] = character;

				if (rooms[roomId].emptyTimer) {
					clearTimeout(rooms[roomId].emptyTimer!);
					rooms[roomId].emptyTimer = null;
				}

				await updatePlayerCount(roomId);

				socket.emit('character_assigned', character);
				socket.emit('existing_players', rooms[roomId].players);
				socket.to(String(roomId)).emit('player_joined', character);
			});

			socket.on('move', ({ roomId, x, y }: { roomId: number; x: number; y: number }) => {
				if (!rooms[roomId]?.players[uuid]) return;

				const clampedX = Math.max(0, Math.min(800, x));
				const clampedY = Math.max(0, Math.min(600, y));

				rooms[roomId].players[uuid].x = clampedX;
				rooms[roomId].players[uuid].y = clampedY;

				socket.to(String(roomId)).emit('player_moved', { id: uuid, x: clampedX, y: clampedY });
			});

			socket.on('chat_message', ({ roomId, message }: { roomId: number; message: string }) => {
				if (!rooms[roomId]) return;
				io.to(String(roomId)).emit('chat_message', { sender: uuid, text: message });
			});

			socket.on('disconnect', async () => {
				for (const roomId in rooms) {
					if (rooms[roomId].players[uuid]) {
						delete rooms[roomId].players[uuid];
						socket.to(roomId).emit('player_left', uuid);
						resetEmptyTimer(Number(roomId));
						await updatePlayerCount(Number(roomId));
					}
				}
			});
		});
	}
};

export default defineConfig({ plugins: [tailwindcss(), sveltekit(), webSocketServer] });