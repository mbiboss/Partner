<?php
session_start();
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('Content-Type: application/json');

// Simple admin authentication (could be improved later)
$isAdmin = isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'login') {
        $password = $_POST['password'] ?? '';
        // Updated admin password
        if ($password === 'Dark_Host.02') {
            $_SESSION['is_admin'] = true;
            echo json_encode(['success' => true, 'message' => 'Admin logged in']);
            exit;
        } else {
            echo json_encode(['success' => false, 'message' => 'Invalid password']);
            exit;
        }
    }

    // Allow adding payment even if not admin (for user submission)
    if ($action === 'add_payment') {
        $usersFile = 'users.json';
        if (!file_exists($usersFile)) {
            echo json_encode(['success' => false, 'message' => 'Database not found']);
            exit;
        }
        $usersData = json_decode(file_get_contents($usersFile), true);
        
        $userId = $_POST['user_id'] ?? '';
        $amount = $_POST['amount'] ?? '';
        $trxId = $_POST['trx_id'] ?? '';
        
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                if (!isset($user['payments'])) {
                    $user['payments'] = [];
                }
                $user['payments'][] = [
                    'amount' => $amount,
                    'trx_id' => $trxId,
                    'date' => date('Y-m-d H:i:s'),
                    'status' => 'pending'
                ];
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Payment added and pending verification']);
        exit;
    }
}

if (!$isAdmin) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$usersFile = 'users.json';
if (!file_exists($usersFile)) {
    echo json_encode(['success' => false, 'message' => 'Database not found']);
    exit;
}

$usersData = json_decode(file_get_contents($usersFile), true);

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
    if ($action === 'get_users') {
        echo json_encode(['success' => true, 'users' => $usersData['users']]);
    }
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    
    if ($action === 'delete_user') {
        $userId = $_POST['user_id'] ?? '';
        $newUsers = [];
        foreach ($usersData['users'] as $user) {
            if ($user['id'] != $userId) {
                $newUsers[] = $user;
            }
        }
        $usersData['users'] = $newUsers;
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'User deleted']);
    } elseif ($action === 'verify_payment') {
        $userId = $_POST['user_id'] ?? '';
        $trxId = $_POST['trx_id'] ?? '';
        $newPlan = strtolower($_POST['plan'] ?? 'premium');
        
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['subscription'] = $newPlan;
                if (isset($user['payments'])) {
                    foreach ($user['payments'] as &$p) {
                        if ($p['trx_id'] == $trxId) {
                            $p['status'] = 'verified';
                        }
                    }
                }
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Payment verified and plan updated']);
    } elseif ($action === 'add_payment_admin') {
        $userId = $_POST['user_id'] ?? '';
        $amount = $_POST['amount'] ?? '';
        $trxId = $_POST['trx_id'] ?? '';
        
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                if (!isset($user['payments'])) {
                    $user['payments'] = [];
                }
                $user['payments'][] = [
                    'amount' => $amount,
                    'trx_id' => $trxId,
                    'date' => date('Y-m-d H:i:s'),
                    'status' => 'verified'
                ];
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Payment added by admin']);
    } elseif ($action === 'change_mobile') {
        $userId = $_POST['user_id'] ?? '';
        $newMobile = $_POST['mobile'] ?? '';
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['mobile'] = $newMobile;
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Mobile updated']);
    } elseif ($action === 'change_gender') {
        $userId = $_POST['user_id'] ?? '';
        $newGender = $_POST['gender'] ?? '';
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['gender'] = $newGender;
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Gender updated']);
    } elseif ($action === 'change_password') {
        $userId = $_POST['user_id'] ?? '';
        $newPassword = $_POST['password'] ?? '';
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['password'] = password_hash($newPassword, PASSWORD_DEFAULT);
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Password updated']);
    } elseif ($action === 'add_payment') {
        $userId = $_POST['user_id'] ?? '';
        $amount = $_POST['amount'] ?? '';
        $trxId = $_POST['trx_id'] ?? '';
        
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                if (!isset($user['payments'])) {
                    $user['payments'] = [];
                }
                $user['payments'][] = [
                    'amount' => $amount,
                    'trx_id' => $trxId,
                    'date' => date('Y-m-d H:i:s')
                ];
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'Payment added']);
    } elseif ($action === 'toggle_premium') {
        $userId = $_POST['user_id'] ?? '';
        $newPlan = $_POST['plan'] ?? 'free';
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['subscription'] = $newPlan;
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'Subscription updated']);
    } elseif ($action === 'change_name') {
        $userId = $_POST['user_id'] ?? '';
        $newName = $_POST['name'] ?? '';
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                $user['name'] = $newName;
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'Name updated']);
    } elseif ($action === 'delete_payment') {
        $userId = $_POST['user_id'] ?? '';
        $trxId = $_POST['trx_id'] ?? '';
        
        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                if (isset($user['payments'])) {
                    $newPayments = [];
                    foreach ($user['payments'] as $p) {
                        if ($p['trx_id'] != $trxId) {
                            $newPayments[] = $p;
                        }
                    }
                    $user['payments'] = $newPayments;
                }
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Payment deleted']);
    } elseif ($action === 'update_user_full_info') {
        $userId = $_POST['user_id'] ?? '';
        $name = $_POST['name'] ?? '';
        $mobile = $_POST['mobile'] ?? '';
        $age = $_POST['age'] ?? '';
        $gender = $_POST['gender'] ?? '';
        $location = $_POST['location'] ?? '';
        $education = $_POST['education'] ?? '';
        $about = $_POST['about'] ?? '';
        $status = $_POST['status'] ?? '';

        foreach ($usersData['users'] as &$user) {
            if ($user['id'] == $userId) {
                if ($name) $user['name'] = $name;
                if ($mobile) $user['mobile'] = $mobile;
                if ($gender) $user['gender'] = $gender;
                $user['age'] = (int)$age;
                $user['location'] = $location;
                $user['education'] = $education;
                $user['about'] = $about;
                $user['status'] = $status;
                break;
            }
        }
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        echo json_encode(['success' => true, 'message' => 'Full user info updated']);
    } elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Admin logged out']);
    }
}
?>