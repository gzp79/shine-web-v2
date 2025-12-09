import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv.length < 3) {
    console.error('Error: Environment argument is required.');
    process.exit(1);
}

const environment = process.argv[2];
console.log(`Environment: ${environment}`);

const sourceConfigPath = path.resolve(__dirname, `../config.${environment}.ts`);
const configPath = path.resolve(__dirname, '..//src/generated/config.ts');
console.log(`  Using config ${sourceConfigPath} -> ${configPath}`);
fs.copyFileSync(sourceConfigPath, configPath);
