package com.example.supplychainapp.data.api

import com.example.supplychainapp.data.model.*
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    // ==================== AUTH ====================

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/refresh")
    suspend fun refreshToken(@Body request: RefreshRequest): Response<RefreshResponse>

    @POST("api/auth/logout")
    suspend fun logout(@Header("Authorization") token: String): Response<SimpleResponse>

    @GET("api/auth/me")
    suspend fun getMe(@Header("Authorization") token: String): Response<LoginResponse>

    // ==================== FORGOT PASSWORD ====================

    @POST("api/auth/forgot-password")
    suspend fun forgotPassword(@Body request: ForgotPasswordRequest): Response<SimpleResponse>

    @POST("api/auth/reset-password")
    suspend fun resetPassword(@Body request: ResetPasswordRequest): Response<SimpleResponse>

    @POST("api/auth/change-password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<SimpleResponse>


    // ==================== PRODUCTS ====================

    @POST("api/products/init")
    suspend fun initLedger(): Response<SimpleResponse>

    @GET("api/products")
    suspend fun getProducts(@Header("Authorization") token: String): Response<ProductListResponse>

    @GET("api/products/{id}")
    suspend fun getProduct(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<ProductResponse>

    @POST("api/products")
    suspend fun createProduct(
        @Header("Authorization") token: String,
        @Body request: CreateProductRequest
    ): Response<SimpleResponse>

    // Tao san pham voi hinh anh (Multipart)
    @Multipart
    @POST("api/products")
    suspend fun createProductWithImage(
        @Header("Authorization") token: String,
        @Part("id") id: RequestBody,
        @Part("name") name: RequestBody,
        @Part("productType") productType: RequestBody,
        @Part("origin") origin: RequestBody,
        @Part("batchNumber") batchNumber: RequestBody,
        @Part("quantity") quantity: RequestBody,
        @Part("unit") unit: RequestBody,
        @Part("price") price: RequestBody,
        @Part("description") description: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<SimpleResponse>

    @Multipart
    @PUT("api/products/{id}/action")
    suspend fun performProductActionWithImage(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Part("action") action: RequestBody,
        @Part("location") location: RequestBody,
        @Part("description") description: RequestBody,
        @Part("temperature") temperature: RequestBody,
        @Part("humidity") humidity: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<ProductActionResponse>
    @PUT("api/products/{id}/action")
    suspend fun performProductAction(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body request: ProductActionRequest
    ): Response<ProductActionResponse>

    @PUT("api/products/{id}/status")
    suspend fun updateStatus(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body request: UpdateStatusRequest
    ): Response<SimpleResponse>

    // Cap nhat trang thai voi hinh anh (Multipart)
    @Multipart
    @PUT("api/products/{id}/status")
    suspend fun updateStatusWithImage(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Part("status") status: RequestBody,
        @Part("location") location: RequestBody,
        @Part("description") description: RequestBody,
        @Part("temperature") temperature: RequestBody,
        @Part("humidity") humidity: RequestBody,
        @Part image: MultipartBody.Part?
    ): Response<SimpleResponse>

    @PUT("api/products/{id}/transfer")
    suspend fun transferOwnership(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body request: TransferRequest
    ): Response<SimpleResponse>

    @POST("api/products/{id}/sell-retail")
    suspend fun sellRetail(
        @Header("Authorization") token: String,
        @Path("id") id: String,
        @Body request: RetailSaleRequest
    ): Response<RetailSaleResponse>

    @GET("api/products/{id}/history")
    suspend fun getHistory(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<HistoryResponse>

    @GET("api/products/{id}/verify")
    suspend fun verifyProduct(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<VerifyResponse>

    @GET("api/products/{id}/qrcode")
    suspend fun getQRCode(@Path("id") id: String): Response<QRCodeResponse>

    @GET("api/products/statistics")
    suspend fun getStatistics(@Header("Authorization") token: String): Response<StatisticsResponse>

    @GET("api/products/trace/{id}")
    suspend fun traceProduct(@Path("id") id: String): Response<TraceFullResponse>

    // ==================== IPFS / FILE UPLOAD ====================

    // Upload hinh anh san pham
    @Multipart
    @POST("api/ipfs/upload/image/{productId}")
    suspend fun uploadProductImage(
        @Header("Authorization") token: String,
        @Path("productId") productId: String,
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>

    // Upload chung nhan san pham
    @Multipart
    @POST("api/ipfs/upload/certificate/{productId}")
    suspend fun uploadProductCertificate(
        @Header("Authorization") token: String,
        @Path("productId") productId: String,
        @Part file: MultipartBody.Part
    ): Response<UploadResponse>

    // Lay danh sach file cua san pham
    @GET("api/ipfs/product/{productId}/files")
    suspend fun getProductFiles(
        @Path("productId") productId: String
    ): Response<ProductFilesResponse>

    // ==================== PARTICIPANTS ====================

    @GET("api/participants")
    suspend fun getParticipants(@Header("Authorization") token: String): Response<ParticipantListResponse>

    @GET("api/participants/{id}")
    suspend fun getParticipant(
        @Header("Authorization") token: String,
        @Path("id") id: String
    ): Response<ParticipantListResponse>
    @POST("api/payments/retail/create")
    suspend fun createRetailPayment(
        @Header("Authorization") token: String,
        @Body request: CreateRetailPaymentRequest
    ): Response<CreateRetailPaymentResponse>

    @GET("api/payments/retail/{orderId}")
    suspend fun getRetailPaymentStatus(
        @Header("Authorization") token: String,
        @Path("orderId") orderId: String
    ): Response<RetailPaymentStatusResponse>
}