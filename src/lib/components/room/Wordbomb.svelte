<script lang="ts">
	import { onMount } from "svelte";
    import { io } from "socket.io-client";

    const { data, socket } = $props();

    let currentStatus = $state("waiting")

    let joinedPlayers = $state<{ id: string; username: string; joined: boolean }[]>([]);
    let holderId = $state("")

    const isMyTurn = $derived(data.user.id === holderId && currentStatus === "playing");
    let userInput = $state("")
    let wordSubmissions = $state([])

    type GameState = {
        status: string;
        currentPlayerId: string;
        explodesAt: number;
        submissions : {userId : string, username : string, word : string}[]
    };

    type RoomStateEvent = {
        players: { id: string; username: string; joined: boolean }[];
    };

    function submitWord() {
        const clean = userInput.trim();
        if (!socket || !isMyTurn || !clean) return;

        socket.emit('wordbomb_submit', {
            word: clean
        });

        userInput = '';
    }

    onMount(()=> {
        if (socket){
            socket.on('game_state', ({ status, currentPlayerId, explodesAt, submissions }: GameState) => {
                console.log("status : " + status)
                currentStatus = status
                holderId = currentPlayerId
                wordSubmissions = submissions
            });

            socket.on('room_state', ({ players: roomPlayers } : RoomStateEvent) => {
                joinedPlayers = Object.values(roomPlayers).filter((p) => p.joined);
            });
        }

        console.log(data)
    })

    
</script>

<h1>Word Bomb</h1>
<h1>{currentStatus}</h1>

{#each joinedPlayers as player}
    <p class={player.id == holderId ?  "bg-red-500" : "" }>{player.username}</p>
{/each}

<!-- If its our turn, display the input-->
{#if isMyTurn}
    <p>ITS YO TURN DAWG</p>
    <form on:submit|preventDefault={submitWord}>
		<input
			bind:value={userInput}
			placeholder="Write your word"
			autocomplete="off"
		/>
		<button type="submit">Send</button>
	</form>
    <input type="text" bind:value={userInput}>
{/if}

{#if currentStatus == "playing"}
    {#each wordSubmissions as {username, userId, word}}
        <p>{word}</p>
    {/each}
{/if}