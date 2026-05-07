import test from 'node:test';
import assert from 'node:assert/strict';
import { confirmDangerous } from '../lib/confirm.js';

test('confirmDangerous allows --yes', async () => {
  assert.equal(await confirmDangerous('delete?', true), true);
});

test('confirmDangerous blocks non-interactive destructive operation without --yes', async () => {
  const oldIn = process.stdin.isTTY;
  const oldOut = process.stdout.isTTY;
  process.stdin.isTTY = false;
  process.stdout.isTTY = false;
  try {
    assert.equal(await confirmDangerous('delete?', false), false);
  } finally {
    process.stdin.isTTY = oldIn;
    process.stdout.isTTY = oldOut;
  }
});
