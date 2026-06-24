package com.example.supplychainapp.di

import android.content.Context
import androidx.room.Room
import com.example.supplychainapp.data.TokenManager
import com.example.supplychainapp.data.api.*
import com.example.supplychainapp.data.local.AppDatabase
import com.example.supplychainapp.data.local.ProductDao
import com.example.supplychainapp.data.repository.SupplyChainRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideTokenManager(@ApplicationContext context: Context): TokenManager {
        return TokenManager(context)
    }

    @Provides
    @Singleton
    fun provideAuthInterceptor(tokenManager: TokenManager): AuthInterceptor {
        return AuthInterceptor(tokenManager)
    }

    @Provides
    @Singleton
    fun provideAuthAuthenticator(tokenManager: TokenManager): AuthAuthenticator {
        return AuthAuthenticator(tokenManager)
    }

    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        authAuthenticator: AuthAuthenticator
    ): OkHttpClient {
        return RetrofitClient.createOkHttpClient(authInterceptor, authAuthenticator)
    }

    @Provides
    @Singleton
    fun provideApiService(okHttpClient: OkHttpClient): ApiService {
        return RetrofitClient.createApiService(okHttpClient)
    }

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "supplychain_db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    @Singleton
    fun provideProductDao(database: AppDatabase): ProductDao {
        return database.productDao()
    }

    @Provides
    @Singleton
    fun provideRepository(
        apiService: ApiService,
        tokenManager: TokenManager,
        productDao: ProductDao
    ): SupplyChainRepository {
        return SupplyChainRepository(apiService, tokenManager, productDao)
    }
}