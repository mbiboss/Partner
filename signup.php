<?php
header('Content-Type: application/json');
session_start();

// Define users.json file path
$usersFile = 'users.json';

// Initialize users.json if it doesn't exist
if (!file_exists($usersFile)) {
    file_put_contents($usersFile, json_encode(['users' => []]));
}

// Get POST data
$name = $_POST['name'] ?? '';
$mobile = $_POST['mobile'] ?? '';
$gender = $_POST['gender'] ?? '';
$age = intval($_POST['age'] ?? 0);
$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';

// Validation
$errors = [];

// Required fields
if (empty($name)) $errors[] = 'Name is required';
if (empty($mobile)) $errors[] = 'Mobile number is required';
if (empty($gender)) $errors[] = 'Gender is required';
if (empty($email)) $errors[] = 'Email is required';
if (empty($password)) $errors[] = 'Password is required';

// Validate mobile number (Bangladeshi format)
if (!preg_match('/^(?:\+8801|01)[3-9]\d{8}$/', $mobile)) {
    $errors[] = 'Please enter a valid Bangladeshi mobile number (format: +8801XXXXXXXXX or 01XXXXXXXXX)';
}

// Validate age
if ($age < 18) {
    $errors[] = 'You must be at least 18 years old';
}

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Please enter a valid email address';
}

// Validate password
if ($password !== $confirm_password) {
    $errors[] = 'Passwords do not match';
}
if (strlen($password) < 6) {
    $errors[] = 'Password must be at least 6 characters';
}

// Check for duplicates
if (empty($errors)) {
    $data = json_decode(file_get_contents($usersFile), true);
    
    foreach ($data['users'] as $user) {
        if ($user['email'] === $email) {
            $errors[] = 'Email already registered. Please login.';
            break;
        }
        if ($user['mobile'] === $mobile) {
            $errors[] = 'Mobile number already registered. Please login.';
            break;
        }
    }
}

// If there are errors, return them
if (!empty($errors)) {
    echo json_encode([
        'success' => false,
        'message' => implode(' ', $errors)
    ]);
    exit;
}

// Create new user
$profilePicPath = '';
if (isset($_FILES['profile_pic_file']) && $_FILES['profile_pic_file']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = 'uploads/';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }
    $fileExtension = pathinfo($_FILES['profile_pic_file']['name'], PATHINFO_EXTENSION);
    $fileName = uniqid('profile_') . '.' . $fileExtension;
    $targetPath = $uploadDir . $fileName;
    
    if (move_uploaded_file($_FILES['profile_pic_file']['tmp_name'], $targetPath)) {
        $profilePicPath = $targetPath;
    }
}

$newUser = [
    'id' => uniqid(),
    'name' => $name,
    'mobile' => $mobile,
    'gender' => $gender,
    'age' => $age,
    'email' => $email,
    'password' => password_hash($password, PASSWORD_DEFAULT),
    'profile_pic' => $profilePicPath,
    'created_at' => date('Y-m-d H:i:s'),
    'subscription' => 'free'
];

// Add user to database
$data['users'][] = $newUser;
file_put_contents($usersFile, json_encode($data, JSON_PRETTY_PRINT));

// Start session for new user
$_SESSION['user_id'] = $newUser['id'];
$_SESSION['user_name'] = $name;
$_SESSION['user_email'] = $email;

// Return success
echo json_encode([
    'success' => true,
    'message' => 'Account created successfully! Redirecting...',
    'profilePicPath' => $profilePicPath,
    'user' => [
        'id' => $newUser['id'],
        'name' => $name,
        'email' => $email,
        'mobile' => $mobile,
        'gender' => $gender,
        'age' => $age,
        'profilePic' => $profilePicPath
    ]
]);
?>