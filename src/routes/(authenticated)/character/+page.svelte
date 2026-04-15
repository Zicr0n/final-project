<script>
	import { onMount } from 'svelte';

	const { data } = $props();

	console.log(data.char);

	onMount(() => {});
</script>

<p>Char : {data.char?.userId}</p>

<form action="?/saveCharacter" method="POST">
	<label for="bodyColor">Body Color</label>
	<input
		name="bodyColor"
		type="color"
		id="bodyColor"
		defaultValue={data.char?.bodyColor ? data.char.bodyColor : 0}
	/>

	<label for="hatId">Hat Id</label>
	<input
		name="hatId"
		type="number"
		id="hatId"
		defaultValue={data.char?.hatId ? data.char.hatId : 0}
	/>

	<label for="eyesId">Eyes Id</label>
	<input
		name="eyesId"
		type="number"
		id="eyesId"
		defaultValue={data.char?.eyesId ? data.char.eyesId : 0}
	/>

	<label for="shirtId">Shirt Id</label>
	<input
		name="shirtId"
		type="number"
		id="shirtId"
		defaultValue={data.char?.shirtId ? data.char.shirtId : 0}
	/>

	<button type="submit">Save Changes</button>
</form>
