package com.example.supplychainapp.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.LoadingDialog
import com.example.supplychainapp.ui.utils.FileUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreateProductScreen(
    viewModel: MainViewModel,
    onBack: () -> Unit
) {
    var id by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var productType by remember { mutableStateOf("Nông sản") }
    var origin by remember { mutableStateOf("") }
    var batchNumber by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("") }
    var unit by remember { mutableStateOf("kg") }
    var price by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var selectedCertUri by remember { mutableStateOf<Uri?>(null) }

    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    // Image picker launcher
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    // Certificate picker launcher
    val certPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedCertUri = uri
    }

    if (uiState.isLoading) {
        LoadingDialog("Đang tạo sản phẩm trên Blockchain...")
    }

    LaunchedEffect(uiState.navigateBack) {
        if (uiState.navigateBack) {
            viewModel.clearMessage()
            onBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tạo sản phẩm mới") },
                navigationIcon = {
                    IconButton(onClick = onBack) { Icon(Icons.Filled.ArrowBack, "Quay lại") }
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
            OutlinedTextField(
                value = id, onValueChange = { id = it },
                label = { Text("Mã sản phẩm *") }, placeholder = { Text("VD: PROD010") },
                leadingIcon = { Icon(Icons.Filled.QrCode2, null) },
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
            OutlinedTextField(
                value = name, onValueChange = { name = it },
                label = { Text("Tên sản phẩm *") }, placeholder = { Text("VD: Xoài Cát Hòa Lộc") },
                leadingIcon = { Icon(Icons.Filled.Inventory2, null) },
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
            OutlinedTextField(
                value = productType, onValueChange = { productType = it },
                label = { Text("Loại sản phẩm *") },
                leadingIcon = { Icon(Icons.Filled.Category, null) },
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
            OutlinedTextField(
                value = origin, onValueChange = { origin = it },
                label = { Text("Xuất xứ *") }, placeholder = { Text("VD: Đồng Tháp, Việt Nam") },
                leadingIcon = { Icon(Icons.Filled.LocationOn, null) },
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
            OutlinedTextField(
                value = batchNumber, onValueChange = { batchNumber = it },
                label = { Text("Mã lô hàng *") }, placeholder = { Text("VD: BATCH-2025-010") },
                leadingIcon = { Icon(Icons.Filled.Numbers, null) },
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = quantity, onValueChange = { quantity = it },
                    label = { Text("Số lượng *") },
                    leadingIcon = { Icon(Icons.Filled.Scale, null) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f), singleLine = true
                )
                OutlinedTextField(
                    value = unit, onValueChange = { unit = it },
                    label = { Text("Đơn vị") },
                    modifier = Modifier.weight(0.5f), singleLine = true
                )
            }
            OutlinedTextField(
                value = price, onValueChange = { price = it },
                label = { Text("Giá (VNĐ)") }, placeholder = { Text("VD: 35000") },
                leadingIcon = { Icon(Icons.Filled.AttachMoney, null) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.fillMaxWidth(), singleLine = true
            )
            OutlinedTextField(
                value = description, onValueChange = { description = it },
                label = { Text("Mô tả") },
                leadingIcon = { Icon(Icons.Filled.Description, null) },
                modifier = Modifier.fillMaxWidth(), minLines = 2, maxLines = 4
            )

            // ===== IMAGE UPLOAD SECTION =====
            Text("Hình ảnh sản phẩm", fontWeight = FontWeight.Medium, modifier = Modifier.padding(top = 8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { imagePickerLauncher.launch("image/*") },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Filled.Image, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Chọn ảnh")
                }
                if (selectedImageUri != null) {
                    OutlinedButton(
                        onClick = { selectedImageUri = null },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(Icons.Filled.Delete, null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Xóa ảnh")
                    }
                }
            }

            // Image preview
            selectedImageUri?.let { uri ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    AsyncImage(
                        model = uri,
                        contentDescription = "Preview",
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp),
                        contentScale = ContentScale.Crop
                    )
                }
            }

            // ===== CERTIFICATE UPLOAD SECTION =====
            Spacer(modifier = Modifier.height(4.dp))
            Text("Chứng nhận sản phẩm (tùy chọn)", fontWeight = FontWeight.Medium)
            Text(
                "VietGAP, OCOP, ISO, giấy kiểm định chất lượng...",
                fontSize = 12.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(4.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { certPickerLauncher.launch("*/*") },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Filled.UploadFile, null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Chọn chứng nhận")
                }
                if (selectedCertUri != null) {
                    OutlinedButton(
                        onClick = { selectedCertUri = null },
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Icon(Icons.Filled.Delete, null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Xóa")
                    }
                }
            }

            // Certificate preview
            if (selectedCertUri != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Filled.Verified,
                            null,
                            tint = Color(0xFF2E7D32),
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text("Đã chọn file chứng nhận", fontSize = 14.sp, fontWeight = FontWeight.Medium)
                            Text(
                                "Hash sẽ được lưu trên Blockchain",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // ===== NÚT TẠO SẢN PHẨM =====
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = {
                    val imageFile = selectedImageUri?.let { uri ->
                        FileUtils.uriToFile(context, uri, id)
                    }
                    val certFile = selectedCertUri?.let { uri ->
                        FileUtils.uriToFile(context, uri, "${id}_cert")
                    }

                    when {
                        // Co anh VA co chung nhan
                        imageFile != null && certFile != null -> {
                            viewModel.createProductWithImageAndCertificate(
                                id = id, name = name, productType = productType,
                                origin = origin, batchNumber = batchNumber,
                                quantity = quantity.toIntOrNull() ?: 0, unit = unit,
                                price = price.toDoubleOrNull() ?: 0.0,
                                description = description,
                                imageFile = imageFile, certFile = certFile
                            )
                        }
                        // Chi co anh, khong co chung nhan
                        imageFile != null -> {
                            viewModel.createProductWithImage(
                                id = id, name = name, productType = productType,
                                origin = origin, batchNumber = batchNumber,
                                quantity = quantity.toIntOrNull() ?: 0, unit = unit,
                                price = price.toDoubleOrNull() ?: 0.0,
                                description = description, imageFile = imageFile
                            )
                        }
                        // Khong co anh, CO chung nhan
                        certFile != null -> {
                            viewModel.createProductWithCertificate(
                                id = id, name = name, productType = productType,
                                origin = origin, batchNumber = batchNumber,
                                quantity = quantity.toIntOrNull() ?: 0, unit = unit,
                                price = price.toDoubleOrNull() ?: 0.0,
                                description = description, certFile = certFile
                            )
                        }
                        // Khong co gi ca
                        else -> {
                            viewModel.createProduct(
                                id = id, name = name, productType = productType,
                                origin = origin, batchNumber = batchNumber,
                                quantity = quantity.toIntOrNull() ?: 0, unit = unit,
                                price = price.toDoubleOrNull() ?: 0.0,
                                description = description
                            )
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                enabled = id.isNotBlank() && name.isNotBlank() && origin.isNotBlank()
                        && batchNumber.isNotBlank() && quantity.isNotBlank() && !uiState.isLoading
            ) {
                Icon(Icons.Filled.Add, null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Tạo sản phẩm")
            }

            if (uiState.error != null) {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer)) {
                    Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Filled.Error, null, tint = MaterialTheme.colorScheme.onErrorContainer)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(uiState.error!!, color = MaterialTheme.colorScheme.onErrorContainer)
                    }
                }
            }
        }
    }
}