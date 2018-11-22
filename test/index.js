import assert from 'assert';
import test from 'asia';
import scripts from '../src';

test('basic', () => {
  assert.strictEqual(typeof scripts, 'function');
});
