<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Manager'){
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["success" => false, "message" => "Invalid JSON data"]);
    exit;
}

$id = $data['id'] ?? 0;
$vehicle_type = $data['vehicle_type'] ?? '';
$driver_name = $data['driver_name'] ?? '';
$plate_number = $data['plate_number'] ?? '';
$price_per_km = $data['price_per_km'] ?? 0;
$is_available = isset($data['is_available']) ? (int)$data['is_available'] : 1; // Accepts 0 or 1 from JS

// Validate required fields
if (empty($vehicle_type) || empty($driver_name) || empty($plate_number) || $price_per_km <= 0 || $id <= 0) {
    echo json_encode(["success" => false, "message" => "All fields are required and must be valid"]);
    exit;
}

// Prepare Update
$stmt = $conn->prepare("UPDATE taxi_listings SET vehicle_type=?, driver_name=?, plate_number=?, price_per_km=?, is_available=? WHERE id=? AND manager_id=?");

// Bind types: s=string, d=double (price), i=integer
// vehicle_type (s), driver_name (s), plate_number (s), price_per_km (d), is_available (i), id (i), manager_id (i)
$stmt->bind_param("sssdiii", $vehicle_type, $driver_name, $plate_number, $price_per_km, $is_available, $id, $_SESSION['user_id']);

if($stmt->execute()){
    if ($stmt->affected_rows > 0) { // Changed from >= 0 to > 0 to ensure at least one row was updated
        echo json_encode(["success" => true, "message" => "Taxi updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "No taxi found with the given ID or you are not authorized to update it"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "SQL Error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
