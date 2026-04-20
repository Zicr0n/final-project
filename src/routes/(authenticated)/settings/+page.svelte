<script lang="ts">
	import { authClient } from '$lib/client';
	import { onMount } from 'svelte';

	import { Avatar, Dialog, FileUpload, Portal } from '@skeletonlabs/skeleton-svelte';
	import { Check, XIcon } from '@lucide/svelte';

	let sessions = $state<
		Array<{
			id: string;
			createdAt: Date;
			updatedAt: Date;
			userId: string;
			expiresAt: Date;
			token: string;
			ipAddress?: string | null;
			userAgent?: string | null;
		}>
	>([]);
	let { data, form } = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let newPasswordConfirm = $state('');
	let errorMessage = $state('');
	let newUsername = $state('');
	let editUsername = $state(false)

	const animation =
		'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

	onMount(async () => {
		const fetch = await authClient.listSessions();
		if (fetch.data) {
			sessions = fetch.data;
		}
	});

	async function RemoveSession(token: string) {
		await authClient.revokeSession({
			token: token
		});
	}

	async function ChangePassword(currentPassword: string, newPassword: string) {
		const { error } = await authClient.changePassword({
			newPassword: newPassword, // required
			currentPassword: currentPassword, // required
			revokeOtherSessions: true
		});
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		errorMessage = '';

		// Basic checks
		if (!currentPassword || !newPassword || !newPasswordConfirm) {
			errorMessage = 'All fields are required.';
			return;
		}

		if (newPassword.length < 8) {
			errorMessage = 'New password must be at least 8 characters.';
			return;
		}

		if (newPassword !== newPasswordConfirm) {
			errorMessage = 'New passwords do not match.';
			return;
		}

		// If valid → submit form
		(event.target as HTMLFormElement).submit();
	}
	let previewProfilePicture = $state('');

	function handleFileSelect(event: Event) {
		const file = (event.target as HTMLInputElement).files?.[0];
		if (file) {
			// Hur skapar du en preview URL?
			const url = URL.createObjectURL(file);

			if (url) {
				previewProfilePicture = url;
			}
		}
	}

	function OnCancelUsernameChange(){
		newUsername = '';
		editUsername = false
	}
</script>

<h3 class="h3">Profile</h3>
<p>Manage your public information</p>

<Avatar class="size-42 my-4">
	<Avatar.Image src={data.user.image} alt="small" />
	<Avatar.Fallback>{data.user.username?.slice(0,2).toUpperCase()}</Avatar.Fallback>
</Avatar>

<section class="bg-surface-200-800 p-3 rounded space-y-6">
	<!-- Change Username-->
	<div class="flex items-center justify-between ">
		<div>
			<p class="font-bold">Username</p>
			<p class="text-xs">Shown to all users</p>
		</div>
		<div>
			{#if editUsername}
				<form method="POST" action="?/changeUsername" class="space-y-1">
					<input
						bind:value={newUsername}
						placeholder={data.user.username}
						maxlength="16"
						minlength="1"
						name="username"
						class="input max-w-58 bg-surface-50-950"
						required
					/>
					<div class="flex justify-end gap-1">
					<button type="submit" class="btn btn-sm rounded active:scale-95 preset-filled-success-400-600" >Confirm</button>
					<button class="btn btn-sm rounded active:scale-95 preset-filled-error-400-600" onclick={OnCancelUsernameChange}>Cancel</button>
					</div>
				</form>
			{:else}
				<span class="badge preset-filled-surface-100-900">{data.user.username}</span>
				<button class="btn rounded active:scale-95 preset-filled-primary-400-600" onclick={()=> editUsername = true} >Edit</button>
			{/if}
		</div>
	</div>


	<!-- Upload Avatar -->
	<div class="flex items-center justify-between">
		<div>
			<p class="font-bold">Avatar</p>
			<p class="text-xs">Your profile picture</p>
		</div>
		<form method="POST" action="?/uploadProfile" enctype="multipart/form-data">
			<FileUpload
				class="w-fit"
				maxFiles={1}
				maxFileSize={5 * 1024 * 1024}
				allowDrop
				accept={['image/*']}
			>
				<FileUpload.HiddenInput name="image" onchange={handleFileSelect} />
				<FileUpload.ItemGroup>
					<FileUpload.Context>
						{#snippet children(fileUpload)}
							{#each fileUpload().acceptedFiles as file (file.name)}
								<FileUpload.Item {file}>
									<img src={previewProfilePicture} alt="preview" class="w-32"/>
									<FileUpload.ItemName>{file.name}</FileUpload.ItemName>
									<FileUpload.ItemDeleteTrigger />
								</FileUpload.Item>
							{/each}
						{/snippet}
					</FileUpload.Context>
				</FileUpload.ItemGroup>
				<div class="flex gap-1">
					<FileUpload.Trigger class="btn btn-sm">Browse Images</FileUpload.Trigger>
					<button type="submit" class="preset-filled-success-500 btn btn-icon"><Check/></button>
				</div>
			</FileUpload>
		</form>
	</div>
	<div class="flex items-center justify-between">
		<div>
			<p class="font-bold">Sign out</p>
			<p class="text-xs">Exit current session</p>
		</div>
		
		<Dialog>
			<Dialog.Trigger class="btn btn-sm preset-filled-error-400-600 uppercase">sign out</Dialog.Trigger>
			<Portal>
				<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
				<Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
					<Dialog.Content class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl {animation}">
						<header class="flex justify-between items-center">
							<Dialog.Title class="text-lg font-bold">Sign out?</Dialog.Title>
							<Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
								<XIcon class="size-4" />
							</Dialog.CloseTrigger>
						</header>
						<Dialog.Description>
							Are you certain you want to sign out? Only this session will be closed.
						</Dialog.Description>
						<footer class="flex justify-end gap-2">
							<Dialog.CloseTrigger class="btn preset-tonal">Cancel</Dialog.CloseTrigger>
							<form method="POST" action="/settings?/signOut">
								<Dialog.CloseTrigger class="btn preset-filled-error-500">Confirm</Dialog.CloseTrigger>
							</form>
						</footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog>
	</div>
</section>

<div>
	<form method="POST" action="?/changePassword" onsubmit={handleSubmit}>
		<label for="currentPassword">Current Password</label>
		<input minlength="8" bind:value={currentPassword} name="currentPassword" type="password" />

		<label for="newPassword">New Password</label>
		<input minlength="8" bind:value={newPassword} name="newPassword" type="password" />

		<label for="newPasswordConfirm">New Password Confirm</label>
		<input
			minlength="8"
			bind:value={newPasswordConfirm}
			name="newPasswordConfirm"
			type="password"
		/>

		<button type="submit">Confirm Password Change</button>
		{#if errorMessage}
			<p class="text-red-500">{errorMessage}</p>
		{/if}
		{#if form?.error}
			<p>ERROR : {form?.error}</p>
		{/if}
	</form>

	<ul class="flex flex-col gap-4">
		<ul>
			{#each sessions as session}
				<p>Expires at : {session.expiresAt}</p>
				<p>Created at : {session.createdAt}</p>
				<p>Updated at : {session.updatedAt}</p>
				<p>IP Address : {session.ipAddress}</p>
				<form>
					<button class="bg-cyan-500" onclick={() => RemoveSession(session.token)}
						>Remove Session</button
					>
				</form>
			{/each}
		</ul>
	</ul>
</div>


<!-- Sign out dialog -->
