<?php
header("Content-Type: application/json");
require_once("../../config/database.php");
session_start();

$data = json_decode(file_get_contents("php://input"), true);
$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and password are required"]);
    exit;
}

// Fetch user with password, role, and name
$stmt = $conn->prepare("SELECT id, password, role, name FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows == 0) {
    echo json_encode(["success" => false, "message" => "User not found"]);
    exit;
}

$stmt->bind_result($id, $hashed_password, $role, $name);
$stmt->fetch();
$stmt->close();

if (!password_verify($password, $hashed_password)) {
    echo json_encode(["success" => false, "message" => "Invalid password"]);
    exit;
}

// Login successful - return full user data
$_SESSION['user_id'] = $id;
$_SESSION['role'] = $role;

echo json_encode([
    "success" => true,
    "message" => "Login successful",
    "role" => $role,
    "user" => [
        "id" => $id,
        "name" => $name ?? '',
        "email" => $email,
        "role" => $role
    ]
]);

$conn->close();
?>