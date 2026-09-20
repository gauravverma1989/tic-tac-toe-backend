# Tic Tac Toe Online — Node.js Backend

## Requirements
- Node.js 20+
- MongoDB Atlas or MongoDB server

## Setup
1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI`, a strong `JWT_SECRET` (32+ characters), and `CORS_ORIGIN`.
3. Install dependencies: `npm install`
4. Start development server: `npm run dev`
5. Production start: `NODE_ENV=production npm start`

## Endpoints
- `GET /health`
- `POST /api/auth/register` — `{ username, email, password }`
- `POST /api/auth/login` — `{ email, password }`
- `GET /api/users/me` — Bearer token
- `GET /api/users/me/games` — Bearer token
- `GET /api/games/:id` — Bearer token

## Socket.IO
Connect with `{ auth: { token } }`.
Events:
- `find_game`
- `queue_joined`
- `game_started`
- `make_move` with `{ gameId, index }`
- `game_updated`
- `game_error`

## Production checklist
- Use TLS/reverse proxy and managed MongoDB with backups.
- Store secrets in a secret manager; never commit `.env`.
- Configure an exact allowlist for `CORS_ORIGIN`.
- Add Redis-backed Socket.IO adapter and distributed matchmaking for multiple instances.
- Add automated tests, observability, abuse controls, parental consent and child privacy compliance before public launch.
