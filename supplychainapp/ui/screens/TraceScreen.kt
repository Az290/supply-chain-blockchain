package com.example.supplychainapp.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.supplychainapp.data.model.StatusRecord
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.StatusBadge
import com.example.supplychainapp.ui.components.getStatusInfo
import com.example.supplychainapp.ui.components.isRetailQRContent
import com.example.supplychainapp.ui.components.parseQRContent
import com.example.supplychainapp.ui.components.parseRetailQRContent
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions

@Composable
fun TraceScreen(
    viewModel: MainViewModel,
    onRetailScan: (String) -> Unit = {}
) {
    val uiState by viewModel.uiState.collectAsState()
    var productId by remember { mutableStateOf("") }

    val scanLauncher = rememberLauncherForActivityResult(
        contract = ScanContract()
    ) { result ->
        val content: String = result.contents ?: return@rememberLauncherForActivityResult

        if (isRetailQRContent(content)) {
            val retailProductId: String = parseRetailQRContent(content) ?: ""
            if (retailProductId.isNotBlank()) {
                onRetailScan(retailProductId)
            }
        } else {
            val tracedProductId: String = parseQRContent(content) ?: ""
            if (tracedProductId.isNotBlank()) {
                productId = tracedProductId
                viewModel.traceProduct(tracedProductId)
            }
        }
    }

    val product = uiState.traceProduct
    val verifyData = uiState.verifyData

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            text = "Truy xuất nguồn gốc",
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.primary
        )

        Text(
            text = "Quét mã QR hoặc nhập mã sản phẩm để kiểm tra thông tin trên blockchain",
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(14.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedTextField(
                    value = productId,
                    onValueChange = { productId = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Mã sản phẩm") },
                    placeholder = { Text("VD: PROD001") },
                    singleLine = true,
                    leadingIcon = {
                        Icon(Icons.Filled.Search, contentDescription = null)
                    }
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = {
                            val options = ScanOptions()
                                .setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                                .setPrompt("Quét mã QR sản phẩm")
                                .setCameraId(0)
                                .setBeepEnabled(true)
                                .setBarcodeImageEnabled(false)

                            scanLauncher.launch(options)
                        },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Filled.QrCodeScanner, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Quét QR")
                    }

                    Button(
                        onClick = {
                            if (productId.isNotBlank()) {
                                viewModel.traceProduct(productId.trim())
                            }
                        },
                        modifier = Modifier.weight(1f).height(48.dp),
                        enabled = productId.isNotBlank() && !uiState.isLoading,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Filled.CameraAlt, contentDescription = null)
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Tra cứu")
                    }
                }
            }
        }

        if (uiState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 24.dp),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        if (uiState.error != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.errorContainer
                )
            ) {
                Text(
                    text = uiState.error!!,
                    modifier = Modifier.padding(14.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer,
                    fontSize = 13.sp
                )
            }
        }

        if (verifyData != null) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (verifyData.isAuthentic) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                )
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Filled.Verified,
                        contentDescription = null,
                        tint = if (verifyData.isAuthentic) Color(0xFF2E7D32) else Color(0xFFC62828),
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = if (verifyData.isAuthentic) "Sản phẩm hợp lệ" else "Không xác thực được",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = if (verifyData.isAuthentic) Color(0xFF2E7D32) else Color(0xFFC62828)
                        )
                        Text(
                            text = "Dữ liệu được kiểm tra trên blockchain",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                TraceStatCard(
                    value = verifyData.totalTransfers.toString(),
                    label = "Chuyển giao",
                    modifier = Modifier.weight(1f)
                )
                TraceStatCard(
                    value = verifyData.totalUpdates.toString(),
                    label = "Cập nhật",
                    modifier = Modifier.weight(1f)
                )
            }
        }

        if (product != null) {
            if (!product.imageHash.isNullOrBlank()) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                ) {
                    AsyncImage(
                        model = viewModel.getProductImageUrl(product.id),
                        contentDescription = "Product Image",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(220.dp),
                        contentScale = ContentScale.Crop
                    )
                }
            }

            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = product.name,
                                fontWeight = FontWeight.Bold,
                                fontSize = 20.sp
                            )
                            Text(
                                text = product.id,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        StatusBadge(product.currentStatus)
                    }

                    HorizontalDivider()

                    TraceInfoRow("Loại sản phẩm", product.productType)
                    TraceInfoRow("Nguồn gốc", product.origin)
                    TraceInfoRow("Chủ sở hữu hiện tại", product.currentOwner)
                    TraceInfoRow("Lô hàng", product.batchNumber)
                    TraceInfoRow("Số lượng", "${product.quantity} ${product.unit}")
                    TraceInfoRow("Giá", "${product.price} VNĐ/${product.unit}")

                    if (!product.description.isNullOrBlank()) {
                        TraceInfoRow("Mô tả", product.description)
                    }
                }
            }

            if (!product.statusHistory.isNullOrEmpty()) {
                Text(
                    text = "Lịch sử trạng thái",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 16.sp
                )

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(
                        modifier = Modifier.padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        product.statusHistory.reversed().forEach { record ->
                            TraceTimelineItem(record)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TraceInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            fontSize = 13.sp,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(0.9f)
        )
        Text(
            text = value,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            modifier = Modifier.weight(1.1f)
        )
    }
}

@Composable
fun TraceStatCard(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    valueColor: Color = MaterialTheme.colorScheme.primary
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                fontWeight = FontWeight.Bold,
                fontSize = 18.sp,
                color = valueColor
            )
            Text(
                text = label,
                fontSize = 11.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun TraceTimelineItem(record: StatusRecord) {
    val info = getStatusInfo(record.status)

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(containerColor = info.bgColor)
    ) {
        Column(modifier = Modifier.padding(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                StatusBadge(record.status)
                Text(
                    text = record.timestamp.take(10),
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "${record.location}  ·  ${record.updatedBy}",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                text = record.description,
                fontSize = 12.sp
            )

            if (!record.temperature.isNullOrBlank()) {
                Text(
                    text = "${record.temperature}°C  ·  ${record.humidity}%",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}