import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer, defineConfig } from 'vite';
import { Server } from 'socket.io';

const EMPTY_ROOM_TIMEOUT = 1 * 60 * 1000; // 1 minutes in ms

const rooms: Record<
	string,
	{
		name: string;
		map: string;
		maxPlayers : number
		players: Record<string, any>;
		emptyTimer: ReturnType<typeof setTimeout> | null;
	}
> = {};

function getRoomList() {
	return Object.entries(rooms).map(([roomId, room]) => ({
		roomId,
		name: room.name,
		playerCount: Object.keys(room.players).length,
		map: room.map,
		maxPlayers : room.maxPlayers
	}));
}

function closeRoom(io: Server, roomId: string) {
	if (!rooms[roomId]) return;
	console.log(`Room "${rooms[roomId].name}" (${roomId}) closed due to inactivity.`);
	io.to(roomId).emit('room_closed', { roomId });
	io.socketsLeave(roomId);
	delete rooms[roomId];
	io.emit('room_list', getRoomList());
}

function resetEmptyTimer(io: Server, roomId: string) {
	if (!rooms[roomId]) return;
	if (rooms[roomId].emptyTimer) {
		clearTimeout(rooms[roomId].emptyTimer!);
		rooms[roomId].emptyTimer = null;
	}
	if (Object.keys(rooms[roomId].players).length === 0) {
		rooms[roomId].emptyTimer = setTimeout(() => closeRoom(io, roomId), EMPTY_ROOM_TIMEOUT);
	}
}

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return;

		const io = new Server(server.httpServer);

		io.on('connection', (socket) => {
			const uuid = crypto.randomUUID();

			// Send current room list on connect
			socket.emit('room_list', getRoomList());

			socket.on('create_room', ({ name, map = 'default', maxPlayers = 1 }: { name: string; map?: string, maxPlayers : number }) => {
				if (!name || !name.trim()) {
					socket.emit('room_error', { error: 'Room name cannot be empty.' });
					return;
				}

				if (!maxPlayers || maxPlayers > 50 || maxPlayers < 1) {
					socket.emit('room_error', { error: 'Invalind room player size' });
					return;
				}

				const roomId = crypto.randomUUID();
				rooms[roomId] = { name: name.trim(), map, players: {}, emptyTimer: null, maxPlayers};
				resetEmptyTimer(io, roomId);

				socket.emit('room_created', { roomId, name: name.trim(), map, maxPlayers : maxPlayers });
				io.emit('room_list', getRoomList());

				console.log(`Room "${name}" (${roomId}) created.`);
			});

			socket.on('join_room', ({ roomId }: { roomId: string }) => {
				if (!rooms[roomId]) {
					socket.emit('room_error', { error: 'Room does not exist.' });
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
					clearTimeout(rooms[roomId].emptyTimer!);
					rooms[roomId].emptyTimer = null;
				}

				console.log(rooms[roomId].players)
				if (Object.keys(rooms[roomId].players).length > rooms[roomId].maxPlayers){
					console.log("ERORR")
					socket.emit('room_error', { error: 'Room is full!' });
					return;
				}

				socket.emit('character_assigned', character);
				socket.emit('existing_players', rooms[roomId].players);
				socket.emit('map_info', { map: rooms[roomId].map });
				socket.to(roomId).emit('player_joined', character);
				io.emit('room_list', getRoomList());
			});

			socket.on('move', ({ roomId, x, y }: { roomId: string; x: number; y: number }) => {
				if (!rooms[roomId] || !rooms[roomId].players[uuid]) return;

				const clampedX = Math.max(0, Math.min(800, x));
				const clampedY = Math.max(0, Math.min(600, y));

				rooms[roomId].players[uuid].x = clampedX;
				rooms[roomId].players[uuid].y = clampedY;

				socket.to(roomId).emit('player_moved', { id: uuid, x: clampedX, y: clampedY });
			});

			socket.on('chat_message', ({ roomId, message }: { roomId: string; message: string }) => {
				if (!rooms[roomId]) return;
				io.to(roomId).emit('chat_message', { sender: uuid, text: message });
			});

			socket.on('disconnect', () => {
				for (const roomId in rooms) {
					if (rooms[roomId].players[uuid]) {
						delete rooms[roomId].players[uuid];
						socket.to(roomId).emit('player_left', uuid);
						resetEmptyTimer(io, roomId);
						io.emit('room_list', getRoomList());
					}
				}
			});
		});
	}
};

export default defineConfig({ plugins: [tailwindcss(), sveltekit(), webSocketServer] });
