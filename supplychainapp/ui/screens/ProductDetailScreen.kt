package com.example.supplychainapp.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import coil.compose.AsyncImage
import com.example.supplychainapp.data.model.StatusRecord
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.QRCodeImage
import com.example.supplychainapp.ui.components.StatusBadge
import com.example.supplychainapp.ui.components.buildQRContent
import com.example.supplychainapp.ui.components.buildRetailQRContent
import com.example.supplychainapp.ui.components.getStatusInfo
import com.example.supplychainapp.ui.utils.FileUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailScreen(
    viewModel: MainViewModel,
    productId: String,
    onBack: () -> Unit,
    onTransfer: (String) -> Unit,
    onRetailSale: (String) -> Unit,
    onHistory: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showQR by remember { mutableStateOf(false) }
    val context = LocalContext.current

    val certPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val certFile = FileUtils.uriToFile(context, uri, "${productId}_cert")
            if (certFile != null) {
                viewModel.uploadProductCertificate(productId, certFile)
            }
        }
    }

    LaunchedEffect(productId) {
        viewModel.loadProduct(productId)
    }

    val product = uiState.selectedProduct

    if (showQR && product != null) {
        Dialog(onDismissRequest = { showQR = false }) {
            Card(shape = RoundedCornerShape(20.dp)) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Mã QR sản phẩm", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(product.name, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("QR truy xuất nguồn gốc", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                    QRCodeImage(content = buildQRContent(productId), size = 190)
                    Text(productId, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Spacer(modifier = Modifier.height(16.dp))
                    TextButton(onClick = { showQR = false }, modifier = Modifier.fillMaxWidth()) {
                        Text("Đóng")
                    }
                }
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chi tiết sản phẩm") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Filled.ArrowBack, "Quay lại")
                    }
                },
                actions = {
                    IconButton(onClick = { showQR = true }) {
                        Icon(Icons.Filled.QrCode2, "QR Code")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (product == null) {
            Box(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Filled.Error,
                        null,
                        modifier = Modifier.size(56.dp),
                        tint = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("Không tìm thấy sản phẩm", fontSize = 15.sp)
                }
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                if (!product.imageHash.isNullOrBlank()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        AsyncImage(
                            model = viewModel.getProductImageUrl(productId),
                            contentDescription = "Product Image",
                            modifier = Modifier.fillMaxWidth().height(240.dp),
                            contentScale = ContentScale.Crop
                        )
                    }
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        product.name,
                        fontWeight = FontWeight.Bold,
                        fontSize = 22.sp,
                        modifier = Modifier.weight(1f),
                        lineHeight = 28.sp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    StatusBadge(product.currentStatus)
                }

                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        DetailRow("Mã sản phẩm", product.id)
                        DetailRow("Loại", product.productType)
                        DetailRow("Xuất xứ", product.origin)
                        DetailRow("Chủ sở hữu", product.currentOwner)
                        DetailRow("Lô hàng", product.batchNumber)
                        DetailRow("Số lượng", "${product.quantity} ${product.unit}")
                        DetailRow("Giá", "${product.price} VNĐ/${product.unit}")

                        if (!product.description.isNullOrBlank()) {
                            DetailRow("Mô tả", product.description)
                        }
                    }
                }

                if (!product.certificateHash.isNullOrBlank()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFC8E6C9))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Filled.Verified,
                                null,
                                tint = Color(0xFF2E7D32),
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    "Đã chứng nhận",
                                    fontSize = 14.sp,
                                    color = Color(0xFF2E7D32),
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    "Hash: ${product.certificateHash.take(20)}...",
                                    fontSize = 11.sp,
                                    color = Color(0xFF388E3C)
                                )
                            }
                        }
                    }
                } else if (viewModel.canCreateProduct()) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0))
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Chưa có chứng nhận", fontSize = 13.sp, color = Color(0xFFE65100))
                            OutlinedButton(
                                onClick = { certPickerLauncher.launch("*/*") },
                                shape = RoundedCornerShape(8.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF2E7D32))
                            ) {
                                Text("Tải lên", fontSize = 13.sp)
                            }
                        }
                    }
                }

                if (!product.statusHistory.isNullOrEmpty()) {
                    Text("Hành trình sản phẩm", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)
                    Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                        Column(
                            modifier = Modifier.padding(12.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            product.statusHistory.reversed().forEach { record ->
                                TimelineItem(record)
                            }
                        }
                    }
                }

                val actions = viewModel.getAvailableProductActions(product)
                val canTransfer = viewModel.canTransferProduct(product)
                val isOwner = product.currentOwner == uiState.userId
                val isAdmin = viewModel.isAdmin()

                if (isOwner || isAdmin) {
                    if (actions.isNotEmpty()) {
                        Text("Chức năng tiếp theo", fontWeight = FontWeight.SemiBold, fontSize = 15.sp)

                        actions.forEach { action ->
                            Button(
                                onClick = {
                                    viewModel.performProductAction(
                                        productId = productId,
                                        action = action.action,
                                        location = product.origin,
                                        description = action.description
                                    )
                                },
                                modifier = Modifier.fillMaxWidth().height(48.dp),
                                shape = RoundedCornerShape(10.dp)
                            ) {
                                Text(action.label, fontSize = 14.sp)
                            }
                        }
                    }

                    if (canTransfer) {
                        OutlinedButton(
                            onClick = { onTransfer(productId) },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("Chuyển giao", fontSize = 14.sp)
                        }
                    }
                    if (viewModel.canSellRetail(product)) {
                        Button(
                            onClick = { onRetailSale(productId) },
                            modifier = Modifier.fillMaxWidth().height(48.dp),
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = MaterialTheme.colorScheme.secondary
                            )
                        ) {
                            Text("Bán lẻ", fontSize = 14.sp)
                        }
                    }
                }

                if (uiState.error != null) {
                    Card(
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)
                    ) {
                        Text(
                            uiState.error!!,
                            modifier = Modifier.padding(14.dp),
                            color = MaterialTheme.colorScheme.onErrorContainer,
                            fontSize = 13.sp
                        )
                    }
                }

                OutlinedButton(
                    onClick = { onHistory(productId) },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Xem lịch sử Blockchain", fontSize = 14.sp)
                }

                Spacer(modifier = Modifier.height(8.dp))
            }
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.weight(0.9f))
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1.1f))
    }
}

@Composable
private fun InfoRow(icon: androidx.compose.ui.graphics.vector.ImageVector, label: String, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 2.dp)) {
        Icon(icon, null, modifier = Modifier.size(16.dp), tint = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.width(8.dp))
        Text("$label: ", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(value, fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
private fun TimelineItem(record: StatusRecord) {
    val info = getStatusInfo(record.status)
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = info.bgColor.copy(alpha = 0.5f))
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusBadge(record.status)
                Text(
                    record.timestamp.take(10),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(record.location, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            Text(record.description, fontSize = 12.sp)
            if (!record.temperature.isNullOrBlank()) {
                Text(
                    "${record.temperature}°C  ·  ${record.humidity}%",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}