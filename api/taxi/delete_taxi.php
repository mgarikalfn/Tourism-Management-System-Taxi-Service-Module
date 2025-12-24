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

// Only allow manager to delete their own taxis
// Instead of DELETE, we just hide it from the public
$stmt = $conn->prepare("UPDATE taxi_listings SET is_available = 0 WHERE id=? AND manager_id=?");
$stmt->bind_param("ii", $id, $_SESSION['user_id']);

if($stmt->execute()){
    echo json_encode(["success" => true, "message" => "Taxi deleted successfully"]);
}else{
    echo json_encode(["success" => false, "message" => "Delete failed: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
