package com.lkvip.mobilecore.api

/**
 * Build-time constants injected by each app's build.gradle.kts.
 *
 * Each app MUST define these in its buildConfigField:
 *
 *   buildConfigField("String",  "API_BASE_URL",      "\"https://api.tc-gaming.live/api/\"")
 *   buildConfigField("boolean", "DEBUG",              "true")
 *   buildConfigField("String",  "CLIENT_VERSION",     "\"1.0.0\"")
 *
 * This object reads those values at runtime.
 */
object BuildConstants {
    /** Base URL of the LKVIP API. Overridden per build variant. */
    const val API_BASE_URL: String = "https://api.tc-gaming.live/api/"

    /** Whether this is a debug build (controls logging verbosity). */
    const val DEBUG: Boolean = false

    /** Client version header sent with every API request. */
    const val CLIENT_VERSION: String = "1.0.0"
}
