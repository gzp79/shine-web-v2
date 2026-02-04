<script lang="ts" module>
    import type { FieldProps } from '@lib/ui/atoms/input/Field.svelte';
    import type { InputProps } from '@lib/ui/atoms/input/Input.svelte';
    import type { InputType } from '@lib/ui/atoms/input/Input.svelte';

    export type ValidationResult<T> = { success: true; data: T } | { success: false; error: string };

    export type ZodFieldProps<T> = Omit<FieldProps, 'status' | 'statusVariant' | 'children'> & {
        type?: InputType;
        rawInput?: string;
        schema: z.ZodType<T>;
        onValue?: (value: T) => void;
        wide?: InputProps['wide'];
    };
</script>

<script lang="ts" generics="T">
    import type z from 'zod';
    import Field from '@lib/ui/atoms/input/Field.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';

    let { type = 'text', rawInput = $bindable(''), schema, onValue, wide, ...fieldProps }: ZodFieldProps<T> = $props();

    type Validation =
        | {
              success: true;
              error: undefined;
              value: T;
          }
        | {
              success: false;
              error: string;
              value: undefined;
          };

    const validation: Validation = $derived.by(() => {
        console.log('Validating input:', rawInput);
        // Call the validation function
        const result = schema.safeParse(
            // Attempt to coerce the raw input to the appropriate type
            type === 'number' ? Number(rawInput) : rawInput
        );

        if (result.success) {
            return {
                success: true,
                error: undefined,
                value: result.data
            };
        } else {
            const error = result.error.issues[0]?.message || 'Invalid input';
            return {
                success: false,
                error,
                value: undefined
            };
        }
    });

    $effect(() => {
        console.log('Validation result:', validation);
        if (validation.success && onValue) {
            onValue(validation.value);
        }
    });
</script>

<Field {...fieldProps} status={validation.error} statusVariant="error">
    <Input {wide} {type} bind:value={rawInput} invalid={!validation.success} />
</Field>
