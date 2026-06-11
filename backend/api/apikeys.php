<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt.php';

function handleApiKeys(string $method, string $action): void {
    match($action) {
        'list'    => listKeys(),
        'create'  => createKey($method),
        'revoke'  => revokeKey($method),
        'verify'  => verifyKey($method),
        default   => jsonError('Not found', 404),
    };
}

function listKeys(): void {
    $payload = authRequired();
    $db = getDB();
    $stmt = $db->prepare('SELECT id,key_name,api_key,requests_total,coins_used,is_active,created_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC');
    $stmt->execute([$payload['sub']]);
    jsonSuccess(['keys' => $stmt->fetchAll()]);
}

function createKey(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $payload = authRequired();
    $data = jsonBody();
    $name = trim($data['name'] ?? 'My API Key');

    $db = getDB();
    $count = $db->prepare('SELECT COUNT(*) FROM api_keys WHERE user_id = ? AND is_active = 1');
    $count->execute([$payload['sub']]);
    if ((int)$count->fetchColumn() >= 5) jsonError('Maximum 5 active API keys allowed');

    $key = 'ol-' . bin2hex(random_bytes(24));
    $db->prepare('INSERT INTO api_keys (user_id, key_name, api_key) VALUES (?,?,?)')->execute([$payload['sub'], $name, $key]);

    jsonSuccess(['api_key' => $key, 'key_name' => $name, 'id' => $db->lastInsertId()]);
}

function revokeKey(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $payload = authRequired();
    $data = jsonBody();
    $db = getDB();
    $db->prepare('UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?')->execute([(int)$data['id'], $payload['sub']]);
    jsonSuccess(['success' => true]);
}

function verifyKey(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $data = jsonBody();
    $apiKey = $data['api_key'] ?? '';
    $db = getDB();
    $stmt = $db->prepare('SELECT ak.*,u.coin_balance,u.role FROM api_keys ak JOIN users u ON ak.user_id=u.id WHERE ak.api_key=? AND ak.is_active=1 AND u.is_active=1');
    $stmt->execute([$apiKey]);
    $row = $stmt->fetch();
    if (!$row) jsonError('Invalid API key', 401);
    $db->prepare('UPDATE api_keys SET requests_total = requests_total + 1 WHERE id = ?')->execute([$row['id']]);
    jsonSuccess(['valid' => true, 'user_id' => $row['user_id'], 'coin_balance' => $row['coin_balance']]);
}
