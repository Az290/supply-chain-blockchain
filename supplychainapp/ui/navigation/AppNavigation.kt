package com.example.supplychainapp.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavType
import androidx.navigation.compose.*
import androidx.navigation.navArgument
import com.example.supplychainapp.ui.MainViewModel
import com.example.supplychainapp.ui.components.BottomNavBar
import com.example.supplychainapp.ui.screens.*

@Composable
fun AppNavigation(viewModel: MainViewModel) {
    val uiState by viewModel.uiState.collectAsState()
    val navController = rememberNavController()
    val currentBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentBackStackEntry?.destination?.route ?: "home"

    // Snackbar
    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(uiState.message) {
        if (uiState.message != null) {
            snackbarHostState.showSnackbar(uiState.message!!)
            viewModel.clearMessage()
        }
    }
    LaunchedEffect(uiState.error) {
        if (uiState.error != null) {
            snackbarHostState.showSnackbar(uiState.error!!)
            viewModel.clearMessage()
        }
    }

    // Auth flow (not logged in)
    if (!uiState.isLoggedIn) {
        val authNavController = rememberNavController()

        NavHost(
            navController = authNavController,
            startDestination = "login"
        ) {
            composable("login") {
                LoginScreen(
                    viewModel = viewModel,
                    onNavigateToForgotPassword = { authNavController.navigate("forgot_password") }
                )
            }

            composable("forgot_password") {
                ForgotPasswordScreen(
                    isLoading = uiState.isLoading,
                    errorMessage = uiState.error,
                    successMessage = uiState.message,
                    onRequestOTP = { userId, email -> viewModel.forgotPassword(userId, email) },
                    onResetPassword = { userId, otp, newPassword ->
                        viewModel.resetPassword(userId, otp, newPassword)
                    },
                    onNavigateBack = { authNavController.popBackStack() }
                )
            }
        }
        return
    }

    if (uiState.requirePasswordChange) {
        ForceChangePasswordScreen(
            isLoading = uiState.isLoading,
            errorMessage = uiState.error,
            onChangePassword = { currentPassword, newPassword ->
                viewModel.changePassword(currentPassword, newPassword)
            },
            onLogout = { viewModel.logout() }
        )
        return
    }

    val showBottomBar = currentRoute in listOf("home", "products", "scan", "participants", "profile")

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        bottomBar = {
            if (showBottomBar) {
                BottomNavBar(
                    currentRoute = currentRoute,
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo("home") { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(padding)
        ) {
            composable("home") {
                HomeScreen(viewModel = viewModel)
            }

            composable("products") {
                ProductListScreen(
                    viewModel = viewModel,
                    onProductClick = { id -> navController.navigate("product/$id") },
                    onCreateClick = { navController.navigate("create_product") }
                )
            }

            composable("scan") {
                TraceScreen(
                    viewModel = viewModel,
                    onRetailScan = { id -> navController.navigate("retail_sale/$id") }
                )
            }

            composable("participants") {
                ParticipantScreen(viewModel = viewModel)
            }

            composable("profile") {
                ProfileScreen(viewModel = viewModel)
            }

            composable(
                "product/{productId}",
                arguments = listOf(navArgument("productId") { type = NavType.StringType })
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: ""
                ProductDetailScreen(
                    viewModel = viewModel,
                    productId = productId,
                    onBack = { navController.popBackStack() },
                    onTransfer = { id -> navController.navigate("transfer/$id") },
                    onRetailSale = { id -> navController.navigate("retail_sale/$id") },
                    onHistory = { id -> navController.navigate("history/$id") }
                )
            }

            composable("create_product") {
                CreateProductScreen(
                    viewModel = viewModel,
                    onBack = { navController.popBackStack() }
                )
            }


            composable(
                "transfer/{productId}",
                arguments = listOf(navArgument("productId") { type = NavType.StringType })
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: ""
                TransferScreen(
                    viewModel = viewModel,
                    productId = productId,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(
                "retail_sale/{productId}",
                arguments = listOf(navArgument("productId") { type = NavType.StringType })
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: ""
                RetailSaleScreen(
                    viewModel = viewModel,
                    productId = productId,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(
                "history/{productId}",
                arguments = listOf(navArgument("productId") { type = NavType.StringType })
            ) { backStackEntry ->
                val productId = backStackEntry.arguments?.getString("productId") ?: ""
                HistoryScreen(
                    viewModel = viewModel,
                    productId = productId,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}