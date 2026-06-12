<script module lang="ts">
    import { DropdownItem } from '@lib/ui/atoms/dropdown-menu';
</script>

<script lang="ts">
    let isFullscreen = $state(!!document.fullscreenElement);

    $effect(() => {
        const onFullscreenChange = () => {
            isFullscreen = !!document.fullscreenElement;
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    });

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {
                isFullscreen = false;
            });
        } else {
            document.exitFullscreen?.()?.catch(() => {
                isFullscreen = !!document.fullscreenElement;
            });
        }
    }
</script>

<DropdownItem onclick={() => toggleFullscreen()}>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</DropdownItem>
