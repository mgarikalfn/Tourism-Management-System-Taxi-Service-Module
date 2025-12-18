<?php
// Database credentials
$host = "localhost";
$db_name = "tourism_db"; // replace with your DB name
$username = "root";
$password = ""; // leave empty if root has no password

// Create connection
$conn = new mysqli($host, $username, $password, $db_name);

// Check connection
if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Connection failed: " . $conn->connect_error
    ]));
}
?>
