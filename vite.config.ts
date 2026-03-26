import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { Server } from 'socket.io';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room, character } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const EMPTY_ROOM_TIMEOUT = 60 * 1000;

type RoomPlayer = {
	id: string;
	username: string;
	x: number;
	y: number;
	bodyColor: string;
	hatId: number;
	shirtId: number;
	eyesId: number;
};

const rooms: Record<
	string,
	{
		players: Record<string, RoomPlayer>;
		timer: ReturnType<typeof setTimeout> | null;
	}
> = {};

// userid, socketid
const activeUsers = new Map<string, string>();

const webSocketServer = {
	name: 'webSocketServer',

	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;

		const pool = new Pool({
			connectionString: process.env.DATABASE_URL
		});

		const db = drizzle(pool);
		const io = new Server(server.httpServer);

		const getPlayerCount = (roomId: number) =>
			rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;

		const updatePlayerCount = async (roomId: number) => {
			await db
				.update(room)
				.set({ playerCount: getPlayerCount(roomId) })
				.where(eq(room.id, roomId));
		};

		const closeRoom = async (roomId: number) => {
			if (!rooms[roomId]) return;

			io.to(String(roomId)).emit('room_closed', { roomId });
			io.socketsLeave(String(roomId));

			delete rooms[roomId];

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

			socket.on('join_room', async ({ roomId }: { roomId: number }) => {
				const [foundRoom] = await db
					.select({ id: room.id, maxPlayers: room.maxPlayers })
					.from(room)
					.where(eq(room.id, roomId));

				if (!foundRoom) {
					socket.emit('room_error', { error: 'Room not found' });
					return;
				}

				if (!rooms[roomId]) {
					rooms[roomId] = { players: {}, timer: null };
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

				const player: RoomPlayer = {
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

			socket.on('move', ({ roomId, x, y }: { roomId: number; x: number; y: number }) => {
				const currentRoom = rooms[roomId];
				if (!currentRoom || !currentRoom.players[socket.data.userId]) return;

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

			socket.on('chat_message', ({ roomId, message }: { roomId: number; message: string }) => {
				if (!rooms[roomId]) return;

				io.to(String(roomId)).emit('chat_message', {
					sender: socket.data.username,
					text: message
				});
			});

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
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), webSocketServer]
});