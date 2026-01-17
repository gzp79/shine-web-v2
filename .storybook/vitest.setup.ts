import { setProjectAnnotations } from '@storybook/sveltekit';
import * as projectAnnotations from './preview';

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([projectAnnotations]);

if (typeof document !== 'undefined') {
    const createSBRootRoot = () => {
        let root = document.getElementById('storybook-root');
        if (!root) {
            root = document.createElement('div');
            root.id = 'storybook-root';
            root.style.position = 'fixed';
            root.style.pointerEvents = 'auto';
            document.body.appendChild(root);
        }
        return root;
    };

    // make sure in tests we have the storybook root element
    createSBRootRoot();
}
