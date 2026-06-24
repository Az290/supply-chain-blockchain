package com.example.supplychainapp.data

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val prefs: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "secure_token_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    companion object {
        private const val KEY_ACCESS_TOKEN = "access_token"
        private const val KEY_REFRESH_TOKEN = "refresh_token"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_USER_NAME = "user_name"
        private const val KEY_USER_ROLE = "user_role"
        private const val KEY_USER_ORG = "user_org"
        private const val KEY_REQUIRE_PASSWORD_CHANGE = "require_password_change"
    }

    // Token
    var accessToken: String?
        get() = prefs.getString(KEY_ACCESS_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_ACCESS_TOKEN, value).apply()

    var refreshToken: String?
        get() = prefs.getString(KEY_REFRESH_TOKEN, null)
        set(value) = prefs.edit().putString(KEY_REFRESH_TOKEN, value).apply()

    // User info
    var userId: String?
        get() = prefs.getString(KEY_USER_ID, null)
        set(value) = prefs.edit().putString(KEY_USER_ID, value).apply()

    var userName: String?
        get() = prefs.getString(KEY_USER_NAME, null)
        set(value) = prefs.edit().putString(KEY_USER_NAME, value).apply()

    var userRole: String?
        get() = prefs.getString(KEY_USER_ROLE, null)
        set(value) = prefs.edit().putString(KEY_USER_ROLE, value).apply()

    var userOrg: String?
        get() = prefs.getString(KEY_USER_ORG, null)
        set(value) = prefs.edit().putString(KEY_USER_ORG, value).apply()

    var requirePasswordChange: Boolean
        get() = prefs.getBoolean(KEY_REQUIRE_PASSWORD_CHANGE, false)
        set(value) = prefs.edit().putBoolean(KEY_REQUIRE_PASSWORD_CHANGE, value).apply()

    fun saveTokens(access: String, refresh: String) {
        accessToken = access
        refreshToken = refresh
    }

    fun saveUser(id: String, name: String, role: String, org: String, mustChangePassword: Boolean = false) {
        userId = id
        userName = name
        userRole = role
        userOrg = org
        requirePasswordChange = mustChangePassword
    }

    fun isLoggedIn(): Boolean {
        return accessToken != null && userId != null
    }

    fun getAuthHeader(): String {
        return "Bearer ${accessToken ?: ""}"
    }

    fun clearAll() {
        prefs.edit().clear().apply()
    }
}