<script lang="ts">

	import { Avatar, Dialog, FileUpload, Portal } from '@skeletonlabs/skeleton-svelte';
	import { Check, XIcon } from '@lucide/svelte';

	
	let { data, form } = $props();


	let newUsername = $state('');
	let editUsername = $state(false)

	const animation =
		'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

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
							<form method="POST" action="?/signOut"
							>
								<Dialog.CloseTrigger class="btn
								preset-filled-error-500"
								type="button">
									<button>Submit</button>
								</Dialog.CloseTrigger>
							</form>
						</footer>
					</Dialog.Content>
				</Dialog.Positioner>
			</Portal>
		</Dialog>
	</div>
</section>