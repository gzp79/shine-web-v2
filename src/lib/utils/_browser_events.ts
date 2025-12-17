import { onMount } from 'svelte';

export function afterPageShow(callback: () => void) {
    onMount(() => {
        window.addEventListener('pageshow', callback);

        return () => {
            window.removeEventListener('pageshow', callback);
        };
    });
}

export function afterBFCacheRestore(callback: () => void) {
    onMount(() => {
        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                callback();
            }
        };

        window.addEventListener('pageshow', onPageShow);

        return () => {
            window.removeEventListener('pageshow', onPageShow);
        };
    });
}

export function onTabVisible(callback: (visible: boolean) => void) {
    onMount(() => {
        const onVisibilityChange = () => {
            callback(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    });
}
