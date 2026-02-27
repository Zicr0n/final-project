import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { handler } from '../build/handler.js'

const port = process.env.PORT || 3000
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


const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*', // fine for now, restrict later
  },
  connectionStateRecovery : {}
})

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
app.use(handler)

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})