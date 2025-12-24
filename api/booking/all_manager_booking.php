<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

// 1. Basic Auth Check
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['Manager','Admin'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}


// 3. Updated Query with WHERE clause
// We filter by t.manager_id to ensure managers only see their own fleet's bookings
$query = "SELECT b.id, u.email as customer_email, t.vehicle_type, b.pickup_location, 
          b.dropoff_location, b.pickup_time, b.status 
          FROM bookings b
          JOIN users u ON b.user_id = u.id
          JOIN taxi_listings t ON b.taxi_id = t.id
          WHERE t.manager_id = ? 
          ORDER BY b.created_at DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$result = $stmt->get_result();

$bookings = [];
while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}

echo json_encode(["success" => true, "data" => $bookings]);

$stmt->close();
$conn->close();
?>