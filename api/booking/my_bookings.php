<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id'])) {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT b.id, t.vehicle_type, t.driver_name, b.pickup_location, b.dropoff_location, b.status, b.created_at
     FROM bookings b
     JOIN taxi_listings t ON b.taxi_id = t.id
     WHERE b.user_id = ?"
);
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();

$result = $stmt->get_result();
$bookings = [];

while ($row = $result->fetch_assoc()) {
    $bookings[] = $row;
}

echo json_encode(["success" => true, "data" => $bookings]);
$conn->close();
