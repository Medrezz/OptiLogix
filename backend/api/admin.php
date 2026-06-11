<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt.php';

function handleAdmin(string $method, string $action): void {
    match($action) {
        'stats'          => getStats(),
        'users'          => getUsers($method),
        'user'           => manageUser($method),
        'god-overview'   => godOverview(),
        'god-admins'     => manageAdmins($method),
        'transactions'   => getAllTransactions(),
        default          => jsonError('Not found', 404),
    };
}

function getStats(): void {
    adminRequired();
    $db = getDB();
    $stats = [];
    $stats['total_users'] = $db->query('SELECT COUNT(*) FROM users WHERE role = "client"')->fetchColumn();
    $stats['total_revenue_sar'] = $db->query('SELECT COALESCE(SUM(amount_sar),0) FROM transactions WHERE status = "completed"')->fetchColumn();
    $stats['total_coins_sold'] = $db->query('SELECT COALESCE(SUM(coins),0) FROM transactions WHERE status = "completed" AND type = "purchase"')->fetchColumn();
    $stats['total_api_keys'] = $db->query('SELECT COUNT(*) FROM api_keys WHERE is_active = 1')->fetchColumn();
    $stats['total_image_generations'] = $db->query('SELECT COUNT(*) FROM coin_usage WHERE endpoint = "image"')->fetchColumn();
    $stats['total_chat_requests'] = $db->query('SELECT COUNT(*) FROM coin_usage WHERE endpoint = "chat"')->fetchColumn();
    $stats['new_users_today'] = $db->query('SELECT COUNT(*) FROM users WHERE DATE(created_at) = DATE("now")')->fetchColumn();
    jsonSuccess($stats);
}

function getUsers(string $method): void {
    adminRequired();
    $db = getDB();
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = 20;
    $offset = ($page - 1) * $limit;
    $search = $_GET['search'] ?? '';

    if ($search) {
        $stmt = $db->prepare('SELECT id,name,phone,email,role,coin_balance,free_images_used,is_active,created_at FROM users WHERE name LIKE ? OR phone LIKE ? OR email LIKE ? ORDER BY created_at DESC LIMIT ? OFFSET ?');
        $s = "%$search%";
        $stmt->execute([$s, $s, $s, $limit, $offset]);
    } else {
        $stmt = $db->prepare('SELECT id,name,phone,email,role,coin_balance,free_images_used,is_active,created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?');
        $stmt->execute([$limit, $offset]);
    }

    $total = $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    jsonSuccess(['users' => $stmt->fetchAll(), 'total' => (int)$total, 'page' => $page]);
}

function manageUser(string $method): void {
    adminRequired();
    if ($method !== 'POST') jsonError('Method not allowed', 405);
    $data = jsonBody();
    $userId = (int)($data['user_id'] ?? 0);
    $action = $data['action'] ?? '';
    $db = getDB();

    match($action) {
        'toggle_active' => $db->prepare('UPDATE users SET is_active = 1 - is_active WHERE id = ?')->execute([$userId]),
        'add_coins' => $db->prepare('UPDATE users SET coin_balance = coin_balance + ? WHERE id = ?')->execute([(int)($data['coins'] ?? 0), $userId]),
        'set_role' => $db->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$data['role'] ?? 'client', $userId]),
        default => jsonError('Invalid action'),
    };

    jsonSuccess(['success' => true]);
}

function godOverview(): void {
    godRequired();
    $db = getDB();
    $data = [];
    $data['total_revenue'] = $db->query('SELECT COALESCE(SUM(amount_sar),0) FROM transactions WHERE status="completed"')->fetchColumn();
    $data['monthly_revenue'] = $db->query('SELECT COALESCE(SUM(amount_sar),0) FROM transactions WHERE status="completed" AND strftime("%Y-%m",created_at)=strftime("%Y-%m","now")')->fetchColumn();
    $data['total_users'] = $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $data['total_admins'] = $db->query('SELECT COUNT(*) FROM users WHERE role IN ("admin","god")')->fetchColumn();
    $data['total_api_keys'] = $db->query('SELECT COUNT(*) FROM api_keys')->fetchColumn();
    $data['coins_in_circulation'] = $db->query('SELECT COALESCE(SUM(coin_balance),0) FROM users')->fetchColumn();
    $data['recent_transactions'] = $db->query('SELECT t.*,u.name,u.phone FROM transactions t LEFT JOIN users u ON t.user_id=u.id ORDER BY t.created_at DESC LIMIT 10')->fetchAll();
    jsonSuccess($data);
}

function manageAdmins(string $method): void {
    godRequired();
    $db = getDB();
    if ($method === 'GET') {
        $stmt = $db->query('SELECT id,name,phone,email,role,is_active,created_at FROM users WHERE role IN ("admin","god") ORDER BY created_at DESC');
        jsonSuccess(['admins' => $stmt->fetchAll()]);
    }
    if ($method === 'POST') {
        $data = jsonBody();
        $db->prepare('UPDATE users SET role = ? WHERE id = ?')->execute([$data['role'] ?? 'admin', (int)$data['user_id']]);
        jsonSuccess(['success' => true]);
    }
}

function getAllTransactions(): void {
    adminRequired();
    $db = getDB();
    $stmt = $db->query('SELECT t.*,u.name,u.phone FROM transactions t LEFT JOIN users u ON t.user_id=u.id ORDER BY t.created_at DESC LIMIT 50');
    jsonSuccess(['transactions' => $stmt->fetchAll()]);
}
