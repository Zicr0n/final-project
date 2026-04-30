<script lang="ts">
	import { onDestroy } from 'svelte';
	import PixiCanvasWordBomb from './utilities/PixiCanvasWordBomb.svelte';
	import PregamePixiCanvas from './utilities/PregamePixiCanvas.svelte';

	let { data, socket } = $props();

	let currentStatus = $state('waiting');

	let joinedPlayers = $state<{ id: string; username: string; joined: boolean, playerImage : string | null, word : string | null }[]>([]);
	let holderId = $state('');
	let wordSubmissions = $state<{ userId: string; username: string; word: string }[]>([]);
	let userInput = $state('');
	let wordInput: HTMLInputElement | null = $state(null);
	let promptToWrite = $state('');

	let cleanup: (() => void) | null = null;

	let isMyTurn = $derived(currentStatus === 'playing' && holderId === data.user.id);
	let statusText = $state("UNKNOWN")

	type GameState = {
		status: string;
		currentPlayerId: string;
		explodesAt: number;
		submissions: { userId: string; username: string; word: string }[];
		currentPrompt: string;
	};

	type RoomStateEvent = {
		players: { id: string; username: string; joined: boolean }[];
	};

	$effect(() => {
		if (isMyTurn) {
			userInput = '';
			wordInput?.focus();
		}
		joinedPlayers;
		currentStatus;

		if(currentStatus == "waiting"){
			if (joinedPlayers.length < 2){
				statusText = `Awaiting ${2 - joinedPlayers.length} ${joinedPlayers.length >= 1 ? "player" : "players"}`
			// TODO - Add settings editing
			}else if (joinedPlayers.length > 1){
				statusText = `Intermission...`
			}
		}
	});

	$effect(() => {
		cleanup?.();
		cleanup = null;

		if (!socket) return;

		const onGameState = ({ status, currentPlayerId, submissions, currentPrompt }: GameState) => {
			currentStatus = status;
			holderId = currentPlayerId;
			wordSubmissions = submissions;
			promptToWrite = currentPrompt;
		};

		const onRoomState = ({ players: roomPlayers }: RoomStateEvent) => {
			joinedPlayers = Object.values(roomPlayers).filter((p) => p.joined);
		};

		const onSubmitError = ({ currentPlayerId }: { currentPlayerId: string }) => {
			OnWordWrong(currentPlayerId);
		};

		socket.on('game_state', onGameState);
		socket.on('room_state', onRoomState);
		socket.on('wordbomb_submit_error', onSubmitError);
		socket.on('letter_written', OnLetterWritten);

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

	function OnLetterWritten(ctx : {userId : string, word : string}) {
		const word = ctx.word;
		const userId = ctx.userId;

		if(!userId || word === null){
			return
		}

		const targetPlayer = joinedPlayers.find((p) => p.id == userId)

		if (targetPlayer){
			targetPlayer.word = word
		}

		console.log(joinedPlayers)

	}

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
		// wrong dude
		console.log('wrong word from player:', currentPlayerId);
	}

	function OnLetterEntered() {
		const clean = wordInput?.value.trim();
		console.log(clean)

		if (!socket || !isMyTurn) return;

		socket.emit('wordbomb_letter', { word: clean });
	}
</script>

<main class="relative h-full">
	{#if currentStatus === 'waiting'}
		<div class="h-full w-full grid grid-rows-[auto_1fr]">
			<!-- Game Status-->
			<header class="w-full p-4">
				<h6 class="h6 text-center font-black">{statusText}</h6>
			</header>

			<section class="w-full h-full text-center flex justify-center items-center">
				<PregamePixiCanvas players={joinedPlayers}/>
			</section>
		</div>
	{:else if currentStatus === 'playing'}
		<div class="flex h-full w-full flex-col">
			<!-- Information-->
			<header class="w-full">
				<h7 class="h7">Difficulty HARD</h7>
			</header>
			<!-- Canvas -->
			<div class="w-full h-full text-center flex justify-center items-center">
				<PixiCanvasWordBomb players={joinedPlayers} holderId={holderId} prompt={promptToWrite}/>
			</div>

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
