<script module lang="ts">
    import { browser } from '$app/environment';
    import { onMount } from 'svelte';
    import type { Action } from 'svelte/action';
    import type { RenderParameters, WidgetId } from 'turnstile-types';
    import { logAPI } from '@lib/loggers';
    import type { Theme } from '@lib/theme/_theme.svelte';
    import { afterBFCacheRestore } from '@lib/utils';

    export interface TurnstileProps {
        /**
         * Represents a rendered Turnstile widget.  Used to identify a specific widget when calling
         * Turnstile methods.
         */
        widgetId?: WidgetId;

        /**
         * Every widget has a sitekey. This sitekey is associated with the corresponding
         * widget configuration and is created upon the widget creation.
         */
        siteKey: RenderParameters['sitekey'];

        /**
         * Controls when the widget is visible:
         * - `"always"` - The widget is visible at all times.
         * - `"execute"` - The widget is visible only after the challenge begins.
         * - `"interaction-only"` - The widget is visible only when an interaction is required.
         *
         * If a widget is visible, its appearance can be controlled via the `appearance` parameter.
         * @see
         * [appearance-modes](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#appearance-modes)
         */
        appearance?: RenderParameters['appearance'];

        /**
         * Language to display, either `"auto"` or an ISO 639-1 two-letter language code.
         * @see [language support FAQ](https://developers.cloudflare.com/turnstile/frequently-asked-questions/#what-languages-does-turnstile-support)
         */
        language?: RenderParameters['language'];

        /**
         * The widget theme. Can be `"light"`, `"dark"`, or `"system"`.
         */
        theme?: Theme;

        /**
         * The widget size. Can be 'normal' or 'compact'.
         * @default "normal"
         */
        size?: RenderParameters['size'];

        /**
         * Execution controls when to obtain the token of the widget and can be on `"render"` (default) or on `"execute"`.
         * @default "render"
         * @see [Execution modes](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/#execution-modes)
         */
        execution?: RenderParameters['execution'];

        /**
         * A customer value that can be used to differentiate widgets under the same
         * sitekey in analytics and which is returned upon validation. This can only
         * contain up to 32 alphanumeric characters including `_` and `-`.
         */
        action?: RenderParameters['action'];

        /**
         * A customer payload that can be used to attach customer data to the challenge
         * throughout its issuance and which is returned upon validation. This can only
         * contain up to 255 alphanumeric characters including `_` and `-`.
         */
        cData?: RenderParameters['cData'];

        /**
         * Time between retry attempts in milliseconds. Value must be between `0` and `900000`
         * (15 minutes). Only applies when `retry` is set to `auto`.
         * @default 8000
         */
        retryInterval?: RenderParameters['retry-interval'];

        /**
         * Automatically retry upon failure to obtain a token or never retry.
         * @default "auto"
         */
        retry?: RenderParameters['retry'];

        /**
         * Controls the behavior when the token of a Turnstile widget has expired.
         * Can be 'auto', 'manual', or 'never'.
         * @default "auto"
         */
        refreshExpired?: RenderParameters['refresh-expired'];

        /**
         * Controls if an input element with the response token is created.
         * @default true
         */
        responseField?: RenderParameters['response-field'];

        /**
         * Name of the input element.
         * @default "cf-turnstile-response"
         */
        responseFieldName?: RenderParameters['response-field-name'];

        /**
         * The tabindex of Turnstile's iframe for accessibility purposes.
         * @default 0
         */
        tabIndex?: number;

        /**
         * Classes to apply to the wrapper div around turnstile.
         * This won't work with Svelte scoped styles.
         */
        class?: string;

        /**
         * The captcha token as a bindable value
         */
        token?: string;

        /**
         * Callback function invoked upon successful challenge completion.
         * @param { token: string } - The token passed upon successful challenge.
         */
        callback?: (token: string) => void;

        /**
         * Callback invoked when there is an error (e.g., network error, challenge failed).
         * @see [Client-side errors](https://developers.cloudflare.com/turnstile/reference/client-side-errors)
         * @param { code: string } - The error code passed upon an error.
         */
        error?: (code: string) => void;

        /**
         * Callback invoked when the token expires and does not reset the widget.
         */
        expired?: () => void;

        /**
         * Callback invoked when the challenge expires.
         */
        timeout?: () => void;

        /**
         * Callback invoked before the challenge enters interactive mode.
         */
        beforeInteractive?: () => void;

        /**
         * Callback invoked when the challenge has left interactive mode.
         */
        afterInteractive?: () => void;

        /**
         * Callback invoked when a given client/browser is not supported.
         */
        unsupported?: () => void;
    }
</script>

<script lang="ts">
    let {
        widgetId = $bindable(),
        siteKey,
        appearance = 'always',
        language = 'auto',
        execution = 'render',
        retryInterval = 8000,
        retry = 'auto',
        refreshExpired = 'auto',
        theme = 'system',
        size = 'normal',
        responseFieldName,
        responseField,
        action,
        cData,
        tabIndex = 0,
        class: className,
        token = $bindable(),
        callback,
        error,
        expired,
        timeout,
        beforeInteractive,
        afterInteractive,
        unsupported
    }: TurnstileProps = $props();

    let loaded = $state(browser && 'turnstile' in window);
    let mounted = $state(false);

    const themeMap: Record<Theme, RenderParameters['theme']> = {
        light: 'light',
        dark: 'dark',
        system: 'auto'
    };

    /**
     * Resets the widget and generates a new token.
     */
    export const reset = (): void => {
        token = '';
        if (widgetId) {
            window?.turnstile?.reset(widgetId);
        }
    };

    const turnstileSettings = $derived({
        sitekey: siteKey,
        callback: (t: string) => {
            token = t;
            callback?.(t);
        },
        'error-callback': (code: string) => {
            logAPI.error('Turnstile, captcha error: ', code);
            token = '';
            error?.(code);
        },
        'timeout-callback': () => {
            logAPI.info('Turnstile, captcha timeout');
            token = '';
            timeout?.();
        },
        'expired-callback': () => {
            logAPI.info('Turnstile, captcha expired');
            token = '';
            expired?.();
        },
        'before-interactive-callback': () => {
            beforeInteractive?.();
        },
        'after-interactive-callback': () => {
            afterInteractive?.();
        },
        'unsupported-callback': () => unsupported?.(),
        'response-field-name': responseFieldName ?? 'cf-turnstile-response',
        'response-field': responseField ?? true,
        'refresh-expired': refreshExpired,
        'retry-interval': retryInterval,
        tabindex: tabIndex,
        appearance,
        execution,
        language,
        action,
        retry,
        theme: themeMap[theme] ?? 'auto',
        cData,
        size
    });

    const turnstileAction: Action = (node) => {
        token = '';
        const id = window.turnstile.render(node, turnstileSettings);
        widgetId = id;
        return {
            destroy: () => {
                window.turnstile.remove(id);
            }
        };
    };

    onMount(() => {
        mounted = true;

        if (!loaded) {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.addEventListener('load', () => (loaded = true), {
                once: true
            });
            document.head.appendChild(script);
        }

        return () => {
            mounted = false;
        };
    });

    afterBFCacheRestore(() => reset());
</script>

{#if loaded && mounted}
    {#key turnstileSettings}
        <div use:turnstileAction class={className}></div>
    {/key}
{/if}
