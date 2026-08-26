<script lang="ts">
    type MockItemProps = {
        name: string;
        isActive: boolean;
        hasParams: boolean;
        defaultValue: string;
        rawInput?: string;
        disabled?: boolean;
        onEnable: (name: string, params: unknown) => Promise<void>;
        onDisable: (name: string) => Promise<void>;
    };

    let {
        name,
        isActive,
        hasParams,
        defaultValue,
        rawInput = $bindable(''),
        disabled = false,
        onDisable,
        onEnable
    }: MockItemProps = $props();

    let isUpdating = $state(false);

    type Validation =
        { success: true; error: undefined; value: unknown } | { success: false; error: string; value: undefined };

    const validation: Validation = $derived.by(() => {
        if (!hasParams) return { success: true, error: undefined, value: undefined };
        if (!rawInput.trim()) return { success: false, error: 'JSON required', value: undefined };

        try {
            const parsed = JSON.parse(rawInput);
            return { success: true, error: undefined, value: parsed };
        } catch (error) {
            return { success: false, error: `Invalid JSON: ${(error as Error).message}`, value: undefined };
        }
    });
    let isDirty = $derived(rawInput !== defaultValue);

    const handleCheckboxChange = async (event: Event) => {
        const checked = (event.target as HTMLInputElement).checked;
        isUpdating = true;
        try {
            if (checked) {
                await onEnable(name, validation.value);
            } else {
                await onDisable(name);
            }
        } finally {
            isUpdating = false;
        }
    };

    const handleJsonBlur = async () => {
        if (!hasParams || !validation.success || !isActive) {
            return;
        }

        isUpdating = true;
        try {
            await onEnable(name, validation.value);
        } finally {
            isUpdating = false;
        }
    };
</script>

<div class="flex flex-row gap-2 p-2 rounded">
    <label class="flex items-center gap-2 cursor-pointer">
        <input
            type="checkbox"
            checked={isActive}
            disabled={disabled || isUpdating}
            onchange={handleCheckboxChange}
            class="w-4 h-4"
        />
        <span class="font-mono text-sm">{name}</span>
        <span class="text-on-danger" class:invisible={!isDirty}>*</span>
    </label>

    <textarea
        bind:value={rawInput}
        onblur={handleJsonBlur}
        disabled={disabled || isUpdating}
        class="font-mono text-xs p-2 rounded border bg-container text-on-container resize-none"
        class:border-on-danger={!validation.success}
        class:border-on-container={validation.success}
        class:invisible={!hasParams}
        rows="3"></textarea>
</div>
