/**
 * Loads every story from the built Storybook and fails on console errors or empty output.
 *
 * `svelte-check` sees compile and type errors, and `build:storybook` catches anything that fails to
 * bundle, but neither can see a story that throws while rendering. This closes that gap.
 *
 * Runs against `storybook-static` rather than a dev server: the output is already bundled, so there
 * is no on-demand compilation and no HMR to race with, and the whole sweep takes a few seconds.
 */
import fs from 'node:fs';
import { type Server, createServer } from 'node:http';
import path from 'node:path';
import { type Page, chromium } from 'playwright';

const DIST = path.resolve(import.meta.dirname, '../storybook-static');
const PORT = Number(process.env.STORYBOOK_PORT ?? 6008);
const BASE = `http://localhost:${PORT}`;
const WORKERS = Number(process.env.STORYBOOK_SMOKE_WORKERS ?? 4);

/** Stories that deliberately provoke an error and log it; a clean run still reports them. */
const EXPECTED_CONSOLE_ERRORS: Record<string, RegExp> = {
    'account-username--error-fallback': /Failed to resolve public user info/
};

const CONTENT_TYPES: Record<string, string> = {
    '.css': 'text/css',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.map': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
};

type StoryIndex = { entries: Record<string, { type: string }> };

function serveDist(): Server {
    const server = createServer((request, response) => {
        const requested = new URL(request.url ?? '/', BASE).pathname;
        const file = path.join(DIST, requested === '/' ? 'index.html' : decodeURIComponent(requested));

        // Keep the server inside the build output even if something asks for a traversal path.
        if (!file.startsWith(DIST) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
            response.writeHead(404).end();
            return;
        }

        response.writeHead(200, { 'content-type': CONTENT_TYPES[path.extname(file)] ?? 'application/octet-stream' });
        fs.createReadStream(file).pipe(response);
    });

    server.listen(PORT);
    return server;
}

/**
 * Collects errors inside the page rather than via playwright's `console` event, which can arrive
 * after the next navigation has started and blame one story for the previous story's error.
 */
const COLLECT_ERRORS = () => {
    const bucket: string[] = [];
    (window as unknown as { __storyErrors: string[] }).__storyErrors = bucket;
    const original = console.error;
    console.error = (...args: unknown[]) => {
        bucket.push(args.map((a) => (a instanceof Error ? a.message : String(a))).join(' '));
        original(...args);
    };
    window.addEventListener('error', (event) => bucket.push(`uncaught: ${event.message}`));
    window.addEventListener('unhandledrejection', (event) =>
        bucket.push(`unhandled rejection: ${String(event.reason)}`)
    );
};

async function checkStory(page: Page, id: string): Promise<string[]> {
    const errors: string[] = [];

    try {
        await page.goto(`${BASE}/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'load', timeout: 30_000 });
        // The story mounts after the preview boots, so wait for content rather than a fixed delay.
        // Note the `undefined`: waitForFunction takes its options as the *third* argument.
        await page.waitForFunction(
            () => (document.getElementById('storybook-root')?.childElementCount ?? 0) > 0,
            undefined,
            { timeout: 30_000 }
        );
    } catch (err) {
        errors.push(`did not render: ${err instanceof Error ? err.message.split('\n')[0] : err}`);
    }

    const collected = await page
        .evaluate(() => (window as unknown as { __storyErrors?: string[] }).__storyErrors ?? [])
        .catch(() => []);
    const expected = EXPECTED_CONSOLE_ERRORS[id];
    errors.push(...collected.filter((text) => !expected?.test(text)));

    return errors;
}

async function smokeTest(ids: string[]): Promise<number> {
    console.log(`Checking ${ids.length} stories ...\n`);

    const browser = await chromium.launch();
    const queue = [...ids];
    let failed = 0;

    const workers = Array.from({ length: WORKERS }, async () => {
        const page = await browser.newPage();
        await page.addInitScript(COLLECT_ERRORS);
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

let server: Server | undefined;
try {
    if (!fs.existsSync(path.join(DIST, 'index.json'))) {
        throw new Error(`No build found in ${DIST} - run "pnpm run build:storybook" first.`);
    }

    server = serveDist();
    const index = JSON.parse(fs.readFileSync(path.join(DIST, 'index.json'), 'utf8')) as StoryIndex;
    const ids = Object.entries(index.entries)
        .filter(([, entry]) => entry.type === 'story')
        .map(([id]) => id);

    process.exitCode = (await smokeTest(ids)) > 0 ? 1 : 0;
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
} finally {
    server?.close();
}
