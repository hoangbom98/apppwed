// @ts-nocheck
'use strict';
/**
 * Social OAuth Service — Google & Facebook login via Passport.js.
 *
 * Mỗi strategy:
 *   1. Tìm user theo socialId (googleId / facebookId) trong project DB.
 *   2. Nếu chưa có, tạo user mới (upsert theo email nếu có).
 *   3. Trả về { user, tokens } — tokens được sign với project claim đúng.
 *
 * Env vars cần thiết:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   GOOGLE_CALLBACK_URL  (default: /api/auth/google/callback)
 *   FACEBOOK_APP_ID, FACEBOOK_APP_SECRET
 *   FACEBOOK_CALLBACK_URL (default: /api/auth/facebook/callback)
 *   OAUTH_REDIRECT_URL    (frontend URL để redirect sau login thành công)
 *
 * Usage (trong route file):
 *   const { googleAuth, googleCallback, facebookAuth, facebookCallback }
 *     = require('./socialAuthService');
 *   router.get('/google',          googleAuth('hub'));
 *   router.get('/google/callback', googleCallback('hub'));
 *   router.get('/facebook',          facebookAuth('hub'));
 *   router.get('/facebook/callback', facebookCallback('hub'));
 */

const passport    = require('passport');
const logger      = require('../core/logger');
const authService = require('../auth/authService');

// Lazy-load passport strategies to avoid crash when packages not installed
let GoogleStrategy   = null;
let FacebookStrategy = null;

try {
  GoogleStrategy   = require('passport-google-oauth2').Strategy;
} catch {
  logger.warn('[OAuth] passport-google-oauth2 not installed — Google login disabled');
}

try {
  FacebookStrategy = require('passport-facebook').Strategy;
} catch {
  logger.warn('[OAuth] passport-facebook not installed — Facebook login disabled');
}

// ── Strategy registration ─────────────────────────────────────────────────────

/**
 * Register Passport Google strategy for a specific project.
 * Called once per project that enables Google login.
 *
 * @param {string} project  e.g. 'hub', 'game', 'trade'
 * @param {Function} findOrCreate  async (prisma, profile, project) => user
 */
function registerGoogleStrategy(project, findOrCreate) {
  if (!GoogleStrategy) return;

  const clientID     = process.env.GOOGLE_CLIENT_ID     || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const callbackURL  = process.env.GOOGLE_CALLBACK_URL  || `/api/auth/google/callback`;

  if (!clientID || !clientSecret) {
    logger.warn(`[OAuth:Google] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — skipping ${project}`);
    return;
  }

  passport.use(
    `google-${project}`,
    new GoogleStrategy(
      { clientID, clientSecret, callbackURL, passReqToCallback: true },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const user   = await findOrCreate(req.prisma, profile, project);
          const tokens = authService.generateTokens({
            id:      user.id,
            email:   user.email || null,
            role:    user.role  || 'user',
            project,
          });
          return done(null, { user, tokens, project });
        } catch (err) {
          logger.error(`[OAuth:Google:${project}] Strategy error: ${err.message}`);
          return done(err, null);
        }
      },
    ),
  );
}

/**
 * Register Passport Facebook strategy for a specific project.
 *
 * @param {string} project  e.g. 'hub', 'dating'
 * @param {Function} findOrCreate  async (prisma, profile, project) => user
 */
function registerFacebookStrategy(project, findOrCreate) {
  if (!FacebookStrategy) return;

  const clientID     = process.env.FACEBOOK_APP_ID      || '';
  const clientSecret = process.env.FACEBOOK_APP_SECRET  || '';
  const callbackURL  = process.env.FACEBOOK_CALLBACK_URL || `/api/auth/facebook/callback`;

  if (!clientID || !clientSecret) {
    logger.warn(`[OAuth:Facebook] FACEBOOK_APP_ID / FACEBOOK_APP_SECRET not set — skipping ${project}`);
    return;
  }

  passport.use(
    `facebook-${project}`,
    new FacebookStrategy(
      {
        clientID, clientSecret, callbackURL,
        profileFields: ['id', 'name', 'displayName', 'photos', 'email'],
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const user   = await findOrCreate(req.prisma, profile, project);
          const tokens = authService.generateTokens({
            id:      user.id,
            email:   user.email || null,
            role:    user.role  || 'user',
            project,
          });
          return done(null, { user, tokens, project });
        } catch (err) {
          logger.error(`[OAuth:Facebook:${project}] Strategy error: ${err.message}`);
          return done(err, null);
        }
      },
    ),
  );
}

