-- =====================================================================
-- Secure Retail – Database validation queries (Steps 6 and 7)
-- Run against project.db. Every "problem" query should return 0 rows,
-- or a count of 0.
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Record count for every table
SELECT 'USERS' AS TableName, COUNT(*) AS Records FROM USERS
UNION ALL SELECT 'ADDRESSES', COUNT(*) FROM ADDRESSES
UNION ALL SELECT 'ENQUIRIES', COUNT(*) FROM ENQUIRIES
UNION ALL SELECT 'CATEGORIES', COUNT(*) FROM CATEGORIES
UNION ALL SELECT 'BRANDS', COUNT(*) FROM BRANDS
UNION ALL SELECT 'PRODUCTS', COUNT(*) FROM PRODUCTS
UNION ALL SELECT 'PRODUCT_VARIANTS', COUNT(*) FROM PRODUCT_VARIANTS
UNION ALL SELECT 'PRODUCT_IMAGES', COUNT(*) FROM PRODUCT_IMAGES
UNION ALL SELECT 'INVENTORY', COUNT(*) FROM INVENTORY
UNION ALL SELECT 'REVIEWS', COUNT(*) FROM REVIEWS
UNION ALL SELECT 'WISHLIST_ITEMS', COUNT(*) FROM WISHLIST_ITEMS
UNION ALL SELECT 'CARTS', COUNT(*) FROM CARTS
UNION ALL SELECT 'CART_ITEMS', COUNT(*) FROM CART_ITEMS
UNION ALL SELECT 'ORDERS', COUNT(*) FROM ORDERS
UNION ALL SELECT 'ORDER_ITEMS', COUNT(*) FROM ORDER_ITEMS
UNION ALL SELECT 'PAYMENTS', COUNT(*) FROM PAYMENTS;

-- 2. Relationships are valid: foreign keys pointing to missing rows (expect no rows)
PRAGMA foreign_key_check;

-- 3. Database file is not corrupted (expect "ok")
PRAGMA integrity_check;

-- 4. Business-rule checks (expect 0 for every row)
SELECT 'Variants without an inventory record (BR-13)' AS CheckName,
       COUNT(*) AS Problems
FROM PRODUCT_VARIANTS v LEFT JOIN INVENTORY i ON i.VariantID = v.VariantID
WHERE i.InventoryID IS NULL
UNION ALL
SELECT 'Active products without exactly one primary image (BR-11)', COUNT(*)
FROM PRODUCTS p
WHERE p.IsActive = 1
  AND (SELECT COUNT(*) FROM PRODUCT_IMAGES i WHERE i.ProductID = p.ProductID AND i.IsPrimary = 1) <> 1
UNION ALL
SELECT 'Products without an active variant (BR-08)', COUNT(*)
FROM PRODUCTS p
WHERE p.IsActive = 1
  AND NOT EXISTS (SELECT 1 FROM PRODUCT_VARIANTS v WHERE v.ProductID = p.ProductID AND v.IsActive = 1)
UNION ALL
SELECT 'Orders with no order items (BR-22)', COUNT(*)
FROM ORDERS o WHERE NOT EXISTS (SELECT 1 FROM ORDER_ITEMS oi WHERE oi.OrderID = o.OrderID)
UNION ALL
SELECT 'Orders whose subtotal does not match their items (BR-24)', COUNT(*)
FROM ORDERS o
WHERE abs(o.Subtotal - (SELECT SUM(LineTotal) FROM ORDER_ITEMS oi WHERE oi.OrderID = o.OrderID)) >= 0.005
UNION ALL
SELECT 'Paid/Shipped/Delivered orders without a matching successful payment (BR-29)', COUNT(*)
FROM ORDERS o
WHERE o.OrderStatus IN ('Paid','Shipped','Delivered')
  AND NOT EXISTS (SELECT 1 FROM PAYMENTS p WHERE p.OrderID = o.OrderID
                  AND p.PaymentStatus = 'Successful' AND abs(p.Amount - o.TotalAmount) < 0.005)
UNION ALL
SELECT 'Delivery addresses that belong to a different user', COUNT(*)
FROM ORDERS o JOIN ADDRESSES a ON a.AddressID = o.AddressID
WHERE a.UserID <> o.UserID
UNION ALL
SELECT 'Cart quantities above stock or purchase limit (BR-20)', COUNT(*)
FROM CART_ITEMS ci
JOIN INVENTORY i ON i.VariantID = ci.VariantID
JOIN PRODUCT_VARIANTS v ON v.VariantID = ci.VariantID
WHERE ci.Quantity > i.QuantityOnHand
   OR (v.PurchaseLimit IS NOT NULL AND ci.Quantity > v.PurchaseLimit)
UNION ALL
SELECT 'Order lines above the purchase limit (BR-31)', COUNT(*)
FROM ORDER_ITEMS oi JOIN PRODUCT_VARIANTS v ON v.VariantID = oi.VariantID
WHERE v.PurchaseLimit IS NOT NULL AND oi.Quantity > v.PurchaseLimit
UNION ALL
SELECT 'Verified reviews without a delivered order for the product (BR-34)', COUNT(*)
FROM REVIEWS r
WHERE r.IsVerifiedPurchase = 1
  AND NOT EXISTS (SELECT 1 FROM ORDERS o
                  JOIN ORDER_ITEMS oi ON oi.OrderID = o.OrderID
                  JOIN PRODUCT_VARIANTS v ON v.VariantID = oi.VariantID
                  WHERE o.UserID = r.UserID AND o.OrderStatus = 'Delivered'
                    AND v.ProductID = r.ProductID)
UNION ALL
SELECT 'Users without exactly one default address (users with addresses)', COUNT(*)
FROM (SELECT UserID FROM ADDRESSES GROUP BY UserID HAVING SUM(IsDefault) <> 1);

-- 5. Example joined view: products with category, brand, price and stock
SELECT p.ProductName, c.CategoryName, b.BrandName, v.SKU, v.Colour, v.StorageOrSize,
       v.Price, v.PromoPrice, i.QuantityOnHand,
       CASE WHEN i.QuantityOnHand = 0 THEN 'Out of stock'
            WHEN i.QuantityOnHand <= i.LowStockThreshold THEN 'Low stock'
            ELSE 'In stock' END AS StockStatus
FROM PRODUCT_VARIANTS v
JOIN PRODUCTS p   ON p.ProductID  = v.ProductID
JOIN CATEGORIES c ON c.CategoryID = p.CategoryID
JOIN BRANDS b     ON b.BrandID    = p.BrandID
JOIN INVENTORY i  ON i.VariantID  = v.VariantID
ORDER BY c.CategoryName, p.ProductName;

-- 6. Example joined view: orders with customer, items and payment status
SELECT o.OrderNumber, u.FirstName || ' ' || u.LastName AS Customer,
       o.FulfilmentMethod, o.OrderStatus, o.TotalAmount,
       (SELECT COUNT(*) FROM ORDER_ITEMS oi WHERE oi.OrderID = o.OrderID) AS Items,
       (SELECT group_concat(PaymentStatus, ', ') FROM PAYMENTS p WHERE p.OrderID = o.OrderID) AS Payments
FROM ORDERS o JOIN USERS u ON u.UserID = o.UserID
ORDER BY o.CreatedAt;
