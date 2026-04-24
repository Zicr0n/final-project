<script lang="ts">
  import { User, Lock, Paintbrush, Volume2, BarChart2, Info } from '@lucide/svelte';
  import { page } from '$app/state';
  let { children } = $props()

  const nav = [
    { section: 'Account', items: [
      { label: 'Profile', icon: User, href: '/settings' },
      { label: 'Security', icon: Lock, href: '/settings/security' },
    ]},
    { section: 'Game', items: [
      { label: 'Appearance', icon: Paintbrush, href: '/settings/appearance' }
    ]}
  ];
</script>
<div class=" w-full h-full">
  <main class="mx-auto grid max-w-4xl grid-cols-[200px_1fr] gap-8 px-6 py-12 ">
    <nav class="space-y-4 bg-surface-200-800 py-4 rounded shadow-2xl h-50">
      {#each nav as group}
        <div>
          <p class="px-3 text-xs font-semibold uppercase tracking-widest text-surface-800-200 mb-1">
            {group.section}
          </p>
          {#each group.items as item}
            <a href={item.href}
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm 
                    hover:bg-surface-500/10  transition-colors
                    [&.active]:bg-surface-500/15 [&.active]:text-white [&.active]:font-medium {page.url.pathname == item.href ? "text-primary-600-400" : ""}">
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