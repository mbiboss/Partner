<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$userId = $_POST['user_id'] ?? null;
if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

$uploadDir = 'uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$profilePicPath = null;

// Handle File Upload
if (isset($_FILES['profile_pic']) && $_FILES['profile_pic']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['profile_pic']['tmp_name'];
    $fileName = $_FILES['profile_pic']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    // Generate unique name
    $newFileName = 'profile_' . $userId . '_' . time() . '.' . $fileExtension;
    $destPath = $uploadDir . $newFileName;
    
    if (move_uploaded_file($fileTmpPath, $destPath)) {
        $profilePicPath = $destPath;
    } else {
        echo json_encode(['success' => false, 'message' => 'Error moving uploaded file']);
        exit;
    }
} else {
    echo json_encode(['success' => false, 'message' => 'No image file uploaded or upload error']);
    exit;
}

// Update users.json
$usersFile = 'users.json';
if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Database not found']);
    exit;
}

$usersData = json_decode(file_get_contents($usersFile), true);
if (!$usersData || !isset($usersData['users'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid users.json format']);
    exit;
}

$users = &$usersData['users'];
$updated = false;

foreach ($users as &$user) {
    if (trim((string)$user['id']) === trim((string)$userId)) {
        // Delete old file if exists and is not a placeholder
        if (isset($user['profile_pic']) && !empty($user['profile_pic']) && file_exists($user['profile_pic']) && strpos($user['profile_pic'], 'uploads/') === 0) {
            @unlink($user['profile_pic']);
        }
        
        $user['profile_pic'] = $profilePicPath;
        $updated = true;
        $updatedUser = $user;
        break;
    }
}

if ($updated) {
    $result = file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
    if ($result === false) {
        echo json_encode(['success' => false, 'message' => 'Failed to write to users.json. Check file permissions.']);
        exit;
    }
    // Remove password before sending back
    unset($updatedUser['password']);
    echo json_encode(['success' => true, 'message' => 'Profile picture updated successfully', 'user' => $updatedUser]);
} else {
    echo json_encode(['success' => false, 'message' => 'User ID ' . $userId . ' not found in database']);
}
?>