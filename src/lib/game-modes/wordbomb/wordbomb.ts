import type { GameMode } from '../mode-interface.ts';
import prompts from './prompts.json';
import { isValidWord } from './words.js'

const TIME_BEFORE_EXPLODE = 10000;

type GameState = {
	status: string;
	submissions: { userId: string; username: string; word: string }[];
	explodesAt: null | number;
	currentPlayerId: string | null;
	currentPrompt: string;
};

function resetGame(room: any) {
	for (const player of Object.values(room.players) as { joined: boolean; lives: number }[]) {
		player.joined = false;
		player.lives = 1;
	}

	room.started = false;
	room.gameState = {
		status: 'waiting',
		currentPlayerId: null,
		explodesAt: null,
		submissions: [],
		currentPrompt: ''
	};
}

function GenerateGamePrompts(minAmount: number = 500): string[] {
	let promptsAdjusted = prompts.filter((p) => p.count > minAmount);
	return promptsAdjusted.map((item: { prompt: string; count: number }) => item.prompt);
}
async function validateWord(word: string, prompt: string) {
	console.log("hello world im scanning words")
	console.log("is correctos?")
	console.log(isValidWord(word))
	return isValidWord(word) && word.includes(prompt);
}

function GeneratePrompt(prompts: Array<string>) {
	return prompts[Math.floor(Math.random() * prompts.length)];
}

export const wordbombGameMode: GameMode = {
	initMode: () => ({
		status: 'waiting',
		currentPlayerId: null,
		explodesAt: null,
		submissions: [],
		currentPrompt: ''
	}),

	onGameStart: ({ room, roomId, io }) => {
		const playersJoined = Object.values(room.players).filter((player) => player.joined);

		if (playersJoined.length < 2) return;

		let prompts = GenerateGamePrompts();
		room.prompts = prompts;

		room.gameState = {
			status: 'playing',
			currentPlayerId: playersJoined[0].id,
			explodesAt: Date.now() + TIME_BEFORE_EXPLODE,
			submissions: [],
			currentPrompt: GeneratePrompt(prompts)
		};

		for (const player of playersJoined as { joined: boolean; lives: number }[]) {
			player.lives = 1;
		}

		console.log(room.gameState);

		io.to(String(roomId)).emit('game_state', room.gameState);
		io.to(String(roomId)).emit('room_state', room);
	},

	onPlayerLeave({ room, roomId, io }, userId) {
		const state = room.gameState as GameState;

		const remaining = Object.values(room.players).filter((p) => p.joined && p.id !== userId);

		if (state.currentPlayerId === userId) {
			state.currentPlayerId = remaining[0]?.id ?? null;
		}

		if (remaining.length < 2) {
			resetGame(room);
			io.to(String(roomId)).emit('room_state', room);
		}

		io.to(String(roomId)).emit('game_state', room.gameState);
	},
	async onWordSubmitted({ room, roomId, io }, userId, word) {
		const state = room.gameState as GameState;

		// Dont allow players that arent currently selected to submit
		if (state.currentPlayerId !== userId) {
			console.log("Not currently selected")
			return;
		}

		const joinedPlayers = Object.values(room.players).filter((p) => p.joined);

		const currentIndex = joinedPlayers.findIndex((p: any) => p.id === userId);
		if (currentIndex === -1) {
			console.log("Not currently in players joined")
			return;
		}

		let cleanWord = word.trim();

		// Check word validity
		const wordValid = await validateWord(cleanWord, state.currentPrompt);

		// Is word already used?
		if (Object.values(state.submissions).find((w) => w.word == cleanWord) != null || !wordValid) {
			console.log("Word already used")

			io.to(String(roomId)).emit('wordbomb_submit_error', room.gameState);
			return;
		}

		const currentPlayer = joinedPlayers[currentIndex] as any;
		const nextPlayer = joinedPlayers[(currentIndex + 1) % joinedPlayers.length] as any;

		room.gameState = {
			...state,
			currentInput: '',
			submissions: [
				...state.submissions,
				{
					userId,
					username: currentPlayer.username,
					word: cleanWord,
					createdAt: Date.now()
				}
			],
			currentPlayerId: nextPlayer.id,
			explodesAt: Date.now() + TIME_BEFORE_EXPLODE,
			currentPrompt: GeneratePrompt(room.prompts || ['zic'])
		};

		console.log(room.gameState);

		io.to(String(roomId)).emit('game_state', room.gameState);
	},
	onTick({ room, roomId, io }) {
		const state = room.gameState as GameState;

		if (!state) {
			return;
		}

		if (!room.started) {
			return;
		}

		if (!state.currentPlayerId) {
			return;
		}

		if (!state.explodesAt) {
			return;
		}

		if (state.explodesAt <= Date.now()) {
			const alivePlayers = Object.values(room.players).filter((p) => p.joined && p.lives > 0);

			const currentIndex = alivePlayers.findIndex((p) => p.id === state.currentPlayerId);
			if (currentIndex === -1) return;

			const currentPlayer = alivePlayers[currentIndex];
			currentPlayer.lives -= 1;

			const remainingPlayers = Object.values(room.players).filter((p) => p.joined && p.lives > 0);

			if (remainingPlayers.length < 2) {
				room.gameState = {
					...state,
					status: 'finished',
					currentPlayerId: '',
					currentInput: ''
				};
				resetGame(room);
				io.to(String(roomId)).emit('game_state', room.gameState);
				io.to(String(roomId)).emit('room_state', room);
				return;
			}

			const nextIndex = remainingPlayers.findIndex((p) => p.id === state.currentPlayerId);
			const nextPlayer =
				nextIndex === -1
					? remainingPlayers[0]
					: remainingPlayers[(nextIndex + 1) % remainingPlayers.length];

			room.gameState = {
				...state,
				currentInput: '',
				currentPlayerId: nextPlayer.id,
				explodesAt: Date.now() + TIME_BEFORE_EXPLODE
			};

			io.to(String(roomId)).emit('game_state', room.gameState);
		}
	}
};
