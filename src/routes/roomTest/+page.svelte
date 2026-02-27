<script>
    import { onMount } from "svelte";
    import io from "socket.io-client";
    import { players, myId } from "$lib/stores/players";

    let socket;

    let lastFrame = performance.now();

    function animate(now) {
        const dt = (now - lastFrame) / 1000;
        lastFrame = now;

        players.update(p => {
            for (const id in p) {
                const player = p[id];

                if (player.targetX !== undefined) {
                    player.x += (player.targetX - player.x) * 10 * dt;
                    player.y += (player.targetY - player.y) * 10 * dt;
                }
            }
            return p;
        });

        requestAnimationFrame(animate);
    }

    onMount(() => {
        requestAnimationFrame(animate);
    });

    onMount(() => {
        socket = io();

        socket.emit("join_room", { roomId: "lobby" });

        socket.on("character_assigned", (character) => {
            myId.set(character.id);
            players.update(p => ({ ...p, [character.id]: character }));
        });

        socket.on("existing_players", (existing) => {
            players.set(existing);
        });

        socket.on("player_joined", (character) => {
            players.update(p => ({ ...p, [character.id]: character }));
        });

        socket.on("player_moved", ({ id, x, y }) => {
            players.update(p => {
                if (p[id]) {
                    p[id].targetX = x;
                    p[id].targetY = y;
                }
                return p;
            });
        });

        socket.on("player_left", (id) => {
            players.update(p => {
                delete p[id];
                return p;
            });
        });
    });

    // movement handling
    let x = 200;
    let y = 200;

    const mapWidth = 800;
    const mapHeight = 600;

    x = Math.max(0, Math.min(mapWidth, x));
    y = Math.max(0, Math.min(mapHeight, y));

    function handleKey(e) {
        const speed = 5;

        if (e.key === "ArrowUp") y -= speed;
        if (e.key === "ArrowDown") y += speed;
        if (e.key === "ArrowLeft") x -= speed;
        if (e.key === "ArrowRight") x += speed;

        myId.subscribe(id => {
            if (!id) return;
            players.update(p => {
                if (p[id]) p[id] = { ...p[id], x, y };
                return p;
            });
            socket.emit("move", { roomId: "lobby", x, y });
        });
    }

    function SendMessage(){
        socket.emit('send_message', {roomId : "lobby", message : "hello world!"})
    }
</script>

<div class="room" tabindex="0" onkeydown={handleKey}>
    {#each Object.values($players) as p}
        <div
            class="player"
            style="left:{p.x}px; top:{p.y}px;"
        >
            <img src={`/sprites/${p.sprite}.png`} alt="sprite" />
        </div>
    {/each}
</div>

<button onclick={SendMessage}>Greet!</button>

<style>
.room {
    position: relative;
    width: 800px;
    height: 600px;
    background: #eee;
    overflow: hidden;
    outline: none;
}

.player {
    position: absolute;
    width: 32px;
    height: 32px;
    transform: translate(-50%, -50%);
}
</style>