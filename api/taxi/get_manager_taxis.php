<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
session_start();

require_once("../../config/database.php");

// 1. Security Check: Only allow logged-in Managers/Admins
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role'], ['Manager', 'Admin'])) {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized access"]);
    exit;
}



// 3. Prepare the Query
// Filter by manager_id to ensure the manager only sees their own fleet
$query = "SELECT id, vehicle_type, plate_number, price_per_km, is_available,driver_name
          FROM taxi_listings 
          WHERE manager_id = ? 
          ORDER BY created_at DESC";

try {
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $_SESSION['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    $taxis = [];
    while ($row = $result->fetch_assoc()) {
        // Convert integer/string values to appropriate types if necessary
        $row['is_available'] = (bool)$row['is_available'];
        $taxis[] = $row;
    }

    echo json_encode([
        "success" => true,
        "count" => count($taxis),
        "data" => $taxis
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Server Error: " . $e->getMessage()
    ]);
} finally {
    $conn->close();
}
?>