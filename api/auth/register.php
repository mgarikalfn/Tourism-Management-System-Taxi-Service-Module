<?php
header("Content-Type: application/json");
require_once("../../config/database.php");

// Get POST data
$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'Customer'; // default role
$created_at = date("Y-m-d H:i:s");

// Basic validation
if(empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit;
}

// Check if email already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if($stmt->num_rows > 0){
    echo json_encode(["success" => false, "message" => "Email already registered."]);
    exit;
}

// Hash password
$hashed_password = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare("INSERT INTO users (email, password, role, created_at) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $email, $hashed_password, $role, $created_at);

if($stmt->execute()){
    echo json_encode(["success" => true, "message" => "User registered successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Registration failed"]);
}

$stmt->close();
$conn->close();
?>
