<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['Manager','Admin'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

// Join with users and taxi_listings to get a complete view for the manager
$query = "SELECT b.id, u.email as customer_email, t.vehicle_type, b.pickup_location, 
          b.dropoff_location, b.pickup_time, b.status 
          FROM bookings b
          JOIN users u ON b.user_id = u.id
          JOIN taxi_listings t ON b.taxi_id = t.id
          ORDER BY b.created_at DESC";

$result = $conn->query($query);
$bookings = [];

while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}

echo json_encode(["success" => true, "data" => $bookings]);
$conn->close();
?>