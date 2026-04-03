<script lang="ts">
	import RoomTemplate from '$lib/components/room/RoomTemplate.svelte';
	
	let { data } = $props()
</script>

<RoomTemplate data={data}/>