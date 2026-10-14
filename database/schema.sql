-- =====================================================================
-- Secure Retail – Product Catalogue System
-- Database schema (SQLite)
-- Week 6 – Activity 2: Creating the project database
--
-- Built from docs/week4/data-dictionary.md and docs/week4/erd.png
-- 16 tables · 114 fields · 19 relationships
--
-- SQLite notes (data dictionary was written for MySQL 8):
--   * INT AUTO_INCREMENT  -> INTEGER PRIMARY KEY AUTOINCREMENT
--   * ENUM(...)           -> TEXT with a CHECK (... IN (...)) constraint
--   * BOOLEAN             -> stored as 0 (FALSE) or 1 (TRUE)
--   * JSON                -> TEXT checked with json_valid()
--   * DATETIME / DATE     -> TEXT in ISO format (YYYY-MM-DD HH:MM:SS)
--   * DECIMAL(10,2)       -> money in Australian dollars, GST inclusive
-- =====================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------
-- Drop tables (children first) so the script can be re-run safely
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS PAYMENTS;
DROP TABLE IF EXISTS ORDER_ITEMS;
DROP TABLE IF EXISTS ORDERS;
DROP TABLE IF EXISTS CART_ITEMS;
DROP TABLE IF EXISTS CARTS;
DROP TABLE IF EXISTS WISHLIST_ITEMS;
DROP TABLE IF EXISTS REVIEWS;
DROP TABLE IF EXISTS INVENTORY;
DROP TABLE IF EXISTS PRODUCT_IMAGES;
DROP TABLE IF EXISTS PRODUCT_VARIANTS;
DROP TABLE IF EXISTS PRODUCTS;
DROP TABLE IF EXISTS BRANDS;
DROP TABLE IF EXISTS CATEGORIES;
DROP TABLE IF EXISTS ENQUIRIES;
DROP TABLE IF EXISTS ADDRESSES;
DROP TABLE IF EXISTS USERS;

-- =====================================================================
-- AREA 1: CUSTOMER & ACCOUNT
-- =====================================================================

