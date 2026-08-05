package com.lkvip.mobilecore.api

import com.lkvip.mobilecore.auth.LkvipTokenManager
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route
import retrofit2.Retrofit
import retrofit2.http.Body
import retrofit2.http.POST
import okhttp3.OkHttpClient
import retrofit2.converter.gson.GsonConverterFactory

/**
 * LkvipAuthenticator — automatic JWT refresh on 401 Unauthorized.
 *
 * Shared between mobile-native and mobile-native-enterprise.
 * When the server returns 401, this authenticator:
 *   1. Calls POST /auth/refresh with the stored refresh token
 *   2. Saves the new access token via LkvipTokenManager
 *   3. Retries the original request with the new token
 *   4. If refresh fails, clears tokens (forces re-login)
 */
class LkvipAuthenticator(
    private val tokenManager: LkvipTokenManager,
    private val baseUrl: String,
) : Authenticator {

    private interface RefreshApi {
        @POST("auth/refresh")
        suspend fun refresh(@Body body: Map<String, String>): RefreshResponse
    }

    private data class RefreshResponse(
        val accessToken: String,
        val refreshToken: String,
    )

    override fun authenticate(route: Route?, response: Response): Request? {
        // Prevent infinite retry loops
        if (responseCount(response) >= 2) {
            tokenManager.clearTokens()
            return null
        }

        val refreshToken = tokenManager.getRefreshToken() ?: run {
            tokenManager.clearTokens()
            return null
        }

        return try {
            // Synchronous refresh call (Authenticator runs on OkHttp I/O thread)
            val refreshRetrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(OkHttpClient.Builder().build())
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            val refreshApi = refreshRetrofit.create(RefreshApi::class.java)

            val newTokens = kotlinx.coroutines.runBlocking {
                refreshApi.refresh(mapOf("refreshToken" to refreshToken))
            }

            tokenManager.saveTokens(newTokens.accessToken, newTokens.refreshToken)

            response.request.newBuilder()
                .header("Authorization", "Bearer ${newTokens.accessToken}")
                .build()
        } catch (e: Exception) {
            tokenManager.clearTokens()
            null
        }
    }

    private fun responseCount(response: Response): Int {
        var r: Response? = response
        var count = 0
        while (r != null) { count++; r = r.priorResponse }
        return count
    }
}
