<?php
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');
$userId = $_GET['id'] ?? null;

if (!$userId) {
    echo json_encode(['success' => false, 'message' => 'No user ID provided']);
    exit;
}

$usersFile = 'users.json';
$girlProfilesFile = 'girl-profiles.json';
$boyProfilesFile = 'boy-profiles.json';

if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Database not found']);
    exit;
}

$data = json_decode(file_get_contents($usersFile), true);
$users = $data['users'] ?? [];
$foundUser = null;

// Search in registered users
foreach ($users as $user) {
    if (strval($user['id']) === strval($userId)) {
        $foundUser = $user;
        break;
    }
}

// Search in demo girls
if (!$foundUser && file_exists($girlProfilesFile)) {
    $girls = json_decode(file_get_contents($girlProfilesFile), true) ?? [];
    foreach ($girls as $index => $user) {
        $demoId = 'demo_female_' . $index;
        if ($demoId == $userId) {
            $foundUser = $user;
            $foundUser['id'] = $demoId;
            $foundUser['gender'] = 'female';
            // Normalize fields
            $foundUser['profile_pic'] = $user['img'] ?? $user['Image'] ?? '';
            $foundUser['about'] = $user['bio'] ?? $user['About'] ?? '';
            $foundUser['education'] = $user['education'] ?? $user['Education'] ?? '';
            $foundUser['location'] = $user['location'] ?? $user['Location'] ?? '';
            break;
        }
    }
}

// Search in demo boys
if (!$foundUser && file_exists($boyProfilesFile)) {
    $boys = json_decode(file_get_contents($boyProfilesFile), true) ?? [];
    foreach ($boys as $index => $user) {
        $demoId = 'demo_male_' . $index;
        if ($demoId == $userId) {
            $foundUser = $user;
            $foundUser['id'] = $demoId;
            $foundUser['gender'] = 'male';
            // Normalize fields
            $foundUser['profile_pic'] = $user['img'] ?? $user['Image'] ?? '';
            $foundUser['about'] = $user['bio'] ?? $user['About'] ?? '';
            $foundUser['education'] = $user['education'] ?? $user['Education'] ?? '';
            $foundUser['location'] = $user['location'] ?? $user['Location'] ?? '';
            break;
        }
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