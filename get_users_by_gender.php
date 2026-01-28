<?php
header('Content-Type: application/json');

$gender = $_GET['gender'] ?? '';
$usersFile = 'users.json';
$girlProfilesFile = 'girl-profiles.json';
$boyProfilesFile = 'boy-profiles.json';

$allUsers = [];

// Load registered users from users.json
if (file_exists($usersFile)) {
    $data = json_decode(file_get_contents($usersFile), true);
    $registeredUsers = $data['users'] ?? [];
    foreach ($registeredUsers as $user) {
        $allUsers[] = $user;
    }
}

// Load demo profiles based on gender
if ($gender === 'female' || $gender === 'all') {
    if (file_exists($girlProfilesFile)) {
        $girlProfiles = json_decode(file_get_contents($girlProfilesFile), true) ?? [];
        foreach ($girlProfiles as $index => $profile) {
            $profile['id'] = 'demo_female_' . $index;
            $profile['gender'] = 'female';
            $profile['profile_pic'] = $profile['img'] ?? '';
            $allUsers[] = $profile;
        }
    }
}

if ($gender === 'male' || $gender === 'all') {
    if (file_exists($boyProfilesFile)) {
        $boyProfiles = json_decode(file_get_contents($boyProfilesFile), true) ?? [];
        foreach ($boyProfiles as $index => $profile) {
            $profile['id'] = 'demo_male_' . $index;
            $profile['gender'] = 'male';
            $profile['profile_pic'] = $profile['img'] ?? '';
            $allUsers[] = $profile;
        }
    }
}

// Filter by gender for registered users
$filtered = array_filter($allUsers, function($u) use ($gender) {
    if ($gender === 'all') return true;
    $uGender = isset($u['gender']) ? strtolower($u['gender']) : '';
    if ($gender === 'female') {
        return $uGender === 'female' || $uGender === 'girl' || $uGender === 'woman';
    }
    if ($gender === 'male') {
        return $uGender === 'male' || $uGender === 'boy' || $uGender === 'man';
    }
    return $uGender === strtolower($gender);
});

// Reset keys for JSON array
echo json_encode(['success' => true, 'users' => array_values($filtered)]);
?>