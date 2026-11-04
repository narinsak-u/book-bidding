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

test('commit encrypts staged env files and rejects private keys and partial edits', () => {
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
  expect(run('git', 'add', '-f', '.env.keys').code).toBe(0);
  expect(run('bash', 'pre-commit').stderr).toContain('Refusing to commit dotenvx private keys');
});
