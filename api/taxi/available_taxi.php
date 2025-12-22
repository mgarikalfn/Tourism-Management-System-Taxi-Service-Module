<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
session_start();

require_once("../../config/database.php");


$query = "
    SELECT 
        id,
        vehicle_type,
        driver_name,
        plate_number,
        price_per_km
    FROM taxi_listings
    WHERE is_available = 1
    ORDER BY id DESC
";

$result = $conn->query($query);

if (!$result) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database query failed"
    ]);
    exit;
}

$taxis = [];

while ($row = $result->fetch_assoc()) {
    $taxis[] = $row;
}

echo json_encode([
    "success" => true,
    "count" => count($taxis),
    "data" => $taxis
]);

$conn->close();
