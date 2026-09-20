import {
  Router
} from 'express';
import {
  auth
} from '../middleware/auth.js';
import {
  User
} from '../models/User.js';
import {
  Game
} from '../models/Game.js';
const router = Router();
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({
      error: 'User not found'
    });
    res.json({
      user
    });
  } catch (e) {
    next(e);
  }
});
router.get('/me/games', auth, async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const games = await Game.find({
      'players.user': req.user.sub
    }).sort({
      createdAt: -1
    }).limit(limit).populate('players.user', 'username');
    res.json({
      games
    });
  } catch (e) {
    next(e);
  }
});
export default router;