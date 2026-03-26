<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import io from 'socket.io-client';
	import { get } from 'svelte/store';
	import { players, myId } from '$lib/stores/players';
	import { chat } from '$lib/stores/chat';

	let { data } = $props();
	const roomId = data.roomId;

	let socket;
	let lastFrame = performance.now();
	let chatInput = $state('');
	let map = $state('default');

	let targetX = $state(200);
	let targetY = $state(200);
	let x = $state(200);
	let y = $state(200);

	const SPEED = 200;
	const mapWidth = 800;
	const mapHeight = 600;

	let markerX = $state(-999);
	let markerY = $state(-999);
	let markerVisible = $state(false);
	let markerTimeout;

	function animate(now) {
		const dt = (now - lastFrame) / 1000;
		lastFrame = now;

		const dx = targetX - x;
		const dy = targetY - y;
		const dist = Math.sqrt(dx * dx + dy * dy);

		if (dist > 1) {
			const step = Math.min(SPEED * dt, dist);
			x += (dx / dist) * step;
			y += (dy / dist) * step;

			const id = get(myId);
			if (id && socket) {
				players.update((p) => {
					const next = { ...p };
					if (next[id]) next[id] = { ...next[id], x, y };
					return next;
				});
				socket.emit('move', { roomId, x, y });
			}
		}

		players.update((p) => {
			const next = { ...p };

			for (const id in next) {
				const player = next[id];
				if (player.targetX !== undefined) {
					next[id] = {
						...player,
						x: player.x + (player.targetX - player.x) * 10 * dt,
						y: player.y + (player.targetY - player.y) * 10 * dt
					};
				}
			}

			return next;
		});

		requestAnimationFrame(animate);
	}

	onMount(() => {
		requestAnimationFrame(animate);

		socket = io({
			auth: {
				userId: data.user.id,
				username: data.user.username
			}
		});

		socket.emit('join_room', { roomId });

		socket.on('map_assigned', (assignedMap) => {
			map = assignedMap;
		});

		socket.on('room_error', ({ error }) => {
			console.error(error);
			alert(error)
			goto('/rooms');
		});

		socket.on('character_assigned', (character) => {
			myId.set(character.id);
			players.update((p) => ({ ...p, [character.id]: character }));
			x = character.x;
			y = character.y;
			targetX = character.x;
			targetY = character.y;
		});

		socket.on('existing_players', (existing) => {
			players.update((p) => ({ ...existing, ...p }));
		});

		socket.on('player_joined', (character) => {
			players.update((p) => ({ ...p, [character.id]: character }));
		});

		socket.on('player_moved', ({ id, x: nx, y: ny }) => {
			players.update((p) => {
				if (!p[id]) return p;
				return {
					...p,
					[id]: {
						...p[id],
						targetX: nx,
						targetY: ny
					}
				};
			});
		});

		socket.on('player_left', (id) => {
			players.update((p) => {
				const next = { ...p };
				delete next[id];
				return next;
			});
		});

		socket.on('chat_message', ({ sender, text }) => {
			chat.update((c) => [...c, { sender, text }]);

			players.update((p) => {
				const next = { ...p };

				for (const id in next) {
					if (next[id].username === sender) {
						next[id] = {
							...next[id],
							bubbleText: text
						};

						setTimeout(() => {
							players.update((current) => {
								if (!current[id]) return current;
								if (current[id].bubbleText !== text) return current;

								return {
									...current,
									[id]: {
										...current[id],
										bubbleText: ''
									}
								};
							});
						}, 3000);

						break;
					}
				}

				return next;
			});
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

	function handleClick(e) {
		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = Math.max(0, Math.min(mapWidth, e.clientX - rect.left));
		const clickY = Math.max(0, Math.min(mapHeight, e.clientY - rect.top));

		targetX = clickX;
		targetY = clickY;

		markerX = clickX;
		markerY = clickY;
		markerVisible = true;
		clearTimeout(markerTimeout);
		markerTimeout = setTimeout(() => (markerVisible = false), 600);
	}

	function sendMessage() {
		if (!chatInput.trim()) return;
		const text = chatInput.trim().slice(0, 120);
		chatInput = '';
		socket.emit('chat_message', { roomId, message: text });
	}
</script>

<h1 class="h1">{data.room.name} — MAP: {map}</h1>

<main class="p-4">
	<div class="room" onclick={handleClick} onkeydown={() => {}} role="button" tabindex="0">
		<div class="player" style="left:{x}px; top:{y}px;">
			{#if $players[$myId]?.bubbleText}
				<div class="chat-bubble">{$players[$myId].bubbleText}</div>
			{/if}
			<img src="/player.webp" alt="sprite" />
			<div class="name-tag">{data.user.username}</div>
		</div>

		{#each Object.values($players).filter((p) => p.id !== $myId) as p}
			<div class="player" style="left:{p.x}px; top:{p.y}px;">
				{#if p.bubbleText}
					<div class="chat-bubble">{p.bubbleText}</div>
				{/if}
				<img src="/player.webp" alt="sprite" />
				<div class="name-tag">{p.username}</div>
			</div>
		{/each}

		{#if markerVisible}
			<div class="marker" style="left:{markerX}px; top:{markerY}px;"></div>
		{/if}
	</div>

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

	.name-tag {
		position: absolute;
		left: 50%;
		bottom: 100%;
		transform: translateX(-50%);
		margin-bottom: 6px;
		padding: 2px 6px;
		border-radius: 999px;
		background: rgba(0, 0, 0, 0.7);
		color: white;
		font-size: 12px;
		white-space: nowrap;
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

	.chat-bubble {
		position: absolute;
		left: 50%;
		bottom: calc(100% + 28px);
		transform: translateX(-50%);
		max-width: 180px;
		padding: 6px 10px;
		border-radius: 12px;
		background: white;
		color: #111;
		font-size: 12px;
		line-height: 1.2;
		text-align: center;
		white-space: normal;
		word-break: break-word;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		pointer-events: none;
		z-index: 10;
	}

	.chat-bubble::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 100%;
		transform: translateX(-50%);
		border-width: 6px;
		border-style: solid;
		border-color: white transparent transparent transparent;
	}
</style>