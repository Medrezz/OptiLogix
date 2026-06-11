<?php

require_once __DIR__ . '/../config/database.php';

function generateJWT(array $payload): string {
    $header = base64UrlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['iat'] = time();
    $payload['exp'] = time() + 86400 * 30; // 30 days
    $body = base64UrlEncode(json_encode($payload));
    $sig = base64UrlEncode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    return "$header.$body.$sig";
}

function verifyJWT(string $token): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $body, $sig] = $parts;
    $expected = base64UrlEncode(hash_hmac('sha256', "$header.$body", JWT_SECRET, true));
    if (!hash_equals($expected, $sig)) return null;
    $payload = json_decode(base64UrlDecode($body), true);
    if (!$payload || $payload['exp'] < time()) return null;
    return $payload;
}

function authRequired(): array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!str_starts_with($auth, 'Bearer ')) {
        jsonError('Unauthorized', 401);
    }
    $token = substr($auth, 7);
    $payload = verifyJWT($token);
    if (!$payload) jsonError('Invalid or expired token', 401);
    return $payload;
}

function adminRequired(): array {
    $payload = authRequired();
    if (!in_array($payload['role'], ['admin', 'god'])) jsonError('Forbidden', 403);
    return $payload;
}

function godRequired(): array {
    $payload = authRequired();
    if ($payload['role'] !== 'god') jsonError('Forbidden', 403);
    return $payload;
}

function base64UrlEncode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function base64UrlDecode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}