// ── Route handler factories ────────────────────────────────────────────────────

/**
 * Returns an Express handler that initiates Google OAuth flow.
 * @param {string} project
 */
function googleAuth(project) {
  return passport.authenticate(`google-${project}`, {
    scope: ['profile', 'email'],
    session: false,
  });
}

/**
 * Returns an Express handler for Google OAuth callback.
 * On success: sets auth cookies and redirects to OAUTH_REDIRECT_URL.
 * On failure: redirects to OAUTH_REDIRECT_URL?error=oauth_failed.
 *
 * @param {string} project
 */
function googleCallback(project) {
  return (req, res, next) => {
    passport.authenticate(
      `google-${project}`,
      { session: false, failureRedirect: `${process.env.OAUTH_REDIRECT_URL || '/'}?error=oauth_failed` },
      (err, result) => {
        if (err || !result) {
          logger.warn(`[OAuth:Google:${project}] Callback error: ${err?.message}`);
          return res.redirect(`${process.env.OAUTH_REDIRECT_URL || '/'}?error=oauth_failed`);
        }
        _sendOAuthResponse(res, result);
      },
    )(req, res, next);
  };
}

/**
 * Returns an Express handler that initiates Facebook OAuth flow.
 * @param {string} project
 */
function facebookAuth(project) {
  return passport.authenticate(`facebook-${project}`, {
    scope: ['email'],
    session: false,
  });
}

/**
 * Returns an Express handler for Facebook OAuth callback.
 * @param {string} project
 */
function facebookCallback(project) {
  return (req, res, next) => {
    passport.authenticate(
      `facebook-${project}`,
      { session: false, failureRedirect: `${process.env.OAUTH_REDIRECT_URL || '/'}?error=oauth_failed` },
      (err, result) => {
        if (err || !result) {
          logger.warn(`[OAuth:Facebook:${project}] Callback error: ${err?.message}`);
          return res.redirect(`${process.env.OAUTH_REDIRECT_URL || '/'}?error=oauth_failed`);
        }
        _sendOAuthResponse(res, result);
      },
    )(req, res, next);
  };
}

// ── Internal helpers ───────────────────────────────────────────────────────────

/**
 * Set auth cookies and redirect to frontend.
 * Cookies match the names read by auth middleware (access_token, refresh_token).
 */
function _sendOAuthResponse(res, { tokens, project }) {
  const isProduction = process.env.NODE_ENV === 'production';
  const sameSite     = isProduction ? 'none' : 'lax';
  const cookieOpts   = { httpOnly: true, secure: isProduction, sameSite };

  res.cookie('access_token',  tokens.access_token,  { ...cookieOpts, maxAge: 7  * 24 * 60 * 60 * 1000 });
  res.cookie('refresh_token', tokens.refresh_token, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' });

  const redirectUrl = process.env.OAUTH_REDIRECT_URL || '/';
  res.redirect(`${redirectUrl}?project=${project}&oauth=success`);
}

// ── Default findOrCreate (Prisma — user table must have googleId / facebookId) ─

/**
 * Default findOrCreate for Google — works with any Prisma client that has a
 * `user` model with `googleId`, `email`, `displayName`, `avatar` fields.
 *
 * Pass a custom findOrCreate when the schema differs.
 */
async function defaultGoogleFindOrCreate(prisma, profile, _project) {
  let user = await prisma.user.findFirst({ where: { googleId: profile.id } });

  if (!user && profile.email) {
    user = await prisma.user.findFirst({ where: { email: profile.email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { googleId: profile.id },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        googleId:    profile.id,
        email:       profile.email    || null,
        displayName: profile.displayName || null,
        avatar:      profile.picture  || null,
        role:        'user',
        status:      'active',
      },
    });
  }

  return user;
}

/**
 * Default findOrCreate for Facebook.
 */
async function defaultFacebookFindOrCreate(prisma, profile, _project) {
  let user = await prisma.user.findFirst({ where: { facebookId: profile.id } });

  const email = profile.emails?.[0]?.value || null;

  if (!user && email) {
    user = await prisma.user.findFirst({ where: { email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { facebookId: profile.id },
      });
    }
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        facebookId:  profile.id,
        email:       email || null,
        displayName: profile.displayName || null,
        avatar:      profile.photos?.[0]?.value || null,
        role:        'user',
        status:      'active',
      },
    });
  }

  return user;
}

module.exports = {
  registerGoogleStrategy,
  registerFacebookStrategy,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  defaultGoogleFindOrCreate,
  defaultFacebookFindOrCreate,
};
