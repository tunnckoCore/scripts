import test from 'asia';
import scripts from '../src';

test('todo', async (t) => {
  t.ok(typeof scripts === 'function');
});
