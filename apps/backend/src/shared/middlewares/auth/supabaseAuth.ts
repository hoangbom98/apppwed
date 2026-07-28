import { Request, Response, NextFunction } from 'express';
import { supabase } from '../../services/supabaseClient';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticateSupabase = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = data.user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
};
