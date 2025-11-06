<script lang="ts">
	import Button from './Button.svelte';

	const {
		onconfirm,
		oncancel,
		open = $bindable(),
		title,
		children,
		...props
	} = $props<{
		open: boolean;
		title?: string;
		onconfirm?: () => void;
		oncancel?: () => void;
		children: () => unknown;
	}>();

	function handleConfirm() {
		onconfirm();
	}

	function handleCancel() {
		oncancel();
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			handleCancel();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-1000 flex items-center justify-center bg-black/40 backdrop-blur-sm dark:bg-black/70"
		onclick={handleBackdropClick}
		role="dialog"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
				handleCancel();
			}
		}}
		aria-modal="true"
	>
		<div
			class="flex max-w-[90vw] min-w-[320px] flex-col overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900"
		>
			{#if title}
				<div class="p-4">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
				</div>
			{/if}
			<div class="p-4 text-gray-900 dark:text-gray-100">
				{@render children()}
			</div>
			{#if oncancel || onconfirm}
				<div class="flex justify-end gap-2 border-gray-200 p-4 dark:border-gray-700">
					{#if oncancel}
						<Button
							type="button"
							class="bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
							onclick={handleCancel}
						>
							Cancel
						</Button>
					{/if}
					{#if onconfirm}
						<Button
							type="button"
							class="bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
							onclick={handleConfirm}
						>
							Confirm
						</Button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}
