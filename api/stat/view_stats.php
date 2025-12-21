<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
session_start();

require_once("../../config/database.php");

// Only Admin or Manager should see stats
if(!isset($_SESSION['user_id']) || ($_SESSION['role'] != 'Manager' && $_SESSION['role'] != 'Admin')){
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$conn = $database->getConnection();

// 1. Total Bookings
$total_query = "SELECT COUNT(*) as total FROM bookings";
$total_res = $conn->query($total_query)->fetch_assoc();

// 2. Bookings by Status
$status_query = "SELECT status, COUNT(*) as count FROM bookings GROUP BY status";
$status_res = $conn->query($status_query);
$stats_by_status = [];
while($row = $status_res->fetch_assoc()){
    $stats_by_status[] = $row;
}

// 3. Most Popular Taxi (by booking count)
$popular_query = "SELECT t.plate_number, COUNT(b.id) as booking_count 
                  FROM taxi_listings t 
                  JOIN bookings b ON t.id = b.taxi_id 
                  GROUP BY t.id ORDER BY booking_count DESC LIMIT 1";
$popular_res = $conn->query($popular_query)->fetch_assoc();

echo json_encode([
    "success" => true,
    "statistics" => [
        "total_bookings" => $total_res['total'],
        "status_breakdown" => $stats_by_status,
        "most_popular_taxi" => $popular_res ?? "No bookings yet"
    ]
]);

$conn->close();
?>