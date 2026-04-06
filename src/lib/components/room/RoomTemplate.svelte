<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import io from 'socket.io-client';

	import Wordbomb from './Wordbomb.svelte';
	import Chat from './utilities/Chat.svelte';
	import { Tabs, Avatar } from '@skeletonlabs/skeleton-svelte';
	import { MessageSquareMore, Users, Cog, DoorOpen, Crown, PanelRightClose, PanelRightOpen } from '@lucide/svelte'

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

	$effect(()=> {
		joinedPlayers = players.filter((p) => p.joined)
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
			players = roomPlayers;
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
	}

	onDestroy(() => {
		socket?.disconnect();
	});
</script>

<!-- TODO : GRADIENT BG-->
<main class="grid {showSidePanel === true ? "grid-cols-[1fr_400px]" : "grid-cols-[1fr]"} bg-surface-900 relative h-full min-h-0 overflow-hidden">
	<!-- Game -->
	{#if roomType == "bomb"}
		<Wordbomb  {data} {socket}/>
	{/if}
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
						<ul class="w-full flex flex-col h-full gap-2">
							{#each players as player}
								<li class="w-full p-2 grid grid-cols-[1fr_3fr]  hover:preset-filled-surface-700-300 transition-all">
									<Avatar class="size-20">
										<Avatar.Image src="https://i.pinimg.com/736x/ab/a7/ed/aba7edba49adffc5a74b5f6eae36ed35.jpg" alt="avatar" />
										<Avatar.Fallback>{player.username.substring(0,2)}</Avatar.Fallback>
									</Avatar>
									<div class="flex">
										<h6 class="h6">{player.username}</h6>
										<!-- TODO : If owner then mark that-->
										{#if player.id === owner?.id}
											<Crown class="text-primary-500 mx-2"/>
										{/if}
									</div>
								</li>
							{/each}
						</ul>
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