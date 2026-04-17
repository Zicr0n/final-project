export type ServerRoom = {
	players: Record<string, RoomPlayer>;
	timer: ReturnType<typeof setTimeout> | null;
	started: boolean;
	roomType: string;
	gameState: unknown;
	prompts: Array<string> | null;
};

export type RoomPlayer = {
	id: string;
	username: string;
	joined: boolean;
	lives: number;
	imageUrl: string;
};

export type GameModeContext = {
	roomId: number;
	io: any;
	room: ServerRoom;
};

export type GameMode = {
	initMode: () => unknown;
	onGameStart?: (ctx: GameModeContext) => void;
	onTick?: (ctx: GameModeContext) => void;
	onGameEnd?: (ctx: GameModeContext, winnerId: string) => void;
	onPlayerLeave?: (ctx: GameModeContext, userId: string) => void;
	onLetterWritten?: (ctx: GameModeContext, word: string, userId: string) => void;
	onWordSubmitted?: (ctx: GameModeContext, word: string, userId: string) => void;
};
