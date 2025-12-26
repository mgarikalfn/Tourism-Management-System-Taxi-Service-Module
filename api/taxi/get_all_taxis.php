<?php
header("Content-Type: application/json");

// Correct path: go up two levels from api/taxi/ to reach config/
require_once '../../config/database.php';

// Query all taxis (global view)
$sql = "SELECT id, vehicle_type, plate_number, driver_name, price_per_km, is_available 
        FROM taxi_listings 
        ORDER BY vehicle_type";

$result = $conn->query($sql);

if ($result) {
    $taxis = [];
    while ($row = $result->fetch_assoc()) {
        $row['is_available'] = (int)$row['is_available'];
        $taxis[] = $row;
    }
    echo json_encode([
        "success" => true,
        "data" => $taxis
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Query failed: " . $conn->error
    ]);
}

$conn->close();
?>