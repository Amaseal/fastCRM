<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { onMount } from 'svelte';

	let {
		value = $bindable(),
		min = 0,
		step = 1,
		class: className = ''
		// ...restProps
	} = $props();

	function increment() {
		value += step;
	}
	function decrement() {
		if (value > min) value -= step;
	}
</script>

<div class={cn('flex items-start gap-1', className)}>
	<button
		type="button"
		class="border-input flex h-9 w-9 items-center justify-center rounded-md border bg-transparent text-lg font-bold disabled:opacity-50"
		onclick={decrement}
		disabled={value <= min}
		aria-label="Decrement"
	>
		-
	</button>
	<input
		type="number"
		bind:value
		{min}
		{step}
		class="border-input bg-background selection:bg-primary dark:bg-input/30 selection:text-primary-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 w-16 rounded-md border px-2 py-1 text-center text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
		aria-label="Number input"
	/>
	<button
		type="button"
		class="border-input flex h-9 w-9 items-center justify-center rounded-md border bg-transparent text-lg font-bold disabled:opacity-50"
		onclick={increment}
		aria-label="Increment"
	>
		+
	</button>
</div>

<style>
	input[type='number']::-webkit-outer-spin-button,
	input[type='number']::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}
	input[type='number'] {
		appearance: textfield;
		-moz-appearance: textfield;
	}
</style>
