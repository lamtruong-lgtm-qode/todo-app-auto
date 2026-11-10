const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../src/server');

async function withServer(fn) {
  const server = createApp().listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://localhost:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

test('REST API CRUD flow', async () => {
  await withServer(async (base) => {
    let res = await fetch(`${base}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Write tests' }),
    });
    assert.strictEqual(res.status, 201);
    const todo = await res.json();

    res = await fetch(`${base}/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    });
    assert.strictEqual((await res.json()).completed, true);

    res = await fetch(`${base}/api/todos`);
    assert.strictEqual((await res.json()).length, 1);

    res = await fetch(`${base}/api/todos/${todo.id}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 204);

    res = await fetch(`${base}/api/todos/${todo.id}`);
    assert.strictEqual(res.status, 404);
  });
});

test('POST with empty title returns 400', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    assert.strictEqual(res.status, 400);
  });
});
