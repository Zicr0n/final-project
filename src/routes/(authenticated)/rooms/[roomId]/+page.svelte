<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import io from 'socket.io-client';
	import { get } from 'svelte/store';
	import { players, myId } from '$lib/stores/players';
	import { chat } from '$lib/stores/chat';

	let { data } = $props();
	// svelte-ignore state_referenced_locally
	const roomId = $state(data.roomId);

	let socket;
	let error_room = $state(false);
	let error_message = $state('');
	let lastFrame = performance.now();
	let chatInput = $state('');

	// Click-to-move: where the player wants to go
	let targetX = $state(200);
	let targetY = $state(200);
	// Actual rendered position (smoothly interpolated)
	let x = $state(200);
	let y = $state(200);

	// Walk speed in px/sec
	const SPEED = 200;
	const mapWidth = 800;
	const mapHeight = 600;

	// Click marker (the little dot shown on click)
	let markerX = $state(-999);
	let markerY = $state(-999);
	let markerVisible = $state(false);
	let markerTimeout;

	// ── Animation loop ───────────────────────────────────────────────────────
	function animate(now) {
		const dt = (now - lastFrame) / 1000;
		lastFrame = now;

		// Move own player toward target
		const dx = targetX - x;
		const dy = targetY - y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > 1) {
			const step = Math.min(SPEED * dt, dist);
			x += (dx / dist) * step;
			y += (dy / dist) * step;

			// Sync position to store + server while walking
			const id = get(myId);
			if (id && socket) {
				players.update((p) => {
					if (p[id]) p[id] = { ...p[id], x, y };
					return p;
				});
				socket.emit('move', { roomId, x, y });
			}
		}

		// Interpolate other players toward their server targets
		players.update((p) => {
			for (const id in p) {
				const player = p[id];
				if (player.targetX !== undefined) {
					player.x += (player.targetX - player.x) * 10 * dt;
					player.y += (player.targetY - player.y) * 10 * dt;
				}
			}
			return p;
		});

		requestAnimationFrame(animate);
	}

	// ── Socket setup ─────────────────────────────────────────────────────────
	onMount(() => {
		requestAnimationFrame(animate);

		socket = io();
		socket.emit('join_room', { roomId });

		socket.on('character_assigned', (character) => {
			myId.set(character.id);
			players.update((p) => ({ ...p, [character.id]: character }));
			x = character.x;
			y = character.y;
			targetX = character.x;
			targetY = character.y;
		});

		socket.on('existing_players', (existing) => {
			players.set(existing);
		});

		socket.on('player_joined', (character) => {
			players.update((p) => ({ ...p, [character.id]: character }));
		});

		socket.on('player_moved', ({ id, x: nx, y: ny }) => {
			players.update((p) => {
				if (p[id]) {
					p[id].targetX = nx;
					p[id].targetY = ny;
				}
				return p;
			});
		});

		socket.on('player_left', (id) => {
			players.update((p) => {
				delete p[id];
				return p;
			});
		});

		socket.on('chat_message', ({ sender, text }) => {
			chat.update((c) => [...c, { sender, text }]);
		});

		socket.on('room_error', ({ error }) => {
			error_message = error;
			error_room = true;
		});

		socket.on('room_closed', () => {
			goto('/rooms');
		});
	});

	onDestroy(() => {
		socket?.disconnect();
		players.set({});
		chat.set([]);
		myId.set(null);
	});

	// ── Click to move ────────────────────────────────────────────────────────
	function handleClick(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = Math.max(0, Math.min(mapWidth, e.clientX - rect.left));
		const clickY = Math.max(0, Math.min(mapHeight, e.clientY - rect.top));

		targetX = clickX;
		targetY = clickY;

		// Show click marker briefly
		markerX = clickX;
		markerY = clickY;
		markerVisible = true;
		clearTimeout(markerTimeout);
		markerTimeout = setTimeout(() => (markerVisible = false), 600);
	}

	// ── Chat ─────────────────────────────────────────────────────────────────
	function sendMessage() {
		if (!chatInput.trim()) return;
		const text = chatInput;
		chatInput = '';
		socket.emit('chat_message', { roomId, message: text });
	}
</script>

<main class="p-4">
	{#if error_room}
		<div class="error-screen">
			<p>⚠️ {error_message || 'Something went wrong.'}</p>
			<a href="/rooms">← Back to rooms</a>
		</div>
	{:else}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div class="room" onclick={handleClick}>
			<!-- Own player rendered from live x/y, not store -->
			<div class="player" style="left:{x}px; top:{y}px;">
				<img src="/player.webp" alt="sprite" />
			</div>

			<!-- Other players from store, interpolated server-side -->
			{#each Object.values($players).filter((p) => p.id !== $myId) as p}
				<div class="player" style="left:{p.x}px; top:{p.y}px;">
					<img src="/player.webp" alt="sprite" />
				</div>
			{/each}

			<!-- Click destination marker -->
			{#if markerVisible}
				<div class="marker" style="left:{markerX}px; top:{markerY}px;"></div>
			{/if}
		</div>

		<div class="chat">
			<ul class="messages">
				{#each $chat as msg}
					<li><strong>{msg.sender.slice(0, 6)}</strong>: {msg.text}</li>
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
	{/if}
</main>

<style>
	.room {
		position: relative;
		width: 800px;
		height: 600px;
		overflow: hidden;
		background: #eee;
		cursor: pointer;
	}

	.player {
		position: absolute;
		width: 64px;
		height: 64px;
		transform: translate(-50%, -100%);
		pointer-events: none;
	}

	.player img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.marker {
		position: absolute;
		width: 10px;
		height: 10px;
		background: rgba(79, 70, 229, 0.7);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		animation: marker-fade 0.6s ease forwards;
	}

	@keyframes marker-fade {
		0% {
			opacity: 1;
			transform: translate(-50%, -50%) scale(1);
		}
		100% {
			opacity: 0;
			transform: translate(-50%, -50%) scale(2);
		}
	}

	.chat {
		width: 800px;
		margin-top: 10px;
	}

	.messages {
		list-style: none;
		padding: 8px;
		margin: 0 0 8px 0;
		max-height: 150px;
		overflow-y: auto;
		background: #f9f9f9;
		border: 1px solid #ddd;
		border-radius: 6px;
	}

	.messages li {
		margin-bottom: 4px;
		font-size: 0.9rem;
	}

	.chat-input {
		display: flex;
		gap: 8px;
	}

	.chat-input input {
		flex: 1;
		padding: 8px 12px;
		border: 1px solid #ccc;
		border-radius: 6px;
		font-size: 1rem;
	}

	.chat-input button {
		padding: 8px 16px;
		background: #4f46e5;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.error-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 300px;
		gap: 12px;
		font-family: sans-serif;
	}

	.error-screen a {
		color: #4f46e5;
	}
</style>
