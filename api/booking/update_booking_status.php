<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['Manager','Admin'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$booking_id = $data['booking_id'] ?? 0;
$status = $data['status'] ?? '';

$allowed = ['Confirmed', 'Completed', 'Cancelled'];
if ($booking_id <= 0 || !in_array($status, $allowed)) {
    echo json_encode(["success" => false, "message" => "Invalid data"]);
    exit;
}

// Update booking
$stmt = $conn->prepare("UPDATE bookings SET status = ? WHERE id = ?");
$stmt->bind_param("si", $status, $booking_id);

if ($stmt->execute()) {

    // If completed or cancelled, free the taxi
    if ($status === 'Completed' || $status === 'Cancelled') {
        $conn->query(
            "UPDATE taxi_listings 
             SET is_available = 1 
             WHERE id = (SELECT taxi_id FROM bookings WHERE id = $booking_id)"
        );
    }

    echo json_encode(["success" => true, "message" => "Booking updated"]);
} else {
    echo json_encode(["success" => false, "message" => "Update failed"]);
}

$conn->close();
