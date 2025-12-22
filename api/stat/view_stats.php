<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

session_start();
require_once("../../config/database.php");

if (!isset($_SESSION['user_id']) || 
   ($_SESSION['role'] !== 'Manager' && $_SESSION['role'] !== 'Admin')) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

/* USE EXISTING $conn */
if (!$conn) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "DB connection failed"]);
    exit;
}

/* TOTAL BOOKINGS */
$total_result = $conn->query("SELECT COUNT(*) AS total FROM bookings");
$total_row = $total_result->fetch_assoc();

/* STATUS BREAKDOWN */
$status_result = $conn->query(
    "SELECT status, COUNT(*) AS count FROM bookings GROUP BY status"
);

$status_breakdown = [];
while ($row = $status_result->fetch_assoc()) {
    $status_breakdown[] = $row;
}

/* MOST POPULAR TAXI */
$popular_result = $conn->query(
    "SELECT t.plate_number, COUNT(b.id) AS booking_count
     FROM taxi_listings t
     JOIN bookings b ON t.id = b.taxi_id
     GROUP BY t.id
     ORDER BY booking_count DESC
     LIMIT 1"
);

$popular_taxi = $popular_result->num_rows > 0
    ? $popular_result->fetch_assoc()
    : null;

echo json_encode([
    "success" => true,
    "statistics" => [
        "total_bookings" => (int)$total_row['total'],
        "status_breakdown" => $status_breakdown,
        "most_popular_taxi" => $popular_taxi
    ]
]);

$conn->close();
?>
