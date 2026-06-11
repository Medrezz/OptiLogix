<?php

define('DB_PATH', __DIR__ . '/../optilogix.db');
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'optilogix-jwt-secret-change-in-prod');
define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost:5000');

function getDB(): PDO {
    static $db = null;
    if ($db) return $db;
    $db = new PDO('sqlite:' . DB_PATH);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    initSchema($db);
    return $db;
}

function initSchema(PDO $db): void {
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT UNIQUE,
            email TEXT UNIQUE,
            password_hash TEXT,
            google_id TEXT UNIQUE,
            apple_id TEXT UNIQUE,
            role TEXT DEFAULT 'client',
            coin_balance INTEGER DEFAULT 0,
            free_images_used INTEGER DEFAULT 0,
            avatar TEXT,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            type TEXT,
            coins INTEGER,
            amount_sar REAL,
            description TEXT,
            paypal_order_id TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS api_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            key_name TEXT,
            api_key TEXT UNIQUE,
            requests_total INTEGER DEFAULT 0,
            coins_used INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS coin_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            api_key_id INTEGER,
            coins_used INTEGER,
            tokens_used INTEGER,
            endpoint TEXT,
            model TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    ");
}
