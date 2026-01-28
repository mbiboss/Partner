<?php
session_start();
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
        file_put_contents($usersFile, json_encode($usersData, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'message' => 'User deleted']);
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
    } elseif ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Admin logged out']);
    }
}
?>