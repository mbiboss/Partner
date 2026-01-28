<?php
header('Content-Type: application/json');
session_start();

$usersFile = 'users.json';

// Get POST data
$login_id = $_POST['login_id'] ?? '';
$password = $_POST['password'] ?? '';

// Validate input
if (empty($login_id) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Please enter email/mobile and password'
    ]);
    exit;
}

// Check if users.json exists
if (!file_exists($usersFile)) {
    echo json_encode([
        'success' => false,
        'message' => 'No users found. Please sign up first.'
    ]);
    exit;
}

// Load users
$data = json_decode(file_get_contents($usersFile), true);
$users = $data['users'] ?? [];

// Find user by email or mobile
$user = null;
foreach ($users as $u) {
    if ($u['email'] === $login_id || $u['mobile'] === $login_id) {
        $user = $u;
        break;
    }
}

// Check if user exists and password is correct
if (!$user || !password_verify($password, $user['password'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email/mobile or password'
    ]);
    exit;
}

// Start session
$_SESSION['user_id'] = $user['id'];
$_SESSION['user_name'] = $user['name'];
$_SESSION['user_email'] = $user['email'];
$_SESSION['user_mobile'] = $user['mobile'];
$_SESSION['user_age'] = $user['age'];

// Return success
echo json_encode([
    'success' => true,
    'message' => 'Login successful! Redirecting...',
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'mobile' => $user['mobile'],
        'gender' => $user['gender'] ?? '',
        'age' => $user['age'] ?? '',
        'profilePic' => $user['profile_pic'] ?? ''
    ]
]);
?>