<?php
// Database connection (copy from your config or database.php)
$servername = "localhost";
$username = "root";
$password = ""; // empty for XAMPP
$dbname = "tourism_db"; // your database name

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// CHANGE THESE VALUES
$plain_password = "user1234";           // The password you want to use
$user_email = "girum@gmail.com";  // The user's email in the database

// Generate the correct hash
$hashed_password = password_hash($plain_password, PASSWORD_DEFAULT);

echo "Plain password: " . $plain_password . "<br>";
echo "Generated hash:<br><strong>" . $hashed_password . "</strong><br><br>";

// Update the database
$sql = "UPDATE users SET password = ? WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $hashed_password, $user_email);

if ($stmt->execute()) {
    echo "Password successfully updated for $user_email!<br>";
    echo "You can now login with: $plain_password";
} else {
    echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>