<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import io from 'socket.io-client';

	import Wordbomb from './Wordbomb.svelte';
	import PlayerList from './utilities/PlayerList.svelte';
	import Chat from './utilities/Chat.svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import {
		MessageSquareMore,
		Users,
		Cog,
		DoorOpen,
		PanelRightClose,
		PanelRightOpen
	} from '@lucide/svelte';

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const roomId = data.roomId;
	// svelte-ignore state_referenced_locally
	const password = data.password ?? '';

	let socket: ReturnType<typeof io> | null = $state(null);
	let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	let players = $state<{ id: string; username: string; joined: boolean }[]>([]);
	let roomType = $state('bomb');
	let owner = $state<{ id: string; username: string; joined: boolean }>();

	let showSidePanel: boolean = $state(true);
	let sidePanelTabValue: string = $state('players');

	const radius = 170;
	let joinedPlayers = $state<{ id: string; username: string; joined: boolean }[]>([]);
	let isJoined: boolean = $state(false);

	$effect(() => {
		joinedPlayers = Object.values(players).filter((p) => p.joined);
	});

	$effect(() => {
		isJoined = joinedPlayers.find((p) => p.id == data.user.id) != null;
	});

	function playerPosition(i: number, total: number) {
		const angle = (i / total) * Math.PI * 2;
		return {
			x: Math.cos(angle) * radius,
			y: Math.sin(angle) * radius
		};
	}

	onMount(() => {
		connectionStatus = 'connecting';

		socket = io({
			auth: {
				userId: data.user.id,
				username: data.user.username
			}
		});

		socket.on('connect', () => {
			connectionStatus = 'connected';

			socket?.emit('join_room', {
				roomId,
				password
			});
		});

		socket.on('disconnect', () => {
			connectionStatus = 'disconnected';
		});

		socket.on('connect_error', () => {
			connectionStatus = 'disconnected';
		});

		socket.on(
			'room_state',
			({ players: roomPlayers, started: roomStarted, roomType: roomTypes, owner: roomOwner }) => {
				players = Object.values(roomPlayers);
				started = roomStarted;
				roomType = roomTypes;
				owner = roomOwner;
			}
		);

		socket.on('room_error', ({ error }) => {
			alert(error);
			goto('/rooms');
		});

		socket.on('room_closed', () => {
			goto('/rooms');
		});
	});

	function AttemptJoinGame() {
		socket?.emit('join_game');
		console.log('attempted game join');
		console.log(Object.values(joinedPlayers));
	}

	onDestroy(() => {
		socket?.disconnect();
	});
</script>

<!-- TODO : GRADIENT BG-->
<main
	class="grid {showSidePanel === true
		? 'grid-cols-[1fr_400px]'
		: 'grid-cols-[1fr]'} relative h-full min-h-0 overflow-hidden bg-surface-900"
>
	<!-- Game -->
	<div class="flex h-full w-full flex-col justify-end">
		<div class="flex-1">
			{#if roomType == 'bomb'}
				<Wordbomb {data} {socket} />
			{/if}
		</div>
		{#if !isJoined}
			<div class="z-10 flex h-16 justify-center preset-tonal-surface p-2">
				<button
					class="btn w-48 justify-self-center preset-filled-success-500 btn-lg text-center"
					onclick={AttemptJoinGame}>Join Game</button
				>
			</div>
		{/if}
	</div>

	<button
		class="absolute top-3 z-10"
		class:right-2={!showSidePanel}
		class:right-[410px]={showSidePanel}
		onclick={() => (showSidePanel = !showSidePanel)}
	>
		{#if showSidePanel}
			<PanelRightClose />
		{:else}
			<PanelRightOpen />
		{/if}
	</button>

	<!-- Side Panel -->
	{#if showSidePanel}
		<section class="relative min-h-full w-full bg-surface-50-950">
			<Tabs
				value={sidePanelTabValue}
				onValueChange={(details) => (sidePanelTabValue = details.value)}
				class="h-full"
			>
				<Tabs.List class="preset-filled-surface-200-800 p-0">
					<Tabs.Trigger class="h-12 flex-1 rounded-none" value="chat"
						><MessageSquareMore /></Tabs.Trigger
					>
					<Tabs.Trigger class="h-12 flex-1 rounded-none" value="players"><Users /></Tabs.Trigger>
					<Tabs.Trigger class="h-12 flex-1 rounded-none" value="settings"><Cog /></Tabs.Trigger>
					<Tabs.Trigger class="h-12 flex-1 rounded-none" value="leave"><DoorOpen /></Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="chat" class="h-full">
					<Chat />
				</Tabs.Content>
				<Tabs.Content value="players" class="h-full">
					<PlayerList {players} ownerId={owner?.id} />
				</Tabs.Content>
				<Tabs.Content value="settings">Settings!</Tabs.Content>
				<Tabs.Content value="leave">Leave...</Tabs.Content>
			</Tabs>
		</section>
	{/if}
</main>
