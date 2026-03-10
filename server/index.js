import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { handler } from '../build/handler.js'

const port = process.env.PORT || 3000
const EMPTY_ROOM_TIMEOUT = 5 * 60 * 1000 // 5 minutes in ms

// Rooms are now dynamic instead of hardcoded
const rooms = {}

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*', // fine for now, restrict later
  },
  connectionStateRecovery: {}
})

// ── Room helpers ────────────────────────────────────────────────────────────

function closeRoom(roomId) {
  if (!rooms[roomId]) return
  console.log(`Room "${rooms[roomId].name}" (${roomId}) closed due to inactivity.`)
  io.to(roomId).emit("room_closed", { roomId })
  io.socketsLeave(roomId)
  delete rooms[roomId]
  // Broadcast updated room list to everyone
  io.emit("room_list", getRoomList())
}

function resetEmptyTimer(roomId) {
  if (!rooms[roomId]) return
  // Clear existing timer if any
  if (rooms[roomId].emptyTimer) {
    clearTimeout(rooms[roomId].emptyTimer)
    rooms[roomId].emptyTimer = null
  }
  // Only start timer if room is empty
  if (Object.keys(rooms[roomId].players).length === 0) {
    rooms[roomId].emptyTimer = setTimeout(() => closeRoom(roomId), EMPTY_ROOM_TIMEOUT)
  }
}

function getRoomList() {
  return Object.entries(rooms).map(([roomId, room]) => ({
    roomId,
    name: room.name,
    playerCount: Object.keys(room.players).length,
    map: room.map
  }))
}

// ── Socket.IO ───────────────────────────────────────────────────────────────

io.on("connection", socket => {
  const uuid = crypto.randomUUID()

  // Send current room list when a client connects
  socket.emit("room_list", getRoomList())

  // ── Create room ──────────────────────────────────────────────────────────
  socket.on("create_room", ({ name, map = "default" }) => {
    if (!name || !name.trim()) {
      socket.emit("room_error", { error: "Room name cannot be empty." })
      return
    }

    const roomId = crypto.randomUUID()

    rooms[roomId] = {
      name: name.trim(),
      map,
      players: {},
      emptyTimer: null
    }

    // Start the empty timer immediately (room starts empty)
    resetEmptyTimer(roomId)

    socket.emit("room_created", { roomId, name: name.trim(), map })

    // Broadcast updated list to all connected clients
    io.emit("room_list", getRoomList())

    console.log(`Room "${name}" (${roomId}) created.`)
  })

  // ── Join room ────────────────────────────────────────────────────────────
  socket.on("join_room", ({ roomId }) => {
    if (!rooms[roomId]) {
      socket.emit("room_error", { error: "Room does not exist." })
      return
    }

    socket.join(roomId)

    const character = {
      id: uuid,
      sprite: "cat",
      x: Math.random() * 400,
      y: Math.random() * 300
    }

    rooms[roomId].players[uuid] = character

    // Cancel the empty-room timer since someone just joined
    if (rooms[roomId].emptyTimer) {
      clearTimeout(rooms[roomId].emptyTimer)
      rooms[roomId].emptyTimer = null
    }

    // Send new player their character
    socket.emit("character_assigned", character)

    // Send existing players to the new player
    socket.emit("existing_players", rooms[roomId].players)

    // Send map info
    socket.emit("map_info", { map: rooms[roomId].map })

    // Notify others in the room
    socket.to(roomId).emit("player_joined", character)

    // Broadcast updated room list (player count changed)
    io.emit("room_list", getRoomList())
  })

  // ── Move ─────────────────────────────────────────────────────────────────
  socket.on("move", ({ roomId, x, y }) => {
    if (!rooms[roomId] || !rooms[roomId].players[uuid]) return

    // Clamp to map bounds server-side
    const clampedX = Math.max(0, Math.min(800, x))
    const clampedY = Math.max(0, Math.min(600, y))

    rooms[roomId].players[uuid].x = clampedX
    rooms[roomId].players[uuid].y = clampedY

    socket.to(roomId).emit("player_moved", {
      id: uuid,
      x: clampedX,
      y: clampedY
    })
  })

  // ── Chat ─────────────────────────────────────────────────────────────────
  socket.on("chat_message", ({ roomId, message }) => {
    if (!rooms[roomId]) return
    io.to(roomId).emit("chat_message", {
      sender: uuid,
      text: message
    })
  })

  // ── Disconnect ───────────────────────────────────────────────────────────
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[uuid]) {
        delete rooms[roomId].players[uuid]
        socket.to(roomId).emit("player_left", uuid)

        // Start empty timer if room is now empty
        resetEmptyTimer(roomId)

        // Broadcast updated room list (player count changed)
        io.emit("room_list", getRoomList())
      }
    }
  })
})

app.use(handler)

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})