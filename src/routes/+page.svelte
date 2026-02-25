<script lang="ts">
  import { io } from 'socket.io-client'
	import { preventDefault } from 'svelte/legacy';

  const socket = io()

  socket.on('eventFromServer', (message) => {
    console.log(message)
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