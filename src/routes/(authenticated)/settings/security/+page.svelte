<script lang="ts">
	import { authClient } from '$lib/client';
	import { ArrowUpDownIcon, XIcon } from '@lucide/svelte';
	import { Collapsible, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

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

    let currentPassword = $state('');
    let currentEmail = $state('');
    let newEmail = $state('');
	let newPassword = $state('');
	let newPasswordConfirm = $state('');
	let errorMessage = $state('');
	let editPassword = $state(false);

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

    function OnCancelPasswordChange(){
		currentPassword = '';
        newPassword = ''
		editPassword = false
	}

    function OnCancelEmailChange(){
		currentEmail = '';
        newEmail = ''
	}

    function parseUserAgent(ua : string | null | undefined) {
        if (!ua) return "Unknown device";

        let browser = "Unknown browser";
        let os = "Unknown OS";

        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
        else if (ua.includes("Firefox")) browser = "Firefox";
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
        else if (ua.includes("Edg")) browser = "Edge";

        if (ua.includes("Windows NT")) os = "Windows";
        else if (ua.includes("Mac OS")) os = "macOS";
        else if (ua.includes("Linux")) os = "Linux";
        else if (ua.includes("Android")) os = "Android";
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

        return `${browser} on ${os}`;
    }

    function formatDate(date: Date) {
        return new Date(date).toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
        }
    
    function formatEmail(email : string) {
        const [local, domain] = email.split("@");
        const [domainName, ...tld] = domain.split(".");

        return `${local.slice(0, 2)}***@${domainName.slice(0, 2)}***.${tld.join(".")}`;
    }

    const animation =
		'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';

</script>

<h3 class="h3">Security</h3>
<p class="mb-2">Manage your private information</p>

<section class="bg-surface-200-800 p-3 rounded space-y-6">
<!-- Change email -->
    <div class="flex items-center justify-between">
		<div>
			<p class="font-bold">Email</p>
			<p class="text-xs">Change your email address</p>
		</div>
		<div>
            <span class="badge preset-filled-surface-100-900">{formatEmail(data.user.email)}</span>
            <Dialog>
                <Dialog.Trigger class="btn btn-sm
                preset-filled-primary-400-600 uppercase disabled" disabled>change
            </Dialog.Trigger >
                <Portal>
                    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
                    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                        <Dialog.Content class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl {animation}">
                            <header class="flex justify-between items-center w-full">
                                <Dialog.Title class="text-lg
                                font-bold">Change your email</Dialog.Title>
                                <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                                    <XIcon class="size-4" />
                                </Dialog.CloseTrigger>
                            </header>
                            <Dialog.Description>
                                Please enter your current and new email.
                            </Dialog.Description>
                            <form method="POST" action="?/changeEmail" class="space-y-1 w-full">
                                <input
                                    bind:value={currentEmail}
                                    placeholder={"Enter your current email address.."}
                                    minlength="1"
                                    name="currentEmail"
                                    class="input max-w-full bg-surface-50-950"
                                    required
                                    type="email"
                                />
                                <input
                                    bind:value={newEmail}
                                    placeholder={"Enter your new email address.."}
                                    minlength="1"
                                    name="newEmail"
                                    class="input max-w-full bg-surface-50-950"
                                    required
                                    type="email"
                                />
                            
                                <footer class="flex justify-end gap-2">
                                    <Dialog.CloseTrigger class="btn preset-tonal" onclick={OnCancelEmailChange}>Cancel</Dialog.CloseTrigger>
                                    <Dialog.CloseTrigger class="btn btn-sm rounded active:scale-95 preset-filled-success-400-600" type="submit"><button type="submit">Confirm</button></Dialog.CloseTrigger>
                                </footer>
                            </form>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog>
		</div>
	</div>
	<!-- Change Password-->
	<div class="flex items-center justify-between ">
		<div>
			<p class="font-bold">Password</p>
			<p class="text-xs">Change your password</p>
		</div>
		<div>
            <Dialog>
                <Dialog.Trigger class="btn btn-sm
                preset-filled-primary-400-600 uppercase">change
            </Dialog.Trigger>
                <Portal>
                    <Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
                    <Dialog.Positioner class="fixed inset-0 z-50 flex justify-center items-center p-4">
                        <Dialog.Content class="card bg-surface-100-900 w-full max-w-xl p-4 space-y-4 shadow-xl {animation}">
                            <header class="flex justify-between items-center">
                                <Dialog.Title class="text-lg
                                font-bold">Change your password</Dialog.Title>
                                <Dialog.CloseTrigger class="btn-icon hover:preset-tonal">
                                    <XIcon class="size-4" />
                                </Dialog.CloseTrigger>
                            </header>
                            <Dialog.Description>
                                Please enter your current and new password.
                            </Dialog.Description>
                            <form method="POST" action="?/changePassword" class="space-y-1">
                                <input
                                    bind:value={currentPassword}
                                    placeholder={"Enter your current password.."}
                                    minlength="1"
                                    name="currentPassword"
                                    class="input max-w-58 bg-surface-50-950"
                                    required
                                    type="password"
                                />
                                <input
                                    bind:value={newPassword}
                                    placeholder={"Enter your new password.."}
                                    minlength="1"
                                    name="newPassword"
                                    class="input max-w-58 bg-surface-50-950"
                                    required
                                    type="password"
                                />
                            
                                <footer class="flex justify-end gap-2">
                                    <Dialog.CloseTrigger class="btn preset-tonal" onclick={OnCancelPasswordChange}>Cancel</Dialog.CloseTrigger>
                                    <Dialog.CloseTrigger class="btn btn-sm rounded active:scale-95 preset-filled-success-400-600" type="submit"><button type="submit">Confirm</button></Dialog.CloseTrigger>
                                </footer>
                            </form>
                        </Dialog.Content>
                    </Dialog.Positioner>
                </Portal>
            </Dialog>
		</div>
	</div>

    <Collapsible class="items-start preset-filled-surface-200-800 flex justify-between w-full ">
        <div class="w-full flex justify-between items-center">
            
            <div>
                <p class="font-bold">Sessions</p>
                <p class="text-xs">View all available sessions</p>
            </div>
            <Collapsible.Trigger class="btn-icon hover:preset-tonal">
                <ArrowUpDownIcon class="size-4" />
            </Collapsible.Trigger>
        </div>
        <Collapsible.Content class="flex flex-col gap-2 w-full">
            <hr class="hr w-full border-surface-600-400">
            {#each sessions as session, i}
                <div class="w-full flex flex-col justify-between gap-2">
                    <div>
                        <p><strong>Device</strong> : {parseUserAgent(session.userAgent)}</p>
                        <p><strong>IP-address</strong> : {session.ipAddress}</p>
                        <p><strong>Expires at</strong> : {formatDate(session.expiresAt)}</p>
                        <p><strong>Last used</strong> : {formatDate(session.updatedAt)}</p>
                    </div>
                    <form>
                        <button class="btn btn-xs preset-filled-error-300-700" onclick={() => RemoveSession(session.token)}>Remove Session</button>
                    </form>
                </div>
                {#if sessions.length > 1 && i < sessions.length - 1}
                    <hr class="hr w-full border-surface-600-400">
                {/if}
            {/each}
        </Collapsible.Content>
    </Collapsible>
</section>