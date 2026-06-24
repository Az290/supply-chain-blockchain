package com.example.supplychainapp.ui.screens

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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.LoadingDialog
import com.example.supplychainapp.ui.components.getRoleLabel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TransferScreen(
    viewModel: MainViewModel,
    productId: String,
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedOwner by remember { mutableStateOf("") }
    var expanded by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadParticipants()
    }

    if (uiState.isLoading) {
        LoadingDialog("Đang chuyển giao trên Blockchain...")
    }

    LaunchedEffect(uiState.navigateBack) {
        if (uiState.navigateBack) {
            viewModel.clearMessage()
            onBack()
        }
    }

    // === SUA: Loc participants theo role hop le ===
    val validRole = viewModel.getValidTransferRecipientRole()
    val participants = uiState.participants.filter { participant ->
        participant.id != uiState.userId &&
                participant.isActive != false &&
                (validRole == null || participant.role == validRole)
    }

    val selectedParticipant = participants.find { it.id == selectedOwner }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Chuyển giao sản phẩm") },
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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                "Sản phẩm: $productId",
                fontSize = 13.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            // === MOI: Hien thi thong tin role hop le ===
            if (validRole != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.tertiaryContainer
                    )
                ) {
                    Text(
                        "Chỉ được chuyển giao cho: ${getRoleLabel(validRole)}",
                        modifier = Modifier.padding(12.dp),
                        fontSize = 13.sp,
                        color = MaterialTheme.colorScheme.onTertiaryContainer,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Dropdown chon nguoi nhan
            ExposedDropdownMenuBox(
                expanded = expanded,
                onExpandedChange = { expanded = !expanded }
            ) {
                OutlinedTextField(
                    value = if (selectedParticipant != null)
                        "${selectedParticipant.name} (${selectedParticipant.id})"
                    else "",
                    onValueChange = {},
                    readOnly = true,
                    label = { Text("Chọn người nhận *") },
                    placeholder = { Text("Chọn thành viên...") },
                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                    modifier = Modifier.fillMaxWidth().menuAnchor(),
                    shape = RoundedCornerShape(10.dp)
                )

                ExposedDropdownMenu(
                    expanded = expanded,
                    onDismissRequest = { expanded = false }
                ) {
                    if (participants.isEmpty()) {
                        DropdownMenuItem(
                            text = { Text("Không có thành viên", color = MaterialTheme.colorScheme.onSurfaceVariant) },
                            onClick = {}
                        )
                    } else {
                        participants.forEach { participant ->
                            DropdownMenuItem(
                                text = {
                                    Column {
                                        Text(participant.name, fontWeight = FontWeight.Medium, fontSize = 14.sp)
                                        Text(
                                            "${participant.id}  ·  ${getRoleLabel(participant.role)}",
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                },
                                onClick = {
                                    selectedOwner = participant.id
                                    expanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Preview nguoi nhan da chon
            if (selectedParticipant != null) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.secondaryContainer
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Người nhận",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f),
                            fontWeight = FontWeight.Medium
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            selectedParticipant.name,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = MaterialTheme.colorScheme.onSecondaryContainer
                        )
                        Text(
                            "${selectedParticipant.id}  ·  ${getRoleLabel(selectedParticipant.role)}",
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.8f)
                        )
                        if (selectedParticipant.location.isNotBlank()) {
                            Text(
                                selectedParticipant.location,
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { viewModel.transferOwnership(productId, selectedOwner) },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                enabled = selectedOwner.isNotBlank() && !uiState.isLoading,
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Xác nhận chuyển giao", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
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
        }
    }
}