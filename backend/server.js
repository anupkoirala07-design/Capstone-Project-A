// =====================================================================
// Secure Retail – Product Catalogue System
// Backend server (Capstone B – Sprint 3 – Week 7)
//
// Express server connected to the SQLite database in ../database/project.db
//
// Start:  node server.js
// Test:   http://localhost:3000
//         http://localhost:3000/api/products
//         http://localhost:3000/api/products/1
//         http://localhost:3000/api/categories
// =====================================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// ---------------------------------------------------------------------
// Step 8 – Connect to the database
// The database lives in the database folder, next to the backend folder.
// OPEN_READWRITE means the server will NOT create a new empty database
// if the file cannot be found – it reports an error instead.
// ---------------------------------------------------------------------
const dbPath = path.join(__dirname, '..', 'database', 'project.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        console.error('Looked for the database at:', dbPath);
        process.exit(1);
    }

    console.log('Connected to SQLite database:', dbPath);

    // Turn on foreign key checks (needed for every connection in SQLite)
    db.run('PRAGMA foreign_keys = ON');

    // Quick test query to prove the connection works
    db.get('SELECT COUNT(*) AS count FROM PRODUCTS', (err, row) => {
        if (err) {
            console.error('Test query failed:', err.message);
        } else {
            console.log(`Database check: ${row.count} products found`);
        }
    });
});

// Price shown to customers: the promo price only while a promotion is running (BR-10)
const CURRENT_PRICE = `
    CASE WHEN v.PromoPrice IS NOT NULL
              AND date('now') BETWEEN v.PromoStartDate AND v.PromoEndDate
         THEN v.PromoPrice ELSE v.Price END`;

// ---------------------------------------------------------------------
// Step 5 – Home route
// ---------------------------------------------------------------------
app.get('/', (req, res) => {
    res.send('Server Running');
});

// ---------------------------------------------------------------------
// Step 9 – First API endpoint: GET /api/products
// Returns every active product with its category, brand,
// starting price, number of variants and total stock.
// ---------------------------------------------------------------------
app.get('/api/products', (req, res) => {
    const sql = `
        SELECT p.ProductID, p.ProductName, c.CategoryName, b.BrandName,
               p.Description, p.WarrantyMonths, p.IsFeatured,
               MIN(${CURRENT_PRICE}) AS PriceFrom,
               COUNT(v.VariantID) AS VariantCount,
               SUM(i.QuantityOnHand) AS TotalStock
        FROM PRODUCTS p
        JOIN CATEGORIES c ON c.CategoryID = p.CategoryID
        JOIN BRANDS b ON b.BrandID = p.BrandID
        LEFT JOIN PRODUCT_VARIANTS v ON v.ProductID = p.ProductID AND v.IsActive = 1
        LEFT JOIN INVENTORY i ON i.VariantID = v.VariantID
        WHERE p.IsActive = 1
        GROUP BY p.ProductID
        ORDER BY p.ProductID`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Could not retrieve products' });
        }
        res.json(rows);
    });
});

// ---------------------------------------------------------------------
// Extra endpoint: GET /api/products/:id
// Returns one product with all of its variants and stock status.
// ---------------------------------------------------------------------
app.get('/api/products/:id', (req, res) => {
    const id = Number(req.params.id);

    // Validate the ID before it reaches the database
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Product ID must be a positive whole number' });
    }

    const productSql = `
        SELECT p.ProductID, p.ProductName, c.CategoryName, b.BrandName,
               p.Description, p.Specifications, p.WarrantyMonths
        FROM PRODUCTS p
        JOIN CATEGORIES c ON c.CategoryID = p.CategoryID
        JOIN BRANDS b ON b.BrandID = p.BrandID
        WHERE p.ProductID = ? AND p.IsActive = 1`;

    const variantSql = `
        SELECT v.VariantID, v.SKU, v.Colour, v.StorageOrSize,
               v.Price, ${CURRENT_PRICE} AS CurrentPrice, v.PurchaseLimit,
               i.QuantityOnHand,
               CASE WHEN i.QuantityOnHand = 0 THEN 'Out of stock'
                    WHEN i.QuantityOnHand <= i.LowStockThreshold THEN 'Low stock'
                    ELSE 'In stock' END AS StockStatus
        FROM PRODUCT_VARIANTS v
        JOIN INVENTORY i ON i.VariantID = v.VariantID
        WHERE v.ProductID = ? AND v.IsActive = 1
        ORDER BY v.Price`;

    // Placeholders (?) keep user input out of the SQL text – prevents SQL injection
    db.get(productSql, [id], (err, product) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Could not retrieve product' });
        }
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        db.all(variantSql, [id], (err, variants) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Could not retrieve variants' });
            }
            product.Specifications = product.Specifications ? JSON.parse(product.Specifications) : null;
            product.Variants = variants;
            res.json(product);
        });
    });
});

// ---------------------------------------------------------------------
// Extra endpoint: GET /api/categories
// ---------------------------------------------------------------------
app.get('/api/categories', (req, res) => {
    const sql = `
        SELECT CategoryID, CategoryName, Description
        FROM CATEGORIES
        WHERE IsActive = 1
        ORDER BY CategoryName`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Could not retrieve categories' });
        }
        res.json(rows);
    });
});

// ---------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------
app.listen(PORT, () => {
    console.log('Server Started');
    console.log(`Open http://localhost:${PORT} in your browser`);
});