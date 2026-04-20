<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/client.js';
	import GridBackground from '$lib/components/global/GridBackground.svelte';
	import LoginForm from '$lib/components/login/LoginForm.svelte';
	import RegisterForm from '$lib/components/login/RegisterForm.svelte';
	import { SquareArrowRight, User, LogIn, Bomb, Pencil, CupSoda } from '@lucide/svelte';

	let { form } = $props();
	let wantsAnon = $state(false);
	let isUserAlready = $state(true);
	let guestName = $state('');
	let email = $state('');
	let username = $state('');
	let password = $state('');

	async function submitGuest() {
		const { data, error } = await authClient.signIn.anonymous();
		if (error || !data) return;

		await authClient.updateUser({
			username: guestName,
			displayUsername: guestName,
			name: guestName
		});

		goto('/rooms');
	}

	function submitAuth() {
		console.log('Auth login:', { email, password });
	}
</script>

<main class=" relative min-h-screen overflow-x-hidden text-surface-900-100 overflow-hidden">
	<div class="absolute bottom-0 left-0 w-full">
		<GridBackground class="w-full" />
	</div>

	<section
		class="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:px-12 lg:py-0"
	>
		<div class="relative flex flex-col justify-center py-8 lg:py-12">
			<div class="max-w-xl space-y-8">
				<div class="space-y-3">
					<h2
						class="w-fit text-5xl leading-none font-black tracking-tight uppercase transition-all duration-300 hover:translate-x-2 sm:text-6xl"
					>
						projectname
					</h2>
					<h2
						class="w-fit bg-linear-to-br from-primary-600-400 to-primary-300 bg-clip-text text-5xl leading-none font-black tracking-tight text-transparent
					uppercase transition-all duration-300 hover:translate-x-2 sm:text-6xl
					"
					>
						.topleveldomain
					</h2>
				</div>

				<p
					class="max-w-md text-base leading-7 text-surface-950-50 transition-all duration-300 hover:scale-[1.02] hover:text-black sm:text-lg dark:hover:text-white"
				>
					Type, draw or guess with other people, with only a username!
				</p>

				<div class="grid max-w-xl grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
					<div
						class="group flex flex-col items-center justify-center gap-4 card rounded-3xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:rotate-1 hover:shadow-2xl"
					>
						<div
							class="bg-warning-100-800 grid h-14 w-14 place-items-center rounded-2xl text-primary-500 ring-1 ring-primary-500 dark:text-warning-500 dark:ring-warning-500"
						>
							<Bomb size={28} />
						</div>
						<p
							class="text-lg font-bold text-surface-800-200 transition-colors duration-300 group-hover:text-primary-500 dark:group-hover:text-warning-500"
						>
							Word Bomb
						</p>
					</div>

					<div
						class="group flex flex-col items-center justify-center gap-4 card rounded-3xl p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:-rotate-1 hover:shadow-2xl"
					>
						<div
							class="bg-secondary-100-800 grid h-14 w-14 place-items-center rounded-2xl text-secondary-500 ring-1 ring-secondary-300-700"
						>
							<Pencil size={28} />
						</div>
						<p
							class="text-lg font-bold text-surface-800-200 transition-colors duration-300 group-hover:text-secondary-500"
						>
							Pictionary
						</p>
					</div>

					<div
						class="group flex flex-col items-center justify-center gap-4 card rounded-3xl p-5 text-center transition-all duration-300
					hover:-translate-y-1 hover:rotate-1 hover:shadow-2xl hover:backdrop-blur-xl"
					>
						<div
							class="bg-tertiary-100-800 grid h-14 w-14 place-items-center rounded-2xl text-tertiary-900-100 ring-1 ring-tertiary-900-100 backdrop-blur-xs"
						>
							<CupSoda size={28} />
						</div>
						<p
							class="text-lg font-bold text-surface-800-200 transition-colors duration-300 group-hover:text-primary-900-100"
						>
							Pop Quiz
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- login panel -->
		<div class="flex items-center justify-center py-8 transition-all lg:py-12">
			<div
				class="w-full max-w-md rounded-4xl border border-surface-300-700/70 bg-surface-50-950/70 p-6 shadow-2xl backdrop-blur-xl transition-all"
			>
				<div class="space-y-2 text-center">
					<h3 class="text-2xl font-black tracking-tight text-surface-900-100">Get in the game</h3>
					<p class="text-sm leading-6 text-surface-700-300">
						Play as a guest or sign in to save stats and cosmetics.
					</p>
				</div>

				<div class="bg-surface-100-800 mt-6 grid grid-cols-2 rounded-2xl p-1.5">
					<button
						type="button"
						class={`rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
							wantsAnon
								? 'bg-primary-500 text-white shadow-lg'
								: 'hover:bg-surface-200-700 text-surface-700-300'
						}`}
						onclick={() => (wantsAnon = true)}
					>
						Guest
					</button>

					<button
						type="button"
						class={`rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
							!wantsAnon
								? 'bg-primary-500 text-white shadow-lg'
								: 'hover:bg-surface-200-700 text-surface-700-300'
						}`}
						onclick={() => (wantsAnon = false)}
					>
						Authenticated
					</button>
				</div>

				{#if wantsAnon}
					<form class="mt-6 space-y-5" onsubmit={submitGuest}>
						<fieldset class="space-y-2">
							<label for="guestName" class="label">
								<span
									class="label-text text-xs font-bold tracking-[0.18em] text-surface-800-200 uppercase"
								>
									Enter a username
								</span>
							</label>
							<div
								class="input-group overflow-hidden rounded-2xl border border-surface-300-700 bg-surface-50-950 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary-500/40"
							>
								<input
									id="guestName"
									bind:value={guestName}
									class="placeholder:text-surface-500-400 input border-0 bg-transparent text-surface-900-100 placeholder-surface-200-800 focus:ring-0"
									type="text"
									placeholder="CoolPlayer123"
									maxlength="16"
								/>
							</div>
						</fieldset>

						<button
							type="submit"
							class="btn w-full justify-center gap-2 rounded-2xl bg-success-500 py-3 text-sm font-bold text-surface-500 shadow-lg transition-all duration-200 hover:scale-[1.01] hover:bg-success-600"
						>
							Play as Guest
							<SquareArrowRight size={18} />
						</button>
					</form>
				{:else if isUserAlready}
					<form
						class="mt-2 space-y-5"
						onsubmit={submitAuth}
						action="?/login"
						method="POST"
						use:enhance
					>
						<input class:hidden={true} value={username} name="username" />
						<input class:hidden={true} value={password} name="password" />
						<LoginForm bind:username bind:password />
					</form>
					{#if form?.message}
						<p class="text-error-500">{form?.message}</p>{/if}
					<p class="mt-3">
						Don't have an account yet? <button
							onclick={() => (isUserAlready = false)}
							class="text-primary-500 underline hover:scale-103">Register</button
						>
					</p>
				{:else}
					<form
						class="mt-2 space-y-5"
						onsubmit={submitAuth}
						action="?/register"
						method="POST"
						use:enhance
					>
						<input class:hidden={true} value={email} name="email" />
						<input class:hidden={true} value={username} name="username" />
						<input class:hidden={true} value={password} name="password" />
						<RegisterForm bind:username bind:password bind:email />
					</form>
					{#if form?.message}
						<p class="text-error-500">{form?.message}</p>{/if}
					<p class="mt-3">
						Have an account already? <button
							onclick={() => (isUserAlready = true)}
							class="text-primary-500 underline hover:scale-103">Log In</button
						>
					</p>
				{/if}
			</div>
		</div>
	</section>
</main>

<style>
	.preset-gradient-background {
		background-image:
			radial-gradient(circle at top, rgb(255 255 255 / 0.08), transparent 30%),
			linear-gradient(180deg, var(--color-primary-100-900) 0%, var(--color-surface-50-950) 100%);
		color: var(--color-primary-contrast-500);
	}
</style>
