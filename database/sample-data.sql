-- =====================================================================
-- Secure Retail – Product Catalogue System
-- Sample data (SQLite)
-- Week 6 – Activity 2: Insert sample data
--
-- Run AFTER schema.sql.
-- All people, emails, phone numbers, addresses and payment references
-- are fictional sample data. Password hashes are placeholders in bcrypt
-- format, not real passwords. No card numbers are stored (BR-30).
-- Prices are realistic sample prices in AUD (GST inclusive).
-- =====================================================================

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- REFERENCE TABLE: CATEGORIES
-- 5 records
INSERT INTO CATEGORIES (CategoryID, CategoryName, Description, IsActive) VALUES
    (1, 'Laptops', 'Notebooks and ultrabooks for work, study and gaming', 1),
    (2, 'Smartphones', 'Latest Android and iPhone models', 1),
    (3, 'Smart Watches', 'Wearables for fitness, health and notifications', 1),
    (4, 'Accessories', 'Headphones, chargers, cases and other add-ons', 1),
    (5, 'Tablets', 'Tablets for entertainment, notes and study', 1);

-- REFERENCE TABLE: BRANDS (6 brands from the data dictionary)
-- 6 records
INSERT INTO BRANDS (BrandID, BrandName) VALUES
    (1, 'Apple'),
    (2, 'Samsung'),
    (3, 'Dell'),
    (4, 'Sony'),
    (5, 'Lenovo'),
    (6, 'ASUS');

