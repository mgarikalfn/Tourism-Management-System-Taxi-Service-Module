<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

// Only logged-in customers
if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Customer') {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$taxi_id = $data['taxi_id'] ?? 0;
$pickup = $data['pickup_location'] ?? '';
$dropoff = $data['dropoff_location'] ?? '';

if ($taxi_id <= 0 || empty($pickup) || empty($dropoff)) {
    echo json_encode(["success" => false, "message" => "All fields are required"]);
    exit;
}

// Check taxi availability
$stmt = $conn->prepare("SELECT is_available FROM taxi_listings WHERE id = ?");
$stmt->bind_param("i", $taxi_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows == 0) {
    echo json_encode(["success" => false, "message" => "Taxi not found"]);
    exit;
}

$taxi = $result->fetch_assoc();
if (!$taxi['is_available']) {
    echo json_encode(["success" => false, "message" => "Taxi not available"]);
    exit;
}

// Create booking
$stmt = $conn->prepare(
    "INSERT INTO bookings (user_id, taxi_id, pickup_location, dropoff_location)
     VALUES (?, ?, ?, ?)"
);
$stmt->bind_param("iiss", $_SESSION['user_id'], $taxi_id, $pickup, $dropoff);

if ($stmt->execute()) {
    // Mark taxi unavailable
    $conn->query("UPDATE taxi_listings SET is_available = 0 WHERE id = $taxi_id");

    echo json_encode(["success" => true, "message" => "Taxi booked successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Booking failed"]);
}

$conn->close();
