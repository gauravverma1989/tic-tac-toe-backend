import http from 'node:http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import mongoose from 'mongoose';
import {
  Server
} from 'socket.io';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import {
  env
} from './config/env.js';
import {
  logger
} from './config/logger.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import gameRoutes from './routes/games.js';
import {
  User
} from './models/User.js';
import {
  Game
} from './models/Game.js';
import {
  winner
} from './utils/game.js';
const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(s => s.trim()),
  credentials: false
}));
app.use(express.json({
  limit: '10kb'
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false
}));
app.get('/health', (_req, res) => res.json({
  ok: true,
  service: 'tic-tac-toe-api'
}));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);
app.use((err, _req, res, _next) => {
  logger.error({
    err
  }, 'request error');
  res.status(err.status || 500).json({
    error: env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: env.CORS_ORIGIN.split(',').map(s => s.trim())
  },
  connectionStateRecovery: {}
});
const queue = [];
const sockets = new Map();

function publicGame(g) {
  return {
    id: g._id.toString(),
    board: g.board,
    turn: g.turn,
    status: g.status,
    players: g.players.map(p => ({
      userId: p.user.toString(),
      symbol: p.symbol
    }))
  };
}
async function finish(g, result) {
  g.status = result === 'draw' ? 'draw' : 'won';
  if (result !== 'draw') {
    const p = g.players.find(x => x.symbol === result);
    g.winner = p?.user || null;
  }
  g.finishedAt = new Date();
  await g.save();
  for (const p of g.players) {
    const won = result !== 'draw' && p.symbol === result;
    const lost = result !== 'draw' && !won;
    await User.updateOne({
      _id: p.user
    }, {
      $inc: {
        'stats.played': 1,
        'stats.wins': won ? 1 : 0,
        'stats.losses': lost ? 1 : 0,
        'stats.draws': result === 'draw' ? 1 : 0
      }
    });
  }
}
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    socket.user = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});
io.on('connection', socket => {
  sockets.set(socket.user.sub, socket.id);
  socket.on('find_game', async () => {
    if (queue.some(x => x.userId === socket.user.sub)) return;
    const other = queue.shift();
    if (!other) {
      queue.push({
        userId: socket.user.sub,
        socketId: socket.id
      });
      socket.emit('queue_joined');
      return;
    }
    const game = await Game.create({
      players: [{
        user: other.userId,
        symbol: 'X'
      }, {
        user: socket.user.sub,
        symbol: 'O'
      }],
      status: 'active'
    });
    const room = game._id.toString();
    socket.join(room);
    io.sockets.sockets.get(other.socketId)?.join(room);
    io.to(room).emit('game_started', {
      game: publicGame(game)
    });
  });
  socket.on('make_move', async ({
    gameId,
    index
  } = {}) => {
    try {
      if (!Number.isInteger(index) || index < 0 || index > 8) return socket.emit('game_error', 'Invalid move');
      const g = await Game.findById(gameId);
      if (!g || !g.players.some(p => p.user.toString() === socket.user.sub) || g.status !== 'active') return socket.emit('game_error', 'Game unavailable');
      const player = g.players.find(p => p.user.toString() === socket.user.sub);
      if (player.symbol !== g.turn || g.board[index]) return socket.emit('game_error', 'Not a valid turn');
      g.board[index] = player.symbol;
      const result = winner(g.board);
      if (result || g.board.every(Boolean)) await finish(g, result || 'draw');
      else g.turn = g.turn === 'X' ? 'O' : 'X';
      g.lastMoveAt = new Date();
      await g.save();
      io.to(g._id.toString()).emit('game_updated', {
        game: publicGame(g),
        result: result || (g.board.every(Boolean) ? 'draw' : null)
      });
    } catch (e) {
      logger.error({
        err: e
      }, 'move error');
      socket.emit('game_error', 'Unable to process move');
    }
  });
  socket.on('disconnect', () => {
    for (let i = queue.length - 1; i >= 0; i--)
      if (queue[i].userId === socket.user.sub) queue.splice(i, 1);
    sockets.delete(socket.user.sub);
  });
});
await mongoose.connect(env.MONGO_URI);

httpServer.listen(env.PORT || 10000, '0.0.0.0', () => logger.info({
  port: env.PORT || 10000
}, 'API listening'));
process.on('SIGTERM', async () => {
  await mongoose.disconnect();
  httpServer.close(() => process.exit(0));
});