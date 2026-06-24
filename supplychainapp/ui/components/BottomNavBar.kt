package com.example.supplychainapp.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector

data class BottomNavItem(val route: String, val label: String, val icon: ImageVector)

val bottomNavItems = listOf(
    BottomNavItem("home", "Trang chủ", Icons.Filled.Home),
    BottomNavItem("products", "Sản phẩm", Icons.Filled.Inventory2),
    BottomNavItem("scan", "Quét QR", Icons.Filled.QrCodeScanner),
    BottomNavItem("participants", "Thành viên", Icons.Filled.Group),
    BottomNavItem("profile", "Cá nhân", Icons.Filled.Person)
)

@Composable
fun BottomNavBar(currentRoute: String, onNavigate: (String) -> Unit) {
    NavigationBar {
        bottomNavItems.forEach { item ->
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
                selected = currentRoute == item.route,
                onClick = { onNavigate(item.route) }
            )
        }
    }
}