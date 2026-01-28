<?php
header('Content-Type: application/json');
$userId = $_GET['id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'No user ID provided']);
    exit;
}

$usersFile = 'users.json';
if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Database not found']);
    exit;
}

$users = json_decode(file_get_contents($usersFile), true);
$foundUser = null;

foreach ($users as $user) {
    if ($user['id'] == $userId) {
        $foundUser = $user;
        break;
    }
}

if ($foundUser) {
    // Remove password for security
    unset($foundUser['password']);
    echo json_encode(['success' => true, 'user' => $foundUser]);
} else {
    echo json_encode(['success' => false, 'message' => 'User not found']);
}
?>