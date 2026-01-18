<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import { actionColorList, sizeList } from '@lib/ui/atoms';
    import Dropdown from '@lib/ui/atoms/icons/common/Dropdown.svelte';
    import { inputVariantList } from '@lib/ui/atoms/input';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';
    import InputGroup from '@lib/ui/atoms/input/InputGroup.svelte';

    const { Story } = defineMeta({
        component: InputGroup,
        title: 'Atoms/Inputs/InputGroup',
        args: {
            color: undefined,
            size: undefined,
            variant: 'filled'
        },
        argTypes: {
            color: {
                control: { type: 'select' },
                options: ['default', ...actionColorList],
                mapping: {
                    default: undefined
                }
            },
            size: {
                control: { type: 'select' },
                options: ['default', ...sizeList],
                mapping: {
                    default: undefined
                }
            },
            variant: {
                control: { type: 'select' },
                options: ['default', ...inputVariantList],
                mapping: {
                    default: undefined
                }
            }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<Story name="Some buttons">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button>Left</Button>
            <Button>Middle</Button>
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Combo button">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button wide>Selected</Button>
            <Button><Dropdown /></Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Input text">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button>Left</Button>
            <Input type="text" placeholder="Enter text" />
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Input text with invalid state">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <Button>Left</Button>
            <Input type="text" placeholder="Enter text" invalid />
            <Button>Right</Button>
        </InputGroup>
    {/snippet}
</Story>

<Story name="Nested InputGroup">
    {#snippet template(args)}
        {@const { children, ...otherArgs } = args}
        <InputGroup {...otherArgs}>
            <InputGroup color="secondary">
                <Button>?</Button>
            </InputGroup>
            <InputGroup size="xs" color="warning" variant="outline">
                <Button>Left</Button>
                <Button color="danger">Middle</Button>
                <Button>Right</Button>
            </InputGroup>
            <InputGroup>
                <Input type="text" placeholder="Enter text" invalid />
                <Button>Search</Button>
            </InputGroup>
        </InputGroup>
    {/snippet}
</Story>
