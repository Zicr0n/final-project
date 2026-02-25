import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer ,defineConfig } from 'vite';
import { Server } from 'socket.io';

// const webSocketServer = {
// 	name: 'webSocketServer',
// 	configureServer(server: ViteDevServer) {
// 		if (!server.httpServer) return

// 		const io = new Server(server.httpServer)

// 		io.on('connection', (socket) => {
// 			socket.emit('eventFromServer', 'Hello, World 👋')
// 			console.log("a user connected")

// 			socket.on('chat_message', (msg)=>{
// 				console.log("message : " + msg);
// 			});

// 			socket.on('disconnect', ()=>{
// 				console.log("User Disconnected")
// 			})
// 		})
// 	}
// }

export default defineConfig({ plugins: [tailwindcss(), sveltekit()] });
