package com.example.supplychainapp.data.api

import com.example.supplychainapp.data.TokenManager
import com.example.supplychainapp.data.model.RefreshRequest
import com.example.supplychainapp.data.model.RefreshResponse
import com.google.gson.Gson
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthAuthenticator @Inject constructor(
    private val tokenManager: TokenManager
) : Authenticator {

    override fun authenticate(route: Route?, response: Response): Request? {
        // Neu da thu refresh roi ma van 401 thi tra ve null (logout)
        if (response.request.header("X-Retry") != null) {
            tokenManager.clearAll()
            return null
        }

        val refreshToken = tokenManager.refreshToken ?: run {
            tokenManager.clearAll()
            return null
        }

        // Goi API refresh token dong bo
        val refreshResult = refreshTokenSync(refreshToken)

        return if (refreshResult != null && refreshResult.success && refreshResult.data != null) {
            // Luu token moi
            tokenManager.saveTokens(
                refreshResult.data.accessToken,
                refreshResult.data.refreshToken
            )

            // Goi lai request cu voi token moi
            response.request.newBuilder()
                .header("Authorization", "Bearer ${refreshResult.data.accessToken}")
                .header("X-Retry", "true")
                .build()
        } else {
            tokenManager.clearAll()
            null
        }
    }

    private fun refreshTokenSync(refreshToken: String): RefreshResponse? {
        return try {
            val client = OkHttpClient()
            val gson = Gson()

            val body = gson.toJson(RefreshRequest(refreshToken))
                .toRequestBody("application/json".toMediaType())

            val request = Request.Builder()
                .url("${RetrofitClient.BASE_URL}api/auth/refresh")
                .post(body)
                .build()

            val response = client.newCall(request).execute()
            val responseBody = response.body?.string()

            if (response.isSuccessful && responseBody != null) {
                gson.fromJson(responseBody, RefreshResponse::class.java)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }
}