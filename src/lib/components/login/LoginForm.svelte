<script>
	import { SquareArrowRight } from '@lucide/svelte';
	import { LogIn } from '@lucide/svelte';

	let { username = $bindable(''), password = $bindable('') } = $props();
</script>

<fieldset class="space-y-2">
	<label for="username" class="label">
		<span class="label-text text-xs font-bold tracking-[0.18em] text-surface-800-200 uppercase">
			Username
		</span>
	</label>
	<div
		class="input-group overflow-hidden rounded-2xl border border-surface-300-700 bg-surface-50-950 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500/40"
	>
		<input
			id="username"
			bind:value={username}
			class="placeholder:text-surface-500-400 input border-0 bg-transparent
        text-surface-900-100 placeholder-surface-200-800 focus:ring-0"
			type="text"
			placeholder="Enter your username..."
		/>
	</div>
</fieldset>

<fieldset class="space-y-2">
	<label for="password" class="label">
		<span class="label-text text-xs font-bold tracking-[0.18em] text-surface-800-200 uppercase">
			Password
		</span>
	</label>
	<div
		class="input-group overflow-hidden rounded-2xl border border-surface-300-700 bg-surface-50-950 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500/40"
	>
		<input
			id="password"
			bind:value={password}
			class="input border-0 bg-transparent text-surface-900-100 placeholder:text-surface-200-800 focus:ring-0"
			type="password"
			placeholder="••••••••"
		/>
	</div>
</fieldset>

<div class="space-y-3 pt-1">
	<button
		type="submit"
		class="btn w-full justify-center gap-2 rounded-2xl bg-primary-500 py-3 text-sm font-bold text-white shadow-lg transition-all duration-200 hover:scale-[1.01] hover:bg-primary-600"
	>
		Log In
		<SquareArrowRight size={18} />
	</button>
</div>
