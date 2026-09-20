import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function auth(req,res,next){try{const token=req.headers.authorization?.startsWith('Bearer ')?req.headers.authorization.slice(7):null;if(!token)return res.status(401).json({error:'Authentication required'});req.user=jwt.verify(token,env.JWT_SECRET);next();}catch{return res.status(401).json({error:'Invalid or expired token'});}}
