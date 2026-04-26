<script lang="ts">
	const { statName = $bindable(), statValue = $bindable() } = $props();
</script>

<div class="flex flex-col">
	<h6 class="uppercase">{statName}</h6>
	<p>{statValue}</p>
</div>
