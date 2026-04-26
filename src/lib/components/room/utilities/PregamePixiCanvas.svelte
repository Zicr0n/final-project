<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import * as PIXI from 'pixi.js';

    interface Player {
        id: string;
        username: string;
        imageUrl?: string;
        lives: number;
        joined: boolean;
    }

    let { players = $bindable() }: { players: Player[] } = $props();

    let container: HTMLDivElement;
    let app: PIXI.Application;
    let ready = $state(false);

    const AVATAR_RADIUS = 38;
    const RING_RADIUS = 180;
    const COLORS = {
        bg: 0x00000000,
        ring: 0x1e1e2e,
        accent: 0xe74c3c,
        text: 0xffffff,
        subtext: 0x555566,
        joined: 0x2ecc71,
        notJoined: 0x1a1a2e,
    };

    function redraw() {
        if (!app || !ready) return;
        app.stage.removeChildren();

        const cx = app.screen.width / 2;
        const cy = app.screen.height / 2;
        const RING_RADIUS = Math.min(cx, cy) * 0.6;
        const AVATAR_RADIUS = Math.min(cx, cy) * 0.12;

        const ring = new PIXI.Graphics();
        ring.circle(cx, cy, RING_RADIUS);
        ring.stroke({ color: COLORS.ring, width: 1.5 });
        app.stage.addChild(ring);

        // waiting text in center
        const joinedCount = players.filter(p => p.joined).length;
        const centerText = new PIXI.Text({
            text: `${joinedCount}/${players.length}`,
            style: { fontFamily: 'monospace', fontSize: 22, fill: COLORS.accent, fontWeight: 'bold' }
        });
        centerText.anchor.set(0.5);
        centerText.x = cx;
        centerText.y = cy - 10;
        app.stage.addChild(centerText);

        const subText = new PIXI.Text({
            text: 'ready',
            style: { fontFamily: 'monospace', fontSize: 11, fill: COLORS.subtext }
        });
        subText.anchor.set(0.5);
        subText.x = cx;
        subText.y = cy + 14;
        app.stage.addChild(subText);

        players.forEach((player, i) => {
            const angle = (i / players.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * RING_RADIUS;
            const y = cy + Math.sin(angle) * RING_RADIUS;

            const group = new PIXI.Container();
            group.x = x;
            group.y = y;

            // dashed line from center
            const line = new PIXI.Graphics();
            line.moveTo(cx - x, cy - y);
            line.lineTo(0, 0);
            line.stroke({ color: player.joined ? COLORS.joined : COLORS.ring, width: 1, alpha: 0.3 });
            group.addChild(line);

            // avatar bg
            const avatarBg = new PIXI.Graphics();
            avatarBg.circle(0, 0, AVATAR_RADIUS);
            avatarBg.fill({ color: player.joined ? 0x0d2b1a : 0x12121c });
            avatarBg.stroke({ color: player.joined ? COLORS.joined : 0x2a2a3e, width: 2 });
            group.addChild(avatarBg);

            // initials
            const initial = new PIXI.Text({
                text: player.username.slice(0, 2).toUpperCase(),
                style: {
                    fontFamily: 'monospace',
                    fontSize: 15,
                    fill: player.joined ? COLORS.joined : COLORS.subtext,
                    fontWeight: 'bold',
                }
            });
            initial.anchor.set(0.5);
            group.addChild(initial);

            // joined indicator dot
            const dot = new PIXI.Graphics();
            dot.circle(AVATAR_RADIUS - 6, -(AVATAR_RADIUS - 6), 6);
            dot.fill({ color: player.joined ? COLORS.joined : 0x2a2a3e });
            dot.stroke({ color: COLORS.bg, width: 2 });
            group.addChild(dot);

            // username
            const label = new PIXI.Text({
                text: player.username,
                style: {
                    fontFamily: 'monospace',
                    fontSize: 10,
                    fill: player.joined ? COLORS.text : COLORS.subtext,
                }
            });
            label.anchor.set(0.5);
            label.y = AVATAR_RADIUS + 14;
            group.addChild(label);

            // status label
            const status = new PIXI.Text({
                text: player.joined ? 'ready' : 'waiting...',
                style: {
                    fontFamily: 'monospace',
                    fontSize: 9,
                    fill: player.joined ? COLORS.joined : COLORS.subtext,
                }
            });
            status.anchor.set(0.5);
            status.y = AVATAR_RADIUS + 26;
            group.addChild(status);

            app.stage.addChild(group);

            // idle pulse for players not yet joined
            if (!player.joined) {
                let t = i * 1.2;
                app.ticker.add(() => {
                    t += 0.03;
                    avatarBg.alpha = 0.6 + Math.sin(t) * 0.4;
                });
            }
        });
    }

    $effect(() => {
        players.forEach(p => [p.joined, p.username]);
        redraw();
    });

    onMount(async () => {
        app = new PIXI.Application();
        await app.init({
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: COLORS.bg,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            backgroundAlpha: 0.0
        });
        container.appendChild(app.canvas);
        ready = true;
        redraw();

       const observer = new ResizeObserver(() => {
            if (!app?.renderer) return;
            app.renderer.resize(container.clientWidth, container.clientHeight);
            redraw();
        });
        observer.observe(container);

        return () => observer.disconnect();
    });

    onDestroy(() => {
        app?.destroy(true);
    });
</script>

<div bind:this={container} class="w-full h-full"></div>