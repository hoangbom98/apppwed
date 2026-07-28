import express, { Router, Request, Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  registerGoogleStrategy,
  registerFacebookStrategy,
  defaultGoogleFindOrCreate,
  defaultFacebookFindOrCreate,
} = require('../../services/auth/socialAuthService');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const authenticate = require('../middlewares/auth/auth');

/**
 * Social OAuth routes — Google & Facebook.
 *
 * Mount under /api/:project/auth in each module's route index:
 *   app.use('/api/hub/auth',  require('./src/shared/routes/auth/social.routes').makeRouter('hub'));
 *   app.use('/api/game/auth', require('./src/shared/routes/auth/social.routes').makeRouter('game'));
 *
 * Or mount the shared router under /api/auth for a project-agnostic flow:
 *   app.use('/api/auth', require('./src/shared/routes/auth/social.routes').makeRouter('hub'));
 *
 * Required env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
 *   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL
 *   OAUTH_REDIRECT_URL  (frontend landing page after OAuth)
 */

/**
 * Build and return an OAuth router for the given project.
 *
 * @param {string} project  e.g. 'hub', 'game', 'dating'
 * @param {object} [opts]
 * @param {Function} [opts.googleFindOrCreate]   Custom findOrCreate for Google
 * @param {Function} [opts.facebookFindOrCreate] Custom findOrCreate for Facebook
 */
function makeRouter(
  project: string,
  opts: {
    googleFindOrCreate?:   (prisma: unknown, profile: unknown, project: string) => Promise<unknown>;
    facebookFindOrCreate?: (prisma: unknown, profile: unknown, project: string) => Promise<unknown>;
  } = {},
): Router {
  const router: Router = express.Router();

  // Register strategies (idempotent — passport deduplicates by name)
  registerGoogleStrategy(
    project,
    opts.googleFindOrCreate   || defaultGoogleFindOrCreate,
  );
  registerFacebookStrategy(
    project,
    opts.facebookFindOrCreate || defaultFacebookFindOrCreate,
  );

  // ── Google OAuth ────────────────────────────────────────────────────────────
  // GET /google          — redirect to Google consent screen
  // GET /google/callback — Google redirects back here with code
  router.get('/google',          googleAuth(project));
  router.get('/google/callback', googleCallback(project));

  // ── Facebook OAuth ──────────────────────────────────────────────────────────
  // GET /facebook          — redirect to Facebook consent screen
  // GET /facebook/callback — Facebook redirects back here with code
  router.get('/facebook',          facebookAuth(project));
  router.get('/facebook/callback', facebookCallback(project));

  // ── GET /oauth/me — return current user from token (cookie or Bearer) ───────
  router.get('/oauth/me', authenticate, (req: Request, res: Response) => {
    res.json({ success: true, data: (req as Request & { user?: unknown }).user });
  });

  return router;
}

export { makeRouter };
module.exports = { makeRouter };
