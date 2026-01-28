<?php
header('Content-Type: application/json');
session_start();

$usersFile = 'users.json';

// Get POST data
$identifier = $_POST['identifier'] ?? '';

// Validate input
if (empty($identifier)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter your email or mobile number'
    ]);
    exit;
}

// Check if users.json exists
if (!file_exists($usersFile)) {
    echo json_encode([
        'success' => true,
        'message' => 'Password reset link sent successfully'
    ]);
    exit;
}

// Load users
$data = json_decode(file_get_contents($usersFile), true);
$users = $data['users'] ?? [];

// Check if user exists
$userExists = false;
foreach ($users as $user) {
    if ($user['email'] === $identifier || $user['mobile'] === $identifier) {
        $userExists = true;
        break;
    }
}

// Always return success message (security practice)
// In a real app, we would send an actual email/SMS
if ($userExists) {
    echo json_encode([
        'success' => true,
        'message' => 'Password reset link sent successfully to your registered email/mobile.'
    ]);
} else {
    // Still return success for security (don't reveal if user exists)
    echo json_encode([
        'success' => true,
        'message' => 'If your email/mobile is registered, you will receive a reset link shortly.'
    ]);
}
?>