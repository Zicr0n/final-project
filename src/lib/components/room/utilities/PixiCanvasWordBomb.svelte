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
    // There is no limit to the LARP :freak:
    function getCssColor(variable: string): number {
        const el = document.createElement('div');
        el.style.color = `var(${variable})`;
        document.body.appendChild(el);
        const computed = getComputedStyle(el).color;
        document.body.removeChild(el);

        const [r, g, b] = computed.match(/\d+/g)!.map(Number);
        return (r << 16) | (g << 8) | b;
    }

    let { players = $bindable(), holderId = $bindable(), prompt = $bindable() }: { players: Player[], holderId: string | null, prompt : string | null } = $props();

    let container: HTMLDivElement;
    let app: PIXI.Application;
    let ready = $state(false);

    const AVATAR_RADIUS = 40;
    const RING_RADIUS = 180;
    const COLORS = {
        bg: 0x00000000,
        ring: getCssColor('--color-primary-500'),
        accent: 0xe74c3c,
        text: 0xffffff,
        subtext: 0x888899,
        heart: 0xe74c3c,
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

        const centerDot = new PIXI.Graphics();
        centerDot.circle(cx, cy, 30);
        centerDot.fill({ color: COLORS.accent, alpha: 0.6 });

        const promptText = new PIXI.Text({
            text: prompt ?? '',
            style: {
                fontFamily: 'monospace',
                fontSize: 16,
                fill: COLORS.bg,
                fontWeight: 'bold',
            },
            anchor : 0.5
        });
        promptText.position.set(cx, cy);

        app.stage.addChild(centerDot);
        app.stage.addChild(promptText);

        players.forEach((player, i) => {
            const angle = (i / players.length) * Math.PI * 2 - Math.PI / 2;
            const x = cx + Math.cos(angle) * RING_RADIUS;
            const y = cy + Math.sin(angle) * RING_RADIUS;

            const isCurrent = player.id === holderId;
            const group = new PIXI.Container();
            group.x = x;
            group.y = y;

            const line = new PIXI.Graphics();
            line.moveTo(cx - x, cy - y);
            line.lineTo(0, 0);
            line.stroke({ color: isCurrent ? COLORS.accent : COLORS.ring, width: 1, alpha: 0.4 });
            group.addChild(line);

            if (isCurrent) {
                const glow = new PIXI.Graphics();
                glow.circle(0, 0, AVATAR_RADIUS + 8);
                glow.stroke({ color: COLORS.accent, width: 2, alpha: 0.5 });
                group.addChild(glow);
            }

            const avatarBg = new PIXI.Graphics();
            avatarBg.circle(0, 0, AVATAR_RADIUS);
            avatarBg.fill({ color: 0x1a1a2e });
            avatarBg.stroke({ color: isCurrent ? COLORS.accent : 0x2a2a3e, width: 2 });
            group.addChild(avatarBg);

            const initial = new PIXI.Text({
                text: player.username.slice(0, 2).toUpperCase(),
                style: {
                    fontFamily: 'monospace',
                    fontSize: 16,
                    fill: isCurrent ? COLORS.accent : COLORS.text,
                    fontWeight: 'bold',
                }
            });
            initial.anchor.set(0.5);
            group.addChild(initial);

            const label = new PIXI.Text({
                text: player.username,
                style: {
                    fontFamily: 'monospace',
                    fontSize: 11,
                    fill: isCurrent ? COLORS.accent : COLORS.subtext,
                }
            });
            label.anchor.set(0.5);
            label.y = AVATAR_RADIUS + 14;
            group.addChild(label);

            const livesContainer = new PIXI.Container();
            livesContainer.y = AVATAR_RADIUS + 28;
            const totalLives = 3;
            const dotSize = 5;
            const dotGap = 4;
            const totalWidth = totalLives * dotSize * 2 + (totalLives - 1) * dotGap;
            for (let l = 0; l < totalLives; l++) {
                const dot = new PIXI.Graphics();
                dot.circle(0, 0, dotSize);
                dot.fill({ color: l < player.lives ? COLORS.heart : 0x2a2a3e });
                dot.x = -totalWidth / 2 + l * (dotSize * 2 + dotGap) + dotSize;
                livesContainer.addChild(dot);
            }
            group.addChild(livesContainer);

            app.stage.addChild(group);

            if (isCurrent) {
                let t = 0;
                app.ticker.add(() => {
                    t += 0.05;
                    group.scale.set(1 + Math.sin(t) * 0.04);
                });
            }
        });
    }

    $effect(() => {
        // track reactive deps
        players.forEach(p => [p.lives, p.joined, p.username]);
        holderId;
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

        app.canvas.style.position = 'absolute';
        app.canvas.style.inset = '0';
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

<div bind:this={container} class="relative w-full h-full"></div>