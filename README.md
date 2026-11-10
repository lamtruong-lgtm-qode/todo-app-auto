# Todo App

A simple todo app built with Node.js — no external dependencies.

## Requirements

- Node.js 18+

## Run

```bash
npm start
# open http://localhost:3000
```

## Test

```bash
npm test
```

## REST API

| Method | Path                          | Description              |
| ------ | ----------------------------- | ------------------------ |
| GET    | `/api/todos?filter=all\|active\|completed` | List todos |
| POST   | `/api/todos`                  | Create `{ "title": "..." }` |
| GET    | `/api/todos/:id`              | Get one todo             |
| PATCH  | `/api/todos/:id`              | Update `{ title?, completed? }` |
| DELETE | `/api/todos/:id`              | Delete one todo          |
| DELETE | `/api/todos`                  | Clear completed todos    |

Data is stored in memory and resets when the server restarts.

## Run in Fleet / Docker

The image is built from the `Dockerfile` at the repo root and runs as the non-root `node` user.

- **Port:** the server listens on `PORT` (default `3000`); the image exposes `3000`.
- **Data:** todos are kept in memory and reset whenever the container restarts.
- **Replicas:** use `replicas: 1`. The store is per-process, so additional replicas would each hold different data.
