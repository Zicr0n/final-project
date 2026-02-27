import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer ,defineConfig } from 'vite';
import { Server } from 'socket.io';

class Room{
	constructor(id) {
		this.id = id
		this.players = []
	}
} 

const rooms = {}

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer)

		io.on("connection", socket => {
			const uuid = crypto.randomUUID();

			socket.on("join_room", ({ roomId }) => {
				socket.join(roomId);

				const character = {
					id: uuid,
					sprite: "cat",
					x: Math.random() * 400,
					y: Math.random() * 300
				};

				// store metadata
				if (!rooms[roomId]) rooms[roomId] = {};
				rooms[roomId][uuid] = character;

				// send the new player their own character
				socket.emit("character_assigned", character);

				// send existing players to the new player
				socket.emit("existing_players", rooms[roomId]);

				// notify others
				socket.to(roomId).emit("player_joined", character);
			});

			socket.on("move", ({ roomId, x, y }) => {
				if (!rooms[roomId] || !rooms[roomId][uuid]) return;

				rooms[roomId][uuid].x = x;
				rooms[roomId][uuid].y = y;

				socket.to(roomId).emit("player_moved", {
					id: uuid,
					x,
					y
				});
			});

			socket.on("disconnect", () => {
				for (const roomId in rooms) {
					if (rooms[roomId][uuid]) {
						delete rooms[roomId][uuid];
						socket.to(roomId).emit("player_left", uuid);
					}
				}
			});
		});

		// io.on('connection', (socket) => {
		// 	// Exclude sender
		// 	// socket.emit('hello', 'world'); 
		// 	// Incllude sender
		// 	// io.emit('chat message', msg);
		// 	console.log('User connected')

		// 	socket.on('join_room', ({userId, roomId})=>{
		// 		socket.join(roomId)
		// 		const character = "hi" // Assign character
		// 		socket.emit('character_assigned')

		// 		socket.to(roomId).emit('player_joined',{
		// 			userId,
		// 			character
		// 		})

		// 	})

		// 	socket.emit('eventFromServer', 'Hello from production 👋')

		// 	socket.on('chat_message', (msg) => {
		// 		io.emit('chat_message', msg);
		// 	})

		// 	socket.on('disconnect', () => {
		// 		console.log('User disconnected')
		// 	})
		// })
	}
}

//export default defineConfig({ plugins: [tailwindcss(), sveltekit(), webSocketServer] });
export default defineConfig({ plugins: [tailwindcss(), sveltekit()] });