-- USERS – registered customers and administrators
CREATE TABLE USERS (
    UserID        INTEGER PRIMARY KEY AUTOINCREMENT,
    FirstName     VARCHAR(50)  NOT NULL CHECK (length(FirstName) BETWEEN 1 AND 50),
    LastName      VARCHAR(50)  NOT NULL CHECK (length(LastName) BETWEEN 1 AND 50),
    Email         VARCHAR(255) NOT NULL UNIQUE
                  CHECK (Email = lower(Email) AND Email LIKE '%_@_%._%'),       -- BR-01
    PasswordHash  VARCHAR(255) NOT NULL CHECK (PasswordHash LIKE '$2%'),        -- BR-02 bcrypt only
    Phone         VARCHAR(20),
    Role          TEXT NOT NULL DEFAULT 'Customer'
                  CHECK (Role IN ('Customer','Admin')),                           -- BR-03
    IsActive      BOOLEAN NOT NULL DEFAULT 1 CHECK (IsActive IN (0,1)),          -- BR-04
    CreatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ADDRESSES – delivery addresses saved by a user            (R1: USERS 1:M ADDRESSES)
CREATE TABLE ADDRESSES (
    AddressID     INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID        INTEGER NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
    AddressLine1  VARCHAR(100) NOT NULL,
    AddressLine2  VARCHAR(100),
    Suburb        VARCHAR(60)  NOT NULL,
    State         TEXT NOT NULL
                  CHECK (State IN ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')),
    Postcode      CHAR(4) NOT NULL CHECK (Postcode GLOB '[0-9][0-9][0-9][0-9]'),
    IsDefault     BOOLEAN NOT NULL DEFAULT 0 CHECK (IsDefault IN (0,1))
);
-- BR-05: only one default address per user
CREATE UNIQUE INDEX UX_ADDRESSES_OneDefault ON ADDRESSES(UserID) WHERE IsDefault = 1;

-- ENQUIRIES – messages from the Contact page                (R6: USERS 1:M ENQUIRIES, optional)
CREATE TABLE ENQUIRIES (
    EnquiryID     INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID        INTEGER REFERENCES USERS(UserID) ON DELETE SET NULL,      -- NULL = guest
    FullName      VARCHAR(100) NOT NULL,
    Email         VARCHAR(255) NOT NULL CHECK (Email LIKE '%_@_%._%'),
    Phone         VARCHAR(20),
    Subject       TEXT NOT NULL CHECK (Subject IN ('General Enquiry','Product Information',
                                                   'Technical Support','Order Status','Returns')),
    Message       TEXT NOT NULL CHECK (length(Message) BETWEEN 10 AND 2000),      -- BR-37
    Status        TEXT NOT NULL DEFAULT 'New'
                  CHECK (Status IN ('New','In Progress','Resolved')),
    SubmittedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- AREA 2: PRODUCT CATALOGUE
-- =====================================================================

-- CATEGORIES – product groupings (reference table)
CREATE TABLE CATEGORIES (
    CategoryID    INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryName  VARCHAR(50) NOT NULL UNIQUE,
    Description   VARCHAR(255),
    IsActive      BOOLEAN NOT NULL DEFAULT 1 CHECK (IsActive IN (0,1))
);

-- BRANDS – product manufacturers (reference table)
CREATE TABLE BRANDS (
    BrandID       INTEGER PRIMARY KEY AUTOINCREMENT,
    BrandName     VARCHAR(50) NOT NULL UNIQUE
);

-- PRODUCTS – information shared by every version of a product
--   (R8: CATEGORIES 1:M PRODUCTS, R9: BRANDS 1:M PRODUCTS)
CREATE TABLE PRODUCTS (
    ProductID      INTEGER PRIMARY KEY AUTOINCREMENT,
    CategoryID     INTEGER NOT NULL REFERENCES CATEGORIES(CategoryID) ON DELETE RESTRICT,  -- BR-07
    BrandID        INTEGER NOT NULL REFERENCES BRANDS(BrandID) ON DELETE RESTRICT,
    ProductName    VARCHAR(150) NOT NULL,
    Description    TEXT NOT NULL,
    Specifications JSON CHECK (Specifications IS NULL OR json_valid(Specifications)),
    WarrantyMonths INT NOT NULL DEFAULT 12 CHECK (WarrantyMonths BETWEEN 0 AND 60),
    IsFeatured     BOOLEAN NOT NULL DEFAULT 0 CHECK (IsFeatured IN (0,1)),
    IsActive       BOOLEAN NOT NULL DEFAULT 1 CHECK (IsActive IN (0,1)),
    CreatedAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCT_VARIANTS – a sellable version with its own SKU and price
--   (R10: PRODUCTS 1:M PRODUCT_VARIANTS)
CREATE TABLE PRODUCT_VARIANTS (
    VariantID      INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID      INTEGER NOT NULL REFERENCES PRODUCTS(ProductID) ON DELETE RESTRICT,
    SKU            VARCHAR(40) NOT NULL UNIQUE                                         -- BR-09
                   CHECK (SKU NOT GLOB '*[^A-Za-z0-9-]*'),
    Colour         VARCHAR(30),
    StorageOrSize  VARCHAR(30),
    Price          DECIMAL(10,2) NOT NULL CHECK (Price > 0),                           -- BR-10
    PromoPrice     DECIMAL(10,2),
    PromoStartDate DATE,
    PromoEndDate   DATE,
    PurchaseLimit  INT CHECK (PurchaseLimit IS NULL OR PurchaseLimit >= 1),            -- BR-31
    IsActive       BOOLEAN NOT NULL DEFAULT 1 CHECK (IsActive IN (0,1)),
    CHECK (PromoPrice IS NULL OR
          (PromoPrice > 0 AND PromoPrice < Price
           AND PromoStartDate IS NOT NULL AND PromoEndDate IS NOT NULL
           AND PromoEndDate >= PromoStartDate))                                         -- BR-10
);

-- PRODUCT_IMAGES – gallery images with alt text           (R11: PRODUCTS 1:M PRODUCT_IMAGES)
CREATE TABLE PRODUCT_IMAGES (
    ImageID        INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID      INTEGER NOT NULL REFERENCES PRODUCTS(ProductID) ON DELETE CASCADE,
    ImageURL       VARCHAR(255) NOT NULL
                   CHECK (lower(ImageURL) LIKE '%.jpg' OR lower(ImageURL) LIKE '%.png'
                          OR lower(ImageURL) LIKE '%.webp'),
    AltText        VARCHAR(150) NOT NULL CHECK (length(AltText) > 0),                 -- BR-11
    SortOrder      INT NOT NULL DEFAULT 0 CHECK (SortOrder >= 0),
    IsPrimary      BOOLEAN NOT NULL DEFAULT 0 CHECK (IsPrimary IN (0,1))
);
-- BR-11: exactly one primary image per product (at most one enforced here)
CREATE UNIQUE INDEX UX_PRODUCT_IMAGES_OnePrimary ON PRODUCT_IMAGES(ProductID) WHERE IsPrimary = 1;

-- INVENTORY – stock on hand, one row per variant          (R14: PRODUCT_VARIANTS 1:1 INVENTORY)
CREATE TABLE INVENTORY (
    InventoryID       INTEGER PRIMARY KEY AUTOINCREMENT,
    VariantID         INTEGER NOT NULL UNIQUE
                      REFERENCES PRODUCT_VARIANTS(VariantID) ON DELETE CASCADE,       -- BR-13
    QuantityOnHand    INT NOT NULL CHECK (QuantityOnHand >= 0),                         -- BR-14
    LowStockThreshold INT NOT NULL DEFAULT 5 CHECK (LowStockThreshold >= 0),           -- BR-16
    UpdatedAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- REVIEWS – ratings and reviews (junction: USERS <-> PRODUCTS)
--   (R4: USERS 1:M REVIEWS, R12: PRODUCTS 1:M REVIEWS)
CREATE TABLE REVIEWS (
    ReviewID           INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductID          INTEGER NOT NULL REFERENCES PRODUCTS(ProductID) ON DELETE RESTRICT,
    UserID             INTEGER NOT NULL REFERENCES USERS(UserID) ON DELETE RESTRICT,
    Rating             TINYINT NOT NULL CHECK (Rating BETWEEN 1 AND 5),                -- BR-33
    Title              VARCHAR(100),
    Comment            TEXT CHECK (Comment IS NULL OR length(Comment) <= 2000),
    IsVerifiedPurchase BOOLEAN NOT NULL DEFAULT 0 CHECK (IsVerifiedPurchase IN (0,1)), -- BR-34
    Status             TEXT NOT NULL DEFAULT 'Pending'
                       CHECK (Status IN ('Pending','Approved','Rejected')),           -- BR-35
    CreatedAt          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (UserID, ProductID)                                                         -- BR-32
);

-- WISHLIST_ITEMS – products saved for later (junction: USERS <-> PRODUCTS)
--   (R3: USERS 1:M WISHLIST_ITEMS, R13: PRODUCTS 1:M WISHLIST_ITEMS)
CREATE TABLE WISHLIST_ITEMS (
    WishlistItemID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID         INTEGER NOT NULL REFERENCES USERS(UserID) ON DELETE CASCADE,
    ProductID      INTEGER NOT NULL REFERENCES PRODUCTS(ProductID) ON DELETE CASCADE,
    AddedAt        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (UserID, ProductID)                                                         -- BR-21
);

-- =====================================================================
-- AREA 3: CART, ORDERS & PAYMENTS
-- =====================================================================

-- CARTS – one active cart per user                          (R2: USERS 1:1 CARTS, optional)
CREATE TABLE CARTS (
    CartID     INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID     INTEGER NOT NULL UNIQUE REFERENCES USERS(UserID) ON DELETE CASCADE,   -- BR-18
    CreatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CART_ITEMS – variants in a cart (junction: CARTS <-> PRODUCT_VARIANTS)
--   (R15: CARTS 1:M CART_ITEMS, R16: PRODUCT_VARIANTS 1:M CART_ITEMS)
CREATE TABLE CART_ITEMS (
    CartItemID INTEGER PRIMARY KEY AUTOINCREMENT,
    CartID     INTEGER NOT NULL REFERENCES CARTS(CartID) ON DELETE CASCADE,
    VariantID  INTEGER NOT NULL REFERENCES PRODUCT_VARIANTS(VariantID) ON DELETE CASCADE,
    Quantity   INT NOT NULL CHECK (Quantity >= 1),                                     -- BR-20
    AddedAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (CartID, VariantID)                                                         -- BR-19
);

-- ORDERS – confirmed customer orders
--   (R5: USERS 1:M ORDERS, R7: ADDRESSES 1:M ORDERS, optional)
CREATE TABLE ORDERS (
    OrderID               INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderNumber           VARCHAR(20) NOT NULL UNIQUE                                  -- BR-28
                          CHECK (OrderNumber GLOB 'SR-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]'),
    UserID                INTEGER NOT NULL REFERENCES USERS(UserID) ON DELETE RESTRICT,
    AddressID             INTEGER REFERENCES ADDRESSES(AddressID) ON DELETE RESTRICT,
    FulfilmentMethod      TEXT NOT NULL CHECK (FulfilmentMethod IN ('Delivery','ClickAndCollect')),
    OrderStatus           TEXT NOT NULL DEFAULT 'Pending'
                          CHECK (OrderStatus IN ('Pending','Paid','Shipped','Delivered','Cancelled')),
    Subtotal              DECIMAL(10,2) NOT NULL CHECK (Subtotal >= 0),
    DeliveryCost          DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (DeliveryCost >= 0),
    TotalAmount           DECIMAL(10,2) NOT NULL,
    EstimatedDeliveryDate DATE,
    TrackingNumber        VARCHAR(50),
    CreatedAt             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- BR-24: total = subtotal + delivery
    CHECK (abs(TotalAmount - (Subtotal + DeliveryCost)) < 0.005),
    -- BR-25: delivery needs an address; Click & Collect has no address and $0 delivery
    CHECK ((FulfilmentMethod = 'Delivery' AND AddressID IS NOT NULL) OR
           (FulfilmentMethod = 'ClickAndCollect' AND AddressID IS NULL AND DeliveryCost = 0)),
    -- BR-27: shipped orders need a tracking number
    CHECK (OrderStatus NOT IN ('Shipped','Delivered') OR TrackingNumber IS NOT NULL),
    CHECK (EstimatedDeliveryDate IS NULL OR EstimatedDeliveryDate >= date(CreatedAt))
);

-- ORDER_ITEMS – variants in an order, with the price paid (junction: ORDERS <-> PRODUCT_VARIANTS)
--   (R17: ORDERS 1:M ORDER_ITEMS, R18: PRODUCT_VARIANTS 1:M ORDER_ITEMS)
CREATE TABLE ORDER_ITEMS (
    OrderItemID INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID     INTEGER NOT NULL REFERENCES ORDERS(OrderID) ON DELETE RESTRICT,
    VariantID   INTEGER NOT NULL REFERENCES PRODUCT_VARIANTS(VariantID) ON DELETE RESTRICT,
    Quantity    INT NOT NULL CHECK (Quantity >= 1),
    UnitPrice   DECIMAL(10,2) NOT NULL CHECK (UnitPrice > 0),                          -- BR-23
    LineTotal   DECIMAL(10,2) NOT NULL,
    CHECK (abs(LineTotal - Quantity * UnitPrice) < 0.005)
);

-- PAYMENTS – payment attempts for an order                  (R19: ORDERS 1:M PAYMENTS)
CREATE TABLE PAYMENTS (
    PaymentID        INTEGER PRIMARY KEY AUTOINCREMENT,
    OrderID          INTEGER NOT NULL REFERENCES ORDERS(OrderID) ON DELETE RESTRICT,
    PaymentMethod    TEXT NOT NULL CHECK (PaymentMethod IN ('Card','PayPal','Afterpay')),
    PaymentStatus    TEXT NOT NULL DEFAULT 'Pending'
                     CHECK (PaymentStatus IN ('Pending','Successful','Failed','Refunded')),
    Amount           DECIMAL(10,2) NOT NULL CHECK (Amount > 0),
    GatewayReference VARCHAR(100),                                                     -- BR-30: no card data
    PaidAt           DATETIME,
    CHECK (PaymentStatus <> 'Successful' OR PaidAt IS NOT NULL)
);
-- BR-29: only one successful payment per order
CREATE UNIQUE INDEX UX_PAYMENTS_OneSuccess ON PAYMENTS(OrderID) WHERE PaymentStatus = 'Successful';

-- ---------------------------------------------------------------------
-- Indexes on foreign keys (faster joins for the backend)
-- ---------------------------------------------------------------------
CREATE INDEX IX_ADDRESSES_UserID        ON ADDRESSES(UserID);
CREATE INDEX IX_ENQUIRIES_UserID        ON ENQUIRIES(UserID);
CREATE INDEX IX_PRODUCTS_CategoryID     ON PRODUCTS(CategoryID);
CREATE INDEX IX_PRODUCTS_BrandID        ON PRODUCTS(BrandID);
CREATE INDEX IX_VARIANTS_ProductID      ON PRODUCT_VARIANTS(ProductID);
CREATE INDEX IX_IMAGES_ProductID        ON PRODUCT_IMAGES(ProductID);
CREATE INDEX IX_REVIEWS_ProductID       ON REVIEWS(ProductID);
CREATE INDEX IX_WISHLIST_ProductID      ON WISHLIST_ITEMS(ProductID);
CREATE INDEX IX_CART_ITEMS_VariantID    ON CART_ITEMS(VariantID);
CREATE INDEX IX_ORDERS_UserID           ON ORDERS(UserID);
CREATE INDEX IX_ORDER_ITEMS_OrderID     ON ORDER_ITEMS(OrderID);
CREATE INDEX IX_ORDER_ITEMS_VariantID   ON ORDER_ITEMS(VariantID);
CREATE INDEX IX_PAYMENTS_OrderID        ON PAYMENTS(OrderID);

-- ---------------------------------------------------------------------
-- Triggers: keep UpdatedAt current whenever a row changes
-- ---------------------------------------------------------------------
CREATE TRIGGER TR_USERS_UpdatedAt AFTER UPDATE ON USERS
BEGIN UPDATE USERS SET UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = NEW.UserID; END;

CREATE TRIGGER TR_PRODUCTS_UpdatedAt AFTER UPDATE ON PRODUCTS
BEGIN UPDATE PRODUCTS SET UpdatedAt = CURRENT_TIMESTAMP WHERE ProductID = NEW.ProductID; END;

CREATE TRIGGER TR_INVENTORY_UpdatedAt AFTER UPDATE ON INVENTORY
BEGIN UPDATE INVENTORY SET UpdatedAt = CURRENT_TIMESTAMP WHERE InventoryID = NEW.InventoryID; END;

CREATE TRIGGER TR_CARTS_UpdatedAt AFTER UPDATE ON CARTS
BEGIN UPDATE CARTS SET UpdatedAt = CURRENT_TIMESTAMP WHERE CartID = NEW.CartID; END;

CREATE TRIGGER TR_ORDERS_UpdatedAt AFTER UPDATE ON ORDERS
BEGIN UPDATE ORDERS SET UpdatedAt = CURRENT_TIMESTAMP WHERE OrderID = NEW.OrderID; END;
