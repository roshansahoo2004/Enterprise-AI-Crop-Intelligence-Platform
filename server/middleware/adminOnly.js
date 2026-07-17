const User = require('../models/User');

/**
 * Phase-4 Step-1: Admin-Only Middleware (Role-Based Access Control)
 *
 * Verifies that the authenticated user has role = "admin".
 * Must be used AFTER the auth middleware (which sets req.user from JWT).
 *
 * This middleware fetches the latest user document from MongoDB instead
 * of trusting the JWT payload alone, ensuring role changes take effect
 * immediately without requiring a new login.
 *
 * Responses:
 *  - 401 Unauthorized: No authenticated user or user not found in DB.
 *  - 403 Forbidden: User exists but does not have admin role.
 *
 * NOTE: To promote a user to admin, update their document directly in MongoDB:
 *   db.users.updateOne({ email: "admin@example.com" }, { $set: { role: "admin" } })
 *   Or use MongoDB Compass: find the user → edit → set role to "admin" → save.
 *   No automatic admin seeding is performed.
 */
const adminOnly = async (req, res, next) => {
  try {
    // ── Guard: auth middleware must have run first ──
    if (!req.user || !req.user.id) {
      console.log('[Admin Auth] Unauthorized request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // ── Fetch the latest user document from MongoDB ──
    // This ensures role changes (e.g. promotion/demotion) take effect
    // immediately, without requiring the user to re-login.
    const user = await User.findById(req.user.id);

    if (!user) {
      console.log('[Admin Auth] Unauthorized request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // ── Check admin role ──
    if (user.role !== 'admin') {
      console.log(`[Admin Auth] User ${req.user.id} attempted admin access`);
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    // ── Admin verified — proceed ──
    console.log('[Admin Auth] Admin verified');
    next();
  } catch (error) {
    console.error('[Admin Auth] Error verifying admin role:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error during authorization'
    });
  }
};

module.exports = adminOnly;
