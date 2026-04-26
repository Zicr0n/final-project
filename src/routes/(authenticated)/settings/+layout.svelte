<script lang="ts">
	import { User, Lock, Paintbrush, Volume2, BarChart2, Info } from '@lucide/svelte';
	import { page } from '$app/state';
	let { children } = $props();

	const nav = [
		{
			section: 'Account',
			items: [
				{ label: 'Profile', icon: User, href: '/settings' },
				{ label: 'Security', icon: Lock, href: '/settings/security' }
			]
		},
		{
			section: 'Game',
			items: [{ label: 'Appearance', icon: Paintbrush, href: '/settings/appearance' }]
		}
	];
</script>

<div class=" h-full w-full">
	<main class="mx-auto grid max-w-4xl grid-cols-[200px_1fr] gap-8 px-6 py-12">
		<nav class="h-50 space-y-4 rounded bg-surface-200-800 py-4 shadow-2xl">
			{#each nav as group}
				<div>
					<p class="mb-1 px-3 text-xs font-semibold tracking-widest text-surface-800-200 uppercase">
						{group.section}
					</p>
					{#each group.items as item}
						<a
							href={item.href}
							class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm
                    transition-colors hover:bg-surface-500/10
                    [&.active]:bg-surface-500/15 [&.active]:font-medium [&.active]:text-white {page
								.url.pathname == item.href
								? 'text-primary-600-400'
								: ''}"
						>
							<item.icon size={15} />
							{item.label}
						</a>
					{/each}
				</div>
			{/each}
		</nav>

		<div>
			{@render children()}
		</div>
	</main>
</div>
