import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { handler } from '../build/handler.js'

const port = process.env.PORT || 3000
const rooms = {}


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
app.use(handler)

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})