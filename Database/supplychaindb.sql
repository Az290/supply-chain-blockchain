-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 23, 2026 lúc 02:28 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `supplychain_db`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `action` varchar(50) NOT NULL,
  `resource_type` varchar(30) NOT NULL,
  `resource_id` varchar(50) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `blockchain_tx_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_id`, `action`, `resource_type`, `resource_id`, `details`, `ip_address`, `blockchain_tx_id`, `created_at`) VALUES
(1, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 12:42:38'),
(2, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:02:32'),
(3, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:03:39'),
(4, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-15 20:04:14'),
(5, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:04:26'),
(6, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:08:42'),
(7, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-15 20:09:45'),
(8, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:09:56'),
(9, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:23:50'),
(10, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-15 20:32:06'),
(11, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:32:38'),
(12, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-15 20:32:41'),
(13, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:33:10'),
(14, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:33:57'),
(15, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-15 20:36:35'),
(16, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-15 20:36:45'),
(17, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-16 01:36:50'),
(18, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-16 01:38:47'),
(19, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-17 03:03:46'),
(20, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-19 23:13:19'),
(21, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 01:59:10'),
(22, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:04:24'),
(23, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:05:30'),
(24, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:08:03'),
(25, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 02:08:21'),
(26, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:08:30'),
(27, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 02:09:56'),
(28, 'VC001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:10:05'),
(29, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:13:31'),
(30, 'VC001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 02:18:56'),
(31, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:19:13'),
(32, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 02:19:32'),
(33, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 03:12:54'),
(34, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:43:52'),
(35, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 06:44:38'),
(36, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:44:46'),
(37, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 06:44:58'),
(38, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:45:07'),
(39, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:46:23'),
(40, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 06:47:46'),
(41, 'PP001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:47:55'),
(42, 'PP001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 06:48:02'),
(43, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:48:10'),
(44, 'BL001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 06:48:15'),
(45, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:48:22'),
(46, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:48:49'),
(47, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 06:49:09'),
(48, 'VC001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 06:49:17'),
(49, 'VC001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:20:42'),
(50, 'VC001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 07:21:15'),
(51, 'PP001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:21:30'),
(52, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:22:10'),
(53, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:30:03'),
(54, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:41:40'),
(55, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:42:55'),
(56, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 07:43:57'),
(57, 'VC001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:44:54'),
(58, 'VC001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 07:45:32'),
(59, 'PP001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:45:42'),
(60, 'PP001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 07:46:46'),
(61, 'PP001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:47:04'),
(62, 'PP001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 07:49:03'),
(63, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 07:49:12'),
(64, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 08:00:08'),
(65, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 08:30:14'),
(66, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 09:00:17'),
(67, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 09:17:21'),
(68, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 09:30:16'),
(69, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 09:52:35'),
(70, 'BL001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-20 09:58:15'),
(71, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 09:58:25'),
(72, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 22:37:45'),
(73, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-20 22:52:46'),
(74, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 00:23:20'),
(75, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 00:23:26'),
(76, 'ADMIN', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 00:28:41'),
(77, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:04:35'),
(78, 'BL001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:05:03'),
(79, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:05:12'),
(80, 'BL001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:07:00'),
(81, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:07:14'),
(82, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:11:40'),
(83, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:11:48'),
(84, 'BL001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:14:05'),
(85, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:14:17'),
(86, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:14:30'),
(87, 'NSX001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:55:49'),
(88, 'NSX001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:57:19'),
(89, 'CB001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:57:27'),
(90, 'CB001', 'LOGOUT', 'AUTH', '', 'User logged out', '127.0.0.1', '', '2026-05-21 01:58:18'),
(91, 'BL001', 'LOGIN', 'AUTH', '', 'User logged in', '127.0.0.1', '', '2026-05-21 01:58:27');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `title` varchar(200) NOT NULL,
  `message` text DEFAULT NULL,
  `type` enum('STATUS_UPDATE','TRANSFER','SYSTEM','ALERT','REGISTRATION') NOT NULL,
  `related_product_id` varchar(50) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `products_cache`
--

CREATE TABLE `products_cache` (
  `id` varchar(50) NOT NULL,
  `name` varchar(200) NOT NULL,
  `product_type` varchar(100) DEFAULT NULL,
  `origin` varchar(200) DEFAULT NULL,
  `current_owner` varchar(50) DEFAULT NULL,
  `current_status` varchar(20) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `unit` varchar(20) DEFAULT NULL,
  `price` decimal(15,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `image_hash` varchar(100) DEFAULT NULL,
  `certificate_hash` varchar(100) DEFAULT NULL,
  `blockchain_tx_id` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `token` text NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `registration_requests`
--

CREATE TABLE `registration_requests` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('PRODUCER','PROCESSOR','TRANSPORTER','DISTRIBUTOR','RETAILER') NOT NULL,
  `organization` varchar(50) NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `status` enum('OTP_PENDING','PENDING','APPROVED','REJECTED') DEFAULT 'OTP_PENDING',
  `reject_reason` text DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `registration_requests`
--

INSERT INTO `registration_requests` (`id`, `user_id`, `name`, `password_hash`, `role`, `organization`, `location`, `phone`, `email`, `otp_code`, `otp_expires_at`, `status`, `reject_reason`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, '', 'Giao Hàng Tiết Kiệm', '$2b$10$W6WDjqoRqeK0n/TyFEhsFuaKyA3OvJpzSMXaQnYJjx9FQM/kzcFzq', 'TRANSPORTER', 'Org2', 'Cà Mau', '0871498756', 'lenhhung765@gmail.com', '981784', '2026-05-19 16:25:49', 'OTP_PENDING', NULL, NULL, '2026-05-19 23:20:49', '2026-05-19 23:20:49'),
(2, '', 'Giao Hàng Tiết Kiệm ', '$2b$10$w/sIFW5iZsGLcCQhZKhJ6OGvrI/aCy6RJH.GlSHOZxxMN.DYqzZMu', 'TRANSPORTER', 'Org2', 'Cà Mau', '0871478872', 'lenhhung765@gmail.com', '766453', '2026-05-19 16:28:24', 'OTP_PENDING', NULL, NULL, '2026-05-19 23:23:24', '2026-05-19 23:23:24');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `retail_payments`
--

CREATE TABLE `retail_payments` (
  `id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `product_id` varchar(50) NOT NULL,
  `retailer_id` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `status` enum('PENDING','PAID','FAILED','CANCELLED') DEFAULT 'PENDING',
  `vnp_txn_ref` varchar(100) DEFAULT NULL,
  `vnp_transaction_no` varchar(100) DEFAULT NULL,
  `vnp_response_code` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `paid_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `retail_payments`
--

INSERT INTO `retail_payments` (`id`, `order_id`, `product_id`, `retailer_id`, `quantity`, `unit_price`, `amount`, `status`, `vnp_txn_ref`, `vnp_transaction_no`, `vnp_response_code`, `created_at`, `paid_at`) VALUES
(1, 'SALE_PROD005_BL001_1779265826390', 'PROD005', 'BL001', 1, 32000.00, 32000.00, 'PENDING', 'SALE_PROD005_BL001_1779265826390', NULL, NULL, '2026-05-20 08:30:26', NULL),
(2, 'SALE_PROD005_BL001_1779265850944', 'PROD005', 'BL001', 10, 32000.00, 320000.00, 'PENDING', 'SALE_PROD005_BL001_1779265850944', NULL, NULL, '2026-05-20 08:30:50', NULL),
(3, 'SALE_PROD005_BL001_1779265925850', 'PROD005', 'BL001', 10, 32000.00, 320000.00, 'PENDING', 'SALE_PROD005_BL001_1779265925850', NULL, NULL, '2026-05-20 08:32:05', NULL),
(4, 'SALE_PROD005_BL001_1779267629472', 'PROD005', 'BL001', 10, 32000.00, 320000.00, 'PENDING', 'SALE_PROD005_BL001_1779267629472', NULL, NULL, '2026-05-20 09:00:29', NULL),
(5, 'SALE_PROD005_BL001_1779268651957', 'PROD005', 'BL001', 1, 32000.00, 32000.00, 'PENDING', 'SALE_PROD005_BL001_1779268651957', NULL, NULL, '2026-05-20 09:17:31', NULL),
(6, 'SALE_PROD005_BL001_1779268658073', 'PROD005', 'BL001', 10, 32000.00, 320000.00, 'PENDING', 'SALE_PROD005_BL001_1779268658073', NULL, NULL, '2026-05-20 09:17:38', NULL),
(7, 'SALE_PROD005_BL001_1779269427185', 'PROD005', 'BL001', 15, 32000.00, 480000.00, 'PENDING', 'SALE_PROD005_BL001_1779269427185', NULL, NULL, '2026-05-20 09:30:27', NULL),
(8, 'SALE_PROD005_BL001_1779270795264', 'PROD005', 'BL001', 15, 32000.00, 480000.00, 'PAID', 'SALE_PROD005_BL001_1779270795264', '15548401', '00', '2026-05-20 09:53:15', '2026-05-20 09:54:13'),
(9, 'SALE_PROD005_BL001_1779326003423', 'PROD005', 'BL001', 1, 32000.00, 32000.00, 'PENDING', 'SALE_PROD005_BL001_1779326003423', NULL, NULL, '2026-05-21 01:13:23', NULL),
(10, 'SALE_PROD005_BL001_1779328719059', 'PROD005', 'BL001', 10, 32000.00, 320000.00, 'PAID', 'SALE_PROD005_BL001_1779328719059', '15549144', '00', '2026-05-21 01:58:39', '2026-05-21 02:00:11');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `uploaded_files`
--

CREATE TABLE `uploaded_files` (
  `id` int(11) NOT NULL,
  `product_id` varchar(50) DEFAULT NULL,
  `file_type` enum('IMAGE','CERTIFICATE','DOCUMENT') NOT NULL,
  `original_name` varchar(255) DEFAULT NULL,
  `stored_name` varchar(255) DEFAULT NULL,
  `file_hash` varchar(100) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `uploaded_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `uploaded_files`
--

INSERT INTO `uploaded_files` (`id`, `product_id`, `file_type`, `original_name`, `stored_name`, `file_hash`, `file_size`, `mime_type`, `uploaded_by`, `created_at`) VALUES
(1, 'PROD001', 'IMAGE', 'PROD001.jpg', '1778875990520-892282974.jpg', 'Qmdbbf4ca1498f7b3c01190ea8b6bae2f79cbd3ee67ac9', 98063, 'image/jpeg', 'NSX001', '2026-05-15 20:13:15'),
(2, 'PROD001', 'CERTIFICATE', 'PROD001_cert.jpg', '1778875996487-79010841.jpg', 'Qm032b36b4064d8c664add0ee813a96b28ea5e5cfcc0dc', 201971, 'image/jpeg', 'anonymous', '2026-05-15 20:13:19'),
(3, 'PROD002', 'IMAGE', 'PROD002.jpg', '1778876117456-290570049.jpg', 'Qma3903b32eda5c5e03e0894717a44b3bae39491abd51c', 18604, 'image/jpeg', 'NSX001', '2026-05-15 20:15:22'),
(4, 'PROD002', 'CERTIFICATE', 'PROD002_cert.jpg', '1778876122736-161811197.jpg', 'Qm04d603f4f5cedb488c8d4fff3952c824620f24936934', 48616, 'image/jpeg', 'anonymous', '2026-05-15 20:15:25'),
(5, 'PROD003', 'IMAGE', 'PROD003.jpg', '1778876215289-968235966.jpg', 'Qm3ca5d08600666a477c53e575ebe014ff74e19ae4a232', 65968, 'image/jpeg', 'NSX001', '2026-05-15 20:17:00'),
(6, 'PROD003', 'CERTIFICATE', 'PROD003_cert.jpg', '1778876220680-295235441.jpg', 'Qm04d603f4f5cedb488c8d4fff3952c824620f24936934', 48616, 'image/jpeg', 'anonymous', '2026-05-15 20:17:03'),
(7, 'PROD004', 'IMAGE', 'PROD004.jpg', '1778876318021-271378759.jpg', 'Qm6622f8e024c6d517be38f0f96493268363389b2c1b27', 121933, 'image/jpeg', 'NSX001', '2026-05-15 20:18:43'),
(8, 'PROD004', 'CERTIFICATE', 'PROD004_cert.jpg', '1778876324113-56477013.jpg', 'Qmacbd502d101a609f83fabbf79f15b806d7a1ed51295c', 196585, 'image/jpeg', 'anonymous', '2026-05-15 20:18:47'),
(9, 'PROD005', 'IMAGE', 'PROD005.jpg', '1778876806404-600848936.jpg', 'Qmb43836d1bd8ca215dfcafa9d68afd7cf94446fd048ef', 124608, 'image/jpeg', 'NSX001', '2026-05-15 20:26:50'),
(10, 'PROD005', 'CERTIFICATE', 'PROD005_cert.jpg', '1778876811344-242817432.jpg', 'Qm04d603f4f5cedb488c8d4fff3952c824620f24936934', 48616, 'image/jpeg', 'anonymous', '2026-05-15 20:26:53'),
(11, 'PROD006', 'IMAGE', 'PROD006.jpg', '1778877381052-444773323.jpg', 'Qmdbbf4ca1498f7b3c01190ea8b6bae2f79cbd3ee67ac9', 98063, 'image/jpeg', 'NSX001', '2026-05-15 20:36:26'),
(12, 'PROD006', 'CERTIFICATE', 'PROD006_cert.jpg', '1778877386725-530982641.jpg', 'Qm032b36b4064d8c664add0ee813a96b28ea5e5cfcc0dc', 201971, 'image/jpeg', 'anonymous', '2026-05-15 20:36:30'),
(13, 'PROD101', 'IMAGE', 'PROD101.jpg', '1779242856503-896075477.jpg', 'Qme25f44461ef07c231da018d8969b18e7387f6947fb6b', 174040, 'image/jpeg', 'NSX001', '2026-05-20 02:07:41'),
(14, 'PROD101', 'CERTIFICATE', 'PROD101_cert.jpg', '1779259537580-599591388.jpg', 'Qm330177f2a24cb741d0ff1604d24ce33d0a8c8750449f', 72700, 'image/jpeg', 'NSX001', '2026-05-20 06:45:39'),
(15, 'PROD100', 'IMAGE', 'PROD100.jpg', '1779271199119-339142507.jpg', 'Qm6622f8e024c6d517be38f0f96493268363389b2c1b27', 121933, 'image/jpeg', 'NSX001', '2026-05-20 10:00:04'),
(16, 'PROD100', 'CERTIFICATE', 'PROD100_cert.jpg', '1779271204713-856489512.jpg', 'Qmacbd502d101a609f83fabbf79f15b806d7a1ed51295c', 196585, 'image/jpeg', 'NSX001', '2026-05-20 10:00:07');

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `users`
--

CREATE TABLE `users` (
  `id` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(100) NOT NULL,
  `role` enum('PRODUCER','PROCESSOR','TRANSPORTER','DISTRIBUTOR','RETAILER','ADMIN') NOT NULL,
  `organization` varchar(50) NOT NULL,
  `location` varchar(200) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `must_change_password` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Đang đổ dữ liệu cho bảng `users`
--

INSERT INTO `users` (`id`, `password_hash`, `name`, `role`, `organization`, `location`, `phone`, `email`, `is_active`, `must_change_password`, `created_at`, `updated_at`) VALUES
('ADMIN', '$2b$10$csqBc2yHfAHIiEntljg2aun85xJjk0b8CONG1B7Z5n5VSGATQcyPO', 'Administrator', 'ADMIN', 'Org1', 'Ha Noi', '0900000000', 'admin@supplychain.vn', 1, 0, '2026-05-15 12:37:23', '2026-05-15 12:42:38'),
('BL001', '$2b$10$hNMUOJmWl4ib/EJwhuGvSOE16l75N4ZZhKvEhjIIfFXmNWJdGjKWe', 'Sieu thi CoopMart', 'RETAILER', 'Org2', 'Ha Noi', '0901234571', 'bl@coop.vn', 1, 0, '2026-05-15 12:37:23', '2026-05-20 02:19:32'),
('CB001', '$2b$10$rZbXFJ43LQdnk6yKLPlZf.PpuhM9rRq.0mrsaK5fVun4WQ7X3NS72', 'Nha may che bien ABC', 'PROCESSOR', 'Org1', 'Can Tho', '0901234568', 'cb@abc.vn', 1, 0, '2026-05-15 12:37:23', '2026-05-15 20:32:38'),
('NSX001', '$2b$10$cqE3Or1HrN4s2fGLHlpcme605C/2j4rgGKstTmQJ1I4yl6fDMrh3O', 'Nong trai Soc Trang', 'PRODUCER', 'Org1', 'Soc Trang', '0901234567', 'nsx@soctrang.vn', 1, 0, '2026-05-15 12:37:23', '2026-05-15 20:03:39'),
('PP001', '$2b$10$iscwSxetEgc7dCEHR7xoA.7g2MNwLphd03AfzDrIuqYHFL7lAd9nq', 'Nha phan phoi MegaMarket', 'DISTRIBUTOR', 'Org2', 'Ha Noi', '0901234570', 'pp@mega.vn', 1, 0, '2026-05-15 12:37:23', '2026-05-20 06:47:55'),
('VC001', '$2b$10$qqDBbImerkjSrvUTU4dU2.77L3A2RCzMQKt1EJUvY0vWqcxI/jdXK', 'Van chuyen VNPost', 'TRANSPORTER', 'Org2', 'Ho Chi Minh', '0901234569', 'vc@vnpost.vn', 1, 0, '2026-05-15 12:37:23', '2026-05-20 02:10:05');

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_action` (`action`),
  ADD KEY `idx_resource` (`resource_type`,`resource_id`),
  ADD KEY `idx_time` (`created_at`);

--
-- Chỉ mục cho bảng `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_read` (`user_id`,`is_read`),
  ADD KEY `idx_time` (`created_at`);

--
-- Chỉ mục cho bảng `products_cache`
--
ALTER TABLE `products_cache`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`current_status`),
  ADD KEY `idx_owner` (`current_owner`),
  ADD KEY `idx_type` (`product_type`);

--
-- Chỉ mục cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Chỉ mục cho bảng `registration_requests`
--
ALTER TABLE `registration_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_user_id` (`user_id`);

--
-- Chỉ mục cho bảng `retail_payments`
--
ALTER TABLE `retail_payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_id` (`order_id`);

--
-- Chỉ mục cho bảng `uploaded_files`
--
ALTER TABLE `uploaded_files`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_hash` (`file_hash`);

--
-- Chỉ mục cho bảng `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=92;

--
-- AUTO_INCREMENT cho bảng `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT cho bảng `registration_requests`
--
ALTER TABLE `registration_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `retail_payments`
--
ALTER TABLE `retail_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT cho bảng `uploaded_files`
--
ALTER TABLE `uploaded_files`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
