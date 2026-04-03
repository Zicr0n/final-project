<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import { get } from 'svelte/store';
	import { players, myId } from '$lib/stores/players';
	import { chat } from '$lib/stores/chat';
	import { createRoomSocket, destroyRoomSocket } from '$lib/socket/room-socket';
	import { createPixiRoom } from '$lib/game/pixi-room';
	import { moveTowardTarget, interpolatePosition } from '$lib/game/movement';
	import { showBubbleForUsername, clearBubbleTimers } from '$lib/game/bubbles';

	let { data } = $props();

	const roomId = data.roomId;
	const password = data.password ?? '';
	const SPEED = 200;
	const mapWidth = 800;
	const mapHeight = 600;

	let pixiHost: HTMLDivElement;
	let pixiRoom: Awaited<ReturnType<typeof createPixiRoom>> | null = null;
	let socket: ReturnType<typeof createRoomSocket> | null = null;

	let x = 200;
	let y = 200;
	let targetX = 200;
	let targetY = 200;

	let markerVisible = false;
	let markerX = -999;
	let markerY = -999;
	let markerTimeout: ReturnType<typeof setTimeout>;

	function handleClick(xPos: number, yPos: number) {
		const clickX = Math.max(0, Math.min(mapWidth, xPos));
		const clickY = Math.max(0, Math.min(mapHeight, yPos));

		targetX = clickX;
		targetY = clickY;

		markerX = clickX;
		markerY = clickY;
		markerVisible = true;
		pixiRoom?.setMarker(markerX, markerY, markerVisible);

		clearTimeout(markerTimeout);
		markerTimeout = setTimeout(() => {
			markerVisible = false;
			pixiRoom?.setMarker(markerX, markerY, markerVisible);
		}, 600);
	}

	onMount(async () => {
		pixiRoom = await createPixiRoom(pixiHost, {
			width: mapWidth,
			height: mapHeight,
			onPointerDown: handleClick
		});

		socket = createRoomSocket(data.user.id, data.user.username);
		socket.emit('join_room', { roomId, password });

		socket.on('room_error', ({ error }) => {
			alert(error);
			goto('/rooms');
		});

		socket.on('character_assigned', (character) => {
			myId.set(character.id);

			players.update((p) => ({
				...p,
				[character.id]: character
			}));

			x = character.x;
			y = character.y;
			targetX = character.x;
			targetY = character.y;
		});

		socket.on('existing_players', (existing) => {
			const withTargets = Object.fromEntries(
				Object.entries(existing).map(([id, p]) => [id, { ...p, targetX: p.x, targetY: p.y }])
			);

			players.set(withTargets);
		});

		socket.on('player_joined', (character) => {
			players.update((p) => ({
				...p,
				[character.id]: { ...character, targetX: character.x, targetY: character.y }
			}));
		});

		socket.on('player_moved', ({ id, x: nx, y: ny }) => {
            if (id === get(myId)) return;

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
			showBubbleForUsername(sender, text);
		});

		pixiRoom.app.ticker.add((ticker) => {
			const dt = ticker.deltaMS / 1000;

			const moved = moveTowardTarget(x, y, targetX, targetY, SPEED, dt);
			x = moved.x;
			y = moved.y;

			const id = get(myId);
			if (moved.moved && id && socket) {
				players.update((p) => {
					const next = { ...p };
					if (next[id]) {
						next[id] = { ...next[id], x, y };
					}
					return next;
				});

				socket.emit('move', { roomId, x, y });
			}

			const localId = get(myId);

            players.update((p) => {
                const next = { ...p };

                for (const id in next) {
                    if (id === localId) continue;

                    const player = next[id];
                    if (player.targetX !== undefined && player.targetY !== undefined) {
                        next[id] = {
                            ...player,
                            x: player.x + (player.targetX - player.x) * 10 * dt,
                            y: player.y + (player.targetY - player.y) * 10 * dt
                        };
                    }
                }

                return next;
            });

			pixiRoom?.syncPlayers(get(players));
		});
	});

	onDestroy(() => {
		clearTimeout(markerTimeout);
		clearBubbleTimers();
		destroyRoomSocket();
		pixiRoom?.destroy();
		players.set({});
		chat.set([]);
		myId.set(null);
	});
</script>

<div bind:this={pixiHost} class="room-canvas"></div>

<style>
	.room-canvas {
		width: 800px;
		height: 600px;
		border: 1px solid #ddd;
	}
</style>