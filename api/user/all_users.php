<?php
header("Content-Type: application/json");
require_once("../config/database.php");

session_start();
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'Admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

// Directly count users from the users table
$sql = "SELECT COUNT(*) AS total FROM users";

// Execute the SQL query
$result = $conn->query($sql);
if (!$result) {
    echo json_encode(["success" => false, "message" => "SQL query failed: " . $conn->error]);
    exit;
}

// Fetch the count
$totalUsers = 0; 
if ($row = $result->fetch_assoc()) {
    $totalUsers = $row['total']; // Get the user count from the result
}

echo json_encode([
    "success" => true,
    "data" => [
        "totalUsers" => $totalUsers // Return the count in the response
    ]
]);

$conn->close();
?>