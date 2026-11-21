-- Expense Management System schema (MySQL 8+)

CREATE DATABASE IF NOT EXISTS expense_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE expense_management;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'USER') NOT NULL DEFAULT 'USER',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expenses (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category ENUM('Food','Travel','Accommodation','Transportation','Shopping','Medical','Entertainment','Utilities','Office Supplies','Other') NOT NULL,
  date DATE NOT NULL,
  payment_method ENUM('CASH','CARD','UPI','BANK_TRANSFER','OTHER') NOT NULL,
  description TEXT NOT NULL,
  status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  created_by INT UNSIGNED NOT NULL,
  deleted_at DATETIME NULL,
  version INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_expenses_creator_deleted (created_by, deleted_at),
  KEY idx_expenses_status_date (status, date),
  KEY idx_expenses_category (category),
  CONSTRAINT fk_expenses_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS expense_audits (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  action ENUM('CREATED','UPDATED','DELETED','APPROVED','REJECTED') NOT NULL,
  reason VARCHAR(500) NULL,
  performed_by INT UNSIGNED NOT NULL,
  expense_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audits_expense_created (expense_id, created_at),
  CONSTRAINT fk_audits_performed_by FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_audits_expense_id FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
