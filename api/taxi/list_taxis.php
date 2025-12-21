<?php
header("Content-Type: application/json");
require_once("../../config/database.php");

$result = $conn->query("SELECT id, manager_id, vehicle_type, driver_name, plate_number, price_per_km, is_available, created_at FROM taxi_listings");

$taxis = [];
while($row = $result->fetch_assoc()){
    $taxis[] = $row;
}

echo json_encode(["success" => true, "data" => $taxis]);

$conn->close();
?>
