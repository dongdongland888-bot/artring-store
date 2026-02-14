-- Add membership points system

-- Add new fields to User table
ALTER TABLE `users` ADD COLUMN `birthday` DATETIME(3) NULL;
ALTER TABLE `users` ADD COLUMN `inviteCode` VARCHAR(191) NULL;
ALTER TABLE `users` ADD COLUMN `invitedBy` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `users_inviteCode_key` ON `users`(`inviteCode`);

-- Add pointsCost field to Coupon table
ALTER TABLE `coupons` ADD COLUMN `pointsCost` INT NULL;

-- Create UserPoints table
CREATE TABLE `user_points` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `balance` INT NOT NULL DEFAULT 0,
    `totalEarned` INT NOT NULL DEFAULT 0,
    `totalSpent` INT NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_points_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create PointsTransaction table
CREATE TABLE `points_transactions` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('PURCHASE', 'REVIEW_TEXT', 'REVIEW_IMAGE', 'REGISTER', 'BIRTHDAY', 'INVITE', 'REDEEM', 'ADMIN_ADJUST', 'EXPIRED') NOT NULL,
    `amount` INT NOT NULL,
    `description` VARCHAR(191) NULL,
    `orderId` VARCHAR(191) NULL,
    `reviewId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `points_transactions_userId_idx`(`userId`),
    INDEX `points_transactions_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create MemberLevel table
CREATE TABLE `member_levels` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minPoints` INT NOT NULL,
    `discount` DECIMAL(3, 2) NOT NULL,
    `benefits` JSON NULL,
    `sortOrder` INT NOT NULL DEFAULT 0,
    `isActive` TINYINT(1) NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `member_levels_name_key`(`name`),
    UNIQUE INDEX `member_levels_minPoints_key`(`minPoints`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Add foreign key for UserPoints
ALTER TABLE `user_points` ADD CONSTRAINT `user_points_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Add foreign key for PointsTransaction
ALTER TABLE `points_transactions` ADD CONSTRAINT `points_transactions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user_points`(`userId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert default member levels
INSERT INTO `member_levels` (`id`, `name`, `minPoints`, `discount`, `benefits`, `sortOrder`, `isActive`, `createdAt`, `updatedAt`) VALUES
(UUID(), '普通会员', 0, 1.00, '[]', 0, true, NOW(), NOW()),
(UUID(), '银卡会员', 1000, 0.95, '["95折优惠"]', 1, true, NOW(), NOW()),
(UUID(), '金卡会员', 5000, 0.90, '["9折优惠", "生日礼遇"]', 2, true, NOW(), NOW()),
(UUID(), '黑卡会员', 20000, 0.85, '["85折优惠", "免运费", "专属客服", "优先发货"]', 3, true, NOW(), NOW());
