package com.example.supplychainapp.data.repository

import android.content.Context
import android.net.Uri
import com.example.supplychainapp.data.TokenManager
import com.example.supplychainapp.data.api.ApiService
import com.example.supplychainapp.data.api.RetrofitClient
import com.example.supplychainapp.data.local.ProductDao
import com.example.supplychainapp.data.local.ProductEntity
import com.example.supplychainapp.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File
import java.io.FileOutputStream
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.flowOn

@Singleton
class SupplyChainRepository @Inject constructor(
    private val api: ApiService,
    private val tokenManager: TokenManager,
    private val productDao: ProductDao
) {

    private fun authHeader(): String = tokenManager.getAuthHeader()

    // ==================== AUTH ====================

    fun login(id: String, password: String): Flow<Resource<LoginData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.login(LoginRequest(id, password))
            if (response.isSuccessful && response.body()?.success == true) {
                val data = response.body()!!.data!!
                tokenManager.saveTokens(data.accessToken, data.refreshToken)
                tokenManager.saveUser(data.user.id, data.user.name, data.user.role, data.user.organization, data.requirePasswordChange || data.user.mustChangePassword)
                emit(Resource.Success(data))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Dang nhap that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun logout(): Flow<Resource<Boolean>> = flow {
        emit(Resource.Loading)
        try {
            api.logout(authHeader())
        } catch (_: Exception) { }
        tokenManager.clearAll()
        productDao.deleteAll()
        emit(Resource.Success(true))
    }


    fun changePassword(currentPassword: String, newPassword: String): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.changePassword(authHeader(), ChangePasswordRequest(currentPassword, newPassword))
            if (response.isSuccessful && response.body()?.success == true) {
                tokenManager.requirePasswordChange = false
                emit(Resource.Success(response.body()?.message ?: "Doi mat khau thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Doi mat khau that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    // ==================== FORGOT PASSWORD ====================

    fun forgotPassword(request: ForgotPasswordRequest): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.forgotPassword(request)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()?.message ?: "Da gui OTP"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Khong tim thay tai khoan"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun resetPassword(request: ResetPasswordRequest): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.resetPassword(request)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()?.message ?: "Dat lai mat khau thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Dat lai mat khau that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    // ==================== PRODUCTS ====================

    fun getProducts(): Flow<Resource<List<Product>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getProducts(authHeader())
            if (response.isSuccessful && response.body()?.success == true) {
                val products = response.body()!!.data ?: emptyList()
                cacheProducts(products)
                emit(Resource.Success(products))
            } else {
                val cached = loadFromCache()
                if (cached.isNotEmpty()) {
                    emit(Resource.Success(cached))
                } else {
                    emit(Resource.Error("Khong lay duoc san pham"))
                }
            }
        } catch (e: Exception) {
            val cached = loadFromCache()
            if (cached.isNotEmpty()) {
                emit(Resource.Success(cached))
            } else {
                emit(Resource.Error("Loi ket noi: ${e.message}"))
            }
        }
    }

    fun getProduct(id: String): Flow<Resource<Product>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getProduct(authHeader(), id)
            if (response.isSuccessful && response.body()?.success == true) {
                val product = response.body()!!.data!!
                cacheProduct(product)
                emit(Resource.Success(product))
            } else {
                val cached = productDao.getProductById(id)
                if (cached != null) {
                    emit(Resource.Success(cached.toProduct()))
                } else {
                    emit(Resource.Error("Khong tim thay san pham"))
                }
            }
        } catch (e: Exception) {
            val cached = productDao.getProductById(id)
            if (cached != null) {
                emit(Resource.Success(cached.toProduct()))
            } else {
                emit(Resource.Error("Loi ket noi: ${e.message}"))
            }
        }
    }

    fun createProduct(request: CreateProductRequest): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.createProduct(authHeader(), request)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.message ?: "Tao san pham thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Tao san pham that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun createProductWithImage(
        id: String,
        name: String,
        productType: String,
        origin: String,
        batchNumber: String,
        quantity: Int,
        unit: String,
        price: Double,
        description: String,
        imageFile: File?
    ): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val idBody = id.toRequestBody("text/plain".toMediaType())
            val nameBody = name.toRequestBody("text/plain".toMediaType())
            val typeBody = productType.toRequestBody("text/plain".toMediaType())
            val originBody = origin.toRequestBody("text/plain".toMediaType())
            val batchBody = batchNumber.toRequestBody("text/plain".toMediaType())
            val qtyBody = quantity.toString().toRequestBody("text/plain".toMediaType())
            val unitBody = unit.toRequestBody("text/plain".toMediaType())
            val priceBody = price.toString().toRequestBody("text/plain".toMediaType())
            val descBody = description.toRequestBody("text/plain".toMediaType())

            val imagePart = imageFile?.let {
                val requestFile = it.asRequestBody("image/jpeg".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("image", it.name, requestFile)
            }

            val response = api.createProductWithImage(
                authHeader(),
                idBody, nameBody, typeBody, originBody, batchBody,
                qtyBody, unitBody, priceBody, descBody,
                imagePart
            )

            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.message ?: "Tao san pham thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Tao san pham that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun performProductActionWithImage(
        productId: String,
        action: String,
        location: String,
        description: String,
        temperature: String,
        humidity: String,
        imageFile: File?
    ): Flow<Resource<Product>> = flow {
        emit(Resource.Loading)
        try {
            val actionBody = action.toRequestBody("text/plain".toMediaType())
            val locationBody = location.toRequestBody("text/plain".toMediaType())
            val descBody = description.toRequestBody("text/plain".toMediaType())
            val tempBody = temperature.toRequestBody("text/plain".toMediaType())
            val humidBody = humidity.toRequestBody("text/plain".toMediaType())

            val imagePart = imageFile?.let {
                val requestFile = it.asRequestBody("image/*".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("image", it.name, requestFile)
            }

            val response = api.performProductActionWithImage(
                authHeader(),
                productId,
                actionBody,
                locationBody,
                descBody,
                tempBody,
                humidBody,
                imagePart
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val product = response.body()?.data?.product
                if (product != null) {
                    cacheProduct(product)
                    emit(Resource.Success(product))
                } else {
                    emit(Resource.Error("Không nhận được dữ liệu sản phẩm"))
                }
            } else {
                emit(Resource.Error(response.body()?.message ?: "Thao tác thất bại"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Lỗi kết nối: ${e.message}"))
        }
    }.flowOn(Dispatchers.IO)

    fun performProductAction(
        productId: String,
        action: String,
        location: String = "",
        description: String = "",
        temperature: String = "",
        humidity: String = ""
    ): Flow<Resource<Product>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.performProductAction(
                authHeader(),
                productId,
                ProductActionRequest(
                    action = action,
                    location = location,
                    description = description,
                    temperature = temperature,
                    humidity = humidity
                )
            )

            if (response.isSuccessful && response.body()?.success == true) {
                val product = response.body()?.data?.product
                if (product != null) {
                    emit(Resource.Success(product))
                } else {
                    emit(Resource.Error("Không nhận được dữ liệu sản phẩm"))
                }
            } else {
                emit(Resource.Error(response.body()?.message ?: "Thao tác thất bại"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Lỗi kết nối: ${e.message}"))
        }
    }

    fun updateStatus(id: String, request: UpdateStatusRequest): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.updateStatus(authHeader(), id, request)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.message ?: "Cap nhat thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Cap nhat that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun updateStatusWithImage(
        productId: String,
        status: String,
        location: String,
        description: String,
        temperature: String,
        humidity: String,
        imageFile: File?
    ): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val statusBody = status.toRequestBody("text/plain".toMediaType())
            val locationBody = location.toRequestBody("text/plain".toMediaType())
            val descBody = description.toRequestBody("text/plain".toMediaType())
            val tempBody = temperature.toRequestBody("text/plain".toMediaType())
            val humidBody = humidity.toRequestBody("text/plain".toMediaType())

            val imagePart = imageFile?.let {
                val requestFile = it.asRequestBody("image/*".toMediaTypeOrNull())
                MultipartBody.Part.createFormData("image", it.name, requestFile)
            }

            val response = api.updateStatusWithImage(
                authHeader(), productId,
                statusBody, locationBody, descBody, tempBody, humidBody,
                imagePart
            )

            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.message ?: "Cap nhat thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Cap nhat that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun transferOwnership(id: String, newOwner: String): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.transferOwnership(authHeader(), id, TransferRequest(newOwner))
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.message ?: "Chuyen quyen thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Chuyen quyen that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun sellRetail(productId: String, quantity: Int, price: Double, location: String): Flow<Resource<RetailSaleData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.sellRetail(
                authHeader(),
                productId,
                RetailSaleRequest(quantity, price, location)
            )
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                val data = response.body()!!.data!!
                cacheProduct(data.product)
                emit(Resource.Success(data))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Ban le that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun getHistory(id: String): Flow<Resource<List<HistoryRecord>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getHistory(authHeader(), id)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.data ?: emptyList()))
            } else {
                emit(Resource.Error("Khong lay duoc lich su"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun verifyProduct(id: String): Flow<Resource<VerifyData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.verifyProduct(authHeader(), id)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error("Xac thuc that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun traceProduct(id: String): Flow<Resource<TraceFullData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.traceProduct(id)
            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error("Khong tim thay san pham"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun getStatistics(): Flow<Resource<Statistics>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getStatistics(authHeader())
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error("Khong lay duoc thong ke"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun getParticipants(): Flow<Resource<List<Participant>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getParticipants(authHeader())
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.data ?: emptyList()))
            } else {
                emit(Resource.Error("Khong lay duoc thanh vien"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    // ==================== FILE UPLOAD ====================

    fun uploadProductImage(productId: String, imageFile: File): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val requestFile = imageFile.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", imageFile.name, requestFile)

            val response = api.uploadProductImage(authHeader(), productId, body)
            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()!!.data?.fileHash ?: "Upload thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Upload that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }

    fun uploadProductCertificate(productId: String, file: File): Flow<Resource<String>> = flow {
        emit(Resource.Loading)
        try {
            val mimeType = when (file.extension.lowercase()) {
                "pdf" -> "application/pdf"
                "doc" -> "application/msword"
                "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                "jpg", "jpeg" -> "image/jpeg"
                "png" -> "image/png"
                else -> "application/pdf"
            }
            val requestFile = file.asRequestBody(mimeType.toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)

            val response = api.uploadProductCertificate(authHeader(), productId, body)

            if (response.isSuccessful && response.body()?.success == true) {
                emit(Resource.Success(response.body()?.message ?: "Tai chung nhan thanh cong"))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Tai chung nhan that bai"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Loi ket noi: ${e.message}"))
        }
    }.flowOn(Dispatchers.IO)

    // ==================== HELPER FUNCTIONS ====================

    fun getProductImageUrl(productId: String): String {
        return "${RetrofitClient.BASE_URL}api/ipfs/product/$productId/image"
    }

    fun getProductCertificateUrl(productId: String): String {
        return "${RetrofitClient.BASE_URL}api/ipfs/product/$productId/certificate"
    }

    // ==================== CACHE HELPERS ====================

    private suspend fun cacheProducts(products: List<Product>) {
        try {
            val entities = products.map { it.toEntity() }
            productDao.insertProducts(entities)
        } catch (_: Exception) { }
    }

    private suspend fun cacheProduct(product: Product) {
        try {
            productDao.insertProduct(product.toEntity())
        } catch (_: Exception) { }
    }

    private suspend fun loadFromCache(): List<Product> {
        return try {
            productDao.getAllProducts().map { it.toProduct() }
        } catch (_: Exception) {
            emptyList()
        }
    }

    // ==================== MAPPERS ====================

    private fun Product.toEntity(): ProductEntity {
        return ProductEntity(
            id = id, name = name, productType = productType, origin = origin,
            currentOwner = currentOwner, currentStatus = currentStatus,
            createdAt = createdAt, updatedAt = updatedAt, batchNumber = batchNumber,
            quantity = quantity, unit = unit, price = price,
            description = description, imageHash = imageHash,
            certificateHash = certificateHash
        )
    }

    private fun ProductEntity.toProduct(): Product {
        return Product(
            id = id, name = name, productType = productType, origin = origin,
            currentOwner = currentOwner, currentStatus = currentStatus,
            createdAt = createdAt, updatedAt = updatedAt, batchNumber = batchNumber,
            quantity = quantity, unit = unit, price = price,
            description = description, imageHash = imageHash,
            certificateHash = certificateHash
        )
    }
    fun createRetailPayment(
        productId: String,
        quantity: Int
    ): Flow<Resource<RetailPaymentData>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.createRetailPayment(
                authHeader(),
                CreateRetailPaymentRequest(productId, quantity)
            )

            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Tạo thanh toán thất bại"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Lỗi kết nối: ${e.message}"))
        }
    }

    fun getRetailPaymentStatus(orderId: String): Flow<Resource<RetailPaymentStatus>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getRetailPaymentStatus(authHeader(), orderId)

            if (response.isSuccessful && response.body()?.success == true && response.body()?.data != null) {
                emit(Resource.Success(response.body()!!.data!!))
            } else {
                emit(Resource.Error(response.body()?.message ?: "Không kiểm tra được trạng thái thanh toán"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Lỗi kết nối: ${e.message}"))
        }
    }
}