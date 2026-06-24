package com.example.supplychainapp.ui.components

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.unit.dp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter

const val SERVER_URL = "https://lamprophyric-janina-intracranial.ngrok-free.dev"

fun buildQRContent(productId: String, batchNumber: String = "", productName: String = ""): String {
    return "$SERVER_URL/trace/$productId"
}

fun buildRetailQRContent(productId: String): String {
    return "RETAIL:$productId"
}

fun isRetailQRContent(scannedContent: String): Boolean {
    return scannedContent.trim().startsWith("RETAIL:", ignoreCase = true)
            || scannedContent.contains("/retail/scan/")
}

fun parseRetailQRContent(scannedContent: String): String? {
    val content = scannedContent.trim()
    return when {
        content.startsWith("RETAIL:", ignoreCase = true) -> content.substringAfter(":").trim()
        content.contains("/retail/scan/") -> content.substringAfterLast("/retail/scan/").trim()
        else -> null
    }
}

fun parseQRContent(scannedContent: String): String? {
    val retailId = parseRetailQRContent(scannedContent)
    if (!retailId.isNullOrBlank()) return retailId
    return when {
        scannedContent.contains("/trace/") -> scannedContent.substringAfterLast("/trace/")
        scannedContent.contains("/products/") -> scannedContent.substringAfterLast("/products/")
        scannedContent.startsWith("PROD") -> scannedContent.trim()
        scannedContent.startsWith("http") -> scannedContent.substringAfterLast("/")
        else -> scannedContent.trim()
    }
}

@Composable
fun QRCodeImage(content: String, size: Int = 200) {
    val bitmap = remember(content) { generateQRCode(content, size) }
    if (bitmap != null) {
        Image(bitmap = bitmap.asImageBitmap(), contentDescription = "QR Code", modifier = Modifier.size(size.dp))
    }
}

fun generateQRCode(content: String, size: Int): Bitmap? {
    return try {
        val writer = QRCodeWriter()
        val bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, size, size)
        val w = bitMatrix.width
        val h = bitMatrix.height
        val bmp = Bitmap.createBitmap(w, h, Bitmap.Config.RGB_565)
        for (x in 0 until w) {
            for (y in 0 until h) {
                bmp.setPixel(x, y, if (bitMatrix.get(x, y)) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
            }
        }
        bmp
    } catch (e: Exception) { null }
}