<script lang="ts">
  import { User, Lock, Paintbrush, Volume2, BarChart2, Info } from '@lucide/svelte';
  let { children } = $props()

  const nav = [
    { section: 'Account', items: [
      { label: 'Profile', icon: User, href: '/settings' },
      { label: 'Security', icon: Lock, href: '/settings/security' },
    ]},
    { section: 'Game', items: [
      { label: 'Appearance', icon: Paintbrush, href: '/settings/appearance' },
      { label: 'Audio', icon: Volume2, href: '/settings/audio' },
      { label: 'Stats', icon: BarChart2, href: '/settings/stats' },
    ]}
  ];
</script>

<main class="mx-auto grid max-w-4xl grid-cols-[200px_1fr] gap-8 px-6 py-12">
  <nav class="space-y-4">
    {#each nav as group}
      <div>
        <p class="px-3 text-xs font-semibold uppercase tracking-widest text-surface-400 mb-1">
          {group.section}
        </p>
        {#each group.items as item}
          <a href={item.href}
            class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-surface-300
                   hover:bg-surface-500/10 hover:text-white transition-colors
                   [&.active]:bg-surface-500/15 [&.active]:text-white [&.active]:font-medium">
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