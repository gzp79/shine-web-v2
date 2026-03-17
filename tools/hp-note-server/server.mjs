import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const skillPath = join(__dirname, '..', '..', '.claude', 'skills', 'hp-note', 'SKILL.md');
const skillContent = readFileSync(skillPath, 'utf-8');

const PORT = 3033;

function callClaude(text) {
    return new Promise((resolve, reject) => {
        const prompt = `${skillContent}\n\nTranslate the following:\n${text}`;
        const child = spawn('claude', ['-p'], { timeout: 60000 });

        let stdout = '';
        let stderr = '';
        child.stdout.on('data', (d) => (stdout += d));
        child.stderr.on('data', (d) => (stderr += d));
        child.on('close', (code) => {
            if (code !== 0) reject(new Error(stderr || `claude exited with code ${code}`));
            else resolve(stdout.trim());
        });
        child.on('error', (err) => reject(err));

        child.stdin.write(prompt);
        child.stdin.end();
    });
}

const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/hp-note') {
        let body = '';
        for await (const chunk of req) body += chunk;

        try {
            const { text } = JSON.parse(body);
            if (!text) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Missing "text" field' }));
                return;
            }
            const result = await callClaude(text);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ result }));
        } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
        }
        return;
    }

    res.writeHead(404);
    res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`HP-Note server running on http://localhost:${PORT}`);
    console.log('POST /hp-note with { "text": "your comment" }');
});
