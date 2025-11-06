<script lang="ts">
	let {
		isPublishing = false,
		onclick = () => {},
		disabled = false
	}: {
		isPublishing?: boolean;
		onclick?: () => void;
		disabled?: boolean;
	} = $props();

	let buttonText = $derived.by(() => {
		if (isPublishing) return 'Publishing...';
		return 'Publish Spot';
	});

	let buttonClass = $derived.by(() => {
		let baseClass = 'px-4 py-2 text-sm font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

		if (disabled || isPublishing) {
			return `${baseClass} bg-gray-400 text-white cursor-not-allowed`;
		}

		return `${baseClass} bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700`;
	});
</script>

<button
	class={buttonClass}
	{disabled}
	onclick={onclick}
>
	{#if isPublishing}
		<span class="inline-flex items-center gap-2">
			<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
					fill="none"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
			{buttonText}
		</span>
	{:else}
		{buttonText}
	{/if}
</button>