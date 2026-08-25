import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const generatedPath = fileURLToPath(new URL('../src/api/generated/gameServerClient.ts', import.meta.url));
const source = readFileSync(generatedPath, 'utf8').replace(/[ \t]+$/gm, '');
const pathAwareSource = source.replaceAll('url_ = url_.replace("{path}", encodeURIComponent("" + path));', 'url_ = url_.replace("{path}", encodeFilePath(path));');
const preparedSource = pathAwareSource.includes('function encodeFilePath') ? pathAwareSource : pathAwareSource.replace('export class GameServerClient', 'function encodeFilePath(path) { return path.split("/").map(encodeURIComponent).join("/"); }\n\nexport class GameServerClient');
const newline = source.includes('\r\n') ? '\r\n' : '\n';
writeFileSync(generatedPath, preparedSource.startsWith('// @ts-nocheck') ? preparedSource : `// @ts-nocheck${newline}${preparedSource}`, 'utf8');
