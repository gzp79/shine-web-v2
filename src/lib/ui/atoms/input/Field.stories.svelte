<script module lang="ts">
    import { defineMeta } from '@storybook/addon-svelte-csf';
    import { expect } from 'storybook/test';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';
    import InputGroup from '@lib/ui/atoms/input/InputGroup.svelte';
    import Box from '@lib/ui/atoms/layouts/Box.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import Field, { type FieldProps } from './Field.svelte';

    const { Story } = defineMeta({
        component: Field,
        title: 'Atoms/Inputs/Field',
        args: {
            disabled: false
        },
        argTypes: {
            disabled: {
                control: { type: 'boolean' }
            }
        },
        play: async ({ canvasElement }) => {
            expect(canvasElement).toBeDefined();
        }
    });
</script>

<script lang="ts">
    let email = $state('');
    let emailError = $state('');

    const validateEmail = () => {
        if (!email) {
            emailError = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            emailError = 'Please enter a valid email address';
        } else {
            emailError = '';
        }
    };
</script>

<Story name="Default">
    {#snippet template(args)}
        <Field
            {...args}
            label="Username"
            description="This is your public display name. It can be your real name or a pseudonym."
        >
            <Input id="username-field" placeholder="Enter your username" />
        </Field>
    {/snippet}
</Story>

<Story name="Minimal">
    {#snippet template(args)}
        <Field {...args}>
            <Input id="username-field" placeholder="Enter your username" />
        </Field>
    {/snippet}
</Story>

<Story name="Disabled Field">
    {#snippet template(args)}
        <Stack spacing={6}>
            <Field {...args} disabled={false} label="Enabled" description="This setting can be changed at this time.">
                <Input id="enabled-field" value="This field is enabled" />
            </Field>
            <Field {...args} disabled label="Disabled" description="This setting cannot be changed at this time.">
                <Input id="disabled-field" value="This field is disabled" />
            </Field>
        </Stack>
    {/snippet}
</Story>

<Story name="Different Sizes">
    {#snippet template(args)}
        <Stack spacing={6}>
            <Field {...args} label="Extra Small" description="This is an extra small input field.">
                <Input size="xs" placeholder="Extra small input" />
            </Field>

            <Field {...args} label="Small" description="This is a small input field.">
                <Input size="sm" placeholder="Small input" />
            </Field>

            <Field {...args} label="Medium (Default)" description="This is a medium input field.">
                <Input id="md-input" size="md" placeholder="Medium input" />
            </Field>

            <Field {...args} label="Large" description="This is a large input field.">
                <Input id="lg-input" size="lg" placeholder="Large input" />
            </Field>
        </Stack>
    {/snippet}
</Story>

<Story name="Status Variants">
    {#snippet template(args)}
        <Stack spacing={6}>
            <Field
                {...args}
                label="Error Status"
                status="This field contains an error that must be fixed"
                statusVariant="error"
            >
                <Input placeholder="Enter value" invalid />
            </Field>

            <Field
                {...args}
                label="Warning Status"
                status="This value may cause issues but is technically valid"
                statusVariant="warning"
            >
                <Input placeholder="Enter value" />
            </Field>

            <Field
                {...args}
                label="Info Status"
                status="This is an additional information for this field"
                statusVariant="info"
            >
                <Input placeholder="Enter value" />
            </Field>

            <Field
                {...args}
                label="Success Status"
                status="This value has been validated successfully"
                statusVariant="success"
            >
                <Input placeholder="Enter value" />
            </Field>
        </Stack>
    {/snippet}
</Story>

<Story name="Color Precedence">
    {#snippet template(args)}
        <Stack spacing={6}>
            <!-- Scenario 1: Field provides color, Input inherits -->
            <Field {...args} color="info" label="Scenario 1: Field color → Input inherits">
                <Input placeholder="Gets 'info' from Field" />
            </Field>

            <!-- Scenario 2: Field provides color, InputGroup inherits, Inputs inherit from group -->
            <Field {...args} color="success" label="Scenario 2: Field color → InputGroup inherits → Inputs inherit">
                <InputGroup>
                    <Input placeholder="Gets 'success' from Field via InputGroup" />
                    <Button>Submit</Button>
                </InputGroup>
            </Field>

            <!-- Scenario 3: Field provides color, InputGroup overrides, Inputs get group color -->
            <Field {...args} color="warning" label="Scenario 3: Field color, InputGroup overrides to 'danger'">
                <InputGroup color="danger">
                    <Input placeholder="Gets 'danger' from InputGroup (overrides Field)" />
                    <Button>Submit</Button>
                </InputGroup>
            </Field>

            <!-- Scenario 4: Field provides color, InputGroup inherits, one Input overrides -->
            <Field {...args} color="info" label="Scenario 4: Field color, one Input overrides to 'secondary'">
                <InputGroup>
                    <Input placeholder="Gets 'info' from Field" />
                    <Input color="secondary" placeholder="Explicit 'secondary' wins" />
                </InputGroup>
            </Field>

            <!-- Scenario 5: All explicit - Input color wins -->
            <Field {...args} color="warning" label="Scenario 5: All explicit - Input color wins">
                <InputGroup color="danger">
                    <Input color="success" placeholder="Explicit 'success' color wins" />
                    <Button color="info">Different</Button>
                </InputGroup>
            </Field>

            <!-- Scenario 6: No Field color, defaults apply -->
            <Field {...args} label="Scenario 6: No Field color - defaults to 'primary'">
                <InputGroup>
                    <Input placeholder="Gets default 'primary'" />
                    <Button>Submit</Button>
                </InputGroup>
            </Field>
        </Stack>
    {/snippet}
</Story>

<Story name="Full Customization with Snippets">
    {#snippet template(args)}
        <Field {...args} required>
            {#snippet label(props)}
                <label {...props}>
                    <span class="inline-flex items-center gap-2">
                        API Key
                        <span class="px-2 py-0.5 text-xs rounded bg-info/20 text-on-info">Beta</span>
                    </span>
                </label>
            {/snippet}
            {#snippet description(props)}
                <p {...props}>
                    Your API key starts with <code class="px-1 py-0.5 rounded bg-surface/50 text-sm">sk_</code>
                    and should be kept secret.
                </p>
            {/snippet}
            {#snippet status(props)}
                <p {...props}>
                    <span class="block">Password must be at least 8 characters long</span>
                    <span class="block">Password must contain at least one uppercase letter</span>
                    <span class="block">Password must contain at least one number</span>
                </p>
            {/snippet}
            <Input type="password" placeholder="sk_..." />
        </Field>
    {/snippet}
</Story>

{#snippet fieldSample(args: FieldProps)}
    <Field
        {...args}
        label="Username"
        description="This is your public display name. It can be your real name or a pseudonym."
    >
        <Input placeholder="Enter your username" />
    </Field>
{/snippet}

<Story name="In Box">
    {#snippet template(args)}
        <Box border color="warning">
            {@render fieldSample(args)}
            <Box border>
                {@render fieldSample(args)}
                <Box border>
                    {@render fieldSample(args)}
                    <Box border>
                        {@render fieldSample(args)}
                        <Box border color="danger">
                            {@render fieldSample(args)}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    {/snippet}
</Story>

<Story name="Form Example">
    {#snippet template(args)}
        <form
            onsubmit={(e) => {
                e.preventDefault();
                validateEmail();
                if (!emailError) {
                    alert('Form submitted!');
                }
            }}
        >
            <Stack spacing={6}>
                <Field
                    {...args}
                    label="Email"
                    description="Enter your email address to continue."
                    status={emailError}
                    required
                >
                    <Input
                        id="email-form"
                        type="email"
                        bind:value={email}
                        placeholder="you@example.com"
                        required
                        invalid={!!emailError}
                        onblur={validateEmail}
                    />
                </Field>

                <Field {...args} label="Password" description="Must be at least 8 characters long." required>
                    <Input type="password" placeholder="Enter your password" required />
                </Field>

                <Field {...args} label="Display name">
                    <Input wide type="text" placeholder="Enter your display name" required />
                </Field>

                <Button type="submit" wide>Register</Button>
            </Stack>
        </form>
    {/snippet}
</Story>
