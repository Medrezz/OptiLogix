<?php

require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/middleware/jwt.php';
require_once __DIR__ . '/api/auth.php';
require_once __DIR__ . '/api/coins.php';
require_once __DIR__ . '/api/admin.php';
require_once __DIR__ . '/api/apikeys.php';

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri = ltrim($uri, '/');
$parts = explode('/', $uri);
$method = $_SERVER['REQUEST_METHOD'];

// Route: /auth/{action}, /coins/{action}, /admin/{action}, /keys/{action}
$group  = $parts[0] ?? '';
$action = $parts[1] ?? '';

try {
    match($group) {
        'auth'  => handleAuth($method, $action),
        'coins' => handleCoins($method, $action),
        'admin' => handleAdmin($method, $action),
        'keys'  => handleApiKeys($method, $action),
        'health' => jsonSuccess(['status' => 'ok', 'version' => '1.0.0']),
        default => jsonError('Not found', 404),
    };
} catch (Throwable $e) {
    jsonError($e->getMessage(), 500);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function jsonSuccess(array $data, int $code = 200): never {
    http_response_code($code);
    echo json_encode(['success' => true, ...$data]);
    exit;
}

function jsonError(string $message, int $code = 400): never {
    http_response_code($code);
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}

function jsonBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}
