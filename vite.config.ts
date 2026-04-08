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
import type { GameMode } from './src/lib/game-modes/mode-interface.js';
import { gameModes } from './src/lib/game-modes/index.js';

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
		roomType: string;
		gameState: any;
		owner: RoomPlayer | null;
	}
> = {};

// roomId -> (userId -> socketId)
const roomUserSockets = new Map<number, Map<string, string>>();

const webSocketServer = {
	name: 'webSocketServer',

	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;

		const pool = new Pool({
			connectionString: process.env.DATABASE_URL
		});

		const db = drizzle(pool);
		const io = new Server(server.httpServer);

		setInterval(() => {
			for (const [roomIdString, currentRoom] of Object.entries(rooms)) {
				if (!currentRoom.started) continue;

				const roomId = Number(roomIdString);
				const mode = gameModes[currentRoom.roomType as keyof typeof gameModes];

				mode?.onTick?.({
					roomId,
					room: currentRoom,
					io
				});
			}
		}, 250);

		const getPlayerCount = (roomId: number) =>
			rooms[roomId] ? Object.keys(rooms[roomId].players).length : 0;

		const getJoinedPlayerCount = (roomId: number) =>
			rooms[roomId]
				? Object.values(rooms[roomId].players).filter((player) => player.joined == true).length
				: 0;

		const updatePlayerCount = async (roomId: number) => {
			await db
				.update(room)
				.set({ playerCount: getPlayerCount(roomId) })
				.where(eq(room.id, roomId));
		};

		const updateOwner = async (roomId: number, ownerId: string) => {
			await db
				.update(room)
				.set({ ownerId: ownerId })
				.where(eq(room.id, roomId));
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

			mode?.onPlayerLeave?.(
				{
					roomId,
					room: currentRoom,
					io
				},
				userId
			);

			const roomSockets = roomUserSockets.get(roomId);
			if (roomSockets?.get(userId) === socket.id) {
				roomSockets.delete(userId);
				if (roomSockets.size === 0) {
					roomUserSockets.delete(roomId);
				}
			}

			if (currentRoom.owner?.id === userId) {
				const remaining = Object.values(currentRoom.players).filter((p) => p.id !== userId);
				currentRoom.owner = remaining[0] ?? null;

				if (currentRoom.owner) {
					await updateOwner(roomId, currentRoom.owner.id);
				}
			}

			delete currentRoom.players[userId];

			socket.leave(String(roomId));
			socket.data.roomId = undefined;

			handleEmptyRoom(roomId);
			await updatePlayerCount(roomId);
			emitRoomState(roomId);
		};

		const getMode = (roomId: number) => {
			const currentRoom = rooms[roomId];
			if (!currentRoom) return null;

			return gameModes[currentRoom.roomType as keyof typeof gameModes] ?? null;
		};

		const emitRoomState = (roomId: number) => {
			const currentRoom = rooms[roomId];
			if (!currentRoom) return;

			console.log(Object.values(currentRoom.players));

			io.to(String(roomId)).emit('room_state', {
				players: Object.values(currentRoom.players),
				started: currentRoom.started,
				roomType: currentRoom.roomType,
				owner: currentRoom.owner
			});
		};

		const closeRoom = async (roomId: number) => {
			if (!rooms[roomId]) return;

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

		io.on('connection', (socket) => {
			const { userId, username } = socket.handshake.auth ?? {};

			if (!userId || !username) {
				socket.disconnect();
				return;
			}

			socket.data.userId = String(userId);
			socket.data.username = String(username);

			socket.on(
				'join_room',
				async ({ roomId, password }: { roomId: number; password?: string }) => {
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

					if (!rooms[roomId]) {
						const mode = gameModes[foundRoom.type];
						rooms[roomId] = {
							players: {},
							timer: null,
							started: false,
							roomType: foundRoom.type,
							gameState: mode?.initMode() ?? null,
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

					let roomSockets = roomUserSockets.get(roomId);
					if (!roomSockets) {
						roomSockets = new Map<string, string>();
						roomUserSockets.set(roomId, roomSockets);
					}

					const existingSocketId = roomSockets.get(socket.data.userId);

					if (existingSocketId && existingSocketId !== socket.id) {
						const existingSocket = io.sockets.sockets.get(existingSocketId);
						if (existingSocket) {
							existingSocket.emit('room_error', {
								error: 'Disconnected because this room was opened in another tab'
							});
							existingSocket.disconnect(true);
						}
					}

					const alreadyInRoom = !!currentRoom.players[socket.data.userId];
					const currentCount = Object.keys(currentRoom.players).length;

					if (!alreadyInRoom && currentCount >= foundRoom.maxPlayers) {
						socket.emit('room_error', { error: 'Room is full' });
						return;
					}

					socket.join(String(roomId));
					socket.data.roomId = roomId;

					roomSockets.set(socket.data.userId, socket.id);

					currentRoom.players[socket.data.userId] = {
						id: socket.data.userId,
						username: socket.data.username,
						joined: false
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
				}
			);

			socket.on('disconnect', async () => {
				const currentRoomId = Number(socket.data.roomId);
				await removePlayerFromRoom(socket);
				if (currentRoomId) {
					emitRoomState(currentRoomId);
				}
			});

			socket.on('leave_room', async () => {
				await removePlayerFromRoom(socket);
				socket.emit('left_room');
			});

			socket.on('join_game', async () => {
				const roomId = Number(socket.data.roomId);
				const joinedUserId = socket.data.userId;
				const room = rooms[roomId];

				if (!joinedUserId || !room) return;

				const roomSockets = roomUserSockets.get(roomId);
				if (roomSockets?.get(joinedUserId) !== socket.id) return;

				if (room.started) return;
				if (!room.players[joinedUserId]) return;

				room.players[joinedUserId].joined = true;

				const joinedCount = Object.values(room.players).filter((p) => p.joined).length;

				emitRoomState(roomId);

				console.log(room.players);

				if (joinedCount > 1) {
					// TODO : start timer (which pasued when settings
					// are being edited) then start the game
					room.started = true;

					const mode = getMode(roomId);
					mode?.onGameStart?.({
						room,
						roomId,
						io
					});
				}
			});

			socket.on('wordbomb_submit', async ({ word }) => {
				const roomId = Number(socket.data.roomId);
				const userId = socket.data.userId;
				const room = rooms[roomId];
				const mode = getMode(roomId);

				if (!room || !mode) return;

				const roomSockets = roomUserSockets.get(roomId);
				if (roomSockets?.get(userId) !== socket.id) return;

				mode.onWordSubmitted?.(
					{
						roomId,
						room,
						io
					},
					userId,
					word
				);
			});

			socket.on('wordbomb_letter', async ({ word }) => {
				const roomId = Number(socket.data.roomId);
				const userId = socket.data.userId;
				const room = rooms[roomId];
				const mode = getMode(roomId);

				if (!room || !mode) return;

				const roomSockets = roomUserSockets.get(roomId);
				if (roomSockets?.get(userId) !== socket.id) return;

				console.log(word)
			});
		});
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), webSocketServer]
});