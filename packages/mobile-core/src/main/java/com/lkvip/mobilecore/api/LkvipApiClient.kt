package com.lkvip.mobilecore.api

import android.content.Context
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import com.lkvip.mobilecore.auth.LkvipTokenManager
import java.util.concurrent.TimeUnit

/**
 * LkvipApiClient — centralized Retrofit + OkHttp client factory.
 *
 * Shared by mobile-native (staff operations) and mobile-native-enterprise (C-level).
 *
 * Features:
 *   - JWT Bearer token injection via LkvipAuthInterceptor
 *   - Automatic token refresh on 401 via LkvipAuthenticator
 *   - 15 s connect / 20 s read/write timeouts
 *   - BODY-level logging in DEBUG builds
 *   - Singleton per baseUrl
 *
 * Usage:
 *   val client = LkvipApiClient.getInstance(context, baseUrl)
 *   val service = client.create(MyApiService::class.java)
 */
class LkvipApiClient private constructor(
    context: Context,
    val baseUrl: String,
) {
    val tokenManager: LkvipTokenManager = LkvipTokenManager.getInstance(context)

    private val okHttpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(15, TimeUnit.SECONDS)
        .readTimeout(20, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .addInterceptor(LkvipAuthInterceptor(tokenManager))
        .addInterceptor(
            HttpLoggingInterceptor().apply {
                level = if (BuildConstants.DEBUG)
                    HttpLoggingInterceptor.Level.BODY
                else
                    HttpLoggingInterceptor.Level.NONE
            }
        )
        .authenticator(LkvipAuthenticator(tokenManager, baseUrl))
        .build()

    val retrofit: Retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    /** Create any Retrofit service interface backed by this client. */
    fun <T> create(service: Class<T>): T = retrofit.create(service)

    companion object {
        @Volatile private var instances: MutableMap<String, LkvipApiClient> = mutableMapOf()

        fun getInstance(context: Context, baseUrl: String = BuildConstants.API_BASE_URL): LkvipApiClient =
            instances[baseUrl] ?: synchronized(this) {
                instances[baseUrl] ?: LkvipApiClient(context.applicationContext, baseUrl)
                    .also { instances[baseUrl] = it }
            }
    }
}
