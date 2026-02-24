<script module lang="ts">
    import { DropdownItem } from '@lib/ui/atoms/dropdown-menu';
</script>

<script lang="ts">
    //todo: add listeners and update state according in a reactive way.
    let isFullscreen = $state(!!document.fullscreenElement);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            isFullscreen = true;
        } else {
            document.exitFullscreen?.();
            isFullscreen = false;
        }
    }
</script>

<DropdownItem onclick={() => toggleFullscreen()}>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</DropdownItem>
