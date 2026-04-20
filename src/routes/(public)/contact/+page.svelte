<script>
	import { MessageSquare, Mail } from '@lucide/svelte';
</script>

<main class="mx-auto max-w-4xl px-6 py-16">
	<div class="mb-10">
		<p class="mb-1 text-xs font-semibold tracking-widest text-surface-400 uppercase">Contact</p>
		<h1 class="mb-2 h1 font-black">Get in touch</h1>
		<p class="max-w-md text-surface-300">
			Found a bug? Have an idea? Just want to say hi? Drop a message below or reach out directly.
		</p>
	</div>

	<div class="grid items-start gap-8 md:grid-cols-[1.4fr_1fr]">
		<div class="space-y-4 card p-6">
			<label class="label">
				<span>Name</span>
				<input class="input" type="text" placeholder="Your name" />
			</label>
			<label class="label">
				<span>Email</span>
				<input class="input" type="email" placeholder="you@example.com" />
			</label>
			<label class="label">
				<span>Subject</span>
				<select class="select">
					<option>Bug report</option>
					<option>Feature request</option>
					<option>General feedback</option>
					<option>Other</option>
				</select>
			</label>
			<label class="label">
				<span>Message</span>
				<textarea class="textarea" rows="5" placeholder="Tell me what's on your mind..."></textarea>
			</label>
			<button class="disabled btn w-full preset-filled-primary-500"
				>Send message (to be added)</button
			>
		</div>

		<div class="space-y-4">
			<div class="divide-y divide-surface-500/20 card p-5">
				<p class="pb-3 text-sm font-medium text-surface-300">Direct links</p>
				<a
					href="https://github.com/Zicron"
					class="flex items-center gap-3 py-3 transition-colors hover:text-primary-400"
				>
					<div
						class="grid h-9 w-9 place-items-center rounded-lg bg-surface-700/50 ring-1 ring-white/5"
					>
						<!-- <Github size={15} /> -->
					</div>
					<div>
						<p class="text-sm leading-none font-medium">GitHub</p>
						<p class="mt-1 text-xs text-surface-400">@Zicron</p>
					</div>
				</a>
				<a
					href="#discord"
					class="flex items-center gap-3 py-3 transition-colors hover:text-primary-400"
				>
					<div
						class="grid h-9 w-9 place-items-center rounded-lg bg-surface-700/50 ring-1 ring-white/5"
					>
						<MessageSquare size={15} />
					</div>
					<div>
						<p class="text-sm leading-none font-medium">Discord</p>
						<p class="mt-1 text-xs text-surface-400">Join the server</p>
					</div>
				</a>
				<a
					href="mailto:zicron@example.com"
					class="flex items-center gap-3 py-3 transition-colors hover:text-primary-400"
				>
					<div
						class="grid h-9 w-9 place-items-center rounded-lg bg-surface-700/50 ring-1 ring-white/5"
					>
						<Mail size={15} />
					</div>
					<div>
						<p class="text-sm leading-none font-medium">Email</p>
						<p class="mt-1 text-xs text-surface-400">zicron@example.com</p>
					</div>
				</a>
			</div>

			<div class="card bg-surface-700/30 p-5">
				<p class="mb-1 text-sm font-medium">Response time</p>
				<p class="text-xs leading-relaxed text-surface-400">
					Usually within a day or two. This is a solo project, so bear with me.
				</p>
			</div>
		</div>
	</div>
</main>
