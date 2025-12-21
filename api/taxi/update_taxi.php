<?php
header("Content-Type: application/json");
session_start();
require_once("../../config/database.php");

if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Manager'){
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? 0;
$vehicle_type = $data['vehicle_type'] ?? '';
$driver_name = $data['driver_name'] ?? '';
$plate_number = $data['plate_number'] ?? '';
$price_per_km = $data['price_per_km'] ?? 0;
$is_available = isset($data['is_available']) ? (bool)$data['is_available'] : true;

// Optional: Only allow manager to update their own taxis
$stmt = $conn->prepare("UPDATE taxi_listings SET vehicle_type=?, driver_name=?, plate_number=?, price_per_km=?, is_available=? WHERE id=? AND manager_id=?");
$stmt->bind_param("sssdiii", $vehicle_type, $driver_name, $plate_number, $price_per_km, $is_available, $id, $_SESSION['user_id']);

if($stmt->execute()){
    echo json_encode(["success" => true, "message" => "Taxi updated successfully"]);
}else{
    echo json_encode(["success" => false, "message" => "Update failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
