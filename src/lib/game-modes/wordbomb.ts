import type { GameMode } from "./mode-interface";

const TIME_BEFORE_EXPLODE = 10000

type GameState = {
    status : string,
    submissions : { userId : string, username : string, word : string }[]
    explodesAt: null | number,
    currentPlayerId : string | null
}

function resetGame(room: any) {
	for (const player of Object.values(room.players) as { joined: boolean }[]) {
		player.joined = false;
	}

	room.started = false;
	room.gameState = {
		status: 'waiting',
		currentPlayerId: null,
		explodesAt: null,
        submissions : []
	};
}

export const wordbombGameMode: GameMode = {
	initMode: () => ({
		status: "waiting",
		currentPlayerId: null,
		explodesAt: null,
        submissions : []
	}),

	onGameStart: ({ room, roomId, io }) => {
		const playersJoined = Object.values(room.players).filter((player) => player.joined);

		if (playersJoined.length < 2) return;

		room.gameState = {
			status: "playing",
			currentPlayerId: playersJoined[0].id,
			explodesAt: Date.now() + TIME_BEFORE_EXPLODE,
            submissions : []
		};

		io.to(String(roomId)).emit("game_state", room.gameState);
	},

	onPlayerLeave({ room, roomId, io }, userId) {
		const state = room.gameState as GameState

		const remaining = Object.values(room.players).filter(
			(p) => p.joined && p.id !== userId
		);

		if (state.currentPlayerId === userId) {
			state.currentPlayerId = remaining[0]?.id ?? null;
		}

		if (remaining.length < 2) {
			console.log("less than two");
			resetGame(room);
		}

		io.to(String(roomId)).emit("game_state", room.gameState);
	},
    onWordSubmitted({room, roomId, io}, userId, word){
        const state = room.gameState as GameState
     
        // Dont allow players that arent currently selected to submit
        if(state.currentPlayerId !== userId){
            return;
        }
        
        const joinedPlayers = Object.values(room.players).filter((p)=>p.joined)
        
        const currentIndex = joinedPlayers.findIndex((p: any) => p.id === userId);
		if (currentIndex === -1) return;
        
        let cleanWord = word.trim();
        // TODO : Check word validity
        // Right now im jsut gonna move to next player

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
                explodesAt: Date.now() + TIME_BEFORE_EXPLODE
            };

            io.to(String(roomId)).emit('game_state', room.gameState);

    },
    onTick({room, roomId, io}) {
        const state = room.gameState as GameState;

        if (!room.started){
            return
        }

        if(!state.currentPlayerId){
            return
        }

        if(!state.explodesAt){
            return
        }

        if(state.explodesAt <= Date.now()){
            // TODO : take life away, rn just gonna moe players
            const joinedPlayers = Object.values(room.players).filter((p)=>p.joined)
    
            const currentIndex = joinedPlayers.findIndex((p: any) => p.id === state.currentPlayerId);
            if (currentIndex === -1) return;

            const nextPlayer = joinedPlayers[(currentIndex + 1) % joinedPlayers.length] as any;

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