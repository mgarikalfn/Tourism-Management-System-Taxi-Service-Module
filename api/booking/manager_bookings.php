<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Manager') {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT b.id, u.email AS customer, t.vehicle_type,
            b.pickup_location, b.dropoff_location, b.status, b.created_at
     FROM bookings b
     JOIN taxi_listings t ON b.taxi_id = t.id
     JOIN users u ON b.user_id = u.id
     WHERE t.manager_id = ?"
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
