package com.example.supplychainapp.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.OpenInBrowser
import androidx.compose.material.icons.filled.Payment
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.QRCodeImage
import com.example.supplychainapp.ui.components.StatusBadge

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RetailSaleScreen(
    viewModel: MainViewModel,
    productId: String,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val uriHandler = LocalUriHandler.current

    var quantityText by remember { mutableStateOf("1") }

    LaunchedEffect(productId) {
        viewModel.loadProduct(productId)
    }

    val product = uiState.selectedProduct
    val quantity = quantityText.toIntOrNull() ?: 0
    val payment = uiState.retailPayment?.takeIf { it.productId == productId }
    val paymentStatus = uiState.retailPaymentStatus?.takeIf { it.product_id == productId }

    val quantityError = quantityText.isNotBlank() &&
            (quantity <= 0 || (product != null && quantity > product.quantity))

    val amount = if (product != null && quantity > 0) {
        quantity * product.price
    } else {
        0.0
    }

    val canCreatePayment = product != null
            && viewModel.canSellRetail(product)
            && quantity > 0
            && quantity <= product.quantity
            && !uiState.isLoading

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Bán lẻ sản phẩm") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, "Quay lại")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            if (uiState.isLoading && product == null) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (product == null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(
                        "Không tìm thấy sản phẩm",
                        modifier = Modifier.padding(16.dp),
                        color = MaterialTheme.colorScheme.error
                    )
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.primaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Filled.PointOfSale,
                                contentDescription = null,
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                product.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                product.id,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                            StatusBadge(product.currentStatus)
                        }
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        RetailInfoRow("Mã lô", product.batchNumber)
                        RetailInfoRow("Tồn kho", "${product.quantity} ${product.unit}")
                        RetailInfoRow("Giá hiện tại", "${product.price} VNĐ/${product.unit}")
                        RetailInfoRow("Chủ sở hữu", product.currentOwner)
                    }
                }

                if (!viewModel.canSellRetail(product)) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0))
                    ) {
                        Text(
                            "Chỉ RETAILER hoặc ADMIN đang sở hữu sản phẩm ở trạng thái IN_STORE mới được bán lẻ.",
                            modifier = Modifier.padding(14.dp),
                            fontSize = 13.sp,
                            color = Color(0xFFE65100)
                        )
                    }
                }

                OutlinedTextField(
                    value = quantityText,
                    onValueChange = { quantityText = it.filter { ch -> ch.isDigit() } },
                    label = { Text("Số lượng khách mua *") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    isError = quantityError,
                    supportingText = if (quantityError) {
                        { Text("Số lượng bán phải từ 1 đến ${product.quantity}") }
                    } else null,
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp)
                )

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        RetailInfoRow("Số lượng bán", "$quantity ${product.unit}")
                        RetailInfoRow("Đơn giá", "${product.price} VNĐ/${product.unit}")
                        RetailInfoRow("Tổng tiền", "$amount VNĐ")
                        RetailInfoRow("Tồn sau khi thanh toán", "${product.quantity - quantity} ${product.unit}")
                    }
                }

                Button(
                    onClick = {
                        viewModel.createRetailPayment(
                            productId = product.id,
                            quantity = quantity
                        )
                    },
                    enabled = canCreatePayment,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    if (uiState.isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Icon(Icons.Filled.Payment, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Tạo mã QR thanh toán",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                }

                if (payment != null) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = Color(0xFFE8F5E9)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            Text(
                                "Mã QR thanh toán VNPay demo",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color(0xFF2E7D32)
                            )

                            Text(
                                "Khách quét mã này để thanh toán sandbox. Sau khi thanh toán thành công, hệ thống mới trừ tồn kho.",
                                fontSize = 13.sp,
                                color = Color(0xFF2E7D32)
                            )

                            QRCodeImage(
                                content = payment.paymentUrl,
                                size = 220
                            )

                            RetailInfoRow("Mã đơn", payment.orderId)
                            RetailInfoRow("Số lượng", "${payment.quantity} ${product.unit}")
                            RetailInfoRow("Số tiền", "${payment.amount} VNĐ")

                            OutlinedButton(
                                onClick = {
                                    uriHandler.openUri(payment.paymentUrl)
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Icon(Icons.Filled.OpenInBrowser, contentDescription = null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(
                                    "Quý khách vui lòng quét mã này để thanh toán",
                                    fontSize = 13.sp,
                                    color = Color(0xFF2E7D32)
                                )
                            }

                            Button(
                                onClick = {
                                    viewModel.checkRetailPaymentStatus(
                                        orderId = payment.orderId,
                                        productId = payment.productId
                                    )
                                },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                enabled = !uiState.isLoading
                            ) {
                                Text("Kiểm tra thanh toán")
                            }
                        }
                    }
                }

                if (paymentStatus != null) {
                    val paid = paymentStatus.status == "PAID"

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (paid) Color(0xFFE8F5E9) else Color(0xFFFFF3E0)
                        )
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = if (paid) "Thanh toán thành công" else "Trạng thái thanh toán: ${paymentStatus.status}",
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = if (paid) Color(0xFF2E7D32) else Color(0xFFE65100)
                            )

                            RetailInfoRow("Mã đơn", paymentStatus.order_id)
                            RetailInfoRow("Đã bán", "${paymentStatus.quantity} ${product.unit}")
                            RetailInfoRow("Số tiền", "${paymentStatus.amount} VNĐ")
                        }
                    }
                }

                if (uiState.error != null) {
                    Card(
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Text(
                            uiState.error!!,
                            modifier = Modifier.padding(14.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RetailInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            label,
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(0.9f)
        )
        Text(
            value,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1.1f)
        )
    }
}