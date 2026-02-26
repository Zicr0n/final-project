<script lang="ts">
  import { io } from 'socket.io-client'
	import { onMount } from 'svelte';
	import { preventDefault } from 'svelte/legacy';

  const socket = io({
    ackTimeout : 10000,
    retries : 3
  })
  let messages = $state([])

  onMount(()=>{

  })

  

  socket.on('eventFromServer', (message) => {
    console.log(message)
  })

  socket.on('chat_message', (msg)=>{
    console.log("received socket message")
      messages.push(msg)
  })

  var chat_input = ""

  function message_sent(){
    if (chat_input){
      console.log("message sent")
      socket.emit('chat_message', chat_input);
      chat_input = ''
    }
  }

//   $effect(() => {
// 		socket.emit('eventFromClient', )
// 	});
</script>

<form on:submit|preventDefault={message_sent}>
  <input type="text" bind:value={chat_input} name="text">
  <button type="submit">Submit Text</button>
</form>

<ul id="messages">
  {#each messages as msg}
    <li>{msg}</li>
  {/each}
</ul>