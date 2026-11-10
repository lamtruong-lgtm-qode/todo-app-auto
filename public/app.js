const list = document.getElementById('todo-list');
const form = document.getElementById('new-todo-form');
const input = document.getElementById('new-todo');
const count = document.getElementById('count');
const clearBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filters button');

let currentFilter = 'all';

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  return res.json();
}

async function render() {
  const todos = await api(`/api/todos?filter=${currentFilter}`);
  const all = await api('/api/todos?filter=active');
  list.innerHTML = '';
  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = todo.completed ? 'completed' : '';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', async () => {
      await api(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: checkbox.checked }),
      });
      render();
    });

    const label = document.createElement('span');
    label.textContent = todo.title;

    const del = document.createElement('button');
    del.textContent = '×';
    del.className = 'delete';
    del.addEventListener('click', async () => {
      await api(`/api/todos/${todo.id}`, { method: 'DELETE' });
      render();
    });

    li.append(checkbox, label, del);
    list.appendChild(li);
  }
  count.textContent = `${all.length} item${all.length === 1 ? '' : 's'} left`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = input.value.trim();
  if (!title) return;
  await api('/api/todos', { method: 'POST', body: JSON.stringify({ title }) });
  input.value = '';
  render();
});

clearBtn.addEventListener('click', async () => {
  await api('/api/todos', { method: 'DELETE' });
  render();
});

filterButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

render();
