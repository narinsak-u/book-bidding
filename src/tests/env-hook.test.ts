import { afterAll, expect, test } from 'vitest';
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('../../', import.meta.url).pathname;
const repo = mkdtempSync('/tmp/book-bidding-env-hook-');
afterAll(() => rmSync(repo, { recursive: true, force: true }));

function run(...cmd: string[]) {
  const result = spawnSync(cmd[0], cmd.slice(1), {
    cwd: repo,
    env: { ...process.env, PATH: `${root}/node_modules/.bin:${process.env.PATH}` },
  });
  return { code: result.status, stderr: result.stderr?.toString() ?? '', stdout: result.stdout?.toString() ?? '' };
}

test('commit encrypts supported staged env files and rejects private keys and partial edits', () => {
  copyFileSync(join(root, '.husky/pre-commit'), join(repo, 'pre-commit'));
  symlinkSync(join(root, 'node_modules'), join(repo, 'node_modules'), 'dir');
  expect(run('git', 'init', '-q').code).toBe(0);
  writeFileSync(join(repo, '.env.development'), 'VALUE=env-hook-test\n');
  expect(run('bunx', 'dotenvx', 'encrypt', '-f', '.env.development').code).toBe(0);
  expect(run('git', 'add', '.env.development').code).toBe(0);
  expect(run('bash', 'pre-commit').code).toBe(0);
  const staged = run('git', 'show', ':.env.development').stdout;
  expect(staged).toContain('encrypted:');
  expect(staged).not.toContain('env-hook-test');

  writeFileSync(join(repo, '.env.development'), `${readFileSync(join(repo, '.env.development'), 'utf8')}OTHER=unstaged\n`);
  expect(run('bash', 'pre-commit').stderr).toContain('partially staged');
  writeFileSync(join(repo, '.env.development'), staged);
  writeFileSync(join(repo, '.env.test-production'), 'VALUE=test-production-hook-test\n');
  expect(run('bunx', 'dotenvx', 'encrypt', '-f', '.env.test-production', '-fk', '.env.test-production.keys').code).toBe(0);
  expect(run('git', 'add', '.env.test-production').code).toBe(0);
  const testProductionHook = run('bash', 'pre-commit');
  expect(testProductionHook.code, testProductionHook.stderr).toBe(0);
  const stagedTestProduction = run('git', 'show', ':.env.test-production').stdout;
  expect(stagedTestProduction).toContain('encrypted:');
  expect(stagedTestProduction).not.toContain('test-production-hook-test');
  writeFileSync(join(repo, '.env.production'), 'VALUE=production-hook-test\n');
  expect(run('bunx', 'dotenvx', 'encrypt', '-f', '.env.production').code).toBe(0);
  expect(run('git', 'add', '.env.production').code).toBe(0);
  expect(run('bash', 'pre-commit').code).toBe(0);
  const stagedProduction = run('git', 'show', ':.env.production').stdout;
  expect(stagedProduction).toContain('encrypted:');
  expect(stagedProduction).not.toContain('production-hook-test');

  expect(run('git', 'add', '-f', '.env.keys').code).toBe(0);
  expect(run('bash', 'pre-commit').stderr).toContain('Refusing to commit dotenvx private keys');
  expect(run('git', 'add', '-f', '.env.test-production.keys').code).toBe(0);
  expect(run('bash', 'pre-commit').stderr).toContain('Refusing to commit dotenvx private keys');

}, 15_000);
