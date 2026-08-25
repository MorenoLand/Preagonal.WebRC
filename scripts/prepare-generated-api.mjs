import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const generatedPath = fileURLToPath(new URL('../src/api/generated/gameServerClient.ts', import.meta.url));
const source = readFileSync(generatedPath, 'utf8').replace(/[ \t]+$/gm, '');
const newline = source.includes('\r\n') ? '\r\n' : '\n';
writeFileSync(generatedPath, source.startsWith('// @ts-nocheck') ? source : `// @ts-nocheck${newline}${source}`, 'utf8');
