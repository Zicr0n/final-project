<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { Lock, Users } from '@lucide/svelte';
	import { pendingRoomPassword } from '$lib/stores/roomPassword.js';

	let { data, form } = $props();

	let roomList = $state(data.rooms);
	let roomName = $state('');
	let roomPassword = $state('');
	let maxPlayers = $state(10);
	let createError = $state('');
	let loading = $state(false);

	let joiningRoom = $state(null);
	let joinPassword = $state('');

	$effect(() => {
		roomList = data.rooms;
	});

	$effect(() => {
		if (form?.error && form?.roomId) {
			joiningRoom = { roomId: form.roomId };
		}
	});

	onMount(() => {
		const interval = setInterval(invalidateAll, 5000);
		return () => clearInterval(interval);
	});

	async function createRoom() {
		createError = '';
		if (!roomName.trim()) { createError = 'Room name cannot be empty.'; return; }
		if (maxPlayers > 50 || maxPlayers < 1) { createError = 'Max room size is 50.'; return; }

		loading = true;
		try {
			const res = await fetch('/rooms', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: roomName.trim(), maxPlayers, password: roomPassword.trim() })
			});
			const json = await res.json();
			if (!res.ok) { createError = json.error ?? 'Failed to create room.'; return; }
			await pendingRoomPassword.set(roomPassword);
			roomName = '';
			roomPassword = '';
			goto(`/rooms/${json.roomId}`);
		} finally {
			loading = false;
		}
	}

	function clickRoom(r) {
		if (r.isPrivate) {
			joiningRoom = r;

		} else {
			goto(`/rooms/${r.roomId}`);
		}
	}

	function blockBadKeys(e) {
		if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
	}
</script>

<main class="mx-auto max-w-5xl px-6 py-12 space-y-10">
	<h1 class="h1 font-black">Rooms</h1>

	<div class="card preset-glass-surface rounded-2xl p-6 space-y-4">
		<h2 class="text-sm font-semibold uppercase tracking-widest text-surface-400">Create a room</h2>
		<div class="flex flex-wrap gap-3">
			<input
				bind:value={roomName}
				class="input rounded-xl flex-1 min-w-48"
				placeholder="Room name..."
				onkeydown={(e) => e.key === 'Enter' && createRoom()}
			/>
			<input
				type="password"
				bind:value={roomPassword}
				class="input rounded-xl flex-1 min-w-48"
				placeholder="Password (optional)"
				onkeydown={(e) => e.key === 'Enter' && createRoom()}
			/>
			<input
				type="number"
				min="2"
				max="50"
				step="1"
				bind:value={maxPlayers}
				class="input rounded-xl w-24"
				onkeydown={blockBadKeys}
			/>
			<button onclick={createRoom} disabled={loading} class="btn preset-filled-primary-500 rounded-xl">
				{loading ? 'Creating…' : 'Create room'}
			</button>
		</div>
		{#if createError}
			<p class="text-error-500 text-sm">{createError}</p>
		{/if}
	</div>

	{#if roomList.length === 0}
		<p class="text-surface-400 text-sm">No rooms yet. Create one!</p>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each roomList as r}
				<button
					type="button"
					onclick={() => clickRoom(r)}
					class="card preset-glass-surface rounded-2xl p-5 text-left hover:ring-1 hover:ring-primary-500/40 transition-all space-y-4"
				>
					<div class="flex items-start justify-between gap-2">
						<span class="font-semibold text-surface-900-100 leading-tight">{r.name}</span>
						{#if r.isPrivate}
							<Lock size={14} class="text-surface-400 shrink-0 mt-0.5" />
						{/if}
					</div>
					<div class="flex items-center justify-between">
						<span class="text-xs text-surface-400">{r.isPrivate ? 'Private' : 'Public'}</span>
						<span class="flex items-center gap-1 text-xs text-surface-400">
							<Users size={12} />
							{r.playerCount}/{r.maxPlayers}
						</span>
					</div>
				</button>
			{/each}
		</div>
	{/if}
</main>

{#if joiningRoom}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-surface-50-950/50 backdrop-blur-sm p-4"
		onclick={() => joiningRoom = null}
		role="presentation"
	>
		<div
			class="card bg-surface-100-900 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl"
			role="dialog"
			aria-modal="true"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.key === 'Escape' && (joiningRoom = null)}
			tabindex="0"
		>
			<h2 class="text-lg font-bold">Enter room password</h2>

			{#if form?.error}
				<p class="text-error-500 text-sm">{form.error}</p>
			{/if}

			<form
				method="POST"
				action="?/verifyPassword"
				use:enhance={({ formData }) => {
					formData.set('roomId', String(joiningRoom.roomId));
					return ({ result, update }) => {
						if (result.type === 'redirect') {
							pendingRoomPassword.set(joinPassword);
						}
						update();
					};
				}}
			>
				<input type="hidden" name="roomId" value={joiningRoom.roomId} />
				<input
					type="password"
					name="password"
					bind:value={joinPassword}
					class="input rounded-xl w-full"
					placeholder="Password"
	
				/>
				<div class="flex justify-end gap-2 mt-4">
					<button type="button" onclick={() => joiningRoom = null} class="btn preset-tonal rounded-xl">Cancel</button>
					<button type="submit" class="btn preset-filled-primary-500 rounded-xl">Join</button>
				</div>
			</form>
		</div>
	</div>
{/if}