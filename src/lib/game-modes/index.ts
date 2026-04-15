import { wordbombGameMode } from './wordbomb.ts';

export const gameModes = {
	bomb: wordbombGameMode,
	pop: null,
	scribble: null,
	vote: null
} as const;
