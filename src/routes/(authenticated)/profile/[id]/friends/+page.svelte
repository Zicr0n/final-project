<script>
	import { User, XIcon } from '@lucide/svelte';
	import { Avatar, Dialog, Portal, Tabs } from '@skeletonlabs/skeleton-svelte';
	const { data } = $props();

	const animation =
		'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';
</script>

<main class="my-16 flex h-full flex-col items-center px-30">
	<div class="">
		<h1 class="text-center h1">Friends</h1>
		<Tabs defaultValue="friends" class="my-12 p-4 min-h-full bg-surface-200-800 rounded">
			<Tabs.List class="w-full">
				<Tabs.Trigger class="flex-1" value="friends">Friends</Tabs.Trigger>
				{#if data.isOwner}
					<Tabs.Trigger class="flex-1" value="requests">Friend Requests</Tabs.Trigger>
				{/if}
				<Tabs.Indicator />
			</Tabs.List>
			<Tabs.Content value="friends">
				{#if data.friendRequests.filter((f) => f.status == 'accepted').length > 0}
					{#each data.friendRequests as request}
						{#if request.status === 'accepted'}
							{@const other = request.senderId === data.profileId ? request.receiver : request.sender}
							<div class="grid grid-cols-1 gap-2  md:grid-cols-2 xl:grid-cols-3">
								<section class="preset-glass-surface h-full w-69 card p-3 card-hover justify-self-center">
									<a
										href={`/profile/${other.id}`}
										class="w-full"
									>
										<div class="flex gap-2 space-y-2">
											<Avatar class="size-20">
												<Avatar.Image src={other.image} alt="large" />
												<Avatar.Fallback><User/></Avatar.Fallback>
											</Avatar>
											<h7 class="h7">{other.username}</h7>
										</div>
									</a>

									<Dialog>
										<Dialog.Trigger
											class="btn w-full preset-outlined-error-500 btn-sm text-error-600-400 uppercase"
											>Remove Friend</Dialog.Trigger
										>
										<Portal>
											<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
											<Dialog.Positioner
												class="fixed inset-0 z-50 flex items-center justify-center p-4"
											>
												<Dialog.Content
													class="w-full max-w-xl space-y-4 card bg-surface-100-900 p-4 shadow-xl {animation}"
												>
													<header class="flex items-center justify-between">
														<Dialog.Title class="text-lg font-bold">Sign out?</Dialog.Title>
														<Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
															<XIcon class="size-4" />
														</Dialog.CloseTrigger>
													</header>

													<Dialog.Description>
														Are you certain that you want to remove this friend?
													</Dialog.Description>

													<footer class="flex w-full justify-end gap-2">
														<Dialog.CloseTrigger class="btn preset-tonal">Cancel</Dialog.CloseTrigger>

														<form class="w-full flex-1" method="POST" action="?/removeFriend">
															<input hidden name="requestId" value={request.id} />

															<Dialog.CloseTrigger class="btn preset-filled-error-500" type="button">
																<button type="submit">Confirm</button>
															</Dialog.CloseTrigger>
														</form>
													</footer>
												</Dialog.Content>
											</Dialog.Positioner>
										</Portal>
									</Dialog>
								</section>
							</div>
						{/if}
					{/each}
				{:else}
					<p>Nothing to see here...</p>
				{/if}
			</Tabs.Content>
			{#if data.isOwner}
				<Tabs.Content value="requests" class="w-full">
					{#if data.friendRequests.filter((f) => f.status == 'pending').length > 0}
						{#each data.friendRequests as request}
							{#if request.status === 'pending'}
							<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3 w-full">
								<section class="preset-glass-surface h-full w-69 not-last:card p-3 card-hover">
									<a
										href={`/profile/${request.sender.id === data.user.id ? request.receiverId : request.sender.id}`}
									>
										<div class="flex gap-2 space-y-2">
											<Avatar class="size-20">
												<Avatar.Image src={request.sender.image} alt="large" />
												<Avatar.Fallback><User/></Avatar.Fallback>
											</Avatar>
											<h7 class="h7">{request.sender.username}</h7>
										</div>
									</a>
									<div class="flex w-full gap-2">
										<form class="w-full flex-1" method="POST" action="?/acceptRequest">
											<button
												type="submit"
												class="z-10 btn w-full preset-filled-success-500 btn-base active:scale-95"
												>Accept</button
											>
											<input hidden class="hidden" name="requestId" value={request.id} />
										</form>
										<form class="w-full flex-1" method="POST" action="?/rejectRequest">
											<button
												type="submit"
												class="z-10 btn w-full preset-filled-error-500 btn-base active:scale-95"
												>Ignore</button
											>
											<input hidden name="requestId" value={request.id} />
										</form>
									</div>
								</section>
							</div>
							{/if}
						{/each}
					{:else}
						<p>Nothing to see here...</p>
					{/if}
				</Tabs.Content>
			{/if}
		</Tabs>
	</div>
</main>
