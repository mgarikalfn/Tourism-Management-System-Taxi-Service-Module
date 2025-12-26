<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Customer') {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$taxi_id = $data['taxi_id'] ?? 0;
$pickup = $data['pickup_location'] ?? '';
$dropoff = $data['dropoff_location'] ?? '';
$pickup_time = $data['pickup_time'] ?? '';
$noofseat = $data['no_of_seats'] ?? 1; // New field

if ($taxi_id <= 0 || empty($pickup) || empty($dropoff) || empty($pickup_time)) {
    echo json_encode(["success" => false, "message" => "All fields including Date/Time are required"]);
    exit;
}

// Check taxi availability
$stmt = $conn->prepare("SELECT is_available FROM taxi_listings WHERE id = ?");
$stmt->bind_param("i", $taxi_id);
$stmt->execute();
$result = $stmt->get_result();
$taxi = $result->fetch_assoc();

if (!$taxi || !$taxi['is_available']) {
    echo json_encode(["success" => false, "message" => "Taxi is no longer available"]);
    exit;
}

// Create booking with date
$stmt = $conn->prepare(
    "INSERT INTO bookings (user_id, taxi_id, pickup_location, dropoff_location, pickup_time)
     VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param("iisss", $_SESSION['user_id'], $taxi_id, $pickup, $dropoff, $pickup_time);

if ($stmt->execute()) {
    // Update taxi status
    $conn->query("UPDATE taxi_listings SET is_available = 0 WHERE id = $taxi_id");
    echo json_encode(["success" => true, "message" => "Taxi booked for " . $pickup_time]);
} else {
    echo json_encode(["success" => false, "message" => "Booking failed"]);
}
$conn->close();
?>