<script lang="ts">
	import { authClient } from '$lib/client';
	import { onMount } from 'svelte';

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

		console.log(sessions);
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
		console.log('submit');
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
</script>

<div>
	<h1 class="text-4xl">{data.user.name}</h1>
	<h1 class="text-4xl">{data.user.username}</h1>
	<h1 class="text-4xl">{data.user.displayUsername}</h1>
	<form method="POST" action="/settings?/signOut">
		<button type="submit">Sign Out</button>
	</form>

	<form method="POST" action="?/changeUsername">
		<input
			bind:value={newUsername}
			placeholder={data.user.name}
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
