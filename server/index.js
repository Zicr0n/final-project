import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { handler } from '../build/handler.js'

const port = process.env.PORT || 3000

const app = express()
const server = createServer(app)

const io = new Server(server, {
  cors: {
    origin: '*', // fine for now, restrict later
  }
})

io.on('connection', (socket) => {
  // Exclude sender
  // socket.emit('hello', 'world'); 
  // Incllude sender
    // io.emit('chat message', msg);
  console.log('User connected')

  socket.emit('eventFromServer', 'Hello from production 👋')

  socket.on('chat_message', (msg) => {
      io.emit('chat_message', msg);
  })

  socket.on('disconnect', () => {
    console.log('User disconnected')
  })
})

app.use(handler)

server.listen(port, () => {
  console.log(`Server running on port ${port}`)
})