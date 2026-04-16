/**
 * @typedef {Object} RoomPlayer
 * @property {string} id
 * @property {string} username
 * @property {boolean} joined
 * @property {number} lives
 * @property {string} imageUrl
 */

/**
 * @typedef {Object} ServerRoom
 * @property {Record<string, RoomPlayer>} players
 * @property {ReturnType<typeof setTimeout> | null} timer
 * @property {boolean} started
 * @property {string} roomType
 * @property {unknown} gameState
 */

/**
 * @typedef {Object} GameModeContext
 * @property {number} roomId
 * @property {any} io
 * @property {ServerRoom} room
 */

/**
 * @typedef {Object} GameMode
 * @property {() => unknown} initMode
 * @property {(ctx: GameModeContext) => void} [onGameStart]
 * @property {(ctx: GameModeContext) => void} [onTick]
 * @property {(ctx: GameModeContext, winnerId: string) => void} [onGameEnd]
 * @property {(ctx: GameModeContext, userId: string) => void} [onPlayerLeave]
 * @property {(ctx: GameModeContext, word: string, userId: string) => void} [onLetterWritten]
 * @property {(ctx: GameModeContext, word: string, userId: string) => void} [onWordSubmitted]
 */

export {};
