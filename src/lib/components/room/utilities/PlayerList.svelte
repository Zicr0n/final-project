<script>
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import { Crown, Gamepad } from '@lucide/svelte';

	let { players, ownerId } = $props();
</script>

<ul class="flex h-full w-full flex-col gap-2">
	{#each players as player}
		<li
			class="grid w-full grid-cols-[1fr_3fr] p-2 transition-all hover:preset-filled-surface-700-300"
		>
			<Avatar class="size-20">
				<Avatar.Image
					src="https://i.pinimg.com/736x/ab/a7/ed/aba7edba49adffc5a74b5f6eae36ed35.jpg"
					alt="avatar"
				/>
				<Avatar.Fallback>{player.username.substring(0, 2)}</Avatar.Fallback>
			</Avatar>
			<div class="flex">
				<h6 class="h6">{player.username}</h6>
				{#if player.joined}
					<Gamepad class="mx-2 text-success-500" />
					{#if player.id === ownerId}
						<Crown class="text-primary-500" />
					{/if}
				{:else if player.id === ownerId}
					<Crown class="mx-2 text-primary-500" />
				{/if}
			</div>
		</li>
	{/each}
</ul>
