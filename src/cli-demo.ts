// src/cli-demo.ts
import { execSync } from 'node:child_process';
console.log('Rodando demo com examples/demo.ellipsis ...');
execSync('pnpm lex examples/demo.ellipsis', { stdio: 'inherit' });
console.log('\n-------------------------------\n');
execSync('pnpm parse examples/demo.ellipsis', { stdio: 'inherit' });
