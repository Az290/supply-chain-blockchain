package com.example.supplychainapp.ui.screens

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.LoadingDialog
import com.example.supplychainapp.ui.components.getStatusInfo
import com.example.supplychainapp.ui.utils.FileUtils

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UpdateStatusScreen(
    viewModel: MainViewModel,
    productId: String,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    val allStatuses = listOf(
        "CREATED", "HARVESTED", "PROCESSED", "PACKAGED",
        "IN_TRANSIT", "WAREHOUSED", "DISTRIBUTED", "IN_STORE", "SOLD"
    )
    val allowedStatuses = allStatuses.filter { viewModel.canUpdateStatus(it) }

    var selectedStatus by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var temperature by remember { mutableStateOf("") }
    var humidity by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }

    val context = LocalContext.current

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? -> selectedImageUri = uri }

    val humidityValue = humidity.toDoubleOrNull() ?: 0.0
    val temperatureValue = temperature.toDoubleOrNull() ?: 0.0
    val humidityError = humidity.isNotBlank() && (humidityValue < 0 || humidityValue > 100)
    val temperatureError = temperature.isNotBlank() && (temperatureValue < -40 || temperatureValue > 60)

    if (uiState.isLoading) {
        LoadingDialog("Đang cập nhật trạng thái trên Blockchain...")
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
                title = { Text("Cập nhật trạng thái") },
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
            // Header card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer)
            ) {
                Text(
                    "Sản phẩm: $productId",
                    modifier = Modifier.padding(16.dp),
                    style = MaterialTheme.typography.titleMedium
                )
            }

            // Status dropdown
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = it }
            ) {
                OutlinedTextField(
                    value = if (selectedStatus.isNotBlank()) getStatusInfo(selectedStatus).label else "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Trạng thái mới *") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                    modifier = Modifier.fillMaxWidth().menuAnchor(),
                    shape = RoundedCornerShape(10.dp)
                )
                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    allowedStatuses.forEach { status ->
                        val info = getStatusInfo(status)
                        DropdownMenuItem(
                            text = { Text(info.label) },
                            onClick = { selectedStatus = status; expanded = false }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = location,
                onValueChange = { location = it },
                label = { Text("Địa điểm *") },
                placeholder = { Text("VD: Sóc Trăng") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(10.dp)
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Mô tả *") },
                placeholder = { Text("VD: Thu hoạch vụ Đông Xuân") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                shape = RoundedCornerShape(10.dp)
            )

            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = temperature,
                    onValueChange = { temperature = it },
                    label = { Text("Nhiệt độ (°C)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = temperatureError,
                    supportingText = if (temperatureError) { { Text("Từ -40 đến 60°C") } } else null,
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp)
                )
                OutlinedTextField(
                    value = humidity,
                    onValueChange = { humidity = it },
                    label = { Text("Độ ẩm (%)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    isError = humidityError,
                    supportingText = if (humidityError) { { Text("Từ 0 đến 100%") } } else null,
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    shape = RoundedCornerShape(10.dp)
                )
            }

            // Ảnh đính kèm
            Text("Ảnh đính kèm (tùy chọn)", fontSize = 13.sp, fontWeight = FontWeight.Medium)
            if (selectedImageUri != null) {
                Card(modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                    AsyncImage(
                        model = selectedImageUri,
                        contentDescription = "Preview",
                        modifier = Modifier.fillMaxWidth().height(180.dp),
                        contentScale = ContentScale.Crop
                    )
                }
                OutlinedButton(
                    onClick = { selectedImageUri = null },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Xóa ảnh")
                }
            } else {
                OutlinedButton(
                    onClick = { imagePickerLauncher.launch("image/*") },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Filled.Image, null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Chọn ảnh")
                }
            }

            Spacer(modifier = Modifier.height(4.dp))

            Button(
                onClick = {
                    val imageFile = selectedImageUri?.let { uri ->
                        FileUtils.uriToFile(context, uri, "${productId}_status")
                    }
                    if (imageFile != null) {
                        viewModel.updateStatusWithImage(
                            productId = productId,
                            status = selectedStatus,
                            location = location,
                            description = description,
                            temperature = temperature,
                            humidity = humidity,
                            imageFile = imageFile
                        )
                    } else {
                        viewModel.updateStatus(
                            productId = productId,
                            status = selectedStatus,
                            location = location,
                            description = description,
                            temperature = temperature,
                            humidity = humidity
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = selectedStatus.isNotBlank() && location.isNotBlank()
                        && description.isNotBlank() && !uiState.isLoading
                        && !humidityError && !temperatureError,
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Cập nhật trạng thái", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
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

            Spacer(modifier = Modifier.height(16.dp))
        }
    }
}