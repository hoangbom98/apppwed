package com.lkvip.mobilecore.api

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

/**
 * LkvipCoreApiService — base REST endpoints dùng chung cho cả 2 native apps.
 *
 * Each app extends this with its own feature-specific service interface.
 * Usage:
 *   val service = LkvipApiClient.getInstance(ctx).create(LkvipCoreApiService::class.java)
 */
interface LkvipCoreApiService {

    // ── Auth ─────────────────────────────────────────────────────────────────

    @POST("auth/login")
    suspend fun login(@Body body: LoginRequest): AuthResponse

    @POST("auth/refresh")
    suspend fun refresh(@Body body: RefreshRequest): AuthResponse

    @POST("auth/logout")
    suspend fun logout()

    // ── Health ────────────────────────────────────────────────────────────────

    @GET("gateway/health")
    suspend fun health(): HealthResponse
}

// ── Data classes ──────────────────────────────────────────────────────────────

data class LoginRequest(
    val username: String,
    val password: String,
)

data class RefreshRequest(val refreshToken: String)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val role: String,
)

data class HealthResponse(
    val status: String,
    val uptime: Long? = null,
)
