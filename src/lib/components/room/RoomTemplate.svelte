<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import io from 'socket.io-client';

	import Wordbomb from './Wordbomb.svelte';
	import PlayerList from './utilities/PlayerList.svelte';
	import Chat from './utilities/Chat.svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import { MessageSquareMore, Users, Cog, DoorOpen, PanelRightClose, PanelRightOpen } from '@lucide/svelte'

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	const roomId = data.roomId;
	// svelte-ignore state_referenced_locally
	const password = data.password ?? '';

	let socket: ReturnType<typeof io> | null = $state(null);
	let connectionStatus = $state<'connecting' | 'connected' | 'disconnected'>('connecting');
	let players = $state<{ id: string; username: string, joined : boolean }[]>([]);
	let started = $state(false)
    let roomType = $state("bomb")
    let owner = $state<{ id: string; username: string, joined : boolean }>()

	let showSidePanel : boolean = $state(true)
	let sidePanelTabValue : string = $state("players")

	const radius = 170;
	const size = 64;
	let playerPositions = []
	let joinedPlayers = $state<{ id: string; username: string, joined : boolean }[]>([])
	let isJoined : boolean = $state(false)

	$effect(()=> {
		joinedPlayers = Object.values(players).filter((p) => p.joined)
	})

	$effect(()=>{
		isJoined = joinedPlayers.find((p) => p.id == data.user.id) != null
	})

	function playerPosition(i : number, total : number) {
			const angle = (i / total) * Math.PI * 2;
			return {
				x: Math.cos(angle) * radius ,
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

		socket.on('room_state', ({ players: roomPlayers, started : roomStarted, roomType : roomTypes, owner : roomOwner }) => {
			players = Object.values(roomPlayers);
			started = roomStarted
			roomType = roomTypes
			owner = roomOwner
		});

		socket.on('room_error', ({ error }) => {
			alert(error);
			goto('/rooms');
		});

		socket.on('room_closed', () => {
			goto('/rooms');
		});
	});

	function AttemptJoinGame(){
		socket?.emit('join_game')
		console.log("attempted game join")
		console.log(Object.values(joinedPlayers))

	}

	onDestroy(() => {
		socket?.disconnect();
	});
</script>

<!-- TODO : GRADIENT BG-->
<main class="grid {showSidePanel === true ? "grid-cols-[1fr_400px]" : "grid-cols-[1fr]"} bg-surface-900 relative h-full min-h-0 overflow-hidden">
	<!-- Game -->
	<div class="h-full w-full flex flex-col justify-end">
		<div class="flex-1">
			{#if roomType == "bomb"}
				<Wordbomb  {data} {socket}/>
			{/if}
		</div>
		{#if !isJoined}
			<div class="flex justify-center preset-tonal-surface h-16 p-2 z-10">
				<button class="btn btn-lg preset-filled-success-500 w-48 text-center justify-self-center" onclick={AttemptJoinGame}>Join Game</button>
			</div>
		{/if}
	</div>

	
	<!-- <section class="transition-all relative flex flex-col h-full min-h-0">
		<div class="h-full flex-1 min-h-0 relative">
			{#if joinedPlayers.length === 2}
				<div class="flex justify-between items-center w-full h-full px-140 transition-transform" >
					{#each joinedPlayers as player(player.id)}
						<div class="w-16 h-16 bg-primary-500 text-white flex items-center justify-center rounded" animate:flip>
							{player.username}
						</div>
					{/each}
				</div>
			{:else}
				{#each joinedPlayers as player, i (player.id)}
					{@const pos = playerPosition(i, joinedPlayers.length)}
					<div
						class="absolute flex items-center justify-center bg-red-500 text-white rounded-md transition-transform"
						style="
							width: {size}px;
							height: {size}px;
							left: 50%;
							top: 50%;
							transform: translate(-50%, -50%) translate({pos.x}px, {pos.y}px);
							
						"
						animate:flip
						>
						{player.username}
					</div>
				{/each}
			{/if}
		</div> -->
		<!-- Bottom bar -->
<!-- 
		<footer class="h-20">
			<button 
			class="bg-green-300 p-4 text-black rounded-4xl hover:scale-105 transition-all"
			onclick={AttemptJoinGame}
			>
				Join Game
			</button>
		</footer>
	
	</section> -->

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
		<section class="w-full min-h-full bg-surface-50-950 relative ">
				<Tabs value={sidePanelTabValue} onValueChange={(details) => (sidePanelTabValue = details.value)} class="h-full">
					<Tabs.List class="preset-filled-surface-200-800 p-0">
						<Tabs.Trigger class="flex-1 h-12 rounded-none" value="chat"><MessageSquareMore/></Tabs.Trigger>
						<Tabs.Trigger class="flex-1 h-12 rounded-none" value="players"><Users/></Tabs.Trigger>
						<Tabs.Trigger class="flex-1 h-12 rounded-none" value="settings"><Cog/></Tabs.Trigger>
						<Tabs.Trigger class="flex-1 h-12 rounded-none" value="leave"><DoorOpen/></Tabs.Trigger>
					</Tabs.List>
					<Tabs.Content value="chat" class="h-full">
						<Chat/>
					</Tabs.Content>
					<Tabs.Content value="players" class="h-full">
						<PlayerList players={players} ownerId={owner?.id}/>
					</Tabs.Content>
					<Tabs.Content value="settings">
						Settings!
					</Tabs.Content>
					<Tabs.Content value="leave">
						Leave...
					</Tabs.Content>
				</Tabs>
		</section>
	{/if}

</main>

<!-- 

<h1 class="h1">{data.room.name}</h1>
<h1 class="h1">{owner?.id}</h1>
<h1>Room Type : {roomType}</h1>
<main class="p-4 space-y-4">
	<section class="card">
		<h2>Status</h2>
		<p class="status {connectionStatus}">
			{connectionStatus}
		</p>
	</section>

	<section class="card">
		<h2>Players in room</h2>

		{#if players.length === 0}
			<p>No one is in the room.</p>
		{:else}
			<ul class="player-list">
				{#each players as player}
					<li>{player.username} {#if player.id == owner?.id} OWNER {/if}</li>
					<p>Joined : {player.joined}</p>
				{/each}
			</ul>
		{/if}
	</section>
    {#if !started}		
        <section>
			<button 
			class="bg-green-300 p-4 text-black rounded-4xl hover:scale-105 transition-all"
			onclick={AttemptJoinGame}
			>
				Join Game
			</button>
		</section>
	{/if}

	{#if roomType == "bomb"}
		<Wordbomb  {data} {socket}/>
	{/if}
</main>

<style>
	.card {
		width: 100%;
		max-width: 700px;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 12px;
		background: gray;
	}

	h2 {
		margin: 0 0 0.75rem 0;
		font-size: 1.1rem;
	}

	.status {
		font-weight: 600;
		text-transform: capitalize;
	}

	.status.connecting {
		color: #b45309;
	}

	.status.connected {
		color: limegreen;
	}

	.status.disconnected {
		color: #b91c1c;
	}

	.player-list {
		margin: 0;
		padding-left: 1.25rem;
	}
</> -->