<script lang="ts">
  import { io } from 'socket.io-client'
	import { onMount } from 'svelte';

  const socket = io({
    ackTimeout : 10000,
    retries : 3
  })

  let messages = $state([])
  let actives = $state(0)

  socket.on('chat_message', (msg)=>{
    console.log("received socket message")
      messages.push(msg)
  })

  socket.on('player_joined', () =>{
    console.log("player joined")
    actives += 1
  })

  var chat_input = $state("")

  function message_sent(){
    if (chat_input){
      console.log("message sent")
      socket.emit('chat_message', chat_input);
      chat_input = ''
    }
  }

  function joinRoom(){
    console.log("hello")
    socket.emit("message", {meta : "join", message : "", room : "0"})
  }

</script>

<p>{actives}</p>

<form onsubmit={message_sent}>
  <input type="text" bind:value={chat_input} name="text">
  <button type="submit">Submit Text</button>
</form>

<button onclick={joinRoom}>Join Room</button>

<ul id="messages">
  {#each messages as msg}
    <li>{msg}</li>
  {/each}
</ul>