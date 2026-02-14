import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

let assetsBuildPromise: Promise<void> | null = null;

export function buildAssets(): Promise<void> {
    if (!assetsBuildPromise) {
        assetsBuildPromise = new Promise<void>((resolve, reject) => {
            console.log('Building assets...');
            // Get output directory from vite config or use default
            const outDir = path.join(process.cwd(), 'static-generated/assets');
            const child = spawn('pnpm', ['run', 'convert:web:ui', `--out=${outDir}`], {
                cwd: '../shine-assets',
                stdio: 'inherit',
                shell: true
            });

            child.on('exit', (code, signal) => {
                if (code === 0) {
                    console.log('Assets built successfully');
                    try {
                        fs.mkdirSync('static-generated/assets', { recursive: true });
                        fs.writeFileSync(
                            'static-generated/assets/latest.json',
                            JSON.stringify(
                                {
                                    version: 'custom'
                                },
                                null,
                                2
                            )
                        );
                        resolve();
                    } catch (error) {
                        console.error('Failed to write assets metadata:', error);
                        reject(error);
                    }
                } else {
                    const errorMsg = signal
                        ? `Asset build process killed with signal ${signal}`
                        : `Asset build process exited with code ${code}`;
                    console.error(errorMsg);
                    reject(new Error(errorMsg));
                }
            });

            child.on('error', (error) => {
                console.error('Failed to start asset build process:', error);
                reject(error);
            });
        });
    }
    return assetsBuildPromise;
}
