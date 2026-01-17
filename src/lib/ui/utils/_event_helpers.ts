import { onMount } from 'svelte';

export function debugFocusElements() {
    onMount(() => {
        const focusIn = (e: Event) => console.log('focusin:', e.target);
        const focusOut = (e: Event) => console.log('focusout:', e.target);

        document.addEventListener('focusin', focusIn);
        document.addEventListener('focusout', focusOut);
        return () => {
            document.removeEventListener('focusin', focusIn);
            document.removeEventListener('focusout', focusOut);
        };
    });
}
