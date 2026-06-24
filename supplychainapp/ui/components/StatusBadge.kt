package com.example.supplychainapp.ui.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

data class StatusInfo(
    val label: String,
    val color: Color,
    val bgColor: Color
)

fun getStatusInfo(status: String): StatusInfo {
    return when (status) {
        "CREATED" -> StatusInfo("Khởi tạo", Color(0xFF1565C0), Color(0xFFBBDEFB))
        "HARVESTED" -> StatusInfo("Đã thu hoạch", Color(0xFF2E7D32), Color(0xFFC8E6C9))
        "PROCESSED" -> StatusInfo("Đã chế biến", Color(0xFFE65100), Color(0xFFFFE0B2))
        "PACKAGED" -> StatusInfo("Đã đóng gói", Color(0xFF00838F), Color(0xFFB2EBF2))
        "IN_TRANSIT" -> StatusInfo("Đang vận chuyển", Color(0xFF6A1B9A), Color(0xFFE1BEE7))
        "WAREHOUSED" -> StatusInfo("Đã nhập kho", Color(0xFF283593), Color(0xFFC5CAE9))
        "DISTRIBUTED" -> StatusInfo("Đã phân phối", Color(0xFFAD1457), Color(0xFFF8BBD0))
        "IN_STORE" -> StatusInfo("Tại cửa hàng", Color(0xFFF9A825), Color(0xFFFFF9C4))
        "SOLD" -> StatusInfo("Đã bán", Color(0xFFD32F2F), Color(0xFFFFCDD2))
        else -> StatusInfo(status, Color.Gray, Color.LightGray)
    }
}

fun getRoleLabel(role: String): String {
    return when (role) {
        "PRODUCER" -> "Nhà sản xuất"
        "PROCESSOR" -> "Nhà chế biến"
        "TRANSPORTER" -> "Đơn vị vận chuyển"
        "DISTRIBUTOR" -> "Nhà phân phối"
        "RETAILER" -> "Nhà bán lẻ"
        "ADMIN" -> "Quản trị viên"
        else -> role
    }
}

// Gợi ý vai trò tiếp theo trong chuỗi cung ứng
fun getNextRoles(currentOwnerRole: String): List<String> {
    return when (currentOwnerRole) {
        "PRODUCER" -> listOf("PROCESSOR")
        "PROCESSOR" -> listOf("TRANSPORTER")
        "TRANSPORTER" -> listOf("DISTRIBUTOR")
        "DISTRIBUTOR" -> listOf("RETAILER")
        "RETAILER" -> emptyList()
        "ADMIN" -> listOf("PRODUCER", "PROCESSOR", "TRANSPORTER", "DISTRIBUTOR", "RETAILER")
        else -> emptyList()
    }
}

@Composable
fun StatusBadge(status: String, modifier: Modifier = Modifier) {
    val info = getStatusInfo(status)
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        color = info.bgColor
    ) {
        Text(
            text = info.label,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            color = info.color,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}