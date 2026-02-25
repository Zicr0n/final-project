import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'

import { handler } from '../build/handler.js'

const port = 3000
const app = express()
const server = createServer(app)

const io = new Server(server)

io.on('connection', (socket) => {
  socket.emit('eventFromServer', 'Hello, World 👋')
  console.log("a user connected")

  socket.on('chat_message', (msg)=>{
    console.log("message : " + msg);
  });

  socket.on('disconnect', ()=>{
    console.log("User Disconnected")
  })
})

// SvelteKit should handle everything else using Express middleware
// https://github.com/sveltejs/kit/tree/master/packages/adapter-node#custom-server
app.use(handler)

server.listen(port)