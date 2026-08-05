package com.lkvip.mobilecore.api

import com.lkvip.mobilecore.auth.LkvipTokenManager
import okhttp3.Interceptor
import okhttp3.Response

/**
 * LkvipAuthInterceptor — injects Bearer JWT into every outgoing request.
 *
 * Shared between mobile-native and mobile-native-enterprise.
 */
class LkvipAuthInterceptor(private val tokenManager: LkvipTokenManager) : Interceptor {

    override fun intercept(chain: Interceptor.Chain): Response {
        val token = tokenManager.getAccessToken()
        val request = if (token != null) {
            chain.request().newBuilder()
                .header("Authorization", "Bearer $token")
                .header("Content-Type", "application/json")
                .header("X-LKVIP-Client-Version", BuildConstants.CLIENT_VERSION)
                .build()
        } else {
            chain.request()
        }
        return chain.proceed(request)
    }
}
