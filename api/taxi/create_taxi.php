<?php
// Set headers for REST API
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");

session_start();

// 1. Include Database Connection
// Adjust the path based on your folder structure
require_once("../../config/database.php"); 

// 2. Initialize Database


// 3. Authentication & Role Check
// The project requires Role-based access control (Admin, Manager, Customer)
if(!isset($_SESSION['user_id']) || $_SESSION['role'] != 'Manager'){
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized: Only Managers can create taxi listings."]);
    exit;
}

// 4. Get the JSON Input
$data = json_decode(file_get_contents("php://input"), true);

// 5. Extract and Sanitize Input
$vehicle_type = strip_tags($data['vehicle_type'] ?? '');
$driver_name  = strip_tags($data['driver_name'] ?? '');
$plate_number = strtoupper(trim(strip_tags($data['plate_number'] ?? '')));
$price_per_km = (float) ($data['price_per_km'] ?? 0);
$manager_id   = $_SESSION['user_id'];

// 6. Basic Validation
if(empty($vehicle_type) || empty($driver_name) || empty($plate_number) || $price_per_km <= 0){
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "All fields are required and price must be greater than 0."]);
    exit;
}

// 7. THE UNIQUE CHECK (Fixes the duplicate issue)
// We check if THIS specific plate exists before trying to insert
$check_query = "SELECT id FROM taxi_listings WHERE plate_number = ? LIMIT 1";
$check_stmt = $conn->prepare($check_query);
$check_stmt->bind_param("s", $plate_number);
$check_stmt->execute();
$check_stmt->store_result();

if ($check_stmt->num_rows > 0) {
    http_response_code(409); // Conflict
    echo json_encode([
        "success" => false, 
        "message" => "Duplicate Error: A taxi with plate number '" . $plate_number . "' already exists."
    ]);
    $check_stmt->close();
    exit;
}
$check_stmt->close();

// 8. INSERT THE NEW TAXI
$insert_query = "INSERT INTO taxi_listings (manager_id, vehicle_type, driver_name, plate_number, price_per_km, is_available) 
                 VALUES (?, ?, ?, ?, ?, 1)";

$stmt = $conn->prepare($insert_query);

if ($stmt) {
    $stmt->bind_param("isssd", $manager_id, $vehicle_type, $driver_name, $plate_number, $price_per_km);
    
    if($stmt->execute()){
        http_response_code(201); // Created
        echo json_encode([
            "success" => true, 
            "message" => "Taxi created successfully",
            "data" => [
                "plate" => $plate_number,
                "driver" => $driver_name
            ]
        ]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Database error: " . $stmt->error]);
    }
    $stmt->close();
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Failed to prepare the insert statement."]);
}

$conn->close();
?>