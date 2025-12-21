<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Manager') {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$query = "
SELECT 
    COUNT(*) AS total_bookings,
    SUM(status = 'Completed') AS completed,
    SUM(status = 'Cancelled') AS cancelled,
    SUM(status = 'Pending') AS pending
FROM bookings
";

$result = $conn->query($query);
$stats = $result->fetch_assoc();

echo json_encode(["success" => true, "data" => $stats]);
$conn->close();
