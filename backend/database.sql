-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `quiz_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `quiz_db`;

-- Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'student') DEFAULT 'student',
  `status` ENUM('active', 'locked') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams Table
CREATE TABLE IF NOT EXISTS `exams` (
  `id` VARCHAR(50) PRIMARY KEY, -- Using VARCHAR to match old mock ID logic (avoid breaking changes if possible)
  `title` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `duration` INT NOT NULL DEFAULT 60, -- minutes
  `start_time` DATETIME NULL,
  `end_time` DATETIME NULL,
  `status` ENUM('active', 'upcoming', 'closed') DEFAULT 'closed',
  `is_permanent` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Questions Table
CREATE TABLE IF NOT EXISTS `questions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` VARCHAR(50) NOT NULL,
  `text` TEXT NOT NULL,
  `option_a` TEXT NOT NULL,
  `option_b` TEXT NOT NULL,
  `option_c` TEXT NOT NULL,
  `option_d` TEXT NOT NULL,
  `correct_option` INT NOT NULL, -- 0 for A, 1 for B...
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
);

-- Submissions Table
CREATE TABLE IF NOT EXISTS `submissions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `exam_id` VARCHAR(50) NOT NULL,
  `score` DECIMAL(5,2) NOT NULL,
  `time_spent` INT NOT NULL, -- in seconds
  `correct_answers` INT NOT NULL,
  `total_questions` INT NOT NULL,
  `submitted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
);

-- Submission Answers (Optional but good for real systems to track what student picked)
CREATE TABLE IF NOT EXISTS `submission_answers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` INT NOT NULL,
  `question_id` INT NOT NULL,
  `selected_option` INT NOT NULL,
  FOREIGN KEY (`submission_id`) REFERENCES `submissions`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`question_id`) REFERENCES `questions`(`id`) ON DELETE CASCADE
);

-- Insert a default admin account
-- The password hash here is for 'password' using bcrypt (rounds=10)
INSERT IGNORE INTO `users` (`name`, `email`, `password`, `role`) 
VALUES ('Administrator', 'admin@ptit.edu.vn', '$2b$10$Ovk0fG0Vxy.h7Z1rE.S8x.1C1B1oO90P1vL0R2bL71e9K0T1D4n9q', 'admin');
