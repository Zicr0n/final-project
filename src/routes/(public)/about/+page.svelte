<script>
	import { Gamepad2, CircleUserRound, Crown, Pencil, Bomb, CupSoda } from '@lucide/svelte';
	import { fadeIn } from '$lib/effects/fadeIn';
</script>

<main class="xl:px-50">
	<section use:fadeIn class="my-30 grid items-center justify-items-center md:grid-cols-2">
		<div>
			<h1 class="h1 font-black text-primary-500 transition-all hover:ml-3">ACTION FIRST</h1>
			<p>
				Ever wished your favorite party games lived under one roof? That's exactly what this is.
				Choose between drawing and guessing, testing your vocabulary under pressure, or evaluating
				your current pop-culture knowledge. Create a room, share the link, and start playing in
				seconds - whether you're on the same couch or opposite sides of the world.
			</p>
		</div>
		<Gamepad2
			size="450"
			class="rotate-3 justify-items-center text-center transition-all hover:scale-105 hover:-rotate-5 hover:text-primary-500"
		/>
	</section>

	<section class="my-30 flex justify-center gap-2">
		<div use:fadeIn={{ delay: 0 }} class="flex flex-col gap-4 card preset-tonal-surface p-4 card-hover bg-surface-500/10">
			<div class="flex items-center gap-4">
				<Bomb size="32" class="rounded bg-warning-500 p-1 text-surface-950" />
				<h5 class="h5 font-black uppercase">Word bomb</h5>
			</div>
			<p>
				Word Bomb is a word game where players must quickly type a word containing a given letter
				combination before a ticking bomb explodes. Miss it and you lose a life - last one standing
				wins.
			</p>
		</div>
		<div use:fadeIn={{ delay: 150 }} class="flex flex-col gap-4 card preset-tonal-surface p-4 card-hover bg-surface-500/10">
			<div class="flex gap-4">
				<CupSoda size="32" class="rounded bg-tertiary-500 p-1 text-surface-950" />
				<h5 class="h5 font-black uppercase">Pop Quiz</h5>
			</div>
			<p>
				Pop Quiz is a trivia game where players are shown an image or a clue and must type the
				correct answer as fast as possible. Players who guess correctly the fastest score the most
				amount of points, and whoever racks up the most points across all rounds wins.
			</p>
		</div>
		<div use:fadeIn={{ delay: 300 }} class="flex flex-col gap-4 card preset-tonal-surface p-4 card-hover bg-surface-500/10">
			<div class="flex gap-4">
				<Pencil size="32" class="rounded bg-secondary-500 p-1 text-surface-950" />
				<h5 class="h5 font-black uppercase">Pictionary</h5>
			</div>
			<p>
				Pictionary is a drawing and guessing game where one player draws a word or phrase and their
				opponents race to guess what it is before the time runs out. No talking, no letters - just
				your drawing skills (or lack thereof) standing between you and the point.
			</p>
		</div>
	</section>

	<section use:fadeIn class="my-30 flex flex-col items-center py-20">
		<h1 class="z-20 h1 font-black transition-all hover:rotate-3 hover:text-primary-500">
			ONE MAN TEAM
		</h1>
		<div class="relative">
			<Crown
				class="all absolute -top-10 right-0 z-10 rotate-30 text-yellow-500 transition hover:scale-105"
				size="100"
			/>
			<CircleUserRound size="200" class="transition-all hover:scale-105 hover:text-primary-500" />
		</div>
		<h6 class="h3 font-medium">Zicron</h6>
		<cite>I'm literally the best</cite>
	</section>
</main>

<footer use:fadeIn class="mt-20 bg-linear-to-b from-transparent to-primary-50-950/90">
	<div class="mx-auto max-w-7xl px-6 py-12">
		<div class="flex flex-col items-center gap-6">
			<div class="flex items-center gap-3">
				<div class="grid h-9 w-9 place-items-center rounded-xl bg-primary-500/15 text-primary-300 ring-1 ring-primary-400/30">
					<Gamepad2 size={16} />
				</div>
				<span class="text-sm font-semibold tracking-widest uppercase opacity-90">
					Project Name
				</span>
			</div>
			<p class="max-w-sm text-center text-sm text-surface-950-50">
				Possible the best party game on the web
			</p>
			<hr class="hr max-w-40 border-surface-950-50" />
			<p class="text-xs text-surface-950-50">
				Made by <span class="font-black text-primary-400">Zicron</span> · {new Date().getFullYear()}
			</p>
		</div>
	</div>
</footer>