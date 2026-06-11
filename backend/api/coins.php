<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt.php';

const COIN_PACKAGES = [
    ['id' => 'starter', 'coins' => 500,  'price_sar' => 5,  'label' => 'Starter'],
    ['id' => 'pro',     'coins' => 1500, 'price_sar' => 15, 'label' => 'Pro'],
    ['id' => 'elite',   'coins' => 5000, 'price_sar' => 40, 'label' => 'Elite'],
];

// Conversion: how many tokens per coin
const TOKENS_PER_COIN = 2000;
// Cost per image: 50 coins
const COINS_PER_IMAGE = 50;
// Cost per 1k chat tokens: 1 coin
const COINS_PER_1K_TOKENS = 1;

function handleCoins(string $method, string $action): void {
    match($action) {
        'packages'  => getPackages(),
        'balance'   => getBalance(),
        'deduct'    => deductCoins($method),
        'purchase'  => createPurchase($method),
        'confirm'   => confirmPurchase($method),
        'history'   => getCoinHistory(),
        default     => jsonError('Not found', 404),
    };
}

function getPackages(): void {
    jsonSuccess(['packages' => COIN_PACKAGES]);
}

function getBalance(): void {
    $payload = authRequired();
    $db = getDB();
    $user = $db->prepare('SELECT coin_balance, free_images_used FROM users WHERE id = ?');
    $user->execute([$payload['sub']]);
    $row = $user->fetch();
    jsonSuccess([
        'balance' => (int)($row['coin_balance'] ?? 0),
        'free_images_used' => (int)($row['free_images_used'] ?? 0),
        'free_images_remaining' => max(0, 3 - (int)($row['free_images_used'] ?? 0)),
    ]);
}

function deductCoins(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $payload = authRequired();
    $data = jsonBody();
    $type = $data['type'] ?? 'chat'; // chat | image
    $tokens = (int)($data['tokens'] ?? 0);

    $db = getDB();
    $user = $db->prepare('SELECT * FROM users WHERE id = ?');
    $user->execute([$payload['sub']]);
    $row = $user->fetch();
    if (!$row) jsonError('User not found', 404);

    if ($type === 'image') {
        $freeUsed = (int)$row['free_images_used'];
        if ($freeUsed < 3) {
            // Use free image
            $db->prepare('UPDATE users SET free_images_used = free_images_used + 1 WHERE id = ?')
               ->execute([$payload['sub']]);
            logUsage($db, $payload['sub'], null, 0, 0, 'image', 'dall-e-3');
            jsonSuccess(['method' => 'free', 'coins_deducted' => 0, 'balance' => (int)$row['coin_balance']]);
        }
        $cost = COINS_PER_IMAGE;
    } else {
        $cost = max(1, (int)ceil($tokens / 1000) * COINS_PER_1K_TOKENS);
    }

    if ((int)$row['coin_balance'] < $cost) {
        jsonError('Insufficient coins. Please purchase more.', 402);
    }

    $db->prepare('UPDATE users SET coin_balance = coin_balance - ? WHERE id = ?')
       ->execute([$cost, $payload['sub']]);

    $model = $type === 'image' ? 'dall-e-3' : 'moonshot-v1-8k';
    logUsage($db, $payload['sub'], null, $cost, $tokens, $type, $model);

    $newBalance = (int)$row['coin_balance'] - $cost;
    jsonSuccess(['method' => 'coins', 'coins_deducted' => $cost, 'balance' => $newBalance]);
}

function createPurchase(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $payload = authRequired();
    $data = jsonBody();
    $packageId = $data['package_id'] ?? '';

    $pkg = null;
    foreach (COIN_PACKAGES as $p) {
        if ($p['id'] === $packageId) { $pkg = $p; break; }
    }
    if (!$pkg) jsonError('Invalid package');

    $db = getDB();
    $db->prepare('INSERT INTO transactions (user_id, type, coins, amount_sar, status, description) VALUES (?,?,?,?,?,?)')
       ->execute([$payload['sub'], 'purchase', $pkg['coins'], $pkg['price_sar'], 'pending', $pkg['label'] . ' Package']);
    $txId = $db->lastInsertId();

    jsonSuccess([
        'transaction_id' => $txId,
        'package' => $pkg,
        'paypal_amount' => number_format($pkg['price_sar'] / 3.75, 2), // SAR to USD approx
    ]);
}

function confirmPurchase(string $method): void {
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $payload = authRequired();
    $data = jsonBody();
    $txId = (int)($data['transaction_id'] ?? 0);
    $paypalOrderId = $data['paypal_order_id'] ?? '';

    $db = getDB();
    $tx = $db->prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ? AND status = ?');
    $tx->execute([$txId, $payload['sub'], 'pending']);
    $row = $tx->fetch();
    if (!$row) jsonError('Transaction not found');

    $db->prepare('UPDATE transactions SET status = ?, paypal_order_id = ? WHERE id = ?')
       ->execute(['completed', $paypalOrderId, $txId]);
    $db->prepare('UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?')
       ->execute([$row['coins'], $payload['sub']]);

    $updated = $db->prepare('SELECT coin_balance FROM users WHERE id = ?');
    $updated->execute([$payload['sub']]);
    $u = $updated->fetch();

    jsonSuccess(['coins_added' => $row['coins'], 'new_balance' => (int)$u['coin_balance']]);
}

function getCoinHistory(): void {
    $payload = authRequired();
    $db = getDB();
    $stmt = $db->prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20');
    $stmt->execute([$payload['sub']]);
    jsonSuccess(['history' => $stmt->fetchAll()]);
}

function logUsage(PDO $db, int $userId, ?int $apiKeyId, int $coins, int $tokens, string $endpoint, string $model): void {
    $db->prepare('INSERT INTO coin_usage (user_id, api_key_id, coins_used, tokens_used, endpoint, model) VALUES (?,?,?,?,?,?)')
       ->execute([$userId, $apiKeyId, $coins, $tokens, $endpoint, $model]);
}
