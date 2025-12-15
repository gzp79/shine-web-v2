import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { type Plugin } from 'vitest/config';

let assetsBuildPromise: Promise<void> | null = null;

export function buildAssets(): Promise<void> {
    if (!assetsBuildPromise) {
        assetsBuildPromise = new Promise<void>((resolve, reject) => {
            console.log('Building assets...');
            const child = spawn('pnpm', ['run', 'convert:web:ui', '--out=../shine-web/static-generated/assets'], {
                cwd: '../shine-assets',
                stdio: 'inherit',
                shell: true
            });
            child.on('close', (code) => {
                if (code === 0) {
                    console.log('Assets built successfully');
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
                } else {
                    console.error(`Asset build failed with code ${code}`);
                    reject(new Error(`Asset build process exited with code ${code}`));
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

/// A convenience Vite plugin to build assets before serving or building the app.
export function vitePluginAssetConverter(mode: string): Plugin {
    return {
        name: 'vite-plugin-asset-converter',
        apply: (_usrConfig, env) => {
            if (env.mode !== 'development') {
                return false;
            }

            const isLocalAssets = ['local', 'mock'].includes(mode);
            return isLocalAssets;
        },
        async buildStart() {
            try {
                await buildAssets();
            } catch (error) {
                console.error('Asset build failed:', error);
                throw error;
            }
        }
    };
}
