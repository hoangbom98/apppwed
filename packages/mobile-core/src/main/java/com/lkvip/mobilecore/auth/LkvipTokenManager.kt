package com.lkvip.mobilecore.auth

import android.content.Context
import android.content.SharedPreferences

/**
 * LkvipTokenManager — centralized JWT token storage for all LKVIP Android apps.
 *
 * Used by both `mobile-native` (staff) and `mobile-native-enterprise` (C-level).
 * Backed by SharedPreferences; swap to EncryptedSharedPreferences for release builds.
 *
 * Usage:
 *   val tm = LkvipTokenManager.getInstance(context)
 *   tm.saveTokens(access, refresh, "admin")
 *   val token = tm.getAccessToken()
 */
class LkvipTokenManager private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("lkvip_auth_tokens", Context.MODE_PRIVATE)

    // ── Public API ────────────────────────────────────────────────────────────

    fun getAccessToken(): String? = prefs.getString(KEY_ACCESS, null)

    fun getRefreshToken(): String? = prefs.getString(KEY_REFRESH, null)

    fun getUserRole(): String = prefs.getString(KEY_ROLE, "user") ?: "user"

    fun saveTokens(accessToken: String, refreshToken: String, role: String = "user") {
        prefs.edit()
            .putString(KEY_ACCESS, accessToken)
            .putString(KEY_REFRESH, refreshToken)
            .putString(KEY_ROLE, role)
            .apply()
    }

    fun clearTokens() = prefs.edit().clear().apply()

    fun isLoggedIn(): Boolean = getAccessToken() != null

    // ── Singleton ─────────────────────────────────────────────────────────────

    companion object {
        private const val KEY_ACCESS  = "jwt_access_token"
        private const val KEY_REFRESH = "jwt_refresh_token"
        private const val KEY_ROLE    = "user_role"

        @Volatile private var instance: LkvipTokenManager? = null

        fun getInstance(context: Context): LkvipTokenManager =
            instance ?: synchronized(this) {
                instance ?: LkvipTokenManager(context.applicationContext).also { instance = it }
            }
    }
}
