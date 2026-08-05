package com.lkvip.mobilecore.data

import android.content.Context
import android.content.SharedPreferences

/**
 * LkvipUserPreferences — shared DataStore/SharedPreferences wrapper.
 *
 * Stores user UI settings (dark mode, display name, locale) across both apps.
 */
class LkvipUserPreferences private constructor(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("lkvip_user_prefs", Context.MODE_PRIVATE)

    var isDarkMode: Boolean
        get() = prefs.getBoolean(KEY_DARK_MODE, true)
        set(v) = prefs.edit().putBoolean(KEY_DARK_MODE, v).apply()

    var displayName: String
        get() = prefs.getString(KEY_DISPLAY_NAME, "") ?: ""
        set(v) = prefs.edit().putString(KEY_DISPLAY_NAME, v).apply()

    var locale: String
        get() = prefs.getString(KEY_LOCALE, "vi") ?: "vi"
        set(v) = prefs.edit().putString(KEY_LOCALE, v).apply()

    fun clear() = prefs.edit().clear().apply()

    companion object {
        private const val KEY_DARK_MODE    = "dark_mode"
        private const val KEY_DISPLAY_NAME = "display_name"
        private const val KEY_LOCALE       = "locale"

        @Volatile private var instance: LkvipUserPreferences? = null

        fun getInstance(context: Context): LkvipUserPreferences =
            instance ?: synchronized(this) {
                instance ?: LkvipUserPreferences(context.applicationContext).also { instance = it }
            }
    }
}
