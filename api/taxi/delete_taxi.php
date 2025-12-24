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

if ($id <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid taxi ID"]);
    exit;
}

// Check for active bookings (not Completed or Cancelled)
$checkStmt = $conn->prepare("SELECT COUNT(*) as active_count FROM bookings WHERE taxi_id = ? AND status NOT IN ('Completed', 'Cancelled')");
$checkStmt->bind_param("i", $id);
$checkStmt->execute();
$result = $checkStmt->get_result();
$row = $result->fetch_assoc();
$activeBookings = $row['active_count'];
$checkStmt->close();

if ($activeBookings > 0) {
    echo json_encode(["success" => false, "message" => "Taxi has active bookings and cannot be deleted"]);
    exit;
}

// No active bookings, proceed to delete
$conn->begin_transaction();

try {
    // Delete related bookings
    $deleteBookingsStmt = $conn->prepare("DELETE FROM bookings WHERE taxi_id = ?");
    $deleteBookingsStmt->bind_param("i", $id);
    $deleteBookingsStmt->execute();
    $deleteBookingsStmt->close();

    // Delete the taxi
    $deleteTaxiStmt = $conn->prepare("DELETE FROM taxi_listings WHERE id = ? AND manager_id = ?");
    $deleteTaxiStmt->bind_param("ii", $id, $_SESSION['user_id']);
    $deleteTaxiStmt->execute();

    if ($deleteTaxiStmt->affected_rows > 0) {
        $conn->commit();
        echo json_encode(["success" => true, "message" => "Taxi and related bookings deleted successfully"]);
    } else {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Taxi not found or not authorized to delete"]);
    }

    $deleteTaxiStmt->close();
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["success" => false, "message" => "Delete failed: " . $e->getMessage()]);
}

$conn->close();
?>
