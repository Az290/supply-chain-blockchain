package com.example.supplychainapp.data.model

// ==================== AUTH ====================

data class LoginRequest(val id: String, val password: String)

data class LoginResponse(val success: Boolean, val data: LoginData?, val message: String?)

data class LoginData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: String,
    val user: User,
    val requirePasswordChange: Boolean = false
)

data class User(
    val id: String,
    val name: String,
    val role: String,
    val organization: String,
    val location: String? = null,
    val phone: String? = null,
    val email: String? = null,
    val mustChangePassword: Boolean = false
)

data class RefreshRequest(val refreshToken: String)

data class RefreshResponse(val success: Boolean, val data: RefreshData?, val message: String?)

data class RefreshData(
    val accessToken: String,
    val refreshToken: String,
    val expiresIn: String
)

// ==================== FORGOT PASSWORD ====================

data class ForgotPasswordRequest(val id: String, val email: String)

data class ResetPasswordRequest(val id: String, val otpCode: String, val newPassword: String)

data class ChangePasswordRequest(val currentPassword: String, val newPassword: String)


// ==================== PRODUCT ====================

data class ProductListResponse(val success: Boolean, val data: List<Product>?, val message: String?)

data class ProductResponse(val success: Boolean, val data: Product?, val message: String?)

data class Product(
    val docType: String? = null,
    val id: String,
    val name: String,
    val productType: String,
    val origin: String,
    val currentOwner: String,
    val currentStatus: String,
    val createdAt: String,
    val updatedAt: String,
    val batchNumber: String,
    val quantity: Int,
    val unit: String,
    val price: Double = 0.0,
    val imageHash: String? = null,
    val certificateHash: String? = null,
    val description: String? = null,
    val statusHistory: List<StatusRecord>? = null,
    val ownerHistory: List<OwnerRecord>? = null
)

data class StatusRecord(
    val status: String,
    val timestamp: String,
    val location: String,
    val updatedBy: String,
    val description: String,
    val temperature: String? = null,
    val humidity: String? = null
)

data class OwnerRecord(
    val from: String,
    val to: String,
    val timestamp: String,
    val txId: String? = null
)

data class CreateProductRequest(
    val id: String,
    val name: String,
    val productType: String,
    val origin: String,
    val batchNumber: String,
    val quantity: Int,
    val unit: String,
    val price: Double,
    val description: String
)

data class ProductActionRequest(
    val action: String,
    val location: String = "",
    val description: String = "",
    val temperature: String = "",
    val humidity: String = ""
)

data class ProductActionResponse(
    val success: Boolean,
    val data: ProductActionData?,
    val message: String?
)

data class ProductActionData(
    val product: Product?,
    val action: String?,
    val status: String?,
    val hasImage: Boolean = false
)

data class UpdateStatusRequest(
    val status: String,
    val location: String,
    val description: String,
    val temperature: String = "",
    val humidity: String = ""
)

data class TransferRequest(val newOwner: String)

data class RetailSaleRequest(
    val quantity: Int,
    val price: Double,
    val location: String
)

data class RetailSaleResponse(
    val success: Boolean,
    val data: RetailSaleData?,
    val message: String?
)

data class RetailSaleData(
    val product: Product,
    val soldQuantity: Int,
    val remainingQuantity: Int,
    val status: String
)

// ==================== COMMON ====================

data class SimpleResponse(val success: Boolean, val message: String?)

data class QRCodeResponse(val success: Boolean, val data: QRCodeData?)

data class QRCodeData(val qrCode: String, val url: String)

// ==================== VERIFY ====================

data class VerifyResponse(val success: Boolean, val data: VerifyData?, val message: String?)

data class TraceFullResponse(
    val success: Boolean,
    val data: TraceFullData?,
    val message: String?
)

data class TraceFullData(
    val verify: VerifyData?,
    val product: Product?
)

data class VerifyData(
    val isAuthentic: Boolean,
    val productId: String,
    val productName: String,
    val origin: String,
    val currentOwner: String,
    val currentStatus: String,
    val totalTransfers: Int,
    val totalUpdates: Int,
    val createdAt: String,
    val lastUpdated: String,
    val hasCertificate: Boolean,
    val hasImage: Boolean,
    val batchNumber: String
)

// ==================== STATISTICS ====================

data class StatisticsResponse(val success: Boolean, val data: Statistics?, val message: String?)

data class Statistics(
    val totalProducts: Int = 0,
    val totalValue: Double = 0.0,
    val totalQuantity: Int = 0,
    val totalParticipants: Int = 0,
    val productsByStatus: Map<String, Int>? = null,
    val participantsByRole: Map<String, Int>? = null
)

// ==================== PARTICIPANT ====================

data class ParticipantListResponse(val success: Boolean, val data: List<Participant>?, val message: String?)

data class Participant(
    val docType: String? = null,
    val id: String,
    val name: String,
    val role: String,
    val organization: String,
    val location: String = "",
    val phone: String? = null,
    val email: String? = null,
    val isActive: Boolean? = null,
    val createdAt: String? = null
)

// ==================== HISTORY ====================

data class HistoryResponse(val success: Boolean, val data: List<HistoryRecord>?, val message: String?)

data class HistoryRecord(
    val txId: String,
    val timestamp: String,
    val isDelete: Boolean,
    val product: Product? = null
)

data class UploadResponse(
    val success: Boolean,
    val data: UploadData?,
    val message: String?
)

data class UploadData(
    val fileHash: String,
    val fileName: String,
    val fileSize: Long,
    val filePath: String,
    val message: String?
)

data class ProductFilesResponse(
    val success: Boolean,
    val data: List<ProductFile>?,
    val message: String?
)

data class ProductFile(
    val id: Int,
    val type: String,
    val originalName: String,
    val fileHash: String,
    val fileSize: Long,
    val mimeType: String,
    val uploadedBy: String,
    val uploadedAt: String,
    val url: String
)
data class CreateRetailPaymentRequest(
    val productId: String,
    val quantity: Int
)

data class CreateRetailPaymentResponse(
    val success: Boolean,
    val data: RetailPaymentData?,
    val message: String?
)

data class RetailPaymentData(
    val orderId: String,
    val productId: String,
    val quantity: Int,
    val unitPrice: Double,
    val amount: Double,
    val paymentUrl: String
)

data class RetailPaymentStatusResponse(
    val success: Boolean,
    val data: RetailPaymentStatus?,
    val message: String?
)

data class RetailPaymentStatus(
    val order_id: String,
    val product_id: String,
    val retailer_id: String,
    val quantity: Int,
    val unit_price: Double,
    val amount: Double,
    val status: String
)