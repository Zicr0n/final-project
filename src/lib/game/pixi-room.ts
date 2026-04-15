// src/lib/game/pixi-room.ts
import { Application, Container, Graphics, Sprite, Assets, Text, Texture } from 'pixi.js';

export type PlayerView = {
	container: Container;
	body: Graphics;
	sprite: Sprite;
	nameTag: Text;
	bubble: Text;
};

export type PixiRoom = {
	app: Application;
	scene: Container;
	markerGraphic: Graphics;
	playerViews: Map<string, PlayerView>;
	destroy: () => void;
	syncPlayers: (players: Record<string, any>) => void;
	setMarker: (x: number, y: number, visible: boolean) => void;
};

export async function createPixiRoom(
	host: HTMLDivElement,
	options: {
		width: number;
		height: number;
		onPointerDown: (x: number, y: number) => void;
	}
): Promise<PixiRoom> {
	const app = new Application();
	await app.init({
		width: options.width,
		height: options.height,
		background: '#eeeeee',
		antialias: true
	});

	host.appendChild(app.canvas);

	const scene = new Container();
	scene.eventMode = 'static';
	scene.hitArea = app.screen;

	scene.on('pointerdown', (event) => {
		const pos = event.getLocalPosition(scene);
		options.onPointerDown(pos.x, pos.y);
	});

	app.stage.addChild(scene);

	const markerGraphic = new Graphics();
	scene.addChild(markerGraphic);

	const playerTexture: Texture = await Assets.load('/player.webp');
	const playerViews = new Map<string, PlayerView>();

	function createPlayerView(player: any): PlayerView {
		const container = new Container();

		const body = new Graphics();
		body.circle(0, -32, 22);
		body.fill(player.bodyColor || '#999999');

		const sprite = new Sprite(playerTexture);
		sprite.anchor.set(0.5, 1);
		sprite.width = 64;
		sprite.height = 64;

		const nameTag = new Text({
			text: player.username,
			style: { fontSize: 12, fill: '#ffffff' }
		});
		nameTag.anchor.set(0.5, 1);
		nameTag.y = -70;

		const bubble = new Text({
			text: '',
			style: {
				fontSize: 12,
				fill: '#111111',
				wordWrap: true,
				wordWrapWidth: 180
			}
		});
		bubble.anchor.set(0.5, 1);
		bubble.y = -95;
		bubble.visible = false;

		container.addChild(body, sprite, nameTag, bubble);
		scene.addChild(container);

		return { container, body, sprite, nameTag, bubble };
	}

	function syncPlayers(players: Record<string, any>) {
		for (const player of Object.values(players)) {
			let view = playerViews.get(player.id);

			if (!view) {
				view = createPlayerView(player);
				playerViews.set(player.id, view);
			}

			view.container.x = player.x;
			view.container.y = player.y;
			view.nameTag.text = player.username;

			view.body.clear();
			view.body.circle(0, -32, 22);
			view.body.fill(player.bodyColor || '#999999');

			view.bubble.text = player.bubbleText || '';
			view.bubble.visible = !!player.bubbleText;
		}

		for (const [id, view] of playerViews.entries()) {
			if (!players[id]) {
				scene.removeChild(view.container);
				view.container.destroy({ children: true });
				playerViews.delete(id);
			}
		}
	}

	function setMarker(x: number, y: number, visible: boolean) {
		markerGraphic.clear();

		if (!visible) return;

		markerGraphic.circle(x, y, 6);
		markerGraphic.fill({ color: 0x4f46e5, alpha: 0.7 });
	}

	function destroy() {
		for (const view of playerViews.values()) {
			view.container.destroy({ children: true });
		}
		playerViews.clear();
		app.destroy(true, { children: true });
	}

	return {
		app,
		scene,
		markerGraphic,
		playerViews,
		destroy,
		syncPlayers,
		setMarker
	};
}