-- MAIN TABLE: USERS (2 admins, 8 customers; user 10 is deactivated)
-- 10 records
INSERT INTO USERS (UserID, FirstName, LastName, Email, PasswordHash, Phone, Role, IsActive, CreatedAt, UpdatedAt) VALUES
    (1, 'Anika', 'Sharma', 'anika.sharma@secureretail.com.au', '$2b$12$AdminSampleHashAnikaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '02 9123 4501', 'Admin', 1, '2026-07-01 09:00:00', '2026-07-01 09:00:00'),
    (2, 'Liam', 'Nguyen', 'liam.nguyen@secureretail.com.au', '$2b$12$AdminSampleHashLiamxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '02 9123 4502', 'Admin', 1, '2026-07-01 09:05:00', '2026-07-01 09:05:00'),
    (3, 'Olivia', 'Brown', 'olivia.brown@example.com', '$2b$12$CustSampleHashOliviaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '0412 345 601', 'Customer', 1, '2026-08-02 14:12:00', '2026-08-02 14:12:00'),
    (4, 'Jack', 'Wilson', 'jack.wilson@example.com', '$2b$12$CustSampleHashJackxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '0412 345 602', 'Customer', 1, '2026-08-05 10:40:00', '2026-08-05 10:40:00'),
    (5, 'Mia', 'Taylor', 'mia.taylor@example.com', '$2b$12$CustSampleHashMiaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', NULL, 'Customer', 1, '2026-08-11 19:22:00', '2026-08-11 19:22:00'),
    (6, 'Noah', 'Patel', 'noah.patel@example.com', '$2b$12$CustSampleHashNoahxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '0412 345 604', 'Customer', 1, '2026-08-15 08:03:00', '2026-08-15 08:03:00'),
    (7, 'Charlotte', 'Lee', 'charlotte.lee@example.com', '$2b$12$CustSampleHashCharlottexxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '0412 345 605', 'Customer', 1, '2026-08-20 16:47:00', '2026-08-20 16:47:00'),
    (8, 'William', 'Martin', 'william.martin@example.com', '$2b$12$CustSampleHashWilliamxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '0412 345 606', 'Customer', 1, '2026-08-28 12:30:00', '2026-08-28 12:30:00'),
    (9, 'Ava', 'Thompson', 'ava.thompson@example.com', '$2b$12$CustSampleHashAvaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', '0412 345 607', 'Customer', 1, '2026-09-03 21:15:00', '2026-09-03 21:15:00'),
    (10, 'Ethan', 'Khan', 'ethan.khan@example.com', '$2b$12$CustSampleHashEthanxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', NULL, 'Customer', 0, '2026-09-06 11:55:00', '2026-09-06 11:55:00');

-- MAIN TABLE: ADDRESSES (one default per user)
-- 10 records
INSERT INTO ADDRESSES (AddressID, UserID, AddressLine1, AddressLine2, Suburb, State, Postcode, IsDefault) VALUES
    (1, 3, '14 Wattle Street', NULL, 'Strathfield', 'NSW', '2135', 1),
    (2, 3, 'Level 3, 100 George Street', NULL, 'Parramatta', 'NSW', '2150', 0),
    (3, 4, '27 Collins Lane', 'Unit 5', 'Southbank', 'VIC', '3006', 1),
    (4, 5, '8 Banksia Avenue', NULL, 'Chermside', 'QLD', '4032', 1),
    (5, 6, '52 Murray Road', NULL, 'Morley', 'WA', '6062', 1),
    (6, 7, '3 Kings Way', 'Apartment 12', 'Glenelg', 'SA', '5045', 1),
    (7, 8, '91 Harbour Drive', NULL, 'Hobart', 'TAS', '7000', 1),
    (8, 8, '16 Fenton Street', NULL, 'Devonport', 'TAS', '7310', 0),
    (9, 9, '40 Northbourne Avenue', 'Unit 21', 'Braddon', 'ACT', '2612', 1),
    (10, 10, '7 Mitchell Street', NULL, 'Darwin City', 'NT', '0800', 1);

-- MAIN TABLE: PRODUCTS
-- 10 records
INSERT INTO PRODUCTS (ProductID, CategoryID, BrandID, ProductName, Description, Specifications, WarrantyMonths, IsFeatured, IsActive, CreatedAt, UpdatedAt) VALUES
    (1, 2, 1, 'Apple iPhone 18 Pro Max', '6.9-inch Super Retina XDR display, A20 Pro chip and 48MP Fusion camera system.', '{"Display": "6.9-inch Super Retina XDR", "Chip": "A20 Pro", "RearCameras": "48MP + 48MP + 48MP", "Network": "5G", "WaterResistance": "IP68"}', 12, 1, 1, '2026-09-20 09:00:00', '2026-09-20 09:00:00'),
    (2, 2, 2, 'Samsung Galaxy S25 Ultra', '6.9-inch Dynamic AMOLED display with built-in S Pen and 200MP camera.', '{"Display": "6.9-inch Dynamic AMOLED 2X", "RearCamera": "200MP", "Network": "5G", "SPen": "Included"}', 12, 1, 1, '2026-07-10 09:00:00', '2026-07-10 09:00:00'),
    (3, 1, 1, 'Apple MacBook Air 13-inch (M4)', 'Thin and light laptop with all-day battery life and a Liquid Retina display.', '{"Display": "13.6-inch Liquid Retina", "Chip": "Apple M4", "Memory": "16GB", "Battery": "Up to 18 hours"}', 12, 1, 1, '2026-07-10 09:10:00', '2026-07-10 09:10:00'),
    (4, 1, 3, 'Dell XPS 13', 'Premium 13-inch ultrabook with an InfinityEdge display.', '{"Display": "13.4-inch FHD+", "Processor": "Intel Core Ultra 7", "Memory": "16GB", "Weight": "1.19kg"}', 12, 0, 1, '2026-07-10 09:20:00', '2026-07-10 09:20:00'),
    (5, 1, 5, 'Lenovo IdeaPad Slim 5', 'Everyday 14-inch laptop for study and work.', '{"Display": "14-inch WUXGA OLED", "Processor": "AMD Ryzen 7", "Memory": "16GB"}', 12, 0, 1, '2026-07-10 09:30:00', '2026-07-10 09:30:00'),
    (6, 1, 6, 'ASUS Zenbook 14 OLED', 'Lightweight laptop with a vivid 3K OLED screen.', '{"Display": "14-inch 3K OLED", "Processor": "Intel Core Ultra 9", "Memory": "32GB"}', 24, 0, 1, '2026-07-10 09:40:00', '2026-07-10 09:40:00'),
    (7, 3, 1, 'Apple Watch Series 11', 'Health, fitness and safety features with an always-on display.', '{"CaseMaterial": "Aluminium", "WaterResistance": "50m", "Connectivity": "GPS"}', 12, 1, 1, '2026-09-20 09:30:00', '2026-09-20 09:30:00'),
    (8, 3, 2, 'Samsung Galaxy Watch8', 'Smart watch with advanced sleep and health tracking.', '{"CaseMaterial": "Armour Aluminium", "Connectivity": "Bluetooth", "Battery": "Up to 40 hours"}', 12, 0, 1, '2026-08-01 09:00:00', '2026-08-01 09:00:00'),
    (9, 4, 4, 'Sony WH-1000XM6 Wireless Headphones', 'Noise cancelling over-ear headphones with 30-hour battery life.', '{"Type": "Over-ear", "NoiseCancelling": "Yes", "Battery": "Up to 30 hours"}', 12, 1, 1, '2026-07-15 09:00:00', '2026-07-15 09:00:00'),
    (10, 5, 2, 'Samsung Galaxy Tab S10 FE', '10.9-inch tablet with S Pen included, ideal for notes and streaming.', '{"Display": "10.9-inch LCD", "Storage": "128GB", "SPen": "Included"}', 12, 0, 1, '2026-07-15 09:10:00', '2026-07-15 09:10:00');

-- MAIN TABLE: PRODUCT_VARIANTS (iPhone variants have "Limit 2 per customer")
-- 16 records
INSERT INTO PRODUCT_VARIANTS (VariantID, ProductID, SKU, Colour, StorageOrSize, Price, PromoPrice, PromoStartDate, PromoEndDate, PurchaseLimit, IsActive) VALUES
    (1, 1, 'APL-IP18PM-256-BLK', 'Black', '256GB', 2299.00, NULL, NULL, NULL, 2, 1),
    (2, 1, 'APL-IP18PM-512-BLK', 'Black', '512GB', 2699.00, NULL, NULL, NULL, 2, 1),
    (3, 1, 'APL-IP18PM-256-SLV', 'Silver', '256GB', 2299.00, NULL, NULL, NULL, 2, 1),
    (4, 2, 'SAM-S25U-256-TBK', 'Titanium Black', '256GB', 2149.00, 1899.00, '2026-10-01', '2026-10-31', NULL, 1),
    (5, 2, 'SAM-S25U-512-TBK', 'Titanium Black', '512GB', 2349.00, NULL, NULL, NULL, NULL, 1),
    (6, 3, 'APL-MBA13M4-256-MID', 'Midnight', '16GB / 256GB', 1799.00, NULL, NULL, NULL, NULL, 1),
    (7, 3, 'APL-MBA13M4-512-SKY', 'Sky Blue', '16GB / 512GB', 2149.00, NULL, NULL, NULL, NULL, 1),
    (8, 4, 'DEL-XPS13-512-PLT', 'Platinum', '16GB / 512GB', 2499.00, NULL, NULL, NULL, NULL, 1),
    (9, 5, 'LEN-IPS5-512-GRY', 'Cloud Grey', '16GB / 512GB', 1199.00, 999.00, '2026-09-15', '2026-10-15', NULL, 1),
    (10, 6, 'ASU-ZB14-1TB-GRY', 'Jasper Grey', '32GB / 1TB', 1899.00, NULL, NULL, NULL, NULL, 1),
    (11, 7, 'APL-AWS11-42-BLK', 'Jet Black', '42mm', 699.00, NULL, NULL, NULL, NULL, 1),
    (12, 7, 'APL-AWS11-46-SLV', 'Silver', '46mm', 749.00, NULL, NULL, NULL, NULL, 1),
    (13, 8, 'SAM-GW8-44-GPH', 'Graphite', '44mm', 599.00, NULL, NULL, NULL, NULL, 1),
    (14, 9, 'SON-WH1000XM6-BLK', 'Black', NULL, 649.00, 549.00, '2026-09-01', '2026-10-31', NULL, 1),
    (15, 9, 'SON-WH1000XM6-SLV', 'Platinum Silver', NULL, 649.00, 549.00, '2026-09-01', '2026-10-31', NULL, 1),
    (16, 10, 'SAM-TABS10FE-128-GRY', 'Grey', '128GB', 749.00, NULL, NULL, NULL, NULL, 1);

-- MAIN TABLE: PRODUCT_IMAGES (one primary image per product)
-- 15 records
INSERT INTO PRODUCT_IMAGES (ImageID, ProductID, ImageURL, AltText, SortOrder, IsPrimary) VALUES
    (1, 1, 'images/products/apple-iphone-18-pro-max-front.jpg', 'Apple iPhone 18 Pro Max, front view', 0, 1),
    (2, 2, 'images/products/samsung-galaxy-s25-ultra-front.jpg', 'Samsung Galaxy S25 Ultra, front view', 0, 1),
    (3, 3, 'images/products/apple-macbook-air-13-inch-m4-front.jpg', 'Apple MacBook Air 13-inch (M4), front view', 0, 1),
    (4, 4, 'images/products/dell-xps-13-front.jpg', 'Dell XPS 13, front view', 0, 1),
    (5, 5, 'images/products/lenovo-ideapad-slim-5-front.jpg', 'Lenovo IdeaPad Slim 5, front view', 0, 1),
    (6, 6, 'images/products/asus-zenbook-14-oled-front.jpg', 'ASUS Zenbook 14 OLED, front view', 0, 1),
    (7, 7, 'images/products/apple-watch-series-11-front.jpg', 'Apple Watch Series 11, front view', 0, 1),
    (8, 8, 'images/products/samsung-galaxy-watch8-front.jpg', 'Samsung Galaxy Watch8, front view', 0, 1),
    (9, 9, 'images/products/sony-wh-1000xm6-wireless-headphones-front.jpg', 'Sony WH-1000XM6 Wireless Headphones, front view', 0, 1),
    (10, 10, 'images/products/samsung-galaxy-tab-s10-fe-front.jpg', 'Samsung Galaxy Tab S10 FE, front view', 0, 1),
    (11, 1, 'images/products/apple-iphone-18-pro-max-back.jpg', 'Apple iPhone 18 Pro Max, back view', 1, 0),
    (12, 1, 'images/products/apple-iphone-18-pro-max-side.jpg', 'Apple iPhone 18 Pro Max, side view', 2, 0),
    (13, 3, 'images/products/apple-macbook-air-13-inch-m4-open.jpg', 'Apple MacBook Air 13-inch (M4), open view', 1, 0),
    (14, 7, 'images/products/apple-watch-series-11-side.jpg', 'Apple Watch Series 11, side view', 2, 0),
    (15, 9, 'images/products/sony-wh-1000xm6-wireless-headphones-folded.jpg', 'Sony WH-1000XM6 Wireless Headphones, folded view', 1, 0);

-- MAIN TABLE: INVENTORY (one row per variant; Galaxy Watch8 is out of stock)
-- 16 records
INSERT INTO INVENTORY (InventoryID, VariantID, QuantityOnHand, LowStockThreshold, UpdatedAt) VALUES
    (1, 1, 18, 5, '2026-10-13 17:00:00'),
    (2, 2, 6, 5, '2026-10-13 17:00:00'),
    (3, 3, 3, 5, '2026-10-13 17:00:00'),
    (4, 4, 25, 5, '2026-10-13 17:00:00'),
    (5, 5, 9, 5, '2026-10-13 17:00:00'),
    (6, 6, 14, 5, '2026-10-13 17:00:00'),
    (7, 7, 7, 5, '2026-10-13 17:00:00'),
    (8, 8, 4, 3, '2026-10-13 17:00:00'),
    (9, 9, 22, 5, '2026-10-13 17:00:00'),
    (10, 10, 5, 3, '2026-10-13 17:00:00'),
    (11, 11, 30, 5, '2026-10-13 17:00:00'),
    (12, 12, 12, 5, '2026-10-13 17:00:00'),
    (13, 13, 0, 5, '2026-10-13 17:00:00'),
    (14, 14, 16, 5, '2026-10-13 17:00:00'),
    (15, 15, 2, 5, '2026-10-13 17:00:00'),
    (16, 16, 11, 5, '2026-10-13 17:00:00');

-- TRANSACTION TABLE: CARTS (one cart per user)
-- 6 records
INSERT INTO CARTS (CartID, UserID, CreatedAt, UpdatedAt) VALUES
    (1, 3, '2026-10-10 09:00:00', '2026-10-13 21:10:00'),
    (2, 4, '2026-10-11 12:30:00', '2026-10-12 08:15:00'),
    (3, 5, '2026-10-06 19:00:00', '2026-10-13 19:45:00'),
    (4, 6, '2026-10-09 07:40:00', '2026-10-09 07:52:00'),
    (5, 7, '2026-10-12 14:00:00', '2026-10-13 10:05:00'),
    (6, 9, '2026-10-13 18:20:00', '2026-10-13 18:31:00');

-- TRANSACTION TABLE: CART_ITEMS
-- 10 records
INSERT INTO CART_ITEMS (CartItemID, CartID, VariantID, Quantity, AddedAt) VALUES
    (1, 1, 11, 1, '2026-10-13 21:10:00'),
    (2, 1, 14, 1, '2026-10-12 09:00:00'),
    (3, 2, 7, 1, '2026-10-12 08:15:00'),
    (4, 3, 4, 1, '2026-10-13 19:40:00'),
    (5, 3, 16, 1, '2026-10-13 19:45:00'),
    (6, 4, 10, 1, '2026-10-09 07:52:00'),
    (7, 5, 5, 1, '2026-10-13 10:05:00'),
    (8, 5, 15, 1, '2026-10-13 10:00:00'),
    (9, 6, 1, 2, '2026-10-13 18:25:00'),
    (10, 6, 12, 1, '2026-10-13 18:31:00');

-- TRANSACTION TABLE: WISHLIST_ITEMS
-- 10 records
INSERT INTO WISHLIST_ITEMS (WishlistItemID, UserID, ProductID, AddedAt) VALUES
    (1, 3, 7, '2026-09-15 20:00:00'),
    (2, 3, 9, '2026-09-16 21:30:00'),
    (3, 4, 3, '2026-09-18 12:00:00'),
    (4, 5, 1, '2026-09-20 18:45:00'),
    (5, 5, 10, '2026-09-21 19:00:00'),
    (6, 6, 6, '2026-09-25 09:10:00'),
    (7, 7, 2, '2026-09-29 22:05:00'),
    (8, 8, 8, '2026-10-01 13:00:00'),
    (9, 9, 7, '2026-10-04 16:40:00'),
    (10, 9, 5, '2026-10-06 11:20:00');

-- TRANSACTION TABLE: ORDERS (totals = items + delivery; Click & Collect has no address)
-- 10 records
INSERT INTO ORDERS (OrderID, OrderNumber, UserID, AddressID, FulfilmentMethod, OrderStatus, Subtotal, DeliveryCost, TotalAmount, EstimatedDeliveryDate, TrackingNumber, CreatedAt, UpdatedAt) VALUES
    (1, 'SR-20260921-1001', 3, 1, 'Delivery', 'Delivered', 2299.00, 0.00, 2299.00, '2026-09-24', 'AP-7741203361', '2026-09-21 10:15:00', '2026-09-21 10:15:00'),
    (2, 'SR-20260922-1002', 4, 3, 'Delivery', 'Delivered', 549.00, 9.95, 558.95, '2026-09-26', 'AP-7741209874', '2026-09-22 13:40:00', '2026-09-22 13:40:00'),
    (3, 'SR-20260925-1003', 5, NULL, 'ClickAndCollect', 'Delivered', 2348.00, 0.00, 2348.00, NULL, 'CC-0003', '2026-09-25 09:05:00', '2026-09-25 09:05:00'),
    (4, 'SR-20261002-1004', 6, 5, 'Delivery', 'Shipped', 1899.00, 0.00, 1899.00, '2026-10-08', 'AP-7741221150', '2026-10-02 18:22:00', '2026-10-02 18:22:00'),
    (5, 'SR-20260928-1005', 7, 6, 'Delivery', 'Delivered', 1248.00, 9.95, 1257.95, '2026-10-02', 'AP-7741215523', '2026-09-28 11:11:00', '2026-09-28 11:11:00'),
    (6, 'SR-20261012-1006', 8, 7, 'Delivery', 'Paid', 2499.00, 0.00, 2499.00, '2026-10-17', NULL, '2026-10-12 20:45:00', '2026-10-12 20:45:00'),
    (7, 'SR-20261013-1007', 3, 2, 'Delivery', 'Pending', 2699.00, 0.00, 2699.00, '2026-10-18', NULL, '2026-10-13 15:30:00', '2026-10-13 15:30:00'),
    (8, 'SR-20261005-1008', 9, 9, 'Delivery', 'Cancelled', 599.00, 9.95, 608.95, '2026-10-09', NULL, '2026-10-05 08:50:00', '2026-10-05 08:50:00'),
    (9, 'SR-20261011-1009', 4, NULL, 'ClickAndCollect', 'Paid', 1748.00, 0.00, 1748.00, NULL, NULL, '2026-10-11 12:00:00', '2026-10-11 12:00:00'),
    (10, 'SR-20261001-1010', 7, 6, 'Delivery', 'Delivered', 3048.00, 0.00, 3048.00, '2026-10-05', 'AP-7741219012', '2026-10-01 17:35:00', '2026-10-01 17:35:00');

-- TRANSACTION TABLE: ORDER_ITEMS (UnitPrice = price paid at checkout, promo price if active)
-- 14 records
INSERT INTO ORDER_ITEMS (OrderItemID, OrderID, VariantID, Quantity, UnitPrice, LineTotal) VALUES
    (1, 1, 1, 1, 2299.00, 2299.00),
    (2, 2, 14, 1, 549.00, 549.00),
    (3, 3, 6, 1, 1799.00, 1799.00),
    (4, 3, 15, 1, 549.00, 549.00),
    (5, 4, 4, 1, 1899.00, 1899.00),
    (6, 5, 11, 1, 699.00, 699.00),
    (7, 5, 14, 1, 549.00, 549.00),
    (8, 6, 8, 1, 2499.00, 2499.00),
    (9, 7, 2, 1, 2699.00, 2699.00),
    (10, 8, 13, 1, 599.00, 599.00),
    (11, 9, 9, 1, 999.00, 999.00),
    (12, 9, 16, 1, 749.00, 749.00),
    (13, 10, 3, 1, 2299.00, 2299.00),
    (14, 10, 12, 1, 749.00, 749.00);

-- TRANSACTION TABLE: PAYMENTS (order 3 has a failed attempt before a successful one)
-- 11 records
INSERT INTO PAYMENTS (PaymentID, OrderID, PaymentMethod, PaymentStatus, Amount, GatewayReference, PaidAt) VALUES
    (1, 1, 'Card', 'Successful', 2299.00, 'GW-CA-8000137', '2026-09-21 10:15:30'),
    (2, 2, 'PayPal', 'Successful', 558.95, 'GW-PA-8000274', '2026-09-22 13:40:30'),
    (3, 3, 'Card', 'Failed', 2348.00, 'GW-CA-8000411', NULL),
    (4, 3, 'Card', 'Successful', 2348.00, 'GW-CA-8000548', '2026-09-25 09:05:31'),
    (5, 4, 'Afterpay', 'Successful', 1899.00, 'GW-AF-8000685', '2026-10-02 18:22:30'),
    (6, 5, 'Card', 'Successful', 1257.95, 'GW-CA-8000822', '2026-09-28 11:11:30'),
    (7, 6, 'Card', 'Successful', 2499.00, 'GW-CA-8000959', '2026-10-12 20:45:30'),
    (8, 7, 'Card', 'Pending', 2699.00, NULL, NULL),
    (9, 8, 'PayPal', 'Refunded', 608.95, 'GW-PA-8001233', '2026-10-05 08:50:30'),
    (10, 9, 'Card', 'Successful', 1748.00, 'GW-CA-8001370', '2026-10-11 12:00:30'),
    (11, 10, 'Afterpay', 'Successful', 3048.00, 'GW-AF-8001507', '2026-10-01 17:35:30');

-- TRANSACTION TABLE: REVIEWS (verified only when the user has a delivered order for the product)
-- 10 records
INSERT INTO REVIEWS (ReviewID, ProductID, UserID, Rating, Title, Comment, IsVerifiedPurchase, Status, CreatedAt) VALUES
    (1, 1, 3, 5, 'Worth the upgrade', 'Battery easily lasts all day and the camera is excellent in low light.', 1, 'Approved', '2026-09-28 19:00:00'),
    (2, 9, 4, 5, 'Best noise cancelling I have used', 'Great for the train. Comfortable for long sessions.', 1, 'Approved', '2026-09-30 08:30:00'),
    (3, 3, 5, 4, 'Light and fast', 'Perfect for uni. Only wish it had more ports.', 1, 'Approved', '2026-10-01 20:10:00'),
    (4, 9, 5, 4, 'Great sound', 'Very good headphones; the case is a bit bulky.', 1, 'Approved', '2026-10-01 20:15:00'),
    (5, 7, 7, 5, 'Love the health features', 'Sleep tracking and notifications work really well.', 1, 'Approved', '2026-10-06 18:00:00'),
    (6, 9, 7, 3, 'Good but pricey', 'Sound is great but I expected a longer battery life.', 1, 'Pending', '2026-10-06 18:05:00'),
    (7, 1, 7, 4, 'Fantastic phone', 'Camera is amazing; it is heavy compared to my old phone.', 1, 'Approved', '2026-10-08 12:00:00'),
    (8, 2, 6, 4, 'Huge screen', 'Waiting for delivery but very happy with the price I paid.', 0, 'Pending', '2026-10-04 09:00:00'),
    (9, 1, 9, 2, 'Too expensive', 'Nice phone in store but the price is very high.', 0, 'Rejected', '2026-10-07 14:20:00'),
    (10, 6, 8, 5, 'Stunning OLED screen', 'Checked it out in store; the display is beautiful.', 0, 'Approved', '2026-10-09 10:45:00');

-- TRANSACTION TABLE: ENQUIRIES (UserID is NULL for guest enquiries)
-- 10 records
INSERT INTO ENQUIRIES (EnquiryID, UserID, FullName, Email, Phone, Subject, Message, Status, SubmittedAt) VALUES
    (1, NULL, 'Sophie Clarke', 'sophie.clarke@example.com', '0413 222 101', 'Product Information', 'Does the iPhone 18 Pro Max come with a charger in the box?', 'Resolved', '2026-09-22 09:12:00'),
    (2, 3, 'Olivia Brown', 'olivia.brown@example.com', '0412 345 601', 'Order Status', 'My order SR-20261013-1007 is still pending. Has my payment gone through?', 'New', '2026-10-13 16:00:00'),
    (3, NULL, 'Daniel Wright', 'daniel.wright@example.com', NULL, 'Technical Support', 'My headphones will not pair with my laptop. Can you help?', 'In Progress', '2026-10-03 11:30:00'),
    (4, 9, 'Ava Thompson', 'ava.thompson@example.com', '0412 345 607', 'Returns', 'I cancelled order SR-20261005-1008. When will I receive my refund?', 'Resolved', '2026-10-06 10:00:00'),
    (5, NULL, 'Grace Kim', 'grace.kim@example.com', '0413 222 105', 'General Enquiry', 'What are your opening hours for Click and Collect at the Sydney store?', 'Resolved', '2026-09-30 17:45:00'),
    (6, 6, 'Noah Patel', 'noah.patel@example.com', '0412 345 604', 'Order Status', 'Can you confirm the delivery date for my Galaxy S25 Ultra?', 'In Progress', '2026-10-04 08:20:00'),
    (7, NULL, 'Lucas Martin', 'lucas.martin@example.com', NULL, 'Product Information', 'Is the Dell XPS 13 available with 32GB of memory?', 'New', '2026-10-12 13:05:00'),
    (8, 5, 'Mia Taylor', 'mia.taylor@example.com', NULL, 'Technical Support', 'How do I transfer my files to the new MacBook Air?', 'Resolved', '2026-09-27 21:40:00'),
    (9, NULL, 'Isla Robinson', 'isla.robinson@example.com', '0413 222 109', 'Returns', 'Can I return a smart watch if the box has been opened?', 'New', '2026-10-13 09:55:00'),
    (10, 8, 'William Martin', 'william.martin@example.com', '0412 345 606', 'General Enquiry', 'Do you offer business invoices for purchases under my ABN?', 'New', '2026-10-13 07:30:00');

COMMIT;
