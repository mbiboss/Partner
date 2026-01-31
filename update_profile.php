<?php
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

if (!$input || !isset($input['id'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

$userId = $input['id'];
$usersFile = 'users.json';

if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Users file not found']);
    exit;
}

$content = file_get_contents($usersFile);
$data = json_decode($content, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode(['success' => false, 'message' => 'Invalid database format']);
    exit;
}
$users = $data['users'] ?? [];

$userFound = false;
foreach ($users as &$user) {
    if (strval($user['id']) === strval($userId)) {
        if (isset($input['about'])) $user['about'] = $input['about'];
        if (isset($input['education'])) $user['education'] = $input['education'];
        if (isset($input['location'])) $user['location'] = $input['location'];
        if (isset($input['status'])) $user['status'] = $input['status'];
        if (isset($input['bio'])) $user['bio'] = $input['bio'];
        if (isset($input['age'])) $user['age'] = intval($input['age']);
        $userFound = true;
        break;
    }
}

if (!$userFound) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    exit;
}

$data['users'] = $users;
if (file_put_contents($usersFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to save profile']);
}
?>
