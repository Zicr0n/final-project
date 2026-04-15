<script lang="ts">
	import { chat } from '$lib/stores/chat';
	import { getRoomSocket } from '$lib/socket/room-socket';

	let { roomId } = $props();
	let chatInput = $state('');

	function sendMessage() {
		if (!chatInput.trim()) return;

		const socket = getRoomSocket();
		if (!socket) return;

		socket.emit('chat_message', {
			roomId,
			message: chatInput.trim().slice(0, 120)
		});

		chatInput = '';
	}
</script>

<div class="chat">
	<ul class="messages">
		{#each $chat as msg}
			<li><strong>{msg.sender}</strong>: {msg.text}</li>
		{/each}
	</ul>

	<div class="chat-input">
		<input
			bind:value={chatInput}
			placeholder="Write a message"
			onkeydown={(e) => e.key === 'Enter' && sendMessage()}
		/>
		<button onclick={sendMessage}>Send</button>
	</div>
</div>
