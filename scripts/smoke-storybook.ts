/**
 * Loads every story in a browser and fails on console errors or empty output.
 *
 * `svelte-check` and `eslint` cannot see a story that throws while rendering, and Storybook has no
 * test runner configured here, so this is the only guard against a story breaking unnoticed. Boots
 * its own dev server, walks `index.json`, and tears the server down again.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { type Page, chromium } from 'playwright';

const PORT = Number(process.env.STORYBOOK_PORT ?? 6007);
const BASE = `http://localhost:${PORT}`;
const STARTUP_TIMEOUT_MS = 240_000;
const WORKERS = Number(process.env.STORYBOOK_SMOKE_WORKERS ?? 4);

/** Stories that deliberately provoke an error and log it; a clean run still reports them. */
const EXPECTED_CONSOLE_ERRORS: Record<string, RegExp> = {
    'account-username--error-fallback': /Failed to resolve public user info/
};

type StoryIndex = { entries: Record<string, { type: string }> };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchIndex(): Promise<StoryIndex | undefined> {
    try {
        const response = await fetch(`${BASE}/index.json`);
        if (!response.ok) return undefined;
        return (await response.json()) as StoryIndex;
    } catch {
        return undefined;
    }
}

async function startStorybook(): Promise<{ child: ChildProcess; index: StoryIndex }> {
    console.log(`Starting Storybook on :${PORT} ...`);
    const child = spawn('pnpm', ['exec', 'storybook', 'dev', '-p', String(PORT), '--ci', '--quiet'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
    });

    let output = '';
    child.stdout?.on('data', (chunk) => (output += chunk));
    child.stderr?.on('data', (chunk) => (output += chunk));

    const deadline = Date.now() + STARTUP_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) {
            console.error(output);
            throw new Error(`Storybook exited early with code ${child.exitCode}`);
        }
        const index = await fetchIndex();
        if (index) return { child, index };
        await wait(2000);
    }

    console.error(output);
    throw new Error(`Storybook did not become ready within ${STARTUP_TIMEOUT_MS / 1000}s`);
}

async function checkStory(page: Page, id: string): Promise<string[]> {
    const errors: string[] = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (message) => {
        if (message.type() !== 'error') return;
        const text = message.text();
        // Storybook's own manager assets are not part of what we are testing.
        if (text.includes('favicon')) return;
        if (EXPECTED_CONSOLE_ERRORS[id]?.test(text)) return;
        errors.push(text);
    });
    page.on('pageerror', (error) => errors.push(`uncaught: ${error.message}`));

    try {
        await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, {
            waitUntil: 'load',
            timeout: 60_000
        });
        // The story mounts after the preview boots, so wait for content rather than a fixed delay.
        await page.waitForFunction(() => (document.getElementById('storybook-root')?.childElementCount ?? 0) > 0, {
            timeout: 30_000
        });
    } catch (err) {
        errors.push(`did not render: ${err instanceof Error ? err.message : err}`);
    }

    return errors;
}

async function smokeTest(index: StoryIndex): Promise<number> {
    const ids = Object.entries(index.entries)
        .filter(([, entry]) => entry.type === 'story')
        .map(([id]) => id);
    console.log(`Checking ${ids.length} stories ...\n`);

    const browser = await chromium.launch();
    const queue = [...ids];
    let failed = 0;

    // Dev-mode Storybook compiles each story on demand, which dominates the runtime - a handful of
    // pages in parallel keeps the whole sweep to a couple of minutes.
    const workers = Array.from({ length: WORKERS }, async () => {
        const page = await browser.newPage();
        for (let id = queue.shift(); id !== undefined; id = queue.shift()) {
            const errors = await checkStory(page, id);
            if (errors.length > 0) {
                failed++;
                console.log(`FAIL ${id}`);
                for (const error of errors) console.log(`       ${error.split('\n')[0].slice(0, 200)}`);
            }
        }
        await page.close();
    });
    await Promise.all(workers);

    await browser.close();
    console.log(`\n${ids.length} stories checked, ${failed} failing`);
    return failed;
}

let storybook: ChildProcess | undefined;
try {
    const started = await startStorybook();
    storybook = started.child;
    const failed = await smokeTest(started.index);
    process.exitCode = failed > 0 ? 1 : 0;
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
} finally {
    storybook?.kill();
}
