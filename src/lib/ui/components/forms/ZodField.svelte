<script lang="ts" module>
    import type { z } from 'zod';
    import { getLocaleContext, localizeTr } from '@lib/i18n';
    import type { FieldProps } from '@lib/ui/atoms/input/Field.svelte';
    import Field from '@lib/ui/atoms/input/Field.svelte';
    import type { InputProps } from '@lib/ui/atoms/input/Input.svelte';
    import type { InputType } from '@lib/ui/atoms/input/Input.svelte';
    import Input from '@lib/ui/atoms/input/Input.svelte';

    export type ZodFieldProps<Schema extends z.ZodType> = Omit<FieldProps, 'status' | 'statusVariant' | 'children'> &
        Pick<InputProps, 'wide'> & {
            type?: InputType;
            rawInput?: string;
            schema: Schema;
            onValue?: (value: z.infer<Schema> | undefined) => void;
        };
</script>

<script lang="ts" generics="Schema extends z.ZodType">
    type ValueType = z.infer<Schema>;
    type Validation =
        | {
              success: true;
              error: undefined;
              value: ValueType;
          }
        | {
              success: false;
              error: string;
              value: undefined;
          };

    let {
        type = 'text',
        rawInput = $bindable(''),
        schema,
        onValue,
        wide,
        ...fieldProps
    }: ZodFieldProps<Schema> = $props();

    let locale = getLocaleContext();

    const validation: Validation = $derived.by(() => {
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
            const error = localizeTr(result.error.issues[0]?.message || 'Invalid input', locale.t);
            return {
                success: false,
                error,
                value: undefined
            };
        }
    });

    // Notify the parent of the validated value as a side effect, keeping the derivation above pure.
    $effect(() => {
        onValue?.(validation.value);
    });
</script>

<Field {...fieldProps} status={validation.error} statusVariant="error">
    <Input {wide} {type} bind:value={rawInput} invalid={!validation.success} />
</Field>
