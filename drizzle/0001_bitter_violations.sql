CREATE TABLE `artworks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`artistName` varchar(255) NOT NULL,
	`artistBio` text,
	`medium` varchar(100),
	`style` varchar(100),
	`dimensions` varchar(100),
	`yearCreated` int,
	`price` decimal(12,2) NOT NULL,
	`aiSuggestedPrice` decimal(12,2),
	`currency` varchar(3) DEFAULT 'USD',
	`primaryImageUrl` text NOT NULL,
	`additionalImages` json,
	`arPreviewUrl` text,
	`verificationStatus` enum('pending','verified','rejected') DEFAULT 'pending',
	`aiConfidenceScore` decimal(5,2),
	`provenanceData` json,
	`status` enum('draft','active','sold','reserved','archived') DEFAULT 'draft',
	`viewCount` int DEFAULT 0,
	`favoriteCount` int DEFAULT 0,
	`averageRating` decimal(3,2) DEFAULT '0.00',
	`totalReviews` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `artworks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `browsingHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`artworkId` int NOT NULL,
	`viewDuration` int,
	`interactionType` enum('view','click','favorite','share','inquiry'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `browsingHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `endorsements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artworkId` int NOT NULL,
	`expertId` int NOT NULL,
	`expertName` varchar(255) NOT NULL,
	`expertTitle` varchar(255),
	`expertCredentials` text,
	`endorsementText` text NOT NULL,
	`authenticityConfirmed` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `endorsements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`artworkId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricingAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artworkId` int NOT NULL,
	`suggestedPrice` decimal(12,2) NOT NULL,
	`confidenceScore` decimal(5,2),
	`analysisData` json,
	`marketComparables` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `pricingAnalysis_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `provenanceHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artworkId` int NOT NULL,
	`eventType` enum('creation','exhibition','sale','authentication','restoration','transfer') NOT NULL,
	`eventDate` timestamp,
	`description` text,
	`location` varchar(255),
	`verifiedBy` varchar(255),
	`documentUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `provenanceHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artworkId` int,
	`sellerId` int,
	`reviewerId` int NOT NULL,
	`transactionId` int,
	`rating` int NOT NULL,
	`title` varchar(255),
	`content` text,
	`isVerifiedPurchase` boolean DEFAULT false,
	`helpfulCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`artworkId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`platformFee` decimal(12,2),
	`currency` varchar(3) DEFAULT 'USD',
	`stripePaymentIntentId` varchar(255),
	`stripeTransferId` varchar(255),
	`escrowStatus` enum('pending','held','released','refunded','disputed') DEFAULT 'pending',
	`status` enum('pending','processing','completed','cancelled','refunded') DEFAULT 'pending',
	`shippingAddress` json,
	`deliveryStatus` enum('pending','shipped','in_transit','delivered','confirmed'),
	`deliveryConfirmedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('buyer','seller','both') DEFAULT 'buyer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `website` varchar(500);--> statement-breakpoint
ALTER TABLE `users` ADD `tasteProfile` json;--> statement-breakpoint
ALTER TABLE `users` ADD `isVerifiedSeller` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `users` ADD `galleryName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `totalSales` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `totalPurchases` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `averageRating` decimal(3,2) DEFAULT '0.00';--> statement-breakpoint
ALTER TABLE `users` ADD `totalReviews` int DEFAULT 0;