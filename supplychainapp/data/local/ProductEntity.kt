package com.example.supplychainapp.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val productType: String,
    val origin: String,
    val currentOwner: String,
    val currentStatus: String,
    val createdAt: String,
    val updatedAt: String,
    val batchNumber: String,
    val quantity: Int,
    val unit: String,
    val price: Double,
    val description: String?,
    val imageHash: String?,
    val certificateHash: String?
)