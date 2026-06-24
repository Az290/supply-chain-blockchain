package com.example.supplychainapp.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.supplychainapp.data.TokenManager
import com.example.supplychainapp.data.api.RetrofitClient
import com.example.supplychainapp.data.model.*
import com.example.supplychainapp.data.repository.SupplyChainRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject

data class UiState(
    val isLoading: Boolean = false,
    val isLoggedIn: Boolean = false,
    val userId: String = "",
    val userName: String = "",
    val userRole: String = "",
    val userOrg: String = "",
    val products: List<Product> = emptyList(),
    val selectedProduct: Product? = null,
    val participants: List<Participant> = emptyList(),
    val history: List<HistoryRecord> = emptyList(),
    val statistics: Statistics? = null,
    val verifyData: VerifyData? = null,
    val traceProduct: Product? = null,
    val message: String? = null,
    val error: String? = null,
    val navigateBack: Boolean = false,
    val requirePasswordChange: Boolean = false,
    val retailPayment: RetailPaymentData? = null,
    val retailPaymentStatus: RetailPaymentStatus? = null,
)
data class ProductWorkflowAction(
    val action: String,
    val label: String,
    val description: String
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val repository: SupplyChainRepository,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()

    init {
        checkLoginStatus()
    }

    private fun checkLoginStatus() {
        if (tokenManager.isLoggedIn()) {
            _uiState.update {
                it.copy(
                    isLoggedIn = true,
                    userId = tokenManager.userId ?: "",
                    userName = tokenManager.userName ?: "",
                    userRole = tokenManager.userRole ?: "",
                    userOrg = tokenManager.userOrg ?: "",
                    requirePasswordChange = tokenManager.requirePasswordChange
                )
            }
        }
    }

    fun clearMessage() {
        _uiState.update { it.copy(message = null, error = null, navigateBack = false) }
    }

    fun canCreateProduct(): Boolean {
        val role = _uiState.value.userRole
        return role == "PRODUCER" || role == "ADMIN"
    }

    fun canUpdateStatus(status: String): Boolean {
        val role = _uiState.value.userRole
        return when (role) {
            "PRODUCER" -> status in listOf("CREATED", "HARVESTED")
            "PROCESSOR" -> status in listOf("PROCESSED", "PACKAGED")
            "TRANSPORTER" -> status in listOf("IN_TRANSIT", "WAREHOUSED")
            "DISTRIBUTOR" -> status in listOf("DISTRIBUTED")
            "RETAILER" -> status == "IN_STORE"
            "ADMIN" -> true
            else -> false
        }
    }

    fun canTransfer(): Boolean {
        val role = _uiState.value.userRole
        return role != "CONSUMER"
    }

    fun getValidTransferRecipientRole(): String? {
        val role = _uiState.value.userRole
        return when (role) {
            "PRODUCER" -> "PROCESSOR"
            "PROCESSOR" -> "TRANSPORTER"
            "TRANSPORTER" -> "DISTRIBUTOR"
            "DISTRIBUTOR" -> "RETAILER"
            "ADMIN" -> null
            else -> null
        }
    }

    fun canTransferProduct(product: Product): Boolean {
        val role = _uiState.value.userRole
        val userId = _uiState.value.userId

        if (role == "ADMIN") return true
        if (product.currentOwner != userId) return false

        return when (role) {
            "PRODUCER" -> product.currentStatus == "HARVESTED"
            "PROCESSOR" -> product.currentStatus == "PACKAGED"
            "TRANSPORTER" -> product.currentStatus == "WAREHOUSED"
            "DISTRIBUTOR" -> product.currentStatus == "DISTRIBUTED"
            else -> false
        }
    }

    fun canSellRetail(product: Product): Boolean {
        val role = _uiState.value.userRole
        return product.currentStatus == "IN_STORE"
                && product.quantity > 0
                && (role == "RETAILER" || role == "ADMIN")
                && (product.currentOwner == _uiState.value.userId || role == "ADMIN")
    }

    fun isAdmin(): Boolean = _uiState.value.userRole == "ADMIN"

    fun getFilteredProducts(): List<Product> {
        val role = _uiState.value.userRole
        val userId = _uiState.value.userId
        val products = _uiState.value.products

        return when (role) {
            "PRODUCER" -> products.filter {
                it.currentOwner == userId || it.currentStatus == "CREATED"
            }

            "PROCESSOR" -> products.filter {
                it.currentOwner == userId || it.currentStatus == "HARVESTED"
            }

            "TRANSPORTER" -> products.filter {
                it.currentOwner == userId || it.currentStatus == "PACKAGED"
            }

            "DISTRIBUTOR" -> products.filter {
                it.currentOwner == userId || it.currentStatus == "WAREHOUSED"
            }

            "RETAILER" -> products.filter {
                it.currentOwner == userId || it.currentStatus == "DISTRIBUTED" || it.currentStatus == "IN_STORE"
            }

            "ADMIN" -> products

            else -> products.filter {
                it.currentOwner == userId
            }
        }
    }
    fun getAvailableProductActions(product: Product): List<ProductWorkflowAction> {
        val role = _uiState.value.userRole
        val userId = _uiState.value.userId

        if (role != "ADMIN" && product.currentOwner != userId) {
            return emptyList()
        }

        return when {
            role == "PRODUCER" && product.currentStatus == "CREATED" -> listOf(
                ProductWorkflowAction(
                    action = "HARVEST",
                    label = "Thu hoạch",
                    description = "Xác nhận sản phẩm đã được thu hoạch"
                )
            )

            role == "PROCESSOR" && product.currentStatus == "HARVESTED" -> listOf(
                ProductWorkflowAction(
                    action = "PROCESS",
                    label = "Chế biến",
                    description = "Xác nhận sản phẩm đã được chế biến"
                )
            )

            role == "PROCESSOR" && product.currentStatus == "PROCESSED" -> listOf(
                ProductWorkflowAction(
                    action = "PACKAGE",
                    label = "Đóng gói",
                    description = "Xác nhận sản phẩm đã được đóng gói"
                )
            )

            role == "TRANSPORTER" && product.currentStatus == "PACKAGED" -> listOf(
                ProductWorkflowAction(
                    action = "START_TRANSPORT",
                    label = "Bắt đầu vận chuyển",
                    description = "Xác nhận sản phẩm đang được vận chuyển"
                )
            )

            role == "TRANSPORTER" && product.currentStatus == "IN_TRANSIT" -> listOf(
                ProductWorkflowAction(
                    action = "WAREHOUSE",
                    label = "Đã tới kho",
                    description = "Xác nhận sản phẩm đã tới kho phân phối"
                )
            )

            role == "DISTRIBUTOR" && product.currentStatus == "WAREHOUSED" -> listOf(
                ProductWorkflowAction(
                    action = "DISTRIBUTE",
                    label = "Phân phối",
                    description = "Xác nhận sản phẩm đã được phân phối"
                )
            )

            role == "RETAILER" && product.currentStatus == "DISTRIBUTED" -> listOf(
                ProductWorkflowAction(
                    action = "PUT_IN_STORE",
                    label = "Lên kệ",
                    description = "Xác nhận sản phẩm đã được đưa lên kệ bán lẻ"
                )
            )

            role == "ADMIN" -> getAdminProductActions(product)

            else -> emptyList()
        }
    }
    private fun getAdminProductActions(product: Product): List<ProductWorkflowAction> {
        return when (product.currentStatus) {
            "CREATED" -> listOf(
                ProductWorkflowAction("HARVEST", "Thu hoạch", "Xác nhận sản phẩm đã được thu hoạch")
            )
            "HARVESTED" -> listOf(
                ProductWorkflowAction("PROCESS", "Chế biến", "Xác nhận sản phẩm đã được chế biến")
            )
            "PROCESSED" -> listOf(
                ProductWorkflowAction("PACKAGE", "Đóng gói", "Xác nhận sản phẩm đã được đóng gói")
            )
            "PACKAGED" -> listOf(
                ProductWorkflowAction("START_TRANSPORT", "Bắt đầu vận chuyển", "Xác nhận sản phẩm đang được vận chuyển")
            )
            "IN_TRANSIT" -> listOf(
                ProductWorkflowAction("WAREHOUSE", "Đã tới kho", "Xác nhận sản phẩm đã tới kho phân phối")
            )
            "WAREHOUSED" -> listOf(
                ProductWorkflowAction("DISTRIBUTE", "Phân phối", "Xác nhận sản phẩm đã được phân phối")
            )
            "DISTRIBUTED" -> listOf(
                ProductWorkflowAction("PUT_IN_STORE", "Lên kệ", "Xác nhận sản phẩm đã được đưa lên kệ bán lẻ")
            )
            else -> emptyList()
        }
    }

    // ==================== IMAGE URL HELPERS ====================

    fun getProductImageUrl(productId: String): String {
        return repository.getProductImageUrl(productId)
    }

    fun getProductCertificateUrl(productId: String): String {
        return repository.getProductCertificateUrl(productId)
    }

    // ==================== AUTH ====================

    fun login(id: String, password: String) {
        viewModelScope.launch {
            repository.login(id, password).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> _uiState.update {
                        it.copy(
                            isLoading = false,
                            isLoggedIn = true,
                            userId = resource.data.user.id,
                            userName = resource.data.user.name,
                            userRole = resource.data.user.role,
                            userOrg = resource.data.user.organization,
                            message = if (resource.data.requirePasswordChange || resource.data.user.mustChangePassword) "Vui lòng đổi mật khẩu mặc định" else "Đăng nhập thành công",
                            requirePasswordChange = resource.data.requirePasswordChange || resource.data.user.mustChangePassword
                        )
                    }
                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }


    fun changePassword(currentPassword: String, newPassword: String) {
        viewModelScope.launch {
            repository.changePassword(currentPassword, newPassword).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> _uiState.update {
                        it.copy(
                            isLoading = false,
                            requirePasswordChange = false,
                            message = "Đổi mật khẩu thành công"
                        )
                    }
                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            repository.logout().collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { UiState(message = "Đã đăng xuất") }
                    is Resource.Error -> _uiState.update { UiState(error = resource.message) }
                }
            }
        }
    }

    // ==================== FORGOT PASSWORD ====================

    fun forgotPassword(userId: String, email: String) {
        viewModelScope.launch {
            repository.forgotPassword(
                ForgotPasswordRequest(userId, email)
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> _uiState.update {
                        it.copy(isLoading = false, message = "Mã OTP đã được gửi đến email")
                    }
                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }

    fun resetPassword(userId: String, otp: String, newPassword: String) {
        viewModelScope.launch {
            repository.resetPassword(
                ResetPasswordRequest(userId, otp, newPassword)
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> _uiState.update {
                        it.copy(isLoading = false, message = "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.")
                    }
                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }


    // ==================== PRODUCTS ====================

    fun loadProducts() {
        viewModelScope.launch {
            repository.getProducts().collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, products = resource.data) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun loadProduct(id: String) {
        viewModelScope.launch {
            repository.getProduct(id).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, selectedProduct = resource.data) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun createProduct(
        id: String, name: String, productType: String, origin: String,
        batchNumber: String, quantity: Int, unit: String, price: Double, description: String
    ) {
        viewModelScope.launch {
            val request = CreateProductRequest(id, name, productType, origin, batchNumber, quantity, unit, price, description)
            repository.createProduct(request).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Tạo sản phẩm thành công", navigateBack = true) }
                        loadProducts()
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun createProductWithCertificate(
        id: String, name: String, productType: String, origin: String,
        batchNumber: String, quantity: Int, unit: String, price: Double, description: String,
        certFile: File
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            var createSuccess = false
            val request = CreateProductRequest(id, name, productType, origin, batchNumber, quantity, unit, price, description)
            repository.createProduct(request).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {}
                    is Resource.Success -> { createSuccess = true }
                    is Resource.Error -> {
                        _uiState.update { it.copy(isLoading = false, error = resource.message) }
                    }
                }
            }
            if (!createSuccess) return@launch
            repository.uploadProductCertificate(id, certFile).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {}
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Tạo sản phẩm và upload chứng nhận thành công", navigateBack = true) }
                        loadProducts()
                    }
                    is Resource.Error -> {
                        _uiState.update { it.copy(isLoading = false, message = "Tạo sản phẩm thành công (upload chứng nhận thất bại: ${resource.message})", navigateBack = true) }
                        loadProducts()
                    }
                }
            }
        }
    }

    fun createProductWithImage(
        id: String, name: String, productType: String, origin: String,
        batchNumber: String, quantity: Int, unit: String, price: Double, description: String,
        imageFile: File?
    ) {
        viewModelScope.launch {
            repository.createProductWithImage(
                id, name, productType, origin, batchNumber,
                quantity, unit, price, description, imageFile
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Tạo sản phẩm thành công", navigateBack = true) }
                        loadProducts()
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun createProductWithImageAndCertificate(
        id: String, name: String, productType: String, origin: String,
        batchNumber: String, quantity: Int, unit: String, price: Double, description: String,
        imageFile: File?, certFile: File
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            var createSuccess = false
            repository.createProductWithImage(
                id, name, productType, origin, batchNumber,
                quantity, unit, price, description, imageFile
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {}
                    is Resource.Success -> { createSuccess = true }
                    is Resource.Error -> {
                        _uiState.update { it.copy(isLoading = false, error = resource.message) }
                    }
                }
            }
            if (!createSuccess) return@launch
            repository.uploadProductCertificate(id, certFile).collect { resource ->
                when (resource) {
                    is Resource.Loading -> {}
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Tạo sản phẩm và upload chứng nhận thành công", navigateBack = true) }
                        loadProducts()
                    }
                    is Resource.Error -> {
                        _uiState.update { it.copy(isLoading = false, message = "Tạo sản phẩm thành công (upload chứng nhận thất bại: ${resource.message})", navigateBack = true) }
                        loadProducts()
                    }
                }
            }
        }
    }

    fun updateStatus(
        productId: String, status: String, location: String,
        description: String, temperature: String, humidity: String
    ) {
        viewModelScope.launch {
            val request = UpdateStatusRequest(status, location, description, temperature, humidity)
            repository.updateStatus(productId, request).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Cập nhật trạng thái thành công", navigateBack = true) }
                        loadProduct(productId)
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun updateStatusWithImage(
        productId: String, status: String, location: String,
        description: String, temperature: String, humidity: String,
        imageFile: File?
    ) {
        viewModelScope.launch {
            repository.updateStatusWithImage(
                productId, status, location, description, temperature, humidity, imageFile
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Cập nhật trạng thái thành công", navigateBack = true) }
                        loadProduct(productId)
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun transferOwnership(productId: String, newOwner: String) {
        viewModelScope.launch {
            repository.transferOwnership(productId, newOwner).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }

                    is Resource.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                message = "Chuyển giao thành công",
                                navigateBack = true
                            )
                        }
                        loadProduct(productId)
                        loadProducts()
                    }

                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }

    fun performProductAction(
        productId: String,
        action: String,
        location: String = "",
        description: String = ""
    ) {
        viewModelScope.launch {
            repository.performProductAction(
                productId = productId,
                action = action,
                location = location,
                description = description
            ).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update {
                        it.copy(isLoading = true, error = null)
                    }

                    is Resource.Success -> _uiState.update {
                        it.copy(
                            isLoading = false,
                            selectedProduct = resource.data,
                            message = "Thao tác thành công"
                        )
                    }

                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }


    fun sellRetail(productId: String, quantity: Int, price: Double, location: String) {
        viewModelScope.launch {
            repository.sellRetail(productId, quantity, price, location).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true, error = null) }
                    is Resource.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                selectedProduct = resource.data.product,
                                message = "Bán lẻ thành công. Còn lại: ${resource.data.remainingQuantity}",
                                navigateBack = true
                            )
                        }
                        loadProducts()
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun loadHistory(productId: String) {
        viewModelScope.launch {
            repository.getHistory(productId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, history = resource.data) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun verifyProduct(productId: String) {
        viewModelScope.launch {
            repository.verifyProduct(productId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, verifyData = resource.data) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun traceProduct(productId: String) {
        viewModelScope.launch {
            repository.traceProduct(productId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update {
                        it.copy(isLoading = true, error = null, verifyData = null, traceProduct = null)
                    }
                    is Resource.Success -> _uiState.update {
                        it.copy(
                            isLoading = false,
                            verifyData = resource.data.verify,
                            traceProduct = resource.data.product
                        )
                    }
                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }

    fun loadStatistics() {
        viewModelScope.launch {
            repository.getStatistics().collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, statistics = resource.data) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun loadParticipants() {
        viewModelScope.launch {
            repository.getParticipants().collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> _uiState.update { it.copy(isLoading = false, participants = resource.data) }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    // ==================== UPLOAD HELPERS ====================

    fun uploadProductImage(productId: String, imageFile: File) {
        viewModelScope.launch {
            repository.uploadProductImage(productId, imageFile).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Upload ảnh thành công") }
                        loadProduct(productId)
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }

    fun uploadProductCertificate(productId: String, file: File) {
        viewModelScope.launch {
            repository.uploadProductCertificate(productId, file).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update { it.copy(isLoading = true) }
                    is Resource.Success -> {
                        _uiState.update { it.copy(isLoading = false, message = "Upload chứng nhận thành công") }
                        loadProduct(productId)
                    }
                    is Resource.Error -> _uiState.update { it.copy(isLoading = false, error = resource.message) }
                }
            }
        }
    }
    fun createRetailPayment(productId: String, quantity: Int) {
        viewModelScope.launch {
            repository.createRetailPayment(productId, quantity).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update {
                        it.copy(isLoading = true, error = null)
                    }

                    is Resource.Success -> _uiState.update {
                        it.copy(
                            isLoading = false,
                            retailPayment = resource.data,
                            message = "Đã tạo mã thanh toán"
                        )
                    }

                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }

    fun checkRetailPaymentStatus(orderId: String, productId: String) {
        viewModelScope.launch {
            repository.getRetailPaymentStatus(orderId).collect { resource ->
                when (resource) {
                    is Resource.Loading -> _uiState.update {
                        it.copy(isLoading = true, error = null)
                    }

                    is Resource.Success -> {
                        _uiState.update {
                            it.copy(
                                isLoading = false,
                                retailPaymentStatus = resource.data,
                                message = "Trạng thái thanh toán: ${resource.data.status}"
                            )
                        }

                        if (resource.data.status == "PAID") {
                            loadProduct(productId)
                            loadProducts()
                        }
                    }

                    is Resource.Error -> _uiState.update {
                        it.copy(isLoading = false, error = resource.message)
                    }
                }
            }
        }
    }
}