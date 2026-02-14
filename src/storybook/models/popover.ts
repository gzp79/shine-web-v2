import { expect, within } from 'storybook/test';

export function withinPopover() {
    const portal = document.body.querySelector('#popover') as HTMLElement;
    expect(portal).not.toBeNull();
    return within(portal);
}
