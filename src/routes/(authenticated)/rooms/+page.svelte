<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	let roomList = $state([]);
	let roomName = $state('');
	let roomPassword = $state('');
	let maxPlayers = $state(10);
	let error = $state('');
	let loading = $state(false);

	let joinError = $state('');
	let joiningRoomId = $state(null);
	let joinPassword = $state('');
	let joinLoading = $state(false);

	async function fetchRooms() {
		const res = await fetch('/rooms', {
			headers: { Accept: 'application/json' }
		});

		if (res.ok) {
			roomList = await res.json();
		}
	}

	onMount(fetchRooms);

	async function createRoom() {
		error = '';

		if (!roomName.trim()) {
			error = 'Room name cannot be empty.';
			return;
		}

		if (maxPlayers > 50 || maxPlayers < 1) {
			error = 'Max room size is 50.';
			return;
		}

		loading = true;

		try {
			const res = await fetch('/rooms', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify({
					name: roomName.trim(),
					maxPlayers,
					password: roomPassword.trim()
				})
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error ?? 'Failed to create room.';
				return;
			}

			roomName = '';
			roomPassword = '';
			goto(`/rooms/${data.roomId}`);
		} finally {
			loading = false;
		}
	}

	function openJoinPrompt(roomId) {
		joinError = '';
		joinPassword = '';
		joiningRoomId = roomId;
	}

	function closeJoinPrompt() {
		joinError = '';
		joinPassword = '';
		joiningRoomId = null;
	}

	async function joinRoom(room) {
		if (room.isPrivate) {
			openJoinPrompt(room.roomId);
			return;
		}

		goto(`/rooms/${room.roomId}`);
	}

	async function submitPrivateJoin() {
		joinError = '';

		if (!joiningRoomId) return;

		if (!joinPassword.trim()) {
			joinError = 'Enter the room password.';
			return;
		}

		joinLoading = true;

		try {
			const params = new URLSearchParams({
				password: joinPassword.trim()
			});

			goto(`/rooms/${joiningRoomId}?${params.toString()}`);
		} finally {
			joinLoading = false;
		}
	}

	function blockBadKeys(e) {
		if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
	}
</script>

<div class="page">
	<h1>Rooms</h1>

	<div class="create">
		<input
			bind:value={roomName}
			placeholder="Room name..."
			onkeydown={(e) => e.key === 'Enter' && createRoom()}
		/>

		<input
			type="password"
			bind:value={roomPassword}
			placeholder="Password (optional)"
			onkeydown={(e) => e.key === 'Enter' && createRoom()}
		/>

		<input
			type="number"
			name="roomSize"
			min="2"
			step="1"
			max="50"
			required
			onkeydown={blockBadKeys}
			bind:value={maxPlayers}
		/>

		<button onclick={createRoom} disabled={loading}>
			{loading ? 'Creating…' : 'Create room'}
		</button>

		{#if error}
			<p class="error">{error}</p>
		{/if}
	</div>

	<div class="room-list">
		{#if roomList.length === 0}
			<p class="empty">No rooms yet. Create one!</p>
		{:else}
			{#each roomList as r}
				<button class="room-card" onclick={() => joinRoom(r)} type="button">
					<div class="room-left">
						<span class="room-name">
							{r.name}
							{#if r.isPrivate}
								<span class="lock">🔒</span>
							{/if}
						</span>
						{#if r.isPrivate}
							<span class="room-private">Private room</span>
						{/if}
					</div>

					<span class="room-count">{r.playerCount}/{r.maxPlayers} players</span>
				</button>
			{/each}
		{/if}
	</div>

	{#if joiningRoomId}
		<div class="modal-backdrop" onclick={closeJoinPrompt}>
			<div
				class="modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="join-room-title"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => {
					if (e.key === 'Escape') closeJoinPrompt();
					if (e.key === 'Enter') submitPrivateJoin();
				}}
				tabindex="0"
			>
				<h2 id="join-room-title">Enter room password</h2>

				<input type="password" bind:value={joinPassword} placeholder="Password" autofocus />

				{#if joinError}
					<p class="error">{joinError}</p>
				{/if}

				<div class="modal-actions">
					<button type="button" class="secondary" onclick={closeJoinPrompt}>Cancel</button>
					<button type="button" onclick={submitPrivateJoin} disabled={joinLoading}>
						{joinLoading ? 'Joining…' : 'Join room'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.page {
		max-width: 600px;
		margin: 40px auto;
		padding: 0 20px;
		font-family: sans-serif;
	}

	h1 {
		margin-bottom: 24px;
	}

	.create {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-bottom: 32px;
		flex-wrap: wrap;
	}

	.create input {
		flex: 1;
		padding: 8px 12px;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 6px;
		min-width: 160px;
	}

	.create button {
		padding: 8px 16px;
		font-size: 1rem;
		background: #4f46e5;
		color: white;
		border: none;
		border-radius: 6px;
		cursor: pointer;
	}

	.create button:hover:not(:disabled) {
		background: #4338ca;
	}

	.create button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: red;
		font-size: 0.9rem;
		width: 100%;
		margin: 0;
	}

	.room-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.empty {
		color: #888;
	}

	.room-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 14px 18px;
		background: #f9f9f9;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		color: inherit;
		transition:
			background 0.15s,
			border-color 0.15s;
		cursor: pointer;
		text-align: left;
	}

	.room-card:hover {
		background: #f0f0ff;
		border-color: #4f46e5;
	}

	.room-left {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.room-name {
		font-weight: 600;
	}

	.room-private {
		font-size: 0.8rem;
		color: #666;
	}

	.lock {
		margin-left: 6px;
	}

	.room-count {
		font-size: 0.85rem;
		color: #666;
	}

	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		display: grid;
		place-items: center;
		padding: 20px;
	}

	.modal {
		width: 100%;
		max-width: 400px;
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
		display: flex;
		flex-direction: column;
		gap: 12px;
		outline: none;
	}

	.modal h2 {
		margin: 0;
		font-size: 1.2rem;
	}

	.modal input {
		padding: 8px 12px;
		font-size: 1rem;
		border: 1px solid #ccc;
		border-radius: 6px;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 8px;
	}

	.modal-actions button {
		padding: 8px 16px;
		font-size: 1rem;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		background: #4f46e5;
		color: white;
	}

	.modal-actions button.secondary {
		background: #e5e7eb;
		color: #111827;
	}
</style>
