import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { type ViteDevServer ,defineConfig } from 'vite';
import { Server } from 'socket.io';

const webSocketServer = {
	name: 'webSocketServer',
	configureServer(server: ViteDevServer) {
		if (!server.httpServer) return

		const io = new Server(server.httpServer)

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
	}
}

export default defineConfig({ plugins: [tailwindcss(), sveltekit(), webSocketServer] });
