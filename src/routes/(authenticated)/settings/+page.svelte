<script lang="ts">
	import { authClient } from '$lib/client';
	import { onMount } from 'svelte';

	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	let sessions = $state([]);
	let { data, form } = $props();

	let currentPassword = $state('');
	let newPassword = $state('');
	let newPasswordConfirm = $state('');
	let errorMessage = $state('');
	let newUsername = $state('');

	onMount(async () => {
		const fetch = await authClient.listSessions();
		sessions = fetch.data;
	});

	async function RemoveSession(token) {
		await authClient.revokeSession({
			token: token
		});
	}

	async function ChangePassword(currentPassword: String, newPassword: String) {
		const { error } = await authClient.changePassword({
			newPassword: newPassword, // required
			currentPassword: currentPassword, // required
			revokeOtherSessions: true
		});
	}

	function handleSubmit(event) {
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
		event.target.submit();
	}
	let previewProfilePicture = $state("");

	function handleFileSelect(event) {
		const file = event.target.files[0];
		if (file) {
			// Hur skapar du en preview URL?
			const url = URL.createObjectURL(file);

			if (url) {
				previewProfilePicture = url;
			}
		}
	}
</script>

<!-- <main class="grid grid-cols-[500px_1fr] p-8">
	<section>
		<SideTab/>
	</section>
</main> -->

<div>
<form method="POST" action="?/uploadProfile" enctype="multipart/form-data">
	{#if form?.fileSize}<div>file size</div>{/if}
	{#if form?.filetype}<div>file type</div>{/if}
	{#if form?.error}<div>error</div>{/if}

	<FileUpload class="w-fit" maxFiles={1} maxFileSize={5 * 1024 * 1024} allowDrop accept={['image/*']}>
		<FileUpload.Trigger>Browse Images</FileUpload.Trigger>
		<FileUpload.HiddenInput name="image" onchange={handleFileSelect}/>
		<FileUpload.ItemGroup>
		<FileUpload.Context>
			{#snippet children(fileUpload)}
				{#each fileUpload().acceptedFiles as file (file.name)}
					<FileUpload.Item {file}>
						<img src={previewProfilePicture} alt="preview" />
						<FileUpload.ItemName>{file.name}</FileUpload.ItemName>
						<FileUpload.ItemSizeText>{file.size} bytes</FileUpload.ItemSizeText>
						<FileUpload.ItemDeleteTrigger />
					</FileUpload.Item>
				{/each}
			{/snippet}
		</FileUpload.Context>
		</FileUpload.ItemGroup>
	</FileUpload>
	<button type="submit" class="btn-base btn preset-filled-success-500">Upload Image</button>
</form>

	{#if data.user.image}
		<img src={data.user.image} alt="avatar" class="h-32 w-32 rounded-full object-cover" />
	{/if}

	<h1 class="text-4xl">{data.user.name}</h1>
	<h1 class="text-4xl">{data.user.username}</h1>
	<h1 class="text-4xl">{data.user.displayUsername}</h1>
	<form method="POST" action="/settings?/signOut">
		<button type="submit">Sign Out</button>
	</form>

	<form method="POST" action="?/changeUsername">
		<input
			bind:value={newUsername}
			placeholder={data.user.username}
			maxlength="16"
			minlength="1"
			name="username"
		/>
		<button type="submit">Change Username</button>
	</form>

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
