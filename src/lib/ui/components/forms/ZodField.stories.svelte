<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { z } from 'zod';
    import Stack from '@lib/ui/atoms//layouts/Stack.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import ZodField from '@lib/ui/components/forms/ZodField.svelte';

    const { Story } = defineMeta({
        title: 'Components/Forms/ZodField',
        component: ZodField,
        args: {
            disabled: false
        },
        argTypes: {
            disabled: {
                control: { type: 'boolean' }
            }
        }
    });

    const emailSchema = z.string().email({ message: 'Please enter a valid email address' });

    const ageSchema = z
        .number()
        .min(18, { message: 'You must be at least 18 years old' })
        .max(120, { message: 'Age must be less than or equal to 120' });
</script>

<script lang="ts">
    let rawInput = $state('');
    let validated = $state<string | number | undefined>(undefined);
</script>

{#snippet showValue()}
    <p class="mt-4 text-sm text-on-surface/70">
        Raw input: {rawInput || '(empty)'}<br />
        Validated value: {validated ?? '(invalid)'}
    </p>
{/snippet}

{#snippet setDefault(name: string, val: string)}
    <Button onclick={() => (rawInput = val)}>{name}</Button>
{/snippet}

<Story name="Email Validation">
    {#snippet template(args)}
        <Stack spacing={4}>
            <ZodField
                {...args}
                type="email"
                schema={emailSchema}
                bind:rawInput
                onValue={(val) => (validated = val)}
                label="Email Address"
                description="Enter a valid email address"
                required
            />
            {@render showValue()}
            {@render setDefault('Valid Email', 'foo@example.com')}
            {@render setDefault('Invalid Email', 'foo_example.com')}
        </Stack>
    {/snippet}
</Story>

<Story name="Age Validation">
    {#snippet template(args)}
        <Stack spacing={4}>
            <ZodField
                {...args}
                type="number"
                schema={ageSchema}
                bind:rawInput
                onValue={(val) => (validated = val)}
                label="Age"
                description="Enter a valid age between 18 and 120"
                required
            />
            {@render showValue()}
            {@render setDefault('Valid Age', '25')}
        </Stack>
    {/snippet}
</Story>
