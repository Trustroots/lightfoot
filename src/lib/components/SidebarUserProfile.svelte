<script lang="ts">
	import { ndk, signer } from '$lib/ndk.svelte';
	import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
	import { WarningCircle } from 'phosphor-svelte';
	import { onMount } from 'svelte';

	const { selectedUser = null } = $props<{
		selectedUser: NDKUserProfile | null;
	}>();

	const currentPubkey = $derived(ndk.$currentPubkey);
	const isCurrentUser = $derived(currentPubkey === selectedUser?.pubkey);

	const onUsernameChange = async (newName: string) => {
		const user = await signer?.instance?.user();
		if (user) {
			user.profile = { name: newName };
			await user.publish();
		}
	};

	let editingName = $state(false);
	let newName = $state(String(selectedUser?.display_name || selectedUser?.name || ''));

	$effect(() => {
		if (selectedUser) {
			newName = String(selectedUser.display_name || selectedUser.name || '');
		}
	});

	function startEditName(e?: MouseEvent) {
		e?.stopPropagation();
		editingName = true;
		newName = String(selectedUser?.display_name || selectedUser?.name || '');
		setTimeout(() => {
			const input = document.getElementById('edit-username-input') as HTMLInputElement;
			input?.focus();
		}, 0);
	}

	function saveName() {
		if (newName.trim() && newName !== (selectedUser?.display_name || selectedUser?.name)) {
			onUsernameChange(newName.trim());
		}
		editingName = false;
	}

	function handleNameInputKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			saveName();
		} else if (e.key === 'Escape') {
			editingName = false;
		}
	}

	onMount(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') close();
		};
		document.addEventListener('keydown', handleEscape);
		return () => document.removeEventListener('keydown', handleEscape);
	});
</script>

{#if isCurrentUser}
	<div
		class="mb-4 flex flex-col items-center gap-2 rounded border-l-2 border-yellow-400 bg-yellow-50 p-3 text-center text-xs text-yellow-800
			dark:border-yellow-600 dark:bg-yellow-900 dark:text-yellow-200"
	>
		<WarningCircle size={24} class="shrink-0" />
		<span>
			Profile editing is still limited in this Nostr client. Some changes may not be saved or
			reflected properly.
		</span>
	</div>
{/if}

<div class="mb-5 flex items-center gap-4">
	{#if selectedUser.picture}
		<img
			src={selectedUser.picture}
			alt=""
			class="h-15 w-15 rounded-full border-2 border-gray-300 object-cover"
		/>
	{/if}
	<h2 class="m-0 flex items-center gap-1 text-xl font-semibold">
		{#if isCurrentUser}
			{#if editingName}
				<input
					id="edit-username-input"
					class="rounded border px-2 py-1 text-base"
					bind:value={newName}
					onkeydown={handleNameInputKeydown}
					onblur={saveName}
				/>
			{:else}
				<span>{selectedUser.display_name || selectedUser.name || 'User'}</span>
				<button
					class="ml-2 rounded bg-gray-200 px-2 py-1 text-xs hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
					onclick={startEditName}
					aria-label="Edit username"
					title="Edit username">✎</button
				>
			{/if}
		{:else}
			{selectedUser.display_name || selectedUser.name || 'User'}
		{/if}
	</h2>
</div>
<div>
	{#if selectedUser.name}
		<p class="my-2 leading-relaxed">
			<strong>Name:</strong>
			{selectedUser.name}
		</p>
	{/if}
	{#if selectedUser.about}
		<p class="my-2 leading-relaxed">
			<strong>About:</strong>
			{selectedUser.about}
		</p>
	{/if}
	{#if selectedUser.nip05}
		<p class="my-2 leading-relaxed">
			<strong>NIP-05:</strong>
			{selectedUser.nip05}
		</p>
	{/if}
	{#if selectedUser.website}
		<p class="my-2 leading-relaxed">
			<strong>Website:</strong>
			<a
				href={selectedUser.website}
				target="_blank"
				rel="noopener noreferrer"
				class="text-blue-500 hover:underline">{selectedUser.website}</a
			>
		</p>
	{/if}
	{#if selectedUser.bot !== undefined}
		<p class="my-2 leading-relaxed">
			<strong>Bot:</strong>
			{selectedUser.bot ? 'Yes' : 'No'}
		</p>
	{/if}
	<p class="my-2 leading-relaxed">
		<strong>Pubkey:</strong>
		<code class="rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 font-mono text-sm break-all"
			>{selectedUser.pubkey}</code
		>
	</p>
</div>
