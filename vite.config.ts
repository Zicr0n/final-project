import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type ViteDevServer } from 'vite';
import { Server } from 'socket.io';
import { drizzle } from 'drizzle-orm/node-postgres';
import { room, roomTypeEnum } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import 'dotenv/config';
import argon2 from 'argon2';

const { Pool } = pg;

const EMPTY_ROOM_TIMEOUT = 60 * 1000;

type RoomPlayer = {
	id: string;
	username: string;
	joined: boolean;
};

enum RoomType {
	BOMB,
	POP, // TODO
	SCRIBBLE, // TODO
	VOTE // TODO
}

const rooms: Record<
	number,
	{
		players: Record<string, RoomPlayer>;
		timer: ReturnType<typeof setTimeout> | null;
		started: boolean;
		roomType : string;
	}
> = {};

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

		const getJoinedPlayerCount = (roomId: number) =>
			rooms[roomId] ? Object.values(rooms[roomId].players).filter((player) => player.joined == true).length : 0;

		const updatePlayerCount = async (roomId: number) => {
			await db
				.update(room)
				.set({ playerCount: getPlayerCount(roomId) })
				.where(eq(room.id, roomId));
		};

		const endGame = (roomId : number) => {
			const room = rooms[roomId]

			for (var player of Object.values(room.players)){
				player.joined = false
			}

			room.started = false
		}

		const emitRoomState = (roomId: number) => {
			const currentRoom = rooms[roomId];
			if (!currentRoom) return;

			io.to(String(roomId)).emit('room_state', {
				players: Object.values(currentRoom.players),
				started : currentRoom.started
			});
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

			socket.on(
				'join_room',
				async ({ roomId, password }: { roomId: number; password?: string }) => {
					const [foundRoom] = await db
						.select({
							id: room.id,
							maxPlayers: room.maxPlayers,
							isPrivate: room.isPrivate,
							passwordHash: room.passwordHash,
							type : room.type
						})
						.from(room)
						.where(eq(room.id, roomId));

					if (!foundRoom) {
						socket.emit('room_error', { error: 'Room not found' });
						return;
					}

					if (!rooms[roomId]) {
						rooms[roomId] = { players: {}, timer: null, started : false, roomType : foundRoom.type };
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

					currentRoom.players[socket.data.userId] = {
						id: socket.data.userId,
						username: socket.data.username,
						joined : false
					};

					if (currentRoom.timer) {
						clearTimeout(currentRoom.timer);
						currentRoom.timer = null;
					}

					await updatePlayerCount(roomId);
					emitRoomState(roomId);
				}
			);

			socket.on('disconnect', async () => {
				const roomId = Number(socket.data.roomId);
				const joinedUserId = socket.data.userId;

				// TODO : do not disconnect player immediately, only
				// after like 1 minute

				if (joinedUserId && activeUsers.get(joinedUserId) === socket.id) {
					activeUsers.delete(joinedUserId);
				}

				if (!roomId || !joinedUserId || !rooms[roomId]?.players[joinedUserId]) return;

				const currentRoom = rooms[roomId]

				delete currentRoom.players[joinedUserId];

				if(getJoinedPlayerCount(roomId) == 1){
					// End game, cant play alone
					endGame(roomId)
				}

				handleEmptyRoom(roomId);
				await updatePlayerCount(roomId);
				emitRoomState(roomId);
			});

			socket.on('join_game', async () =>{
				const roomId = Number(socket.data.roomId);
				const joinedUserId = socket.data.userId;
				const room = rooms[roomId]

				if (joinedUserId && activeUsers.get(joinedUserId) === socket.id && room) {
					// Check if game is already started or not
					if (room.started == true){
						console.log("room already started cant join")
						return // TODO : send error that the game has already started and you somehow was able to join
					}

					// Join the game
					room.players[joinedUserId].joined = true;

					// Check if enough players, then start
					// TODO : if enough players, start timer then start
					// TODO : pause timer if settings are being changed
					console.log(room.players)
					if(Object.values(room.players).filter((a) => a.joined === true).length > 1){
						room.started = true
						console.log("started")
					}

					emitRoomState(roomId);

					return true
				}

				return false
			})
		});
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), webSocketServer]
});