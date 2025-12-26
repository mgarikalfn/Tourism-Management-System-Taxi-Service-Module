-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Dec 25, 2025 at 01:09 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `tourism_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `taxi_listings`
--

CREATE TABLE `taxi_listings` (
  `id` int(11) NOT NULL,
  `manager_id` int(11) NOT NULL,
  `vehicle_type` varchar(50) NOT NULL,
  `driver_name` varchar(100) NOT NULL,
  `plate_number` varchar(20) NOT NULL,
  `price_per_km` decimal(10,2) NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `taxi_listings`
--

INSERT INTO `taxi_listings` (`id`, `manager_id`, `vehicle_type`, `driver_name`, `plate_number`, `price_per_km`, `is_available`, `created_at`) VALUES
(5, 2, 'Minibus', 'Solomon Bekele', 'AA-54321', 40.00, 0, '2025-12-21 13:35:44'),
(7, 2, 'RAV4', 'mengestu menge', 'AA-67891', 39.99, 0, '2025-12-21 13:37:52'),
(10, 2, 'sudan', 'mengu menge', 'AA-SE-12', 34.44, 0, '2025-12-23 11:05:41'),
(11, 2, 'toyota', 'Abebe Tesfaye', 'AA-12345', 30.00, 0, '2025-12-23 12:03:01'),
(12, 2, 'lambo', 'kim jhong hun', 'GR-1212', 11.00, 0, '2025-12-24 01:54:53'),
(14, 2, 'hilux', 'Abebe Tesfaye', 'GRE12', 12.00, 1, '2025-12-25 08:09:52');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `taxi_listings`
--
ALTER TABLE `taxi_listings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plate_number` (`plate_number`),
  ADD KEY `manager_id` (`manager_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `taxi_listings`
--
ALTER TABLE `taxi_listings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `taxi_listings`
--
ALTER TABLE `taxi_listings`
  ADD CONSTRAINT `taxi_listings_ibfk_1` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
