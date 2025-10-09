// src/cli-demo.ts
import { execSync } from 'node:child_process';
console.log('Rodando demo com examples/demo.acai ...');
execSync('pnpm lex examples/demo.acai', { stdio: 'inherit' });
console.log('\n-------------------------------\n');
execSync('pnpm parse examples/demo.acai', { stdio: 'inherit' });
