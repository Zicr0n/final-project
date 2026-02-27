<script>
    let { data } = $props();
    // svelte-ignore state_referenced_locally
    const roomId = $state(data.roomId);

    import { onMount } from "svelte";
    import io from "socket.io-client";
    import { players, myId } from "$lib/stores/players";
    import { chat } from "$lib/stores/chat";
	import { fail, redirect } from "@sveltejs/kit";

    let socket;
    let error_room = $state(false)

    let lastFrame = performance.now();
    let chatInput = $state("");

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

        socket.emit("join_room", { roomId: roomId });

        socket.on("chat_message", ({sender, text}) =>{
            chat.update(c => [...c, {sender, text}]);
        });

        socket.on("character_assigned", (character) => {
            myId.set(character.id);
            players.update(p => ({ ...p, [character.id]: character }));
            x = character.x
            y = character.y
        });

        socket.on("room_error", ({error}) =>{
            error_room = true;
        })

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
            socket.emit("move", { roomId: roomId, x, y });
        });
    }

    function SendMessage(){
        if (!chatInput.trim()) return;
        const text = chatInput;
        chatInput = ""

        socket.emit('chat_message', {roomId : roomId, message : text})
    }
</script>

{#if error_room == false}
<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div class="room {roomId}" tabindex="0" onkeydown={handleKey}>
    {#each Object.values($players) as p}
        <div
            class="player"
            style="left:{p.x}px; top:{p.y}px;"
        >
            <img src={`/player.webp`} alt="sprite" />
        </div>
    {/each}
</div>

<div>
    <ul>
        {#each $chat as msg}
            <p>{msg.sender}: {msg.text}</p>
        {/each}
    </ul>
</div>

<form onsubmit={SendMessage}> 
    <input bind:value={chatInput} placeholder="Write a message">
    <button>Send</button>
</form>

{:else}
<p>ERROR!</p>
{/if}

<style>
.room {
    position: relative;
    width: 800px;
    height: 600px;
    overflow: hidden;
    outline: none;
}

.player {
    position: absolute;
    width: 128px;
    height: 128px;
    transform: translate(-50%, -50%);
}

</style>