<script lang="ts">
	import { onDestroy } from 'svelte';
	import WordBombCanvas from './utilities/WordBombCanvas.svelte';

	let { data, socket } = $props();

	let currentStatus = $state('waiting');

	let joinedPlayers = $state<{ id: string; username: string; joined: boolean }[]>([]);
	let holderId = $state('');
	let wordSubmissions = $state<{ userId: string; username: string; word: string }[]>([]);
	let userInput = $state('');
	let wordInput: HTMLInputElement | null = $state(null);

	let cleanup: (() => void) | null = null;

	let isMyTurn = $derived(currentStatus === 'playing' && holderId === data.user.id);

	type GameState = {
		status: string;
		currentPlayerId: string;
		explodesAt: number;
		submissions: { userId: string; username: string; word: string }[];
	};

	type RoomStateEvent = {
		players: { id: string; username: string; joined: boolean }[];
	};

	$effect(() => {
		if (isMyTurn) {
			userInput = '';
			wordInput?.focus();
		}
	});

	$effect(() => {
		cleanup?.();
		cleanup = null;

		if (!socket) return;

		const onGameState = ({ status, currentPlayerId, explodesAt, submissions }: GameState) => {
			currentStatus = status;
			holderId = currentPlayerId;
			wordSubmissions = submissions;
			console.log('game_state:', { status, currentPlayerId, explodesAt, submissions });
		};

		const onRoomState = ({ players: roomPlayers }: RoomStateEvent) => {
			joinedPlayers = Object.values(roomPlayers).filter((p) => p.joined);
		};

		const onSubmitError = ({ currentPlayerId }: { currentPlayerId: string }) => {
			console.log('WRONG WORD!');
			OnWordWrong(currentPlayerId);
		};

		socket.on('game_state', onGameState);
		socket.on('room_state', onRoomState);
		socket.on('wordbomb_submit_error', onSubmitError);

		cleanup = () => {
			socket.off('game_state', onGameState);
			socket.off('room_state', onRoomState);
			socket.off('wordbomb_submit_error', onSubmitError);
		};

		return cleanup;
	});

	onDestroy(() => {
		cleanup?.();
	});

	function submitWord(event: SubmitEvent) {
		event.preventDefault();
		const clean = userInput.trim();

		if (!socket || !isMyTurn || !clean) return;

		socket.emit('wordbomb_submit', {
			word: clean
		});

		userInput = '';
	}

	function OnWordWrong(currentPlayerId: string) {
		// put your wrong-word UI logic here
		console.log('wrong word from player:', currentPlayerId);
	}

	function OnLetterEntered() {
		const clean = userInput.trim();

		if (!socket || !isMyTurn || !clean) return;

		socket.emit('wordbomb_letter', { word: clean });
	}
</script>

<main class="relative h-full">
	{currentStatus}

	{#if currentStatus === 'waiting'}
		<div class="absolute left-[50%] my-6 flex w-full translate-x-[-50%] justify-center">
			<h1 class="h1">Welcome to WORD BOMB!</h1>
		</div>
	{:else if currentStatus === 'playing'}
		<div class="flex h-full w-full flex-col">
			<WordBombCanvas />

			<div class="flex h-16 w-full justify-center preset-tonal-surface">
				<form onsubmit={submitWord} class="flex items-center">
					<div>
						<input
							class="input inline h-10 w-48 self-center preset-outlined-primary-500 text-center"
							bind:value={userInput}
							bind:this={wordInput}
							oninput={OnLetterEntered}
							placeholder="Write your word"
							autocomplete="off"
							id="wordInput"
							disabled={holderId !== data.user.id}
						/>
						<button
							class="btn preset-filled-primary-500"
							type="submit"
							disabled={holderId !== data.user.id}
						>
							Send
						</button>
					</div>
				</form>
			</div>
		</div>
	{/if}
</main>
