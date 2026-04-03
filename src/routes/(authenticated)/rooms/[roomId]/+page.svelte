<script lang="ts">
	import RoomCanvas from '$lib/components/room/RoomCanvas.svelte';
	import RoomChat from '$lib/components/room/RoomChat.svelte';

	let { data } = $props();
</script>

<h1 class="h1">{data.room.name}</h1>

<main class="p-4">
	<RoomCanvas {data} />
	<RoomChat roomId={data.roomId} />
</main>