<script lang="ts">
	const { children, ...props } = $props<
		{
			class?: string;
			children?: () => unknown;
		} & svelteHTML.IntrinsicElements['button']
	>();
</script>

<button {...props} class={['cursor-pointer rounded', props.class]}>
	{@render children?.()}
</button>
