package com.example.supplychainapp.data.local

import androidx.room.*

@Dao
interface ProductDao {

    @Query("SELECT * FROM products ORDER BY updatedAt DESC")
    suspend fun getAllProducts(): List<ProductEntity>

    @Query("SELECT * FROM products WHERE id = :id")
    suspend fun getProductById(id: String): ProductEntity?

    @Query("SELECT * FROM products WHERE currentStatus = :status")
    suspend fun getProductsByStatus(status: String): List<ProductEntity>

    @Query("SELECT * FROM products WHERE currentOwner = :owner")
    suspend fun getProductsByOwner(owner: String): List<ProductEntity>

    @Query("SELECT * FROM products WHERE name LIKE '%' || :keyword || '%' OR origin LIKE '%' || :keyword || '%'")
    suspend fun searchProducts(keyword: String): List<ProductEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProduct(product: ProductEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertProducts(products: List<ProductEntity>)

    @Delete
    suspend fun deleteProduct(product: ProductEntity)

    @Query("DELETE FROM products")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM products")
    suspend fun getCount(): Int
}