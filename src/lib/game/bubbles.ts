// src/lib/game/bubbles.ts
import { players } from '$lib/stores/players';

const bubbleTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function showBubbleForUsername(sender: string, text: string) {
	players.update((p) => {
		const next = { ...p };

		for (const id in next) {
			if (next[id].username === sender) {
				next[id] = {
					...next[id],
					bubbleText: text
				};

				if (bubbleTimers.has(id)) {
					clearTimeout(bubbleTimers.get(id)!);
				}

				const timer = setTimeout(() => {
					players.update((current) => {
						if (!current[id]) return current;

						return {
							...current,
							[id]: {
								...current[id],
								bubbleText: ''
							}
						};
					});

					bubbleTimers.delete(id);
				}, 3000);

				bubbleTimers.set(id, timer);
				break;
			}
		}

		return next;
	});
}

export function clearBubbleTimers() {
	for (const timer of bubbleTimers.values()) {
		clearTimeout(timer);
	}
	bubbleTimers.clear();
}