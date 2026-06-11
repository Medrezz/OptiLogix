<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt.php';

function handleAuth(string $method, string $action): void {
    match($action) {
        'register' => register($method),
        'login'    => login($method),
        'oauth'    => oauthLogin($method),
        'me'       => getMe(),
        default    => jsonError('Not found', 404),
    };
}

function register(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $data = jsonBody();
    $phone = trim($data['phone'] ?? '');
    $password = $data['password'] ?? '';
    $name = trim($data['name'] ?? '');

    if (!$phone || !$password) jsonError('Phone and password required');
    if (strlen($password) < 6) jsonError('Password must be at least 6 characters');

    $db = getDB();
    $exists = $db->prepare('SELECT id FROM users WHERE phone = ?');
    $exists->execute([$phone]);
    if ($exists->fetch()) jsonError('Phone number already registered');

    $hash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $db->prepare('INSERT INTO users (name, phone, password_hash, coin_balance) VALUES (?, ?, ?, 0)');
    $stmt->execute([$name ?: 'User', $phone, $hash]);
    $userId = $db->lastInsertId();

    $user = getUserById($db, $userId);
    $token = generateJWT(['sub' => $userId, 'role' => $user['role']]);
    jsonSuccess(['token' => $token, 'user' => sanitizeUser($user)]);
}

function login(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $data = jsonBody();
    $phone = trim($data['phone'] ?? '');
    $password = $data['password'] ?? '';

    if (!$phone || !$password) jsonError('Phone and password required');

    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM users WHERE phone = ? AND is_active = 1');
    $stmt->execute([$phone]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($password, $user['password_hash'] ?? '')) {
        jsonError('Invalid phone number or password', 401);
    }

    $token = generateJWT(['sub' => $user['id'], 'role' => $user['role']]);
    jsonSuccess(['token' => $token, 'user' => sanitizeUser($user)]);
}

function oauthLogin(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $data = jsonBody();
    $provider = $data['provider'] ?? '';
    $providerId = $data['provider_id'] ?? '';
    $email = $data['email'] ?? '';
    $name = $data['name'] ?? '';
    $avatar = $data['avatar'] ?? '';

    if (!$provider || !$providerId) jsonError('Provider and provider_id required');

    $db = getDB();
    $col = $provider === 'google' ? 'google_id' : 'apple_id';
    $stmt = $db->prepare("SELECT * FROM users WHERE $col = ?");
    $stmt->execute([$providerId]);
    $user = $stmt->fetch();

    if (!$user) {
        // check by email first
        if ($email) {
            $stmt2 = $db->prepare('SELECT * FROM users WHERE email = ?');
            $stmt2->execute([$email]);
            $user = $stmt2->fetch();
        }
        if (!$user) {
            $db->prepare("INSERT INTO users (name, email, $col, avatar, coin_balance) VALUES (?,?,?,?,0)")
               ->execute([$name, $email ?: null, $providerId, $avatar ?: null]);
            $user = getUserById($db, $db->lastInsertId());
        } else {
            $db->prepare("UPDATE users SET $col = ?, avatar = COALESCE(?, avatar) WHERE id = ?")
               ->execute([$providerId, $avatar ?: null, $user['id']]);
            $user = getUserById($db, $user['id']);
        }
    }

    $token = generateJWT(['sub' => $user['id'], 'role' => $user['role']]);
    jsonSuccess(['token' => $token, 'user' => sanitizeUser($user)]);
}

function getMe(): void {
    $payload = authRequired();
    $db = getDB();
    $user = getUserById($db, $payload['sub']);
    if (!$user) jsonError('User not found', 404);
    jsonSuccess(['user' => sanitizeUser($user)]);
}

function getUserById(PDO $db, int $id): ?array {
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function sanitizeUser(array $user): array {
    unset($user['password_hash']);
    return $user;
}
