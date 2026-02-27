import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer ,defineConfig } from 'vite';
import { Server } from 'socket.io';

const rooms = {
	lobby : {
		players : {},
		map : "plaza"
	},
	dungeon: {
		players : {},
		map : "cave"
	},
	miku: {
		players : {},
		map : "miku"
	}
}

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer)

		io.on("connection", socket => {
			const uuid = crypto.randomUUID();

			socket.on("join_room", ({ roomId }) => {
				if(!rooms[roomId]){
					socket.emit("room_error", {error : "Room does not exist."})
					return;
				}

				socket.join(roomId);

				const character = {
					id: uuid,
					sprite: "cat",
					x: Math.random() * 400,
					y: Math.random() * 300
				};

				// store metadata
				if (!rooms[roomId]){
					rooms[roomId] = {players : {}, map : "default"}
				}

				rooms[roomId].players[uuid] = character;

				// send the new player their own character
				socket.emit("character_assigned", character);

				// send existing players to the new player
				socket.emit("existing_players", rooms[roomId].players);

				// Modify mapinfo
				socket.emit("map_info", {map : rooms[roomId].map})

				// notify others
				socket.to(roomId).emit("player_joined", character);
			});

			socket.on("move", ({ roomId, x, y }) => {
				if (!rooms[roomId] || !rooms[roomId].players[uuid]) return;

				rooms[roomId].players[uuid].x = x;
				rooms[roomId].players[uuid].y = y;

				socket.to(roomId).emit("player_moved", {
					id: uuid,
					x,
					y
				});
			});

			socket.on("chat_message", ({roomId, message}) =>{
				io.to(roomId).emit("chat_message", {
					sender : uuid,
					text : message
				})	
			})

			socket.on("disconnect", () => {
				for (const roomId in rooms) {
					if (rooms[roomId].players[uuid]) {
						delete rooms[roomId].players[uuid];
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

// export default defineConfig({ plugins: [tailwindcss(), sveltekit(), webSocketServer] });
 export default defineConfig({ plugins: [tailwindcss(), sveltekit(), webSocketServer] });
