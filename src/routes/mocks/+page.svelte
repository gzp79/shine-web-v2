<script lang="ts">
    import { onMount } from 'svelte';
    import { type MockSetting, MockSettingSchema, applyMock } from '@mocks/currentMocks';
    import { availableUserMocks } from '@mocks/data/user';
    import MessageContent from '@lib/ui/app/MessageContent.svelte';
    import Typography from '@lib/ui/atoms/Typography.svelte';
    import Button from '@lib/ui/atoms/input/Button.svelte';
    import Stack from '@lib/ui/atoms/layouts/Stack.svelte';
    import { async, parseResponse } from '@lib/utils';

    let selectedUser = $state('');
    let loading = $state(true);
    let message = $state('');

    const refreshState = (data: MockSetting) => {
        selectedUser = data.user;
    };

    const refreshMockSettings = async () => {
        try {
            loading = true;
            const response = await fetch('/api/mocks');
            if (response.ok) {
                const data = await parseResponse(MockSettingSchema, response);
                refreshState(data);
                message = '';
            } else {
                message = 'Failed to fetch mock options';
            }
            await async.delay(1000);
        } catch (err) {
            message = `Error refreshing options: ${err instanceof Error ? err.message : String(err)}`;
        } finally {
            loading = false;
        }
    };

    const patchMock = async (patch: Record<string, string>) => {
        loading = true;
        message = '';

        try {
            const response = await fetch('/api/mocks', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patch)
            });

            if (!response.ok) {
                throw new Error('Failed to update mock');
            }

            const data = await parseResponse(MockSettingSchema, response);
            applyMock(data);
            refreshState(data);
            message = `Mock updated successfully! Current mock: ${data.user}`;
        } catch (err) {
            message = `Error: ${err instanceof Error ? err.message : String(err)}`;
        } finally {
            loading = false;
        }
    };

    onMount(async () => {
        await refreshMockSettings();
    });
</script>

<MessageContent>
    <Stack>
        <Typography variant="h1">Mock Settings</Typography>

        <label for="user-mock">Select User Mock:</label>
        <select
            id="user-mock"
            bind:value={selectedUser}
            onchange={() => patchMock({ user: selectedUser })}
            disabled={loading}
        >
            {#each availableUserMocks as option (option)}
                <option value={option}>{option}</option>
            {/each}
        </select>

        <Button onclick={refreshMockSettings} disabled={loading}>Refresh</Button>

        {#if message}
            <div class="message">
                {message}
            </div>
        {/if}
    </Stack>
</MessageContent>
