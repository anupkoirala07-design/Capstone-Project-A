// =====================================================================
// Secure Retail – Product Catalogue System
// Backend server (Capstone B – final version)
//
// Express server connected to the SQLite database in ../database/project.db
// Builds on the Week 7 server and the Week 8–9 CRUD, and adds what we
// promised in the Capstone A presentation:
//   - customer register / login / logout
//   - shopping cart and checkout (simulated payment – no card details)
//   - an admin area for products, variants (price + stock), orders
//     and enquiries
//
// First time:   npm install
//               node set-demo-passwords.js     (gives the sample users real passwords)
// Start:        node server.js
// Shop:         http://localhost:3000/index.html
// Admin:        http://localhost:3000/admin.html
//
// Endpoints
//   GET    /                                -> "Server Running"
//
//   Accounts
//   POST   /api/auth/register               -> create a customer account and log in
//   POST   /api/auth/login                  -> log in
//   POST   /api/auth/logout                 -> log out
//   GET    /api/auth/me                     -> who is logged in
//
//   Catalogue (public)
//   GET    /api/products                    -> list active products (?search= &category=)
//   GET    /api/products/:id                -> one product with its variants
//   GET    /api/categories, /api/brands     -> lists for menus and forms
//   POST   /api/enquiries                   -> Contact page form
//
//   Cart, checkout and orders (logged-in customers)
//   GET    /api/cart                        -> my cart
//   POST   /api/cart/items                  -> add a variant to my cart
//   PUT    /api/cart/items/:id              -> change quantity
//   DELETE /api/cart/items/:id              -> remove from cart
//   GET    /api/addresses                   -> my saved addresses
//   POST   /api/addresses                   -> add an address
//   POST   /api/checkout                    -> place the order and pay
//   GET    /api/orders, /api/orders/:id     -> my orders
//
//   Admin only
//   POST   /api/products                    -> add a product           (Week 8–9)
//   PUT    /api/products/:id                -> update a product        (Week 8–9)
//   DELETE /api/products/:id                -> delete/deactivate       (Week 8–9)
//   GET    /api/admin/summary               -> dashboard numbers
//   GET    /api/admin/products/:id/variants -> variants with price and stock
//   POST   /api/admin/products/:id/variants -> add a variant (and its stock record)
//   PUT    /api/admin/variants/:id          -> update price, promotion, stock
//   DELETE /api/admin/variants/:id          -> delete/deactivate a variant
//   GET    /api/admin/orders, /:id          -> all orders
//   PUT    /api/admin/orders/:id/status     -> Shipped / Delivered / Cancelled
//   GET    /api/admin/enquiries             -> Contact page messages
//   PUT    /api/admin/enquiries/:id/status  -> New / In Progress / Resolved
//   GET    /api/admin/low-stock             -> low-stock alerts
// =====================================================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

// Delivery charge rule used by checkout (Click & Collect is always free – BR-25)
const DELIVERY_FEE = 9.95;
const FREE_DELIVERY_FROM = 1000;   // orders of $1,000 or more get free delivery

// Read JSON request bodies (needed for POST and PUT)
app.use(express.json({ limit: '100kb' }));

// ---------------------------------------------------------------------
// Sessions – remember who is logged in
// The browser only gets a random session ID in an HttpOnly cookie
// (JavaScript on the page cannot read it). The user details stay on the server.
// ---------------------------------------------------------------------
app.use(session({
    name: 'sr.sid',
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 2 * 60 * 60 * 1000          // 2 hours
    }
}));

// ---------------------------------------------------------------------
// Connect to the database
// OPEN_READWRITE: report an error instead of creating an empty database
// ---------------------------------------------------------------------
const dbPath = path.join(__dirname, '..', 'database', 'project.db');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Database connection failed:', err.message);
        console.error('Looked for the database at:', dbPath);
        process.exit(1);
    }

    console.log('Connected to SQLite database:', dbPath);
    db.run('PRAGMA foreign_keys = ON');

    db.get('SELECT COUNT(*) AS count FROM PRODUCTS', (err, row) => {
        if (err) {
            console.error('Test query failed:', err.message);
        } else {
            console.log(`Database check: ${row.count} products found`);
        }
    });
});

// Small helpers so the route code can use async/await
function dbGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}

function dbAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

function dbRun(sql, params = []) {
    return new Promise((resolve, reject) => {
        // "function" (not an arrow) so that this.lastID and this.changes work
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

// Runs several statements as ONE transaction: either all of them are saved
// or none are. Requests that change data wait their turn, so two checkouts
// can never sell the same last item twice.
let writeQueue = Promise.resolve();
function withTransaction(work) {
    const run = writeQueue.then(async () => {
        await dbRun('BEGIN IMMEDIATE');
        try {
            const result = await work();
            await dbRun('COMMIT');
            return result;
        } catch (err) {
            await dbRun('ROLLBACK').catch(() => {});
            throw err;
        }
    });
    writeQueue = run.catch(() => {});
    return run;
}

// An error with an HTTP status code, e.g. throw new HttpError(409, 'Out of stock')
class HttpError extends Error {
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
    }
}

// Wraps a route so HttpErrors become proper responses and anything else is a 500
function route(handler) {
    return async (req, res) => {
        try {
            await handler(req, res);
        } catch (err) {
            if (err instanceof HttpError) {
                const body = { error: err.message };
                if (err.details) body.details = err.details;
                return res.status(err.status).json(body);
            }
            console.error(err);
            res.status(500).json({ error: 'Something went wrong on the server' });
        }
    };
}

// Price shown to customers: the promo price only while a promotion is running (BR-10)
const CURRENT_PRICE = `
    CASE WHEN v.PromoPrice IS NOT NULL
              AND date('now') BETWEEN v.PromoStartDate AND v.PromoEndDate
         THEN v.PromoPrice ELSE v.Price END`;

// Money is added up in cents so we never get answers like 0.30000000000000004
const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => Math.round(cents) / 100;

// ---------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------

// Checks that an ID from the URL is a positive whole number
function parseId(value) {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
}

const isText = (value) => typeof value === 'string' && value.trim() !== '';
const isWholeNumber = (value, min = 0) => Number.isInteger(value) && value >= min;
const isMoney = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0 &&
                           Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;
const isDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                          !Number.isNaN(Date.parse(value));
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Checks the request body is a JSON object before reading fields from it
function requireBody(body) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new HttpError(400, 'Request body must be a JSON object');
    }
    return body;
}

// Checks the product data sent by the user. Returns a list of error messages.
function validateProduct(body) {
    const errors = [];

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return ['Request body must be a JSON object'];
    }

    const { ProductName, Description, CategoryID, BrandID,
            WarrantyMonths, IsFeatured, Specifications } = body;

    // Required text fields: must be present, must be text, must not be blank
    if (ProductName === undefined || ProductName === null) {
        errors.push('ProductName is required');
    } else if (typeof ProductName !== 'string') {
        errors.push('ProductName must be text');
    } else if (ProductName.trim() === '') {
        errors.push('ProductName cannot be blank');
    } else if (ProductName.trim().length > 150) {
        errors.push('ProductName must be 150 characters or fewer');
    }

    if (Description === undefined || Description === null) {
        errors.push('Description is required');
    } else if (typeof Description !== 'string') {
        errors.push('Description must be text');
    } else if (Description.trim() === '') {
        errors.push('Description cannot be blank');
    }

    // Required ID fields: must be positive whole numbers
    if (CategoryID === undefined || CategoryID === null || CategoryID === '') {
        errors.push('CategoryID is required');
    } else if (!Number.isInteger(CategoryID) || CategoryID < 1) {
        errors.push('CategoryID must be a positive whole number');
    }

    if (BrandID === undefined || BrandID === null || BrandID === '') {
        errors.push('BrandID is required');
    } else if (!Number.isInteger(BrandID) || BrandID < 1) {
        errors.push('BrandID must be a positive whole number');
    }

    // Optional fields
    if (WarrantyMonths !== undefined && WarrantyMonths !== null &&
        (!Number.isInteger(WarrantyMonths) || WarrantyMonths < 0 || WarrantyMonths > 60)) {
        errors.push('WarrantyMonths must be a whole number from 0 to 60');
    }

    if (IsFeatured !== undefined && IsFeatured !== null && typeof IsFeatured !== 'boolean') {
        errors.push('IsFeatured must be true or false');
    }

    if (Specifications !== undefined && Specifications !== null &&
        (typeof Specifications !== 'object' || Array.isArray(Specifications))) {
        errors.push('Specifications must be a JSON object of name/value pairs');
    }

    return errors;
}

// Checks the rules that need the database: category/brand exist, no duplicates
async function checkProductRules(body, excludeProductId = null) {
    const errors = [];

    const category = await dbGet(
        'SELECT CategoryID FROM CATEGORIES WHERE CategoryID = ? AND IsActive = 1', [body.CategoryID]);
    if (!category) errors.push(`CategoryID ${body.CategoryID} does not exist`);

    const brand = await dbGet('SELECT BrandID FROM BRANDS WHERE BrandID = ?', [body.BrandID]);
    if (!brand) errors.push(`BrandID ${body.BrandID} does not exist`);

    if (errors.length) return { status: 400, errors };

    // Duplicate check: the same product name for the same brand (ignoring case and spaces)
    const duplicate = await dbGet(
        `SELECT ProductID FROM PRODUCTS
         WHERE lower(trim(ProductName)) = lower(?) AND BrandID = ? AND IsActive = 1
           AND (? IS NULL OR ProductID <> ?)`,
        [body.ProductName.trim(), body.BrandID, excludeProductId, excludeProductId]);

    if (duplicate) {
        return {
            status: 409,
            errors: [`A product named "${body.ProductName.trim()}" already exists for this brand (ProductID ${duplicate.ProductID})`]
        };
    }

    return null;
}

// Checks variant data from the admin page (price, promotion, stock). BR-09, BR-10, BR-14, BR-31
function validateVariant(body, isNew) {
    const errors = [];
    const b = body;

    if (!isText(b.SKU)) errors.push('SKU is required');
    else if (b.SKU.trim().length > 40) errors.push('SKU must be 40 characters or fewer');
    else if (!/^[A-Za-z0-9-]+$/.test(b.SKU.trim())) errors.push('SKU can only use letters, numbers and hyphens');

    for (const field of ['Colour', 'StorageOrSize']) {
        if (b[field] !== undefined && b[field] !== null && b[field] !== '' &&
            (typeof b[field] !== 'string' || b[field].trim().length > 30)) {
            errors.push(`${field} must be text of 30 characters or fewer`);
        }
    }

    if (!isMoney(b.Price)) errors.push('Price must be a number greater than 0 with at most 2 decimal places');

    const hasPromo = b.PromoPrice !== undefined && b.PromoPrice !== null && b.PromoPrice !== '';
    if (hasPromo) {
        if (!isMoney(b.PromoPrice)) errors.push('PromoPrice must be a number greater than 0');
        else if (isMoney(b.Price) && b.PromoPrice >= b.Price) errors.push('PromoPrice must be lower than Price');
        if (!isDate(b.PromoStartDate) || !isDate(b.PromoEndDate)) {
            errors.push('A promotion needs a start date and an end date (YYYY-MM-DD)');
        } else if (b.PromoEndDate < b.PromoStartDate) {
            errors.push('PromoEndDate must be on or after PromoStartDate');
        }
    }

    if (b.PurchaseLimit !== undefined && b.PurchaseLimit !== null && b.PurchaseLimit !== '' &&
        !isWholeNumber(b.PurchaseLimit, 1)) {
        errors.push('PurchaseLimit must be a whole number of 1 or more (or empty for no limit)');
    }

    if ((isNew || b.QuantityOnHand !== undefined) && !isWholeNumber(b.QuantityOnHand, 0)) {
        errors.push('QuantityOnHand must be a whole number of 0 or more');
    }
    if (b.LowStockThreshold !== undefined && b.LowStockThreshold !== null &&
        !isWholeNumber(b.LowStockThreshold, 0)) {
        errors.push('LowStockThreshold must be a whole number of 0 or more');
    }

    return errors;
}

// Turns a variant request body into the values saved in the database
function variantValues(b) {
    const hasPromo = b.PromoPrice !== undefined && b.PromoPrice !== null && b.PromoPrice !== '';
    const clean = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null);
    return {
        SKU: b.SKU.trim().toUpperCase(),
        Colour: clean(b.Colour),
        StorageOrSize: clean(b.StorageOrSize),
        Price: b.Price,
        PromoPrice: hasPromo ? b.PromoPrice : null,
        PromoStartDate: hasPromo ? b.PromoStartDate : null,
        PromoEndDate: hasPromo ? b.PromoEndDate : null,
        PurchaseLimit: Number.isInteger(b.PurchaseLimit) ? b.PurchaseLimit : null
    };
}

// Loads one product with its variants (used by READ, CREATE and UPDATE responses)
async function getProductById(id) {
    const product = await dbGet(`
        SELECT p.ProductID, p.ProductName, p.CategoryID, c.CategoryName,
               p.BrandID, b.BrandName, p.Description, p.Specifications,
               p.WarrantyMonths, p.IsFeatured, p.CreatedAt, p.UpdatedAt,
               (SELECT ImageURL FROM PRODUCT_IMAGES WHERE ProductID = p.ProductID AND IsPrimary = 1) AS ImageURL,
               (SELECT AltText FROM PRODUCT_IMAGES WHERE ProductID = p.ProductID AND IsPrimary = 1) AS ImageAlt
        FROM PRODUCTS p
        JOIN CATEGORIES c ON c.CategoryID = p.CategoryID
        JOIN BRANDS b ON b.BrandID = p.BrandID
        WHERE p.ProductID = ? AND p.IsActive = 1`, [id]);

    if (!product) return null;

    product.Specifications = product.Specifications ? JSON.parse(product.Specifications) : null;
    product.IsFeatured = product.IsFeatured === 1;
    product.Variants = await dbAll(`
        SELECT v.VariantID, v.SKU, v.Colour, v.StorageOrSize,
               v.Price, ${CURRENT_PRICE} AS CurrentPrice, v.PurchaseLimit,
               i.QuantityOnHand,
               CASE WHEN i.QuantityOnHand = 0 THEN 'Out of stock'
                    WHEN i.QuantityOnHand <= i.LowStockThreshold THEN 'Low stock'
                    ELSE 'In stock' END AS StockStatus
        FROM PRODUCT_VARIANTS v
        JOIN INVENTORY i ON i.VariantID = v.VariantID
        WHERE v.ProductID = ? AND v.IsActive = 1
        ORDER BY v.Price`, [id]);

    return product;
}

// ---------------------------------------------------------------------
// Login checks (middleware)
// The user's role and active status are checked against the database on
// every request, so a deactivated account is locked out straight away.
// ---------------------------------------------------------------------
async function loadSessionUser(req) {
    if (!req.session.user) return null;
    const user = await dbGet(
        'SELECT UserID, FirstName, LastName, Email, Role FROM USERS WHERE UserID = ? AND IsActive = 1',
        [req.session.user.UserID]);
    if (!user) req.session.user = null;
    return user || null;
}

async function requireLogin(req, res, next) {
    try {
        req.user = await loadSessionUser(req);
        if (!req.user) return res.status(401).json({ error: 'Please log in first' });
        next();
    } catch (err) {
        next(err);
    }
}

async function requireAdmin(req, res, next) {
    try {
        req.user = await loadSessionUser(req);
        if (!req.user) return res.status(401).json({ error: 'Please log in first' });
        if (req.user.Role !== 'Admin') return res.status(403).json({ error: 'Only admins can do this' });   // BR-03
        next();
    } catch (err) {
        next(err);
    }
}

// ---------------------------------------------------------------------
// Home route
// ---------------------------------------------------------------------
app.get('/', (req, res) => {
    res.send('Server Running');
});

// Serve the frontend pages (index.html, cart.html, admin.html …) from ../frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// =====================================================================
// ACCOUNTS – register, login, logout
// =====================================================================

// Used when the email is not found, so a wrong email takes as long as a
// wrong password (an attacker cannot tell which emails are registered)
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

// Saves the logged-in user in a NEW session (stops session fixation attacks)
function startSession(req, user) {
    return new Promise((resolve, reject) => {
        req.session.regenerate((err) => {
            if (err) return reject(err);
            req.session.user = { UserID: user.UserID, Role: user.Role };
            req.session.save((saveErr) => (saveErr ? reject(saveErr) : resolve()));
        });
    });
}

const publicUser = (u) => ({
    UserID: u.UserID, FirstName: u.FirstName, LastName: u.LastName, Email: u.Email, Role: u.Role
});

app.post('/api/auth/register', route(async (req, res) => {
    const b = requireBody(req.body);
    const errors = [];

    for (const field of ['FirstName', 'LastName']) {
        if (!isText(b[field])) errors.push(`${field} is required`);
        else if (b[field].trim().length > 50) errors.push(`${field} must be 50 characters or fewer`);
    }

    const email = typeof b.Email === 'string' ? b.Email.trim().toLowerCase() : '';   // BR-01
    if (!email) errors.push('Email is required');
    else if (email.length > 255 || !EMAIL_PATTERN.test(email)) errors.push('Email is not a valid email address');

    // Password rules: 8–72 characters, at least one letter and one number
    if (typeof b.Password !== 'string' || b.Password.length < 8) {
        errors.push('Password must be at least 8 characters');
    } else if (b.Password.length > 72) {
        errors.push('Password must be 72 characters or fewer');
    } else if (!/[A-Za-z]/.test(b.Password) || !/[0-9]/.test(b.Password)) {
        errors.push('Password must contain at least one letter and one number');
    }

    let phone = null;
    if (b.Phone !== undefined && b.Phone !== null && b.Phone !== '') {
        if (typeof b.Phone !== 'string' || !/^\+?[0-9 ]{8,20}$/.test(b.Phone.trim())) {
            errors.push('Phone must contain only numbers and spaces (8–20 characters)');
        } else {
            phone = b.Phone.trim();
        }
    }

    if (errors.length) throw new HttpError(400, 'Validation failed', errors);

    const existing = await dbGet('SELECT UserID FROM USERS WHERE Email = ?', [email]);
    if (existing) throw new HttpError(409, 'An account with this email already exists');

    // BR-02: only a bcrypt hash is stored, never the password itself
    const passwordHash = await bcrypt.hash(b.Password, 12);

    // New accounts are always Customers – nobody can make themselves an Admin (BR-03)
    const result = await withTransaction(() => dbRun(
        `INSERT INTO USERS (FirstName, LastName, Email, PasswordHash, Phone, Role)
         VALUES (?, ?, ?, ?, ?, 'Customer')`,
        [b.FirstName.trim(), b.LastName.trim(), email, passwordHash, phone]));

    const user = await dbGet('SELECT UserID, FirstName, LastName, Email, Role FROM USERS WHERE UserID = ?',
                             [result.lastID]);
    await startSession(req, user);
    res.status(201).json({ message: 'Account created', user: publicUser(user) });
}));

app.post('/api/auth/login', route(async (req, res) => {
    const b = requireBody(req.body);
    const email = typeof b.Email === 'string' ? b.Email.trim().toLowerCase() : '';
    const password = typeof b.Password === 'string' ? b.Password : '';

    if (!email || !password) throw new HttpError(400, 'Email and password are required');

    const user = await dbGet(
        'SELECT UserID, FirstName, LastName, Email, Role, PasswordHash, IsActive FROM USERS WHERE Email = ?',
        [email]);

    let passwordOk = false;
    try {
        passwordOk = await bcrypt.compare(password, user ? user.PasswordHash : DUMMY_HASH);
    } catch {
        passwordOk = false;   // a broken hash in the database counts as a wrong password
    }

    // Same message for "no such email" and "wrong password"
    if (!user || !passwordOk) throw new HttpError(401, 'Email or password is incorrect');
    if (user.IsActive !== 1) throw new HttpError(403, 'This account has been deactivated');   // BR-04

    await startSession(req, user);
    res.json({ message: `Welcome back, ${user.FirstName}`, user: publicUser(user) });
}));

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('sr.sid');
        res.json({ message: 'Logged out' });
    });
});

app.get('/api/auth/me', route(async (req, res) => {
    const user = await loadSessionUser(req);
    if (!user) return res.json({ user: null, cartCount: 0 });

    const count = await dbGet(`
        SELECT COALESCE(SUM(ci.Quantity), 0) AS n
        FROM CARTS c JOIN CART_ITEMS ci ON ci.CartID = c.CartID
        WHERE c.UserID = ?`, [user.UserID]);
    res.json({ user: publicUser(user), cartCount: count.n });
}));

// =====================================================================
// CATALOGUE – products (READ is public, CREATE/UPDATE/DELETE are admin only)
// =====================================================================

// READ – all active products
// Optional filters: /api/products?search=iphone  /api/products?category=2
app.get('/api/products', async (req, res) => {
    try {
        const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
        const category = parseId(req.query.category);

        const rows = await dbAll(`
            SELECT p.ProductID, p.ProductName, p.CategoryID, c.CategoryName,
                   p.BrandID, b.BrandName, p.Description, p.WarrantyMonths, p.IsFeatured,
                   MIN(${CURRENT_PRICE}) AS PriceFrom,
                   MIN(v.Price) AS RegularPriceFrom,
                   COUNT(v.VariantID) AS VariantCount,
                   SUM(i.QuantityOnHand) AS TotalStock,
                   (SELECT ImageURL FROM PRODUCT_IMAGES WHERE ProductID = p.ProductID AND IsPrimary = 1) AS ImageURL,
                   (SELECT AltText FROM PRODUCT_IMAGES WHERE ProductID = p.ProductID AND IsPrimary = 1) AS ImageAlt
            FROM PRODUCTS p
            JOIN CATEGORIES c ON c.CategoryID = p.CategoryID
            JOIN BRANDS b ON b.BrandID = p.BrandID
            LEFT JOIN PRODUCT_VARIANTS v ON v.ProductID = p.ProductID AND v.IsActive = 1
            LEFT JOIN INVENTORY i ON i.VariantID = v.VariantID
            WHERE p.IsActive = 1
              AND (? = '' OR p.ProductName LIKE '%' || ? || '%')
              AND (? IS NULL OR p.CategoryID = ?)
            GROUP BY p.ProductID
            ORDER BY p.IsFeatured DESC, p.ProductID`, [search, search, category, category]);

        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not retrieve products' });
    }
});

// READ – one product with its variants
app.get('/api/products/:id', async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'Product ID must be a positive whole number' });
    }

    try {
        const product = await getProductById(id);
        if (!product) {
            return res.status(404).json({ error: `Product ${id} not found` });
        }
        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not retrieve product' });
    }
});

// CREATE – add a new product (admin only)
app.post('/api/products', requireAdmin, async (req, res) => {
    const errors = validateProduct(req.body);
    if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    try {
        const ruleCheck = await checkProductRules(req.body);
        if (ruleCheck) {
            return res.status(ruleCheck.status).json({
                error: ruleCheck.status === 409 ? 'Duplicate record' : 'Validation failed',
                details: ruleCheck.errors
            });
        }

        const b = req.body;
        // Placeholders (?) keep user input out of the SQL text – prevents SQL injection
        const result = await withTransaction(() => dbRun(`
            INSERT INTO PRODUCTS (CategoryID, BrandID, ProductName, Description,
                                  Specifications, WarrantyMonths, IsFeatured)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [b.CategoryID, b.BrandID, b.ProductName.trim(), b.Description.trim(),
             b.Specifications ? JSON.stringify(b.Specifications) : null,
             b.WarrantyMonths ?? 12, b.IsFeatured ? 1 : 0]));

        const product = await getProductById(result.lastID);
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not create product' });
    }
});

// UPDATE – change an existing product (admin only)
app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'Product ID must be a positive whole number' });
    }

    const errors = validateProduct(req.body);
    if (errors.length) {
        return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    try {
        const existing = await dbGet('SELECT ProductID FROM PRODUCTS WHERE ProductID = ? AND IsActive = 1', [id]);
        if (!existing) {
            return res.status(404).json({ error: `Product ${id} not found` });
        }

        const ruleCheck = await checkProductRules(req.body, id);
        if (ruleCheck) {
            return res.status(ruleCheck.status).json({
                error: ruleCheck.status === 409 ? 'Duplicate record' : 'Validation failed',
                details: ruleCheck.errors
            });
        }

        const b = req.body;
        await withTransaction(() => dbRun(`
            UPDATE PRODUCTS
            SET CategoryID = ?, BrandID = ?, ProductName = ?, Description = ?,
                Specifications = ?, WarrantyMonths = ?, IsFeatured = ?
            WHERE ProductID = ?`,
            [b.CategoryID, b.BrandID, b.ProductName.trim(), b.Description.trim(),
             b.Specifications ? JSON.stringify(b.Specifications) : null,
             b.WarrantyMonths ?? 12, b.IsFeatured ? 1 : 0, id]));

        const product = await getProductById(id);
        res.json({ message: 'Product updated successfully', product });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not update product' });
    }
});

// DELETE – remove a product (admin only)
// BR-12: products with variants or reviews are DEACTIVATED (hidden) instead
// of deleted, so past orders and reviews are never lost.
app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res.status(400).json({ error: 'Product ID must be a positive whole number' });
    }

    try {
        const existing = await dbGet(
            'SELECT ProductID, ProductName FROM PRODUCTS WHERE ProductID = ? AND IsActive = 1', [id]);
        if (!existing) {
            return res.status(404).json({ error: `Product ${id} not found` });
        }

        const history = await dbGet(`
            SELECT (SELECT COUNT(*) FROM PRODUCT_VARIANTS WHERE ProductID = ?) +
                   (SELECT COUNT(*) FROM REVIEWS WHERE ProductID = ?) AS LinkedRecords`, [id, id]);

        if (history.LinkedRecords > 0) {
            await withTransaction(async () => {
                // Hidden products can no longer be bought, so take them out of carts too
                await dbRun(`DELETE FROM CART_ITEMS WHERE VariantID IN
                             (SELECT VariantID FROM PRODUCT_VARIANTS WHERE ProductID = ?)`, [id]);
                await dbRun('UPDATE PRODUCT_VARIANTS SET IsActive = 0 WHERE ProductID = ?', [id]);
                await dbRun('UPDATE PRODUCTS SET IsActive = 0 WHERE ProductID = ?', [id]);
            });
            return res.json({
                message: `Product "${existing.ProductName}" has variants, reviews or order history, so it was deactivated instead of deleted (BR-12)`,
                productId: id,
                action: 'deactivated'
            });
        }

        // No history: images and wishlist entries are removed automatically (ON DELETE CASCADE)
        await withTransaction(() => dbRun('DELETE FROM PRODUCTS WHERE ProductID = ?', [id]));
        res.json({
            message: `Product "${existing.ProductName}" deleted successfully`,
            productId: id,
            action: 'deleted'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not delete product' });
    }
});

// Lists used by menus and the admin form dropdowns
app.get('/api/categories', async (req, res) => {
    try {
        res.json(await dbAll(
            'SELECT CategoryID, CategoryName, Description FROM CATEGORIES WHERE IsActive = 1 ORDER BY CategoryName'));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not retrieve categories' });
    }
});

app.get('/api/brands', async (req, res) => {
    try {
        res.json(await dbAll('SELECT BrandID, BrandName FROM BRANDS ORDER BY BrandName'));
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Could not retrieve brands' });
    }
});

// =====================================================================
// CONTACT PAGE – enquiries (guests and logged-in users, BR-36)
// =====================================================================
const ENQUIRY_SUBJECTS = ['General Enquiry', 'Product Information', 'Technical Support', 'Order Status', 'Returns'];

app.post('/api/enquiries', route(async (req, res) => {
    const b = requireBody(req.body);
    const errors = [];

    // BR-37: HTML tags are removed before saving (stops XSS)
    const stripHtml = (s) => (typeof s === 'string' ? s.replace(/<[^>]*>/g, '').trim() : '');
    const fullName = stripHtml(b.FullName);
    const email = typeof b.Email === 'string' ? b.Email.trim().toLowerCase() : '';
    const message = stripHtml(b.Message);
    const phone = typeof b.Phone === 'string' && b.Phone.trim() !== '' ? b.Phone.trim() : null;

    if (!fullName) errors.push('Full name is required');
    else if (fullName.length > 100) errors.push('Full name must be 100 characters or fewer');
    if (!EMAIL_PATTERN.test(email)) errors.push('A valid email is required');
    if (phone && !/^\+?[0-9 ]{8,20}$/.test(phone)) errors.push('Phone must contain only numbers and spaces');
    if (!ENQUIRY_SUBJECTS.includes(b.Subject)) errors.push(`Subject must be one of: ${ENQUIRY_SUBJECTS.join(', ')}`);
    if (message.length < 10 || message.length > 2000) errors.push('Message must be between 10 and 2,000 characters');

    if (errors.length) throw new HttpError(400, 'Validation failed', errors);

    const user = await loadSessionUser(req);
    await withTransaction(() => dbRun(
        `INSERT INTO ENQUIRIES (UserID, FullName, Email, Phone, Subject, Message)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user ? user.UserID : null, fullName, email, phone, b.Subject, message]));

    res.status(201).json({ message: 'Thanks! Your message has been sent. We will reply within one business day.' });
}));

// =====================================================================
// CART (logged-in users)
// =====================================================================

// Loads the user's cart with current prices and stock
async function loadCart(userId) {
    const items = await dbAll(`
        SELECT ci.CartItemID, ci.VariantID, ci.Quantity,
               p.ProductID, p.ProductName, p.CategoryID,
               v.SKU, v.Colour, v.StorageOrSize, v.Price,
               ${CURRENT_PRICE} AS UnitPrice,
               v.PurchaseLimit, i.QuantityOnHand,
               (v.IsActive = 1 AND p.IsActive = 1) AS IsAvailable,
               (SELECT ImageURL FROM PRODUCT_IMAGES WHERE ProductID = p.ProductID AND IsPrimary = 1) AS ImageURL
        FROM CARTS c
        JOIN CART_ITEMS ci ON ci.CartID = c.CartID
        JOIN PRODUCT_VARIANTS v ON v.VariantID = ci.VariantID
        JOIN PRODUCTS p ON p.ProductID = v.ProductID
        JOIN INVENTORY i ON i.VariantID = v.VariantID
        WHERE c.UserID = ?
        ORDER BY ci.AddedAt, ci.CartItemID`, [userId]);

    let subtotalCents = 0;
    let itemCount = 0;
    for (const item of items) {
        item.IsAvailable = item.IsAvailable === 1;
        item.MaxQuantity = Math.min(item.QuantityOnHand, item.PurchaseLimit ?? Infinity);
        item.LineTotal = fromCents(toCents(item.UnitPrice) * item.Quantity);
        // A problem is shown next to the item and blocks checkout until fixed
        item.Problem = !item.IsAvailable ? 'This item is no longer available'
                     : item.QuantityOnHand === 0 ? 'Out of stock'
                     : item.Quantity > item.MaxQuantity ? `Only ${item.MaxQuantity} can be ordered`
                     : null;
        subtotalCents += toCents(item.UnitPrice) * item.Quantity;
        itemCount += item.Quantity;
    }

    const subtotal = fromCents(subtotalCents);
    return {
        items,
        itemCount,
        subtotal,
        deliveryCost: items.length ? deliveryCostFor('Delivery', subtotal) : 0,
        freeDeliveryFrom: FREE_DELIVERY_FROM,
        canCheckout: items.length > 0 && items.every((i) => !i.Problem)
    };
}

function deliveryCostFor(method, subtotal) {
    if (method === 'ClickAndCollect') return 0;                    // BR-25
    return subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
}

// Checks a quantity against stock and the purchase limit (BR-17, BR-20, BR-31)
function checkQuantity(variant, quantity) {
    if (variant.QuantityOnHand === 0) {
        throw new HttpError(409, `${variant.ProductName} is out of stock`);
    }
    if (variant.PurchaseLimit && quantity > variant.PurchaseLimit) {
        throw new HttpError(409, `Limit ${variant.PurchaseLimit} per customer for ${variant.ProductName}`);
    }
    if (quantity > variant.QuantityOnHand) {
        throw new HttpError(409, `Only ${variant.QuantityOnHand} of ${variant.ProductName} left in stock`);
    }
}

app.get('/api/cart', requireLogin, route(async (req, res) => {
    res.json(await loadCart(req.user.UserID));
}));

app.post('/api/cart/items', requireLogin, route(async (req, res) => {
    const b = requireBody(req.body);
    const variantId = parseId(b.VariantID);
    const quantity = b.Quantity === undefined ? 1 : b.Quantity;

    if (!variantId) throw new HttpError(400, 'VariantID must be a positive whole number');
    if (!isWholeNumber(quantity, 1) || quantity > 99) throw new HttpError(400, 'Quantity must be a whole number from 1 to 99');

    await withTransaction(async () => {
        const variant = await dbGet(`
            SELECT v.VariantID, v.PurchaseLimit, p.ProductName, i.QuantityOnHand
            FROM PRODUCT_VARIANTS v
            JOIN PRODUCTS p ON p.ProductID = v.ProductID
            JOIN INVENTORY i ON i.VariantID = v.VariantID
            WHERE v.VariantID = ? AND v.IsActive = 1 AND p.IsActive = 1`, [variantId]);
        if (!variant) throw new HttpError(404, `Variant ${variantId} not found`);

        // BR-18: one cart per user, created the first time they add something
        await dbRun('INSERT OR IGNORE INTO CARTS (UserID) VALUES (?)', [req.user.UserID]);
        const cart = await dbGet('SELECT CartID FROM CARTS WHERE UserID = ?', [req.user.UserID]);

        // BR-19: adding the same variant again increases the quantity
        const existing = await dbGet('SELECT CartItemID, Quantity FROM CART_ITEMS WHERE CartID = ? AND VariantID = ?',
                                     [cart.CartID, variantId]);
        const newQuantity = (existing ? existing.Quantity : 0) + quantity;
        checkQuantity(variant, newQuantity);

        if (existing) {
            await dbRun('UPDATE CART_ITEMS SET Quantity = ? WHERE CartItemID = ?', [newQuantity, existing.CartItemID]);
        } else {
            await dbRun('INSERT INTO CART_ITEMS (CartID, VariantID, Quantity) VALUES (?, ?, ?)',
                        [cart.CartID, variantId, quantity]);
        }
        await dbRun('UPDATE CARTS SET UpdatedAt = CURRENT_TIMESTAMP WHERE CartID = ?', [cart.CartID]);
    });

    res.status(201).json({ message: 'Added to cart', cart: await loadCart(req.user.UserID) });
}));

// Finds a cart item that belongs to the logged-in user (other users' items are "not found")
async function findMyCartItem(userId, cartItemId) {
    return dbGet(`
        SELECT ci.CartItemID, ci.Quantity, v.VariantID, v.PurchaseLimit, p.ProductName, i.QuantityOnHand
        FROM CART_ITEMS ci
        JOIN CARTS c ON c.CartID = ci.CartID
        JOIN PRODUCT_VARIANTS v ON v.VariantID = ci.VariantID
        JOIN PRODUCTS p ON p.ProductID = v.ProductID
        JOIN INVENTORY i ON i.VariantID = v.VariantID
        WHERE ci.CartItemID = ? AND c.UserID = ?`, [cartItemId, userId]);
}

app.put('/api/cart/items/:id', requireLogin, route(async (req, res) => {
    const id = parseId(req.params.id);
    const b = requireBody(req.body);
    if (!id) throw new HttpError(400, 'Cart item ID must be a positive whole number');
    if (!isWholeNumber(b.Quantity, 1) || b.Quantity > 99) {
        throw new HttpError(400, 'Quantity must be a whole number from 1 to 99');
    }

    await withTransaction(async () => {
        const item = await findMyCartItem(req.user.UserID, id);
        if (!item) throw new HttpError(404, `Cart item ${id} not found`);
        checkQuantity(item, b.Quantity);
        await dbRun('UPDATE CART_ITEMS SET Quantity = ? WHERE CartItemID = ?', [b.Quantity, id]);
    });

    res.json({ message: 'Cart updated', cart: await loadCart(req.user.UserID) });
}));

app.delete('/api/cart/items/:id', requireLogin, route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Cart item ID must be a positive whole number');

    await withTransaction(async () => {
        const item = await findMyCartItem(req.user.UserID, id);
        if (!item) throw new HttpError(404, `Cart item ${id} not found`);
        await dbRun('DELETE FROM CART_ITEMS WHERE CartItemID = ?', [id]);
    });

    res.json({ message: 'Item removed', cart: await loadCart(req.user.UserID) });
}));

// =====================================================================
// ADDRESSES (logged-in users)
// =====================================================================
const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

app.get('/api/addresses', requireLogin, route(async (req, res) => {
    res.json(await dbAll(
        `SELECT AddressID, AddressLine1, AddressLine2, Suburb, State, Postcode, IsDefault
         FROM ADDRESSES WHERE UserID = ? ORDER BY IsDefault DESC, AddressID`, [req.user.UserID]));
}));

app.post('/api/addresses', requireLogin, route(async (req, res) => {
    const b = requireBody(req.body);
    const errors = [];

    if (!isText(b.AddressLine1) || b.AddressLine1.trim().length > 100) errors.push('Address line 1 is required (100 characters max)');
    if (b.AddressLine2 && (typeof b.AddressLine2 !== 'string' || b.AddressLine2.trim().length > 100)) errors.push('Address line 2 must be 100 characters or fewer');
    if (!isText(b.Suburb) || b.Suburb.trim().length > 60) errors.push('Suburb is required (60 characters max)');
    if (!STATES.includes(b.State)) errors.push(`State must be one of: ${STATES.join(', ')}`);
    if (typeof b.Postcode !== 'string' || !/^[0-9]{4}$/.test(b.Postcode)) errors.push('Postcode must be 4 digits');

    if (errors.length) throw new HttpError(400, 'Validation failed', errors);

    const addressId = await withTransaction(async () => {
        const count = await dbGet('SELECT COUNT(*) AS n FROM ADDRESSES WHERE UserID = ?', [req.user.UserID]);
        const makeDefault = b.IsDefault === true || count.n === 0;
        // BR-05: only one default address, so clear the old default first
        if (makeDefault) await dbRun('UPDATE ADDRESSES SET IsDefault = 0 WHERE UserID = ?', [req.user.UserID]);
        const result = await dbRun(
            `INSERT INTO ADDRESSES (UserID, AddressLine1, AddressLine2, Suburb, State, Postcode, IsDefault)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [req.user.UserID, b.AddressLine1.trim(), isText(b.AddressLine2) ? b.AddressLine2.trim() : null,
             b.Suburb.trim(), b.State, b.Postcode, makeDefault ? 1 : 0]);
        return result.lastID;
    });

    const address = await dbGet('SELECT * FROM ADDRESSES WHERE AddressID = ?', [addressId]);
    res.status(201).json({ message: 'Address saved', address });
}));

// =====================================================================
// CHECKOUT – turns the cart into an order and takes a (simulated) payment
// =====================================================================
const PAYMENT_METHODS = ['Card', 'PayPal', 'Afterpay'];

app.post('/api/checkout', requireLogin, route(async (req, res) => {
    const b = requireBody(req.body);
    const userId = req.user.UserID;

    // Only these three choices come from the browser. Prices and totals
    // are always worked out here on the server (BR-24).
    const method = b.FulfilmentMethod;
    if (!['Delivery', 'ClickAndCollect'].includes(method)) {
        throw new HttpError(400, 'FulfilmentMethod must be Delivery or ClickAndCollect');
    }
    if (!PAYMENT_METHODS.includes(b.PaymentMethod)) {
        throw new HttpError(400, `PaymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`);
    }

    let addressId = null;
    if (method === 'Delivery') {                                    // BR-25
        addressId = parseId(b.AddressID);
        if (!addressId) throw new HttpError(400, 'Please choose a delivery address');
        const address = await dbGet('SELECT AddressID FROM ADDRESSES WHERE AddressID = ? AND UserID = ?',
                                    [addressId, userId]);
        if (!address) throw new HttpError(404, 'Delivery address not found');
    }

    const orderId = await withTransaction(async () => {
        const cart = await loadCart(userId);

        if (!cart.items.length) throw new HttpError(400, 'Your cart is empty');          // BR-22
        const problems = cart.items.filter((i) => i.Problem)
                                   .map((i) => `${i.ProductName}: ${i.Problem}`);
        if (problems.length) throw new HttpError(409, 'Some items in your cart need attention', problems);

        const deliveryCost = deliveryCostFor(method, cart.subtotal);
        const total = fromCents(toCents(cart.subtotal) + toCents(deliveryCost));

        // BR-28: order number SR-YYYYMMDD-NNNN, generated by the system
        const today = new Date();
        const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
        const seq = await dbGet(
            `SELECT COALESCE(MAX(CAST(substr(OrderNumber, -4) AS INTEGER)), 1000) + 1 AS next FROM ORDERS`);
        const orderNumber = `SR-${ymd}-${String(seq.next).padStart(4, '0')}`;

        const order = await dbRun(`
            INSERT INTO ORDERS (OrderNumber, UserID, AddressID, FulfilmentMethod, OrderStatus,
                                Subtotal, DeliveryCost, TotalAmount, EstimatedDeliveryDate)
            VALUES (?, ?, ?, ?, 'Pending', ?, ?, ?, ${method === 'Delivery' ? "date('now', '+5 days')" : 'NULL'})`,
            [orderNumber, userId, addressId, method, cart.subtotal, deliveryCost, total]);

        // BR-23: the price is copied into the order, so later price changes don't affect it
        for (const item of cart.items) {
            await dbRun(`
                INSERT INTO ORDER_ITEMS (OrderID, VariantID, Quantity, UnitPrice, LineTotal)
                VALUES (?, ?, ?, ?, ?)`,
                [order.lastID, item.VariantID, item.Quantity, item.UnitPrice, item.LineTotal]);
        }

        // Simulated payment: no card number or CVV is ever sent or stored (BR-30).
        // A real shop would send the customer to a payment gateway here and save
        // only the reference it sends back.
        const reference = `SIM-${b.PaymentMethod.slice(0, 2).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        await dbRun(`
            INSERT INTO PAYMENTS (OrderID, PaymentMethod, PaymentStatus, Amount, GatewayReference, PaidAt)
            VALUES (?, ?, 'Successful', ?, ?, CURRENT_TIMESTAMP)`,
            [order.lastID, b.PaymentMethod, total, reference]);

        // BR-29: a successful payment equal to the total makes the order Paid
        await dbRun(`UPDATE ORDERS SET OrderStatus = 'Paid' WHERE OrderID = ?`, [order.lastID]);

        // BR-15: stock goes down when the payment succeeds (and never below 0 – BR-14)
        for (const item of cart.items) {
            const result = await dbRun(`
                UPDATE INVENTORY SET QuantityOnHand = QuantityOnHand - ?
                WHERE VariantID = ? AND QuantityOnHand >= ?`,
                [item.Quantity, item.VariantID, item.Quantity]);
            if (result.changes !== 1) throw new HttpError(409, `${item.ProductName} just sold out`);
        }

        // Empty the cart
        await dbRun(`DELETE FROM CART_ITEMS WHERE CartID = (SELECT CartID FROM CARTS WHERE UserID = ?)`, [userId]);

        return order.lastID;
    });

    res.status(201).json({ message: 'Order placed and paid', order: await loadOrder(orderId) });
}));

// =====================================================================
// ORDERS
// =====================================================================

// Loads one order with its items, address and payments
async function loadOrder(orderId, userId = null) {
    const order = await dbGet(`
        SELECT o.OrderID, o.OrderNumber, o.UserID, u.FirstName || ' ' || u.LastName AS CustomerName,
               u.Email AS CustomerEmail, o.FulfilmentMethod, o.OrderStatus,
               o.Subtotal, o.DeliveryCost, o.TotalAmount, o.EstimatedDeliveryDate,
               o.TrackingNumber, o.CreatedAt, o.UpdatedAt,
               a.AddressLine1, a.AddressLine2, a.Suburb, a.State, a.Postcode
        FROM ORDERS o
        JOIN USERS u ON u.UserID = o.UserID
        LEFT JOIN ADDRESSES a ON a.AddressID = o.AddressID
        WHERE o.OrderID = ? AND (? IS NULL OR o.UserID = ?)`, [orderId, userId, userId]);
    if (!order) return null;

    order.Items = await dbAll(`
        SELECT oi.OrderItemID, oi.VariantID, p.ProductName, v.SKU, v.Colour, v.StorageOrSize,
               oi.Quantity, oi.UnitPrice, oi.LineTotal
        FROM ORDER_ITEMS oi
        JOIN PRODUCT_VARIANTS v ON v.VariantID = oi.VariantID
        JOIN PRODUCTS p ON p.ProductID = v.ProductID
        WHERE oi.OrderID = ?`, [orderId]);

    order.Payments = await dbAll(
        `SELECT PaymentMethod, PaymentStatus, Amount, GatewayReference, PaidAt
         FROM PAYMENTS WHERE OrderID = ? ORDER BY PaymentID`, [orderId]);

    return order;
}

const ORDER_LIST_SQL = `
    SELECT o.OrderID, o.OrderNumber, o.OrderStatus, o.FulfilmentMethod, o.TotalAmount,
           o.CreatedAt, o.TrackingNumber, u.FirstName || ' ' || u.LastName AS CustomerName,
           u.Email AS CustomerEmail,
           (SELECT SUM(Quantity) FROM ORDER_ITEMS WHERE OrderID = o.OrderID) AS ItemCount
    FROM ORDERS o JOIN USERS u ON u.UserID = o.UserID`;

// A customer sees only their own orders
app.get('/api/orders', requireLogin, route(async (req, res) => {
    res.json(await dbAll(`${ORDER_LIST_SQL} WHERE o.UserID = ? ORDER BY o.CreatedAt DESC, o.OrderID DESC`,
                         [req.user.UserID]));
}));

app.get('/api/orders/:id', requireLogin, route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Order ID must be a positive whole number');
    const order = await loadOrder(id, req.user.UserID);
    if (!order) throw new HttpError(404, `Order ${id} not found`);
    res.json(order);
}));

// =====================================================================
// ADMIN AREA (every route below needs an Admin login)
// =====================================================================
app.use('/api/admin', requireAdmin);

// Dashboard numbers
app.get('/api/admin/summary', route(async (req, res) => {
    const row = await dbGet(`
        SELECT
          (SELECT COUNT(*) FROM PRODUCTS WHERE IsActive = 1) AS Products,
          (SELECT COUNT(*) FROM ORDERS) AS Orders,
          (SELECT COUNT(*) FROM ORDERS WHERE OrderStatus = 'Paid') AS OrdersToShip,
          (SELECT COALESCE(SUM(Amount), 0) FROM PAYMENTS WHERE PaymentStatus = 'Successful') AS Revenue,
          (SELECT COUNT(*) FROM ENQUIRIES WHERE Status = 'New') AS NewEnquiries,
          (SELECT COUNT(*) FROM INVENTORY i JOIN PRODUCT_VARIANTS v ON v.VariantID = i.VariantID
             WHERE v.IsActive = 1 AND i.QuantityOnHand <= i.LowStockThreshold) AS LowStock,
          (SELECT COUNT(*) FROM USERS WHERE Role = 'Customer' AND IsActive = 1) AS Customers`);
    res.json(row);
}));

// ---------- Variants: price, promotion and stock ----------
app.get('/api/admin/products/:id/variants', route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Product ID must be a positive whole number');
    const product = await dbGet('SELECT ProductID, ProductName FROM PRODUCTS WHERE ProductID = ? AND IsActive = 1', [id]);
    if (!product) throw new HttpError(404, `Product ${id} not found`);

    product.Variants = await dbAll(`
        SELECT v.VariantID, v.SKU, v.Colour, v.StorageOrSize, v.Price, v.PromoPrice,
               v.PromoStartDate, v.PromoEndDate, v.PurchaseLimit,
               i.QuantityOnHand, i.LowStockThreshold
        FROM PRODUCT_VARIANTS v JOIN INVENTORY i ON i.VariantID = v.VariantID
        WHERE v.ProductID = ? AND v.IsActive = 1
        ORDER BY v.Price`, [id]);
    res.json(product);
}));

async function checkSkuIsFree(sku, excludeVariantId = null) {
    const clash = await dbGet(
        'SELECT VariantID FROM PRODUCT_VARIANTS WHERE upper(SKU) = ? AND (? IS NULL OR VariantID <> ?)',
        [sku, excludeVariantId, excludeVariantId]);
    if (clash) throw new HttpError(409, 'Duplicate record', [`SKU ${sku} is already used by variant ${clash.VariantID}`]);   // BR-09
}

app.post('/api/admin/products/:id/variants', route(async (req, res) => {
    const productId = parseId(req.params.id);
    if (!productId) throw new HttpError(400, 'Product ID must be a positive whole number');
    const b = requireBody(req.body);
    const errors = validateVariant(b, true);
    if (errors.length) throw new HttpError(400, 'Validation failed', errors);

    const v = variantValues(b);
    const variantId = await withTransaction(async () => {
        const product = await dbGet('SELECT ProductID FROM PRODUCTS WHERE ProductID = ? AND IsActive = 1', [productId]);
        if (!product) throw new HttpError(404, `Product ${productId} not found`);
        await checkSkuIsFree(v.SKU);

        const result = await dbRun(`
            INSERT INTO PRODUCT_VARIANTS (ProductID, SKU, Colour, StorageOrSize, Price,
                                          PromoPrice, PromoStartDate, PromoEndDate, PurchaseLimit)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [productId, v.SKU, v.Colour, v.StorageOrSize, v.Price,
             v.PromoPrice, v.PromoStartDate, v.PromoEndDate, v.PurchaseLimit]);

        // BR-13: every variant gets its stock record at the same time
        await dbRun('INSERT INTO INVENTORY (VariantID, QuantityOnHand, LowStockThreshold) VALUES (?, ?, ?)',
                    [result.lastID, b.QuantityOnHand, b.LowStockThreshold ?? 5]);
        return result.lastID;
    });

    res.status(201).json({ message: `Variant ${v.SKU} added`, variantId });
}));

app.put('/api/admin/variants/:id', route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Variant ID must be a positive whole number');
    const b = requireBody(req.body);
    const errors = validateVariant(b, false);
    if (errors.length) throw new HttpError(400, 'Validation failed', errors);

    const v = variantValues(b);
    await withTransaction(async () => {
        const existing = await dbGet('SELECT VariantID FROM PRODUCT_VARIANTS WHERE VariantID = ? AND IsActive = 1', [id]);
        if (!existing) throw new HttpError(404, `Variant ${id} not found`);
        await checkSkuIsFree(v.SKU, id);

        await dbRun(`
            UPDATE PRODUCT_VARIANTS
            SET SKU = ?, Colour = ?, StorageOrSize = ?, Price = ?, PromoPrice = ?,
                PromoStartDate = ?, PromoEndDate = ?, PurchaseLimit = ?
            WHERE VariantID = ?`,
            [v.SKU, v.Colour, v.StorageOrSize, v.Price, v.PromoPrice,
             v.PromoStartDate, v.PromoEndDate, v.PurchaseLimit, id]);

        if (b.QuantityOnHand !== undefined || b.LowStockThreshold !== undefined) {
            await dbRun(`
                UPDATE INVENTORY
                SET QuantityOnHand = COALESCE(?, QuantityOnHand),
                    LowStockThreshold = COALESCE(?, LowStockThreshold)
                WHERE VariantID = ?`,
                [b.QuantityOnHand ?? null, b.LowStockThreshold ?? null, id]);
        }
    });

    res.json({ message: `Variant ${v.SKU} updated` });
}));

app.delete('/api/admin/variants/:id', route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Variant ID must be a positive whole number');

    const action = await withTransaction(async () => {
        const variant = await dbGet('SELECT VariantID, SKU FROM PRODUCT_VARIANTS WHERE VariantID = ? AND IsActive = 1', [id]);
        if (!variant) throw new HttpError(404, `Variant ${id} not found`);

        const used = await dbGet('SELECT COUNT(*) AS n FROM ORDER_ITEMS WHERE VariantID = ?', [id]);
        await dbRun('DELETE FROM CART_ITEMS WHERE VariantID = ?', [id]);
        if (used.n > 0) {
            // BR-12: it appears in past orders, so hide it instead of deleting it
            await dbRun('UPDATE PRODUCT_VARIANTS SET IsActive = 0 WHERE VariantID = ?', [id]);
            return `Variant ${variant.SKU} is in past orders, so it was deactivated instead of deleted (BR-12)`;
        }
        await dbRun('DELETE FROM PRODUCT_VARIANTS WHERE VariantID = ?', [id]);   // stock record goes too (CASCADE)
        return `Variant ${variant.SKU} deleted`;
    });

    res.json({ message: action });
}));

// ---------- Orders ----------
const ORDER_STATUSES = ['Pending', 'Paid', 'Shipped', 'Delivered', 'Cancelled'];

app.get('/api/admin/orders', route(async (req, res) => {
    const status = ORDER_STATUSES.includes(req.query.status) ? req.query.status : null;
    res.json(await dbAll(`${ORDER_LIST_SQL} WHERE (? IS NULL OR o.OrderStatus = ?)
                          ORDER BY o.CreatedAt DESC, o.OrderID DESC`, [status, status]));
}));

app.get('/api/admin/orders/:id', route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Order ID must be a positive whole number');
    const order = await loadOrder(id);
    if (!order) throw new HttpError(404, `Order ${id} not found`);
    res.json(order);
}));

// BR-26: status only moves forward. Cancelling is allowed while Pending or Paid.
const NEXT_STATUS = {
    Pending: ['Cancelled'],
    Paid: ['Shipped', 'Cancelled'],
    Shipped: ['Delivered'],
    Delivered: [],
    Cancelled: []
};

app.put('/api/admin/orders/:id/status', route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Order ID must be a positive whole number');
    const b = requireBody(req.body);
    const newStatus = b.OrderStatus;
    if (!ORDER_STATUSES.includes(newStatus)) {
        throw new HttpError(400, `OrderStatus must be one of: ${ORDER_STATUSES.join(', ')}`);
    }

    await withTransaction(async () => {
        const order = await dbGet('SELECT OrderID, OrderStatus FROM ORDERS WHERE OrderID = ?', [id]);
        if (!order) throw new HttpError(404, `Order ${id} not found`);

        if (!NEXT_STATUS[order.OrderStatus].includes(newStatus)) {
            const allowed = NEXT_STATUS[order.OrderStatus];
            throw new HttpError(409, `A ${order.OrderStatus} order cannot be changed to ${newStatus}` +
                (allowed.length ? ` (allowed: ${allowed.join(', ')})` : ' (no further changes allowed)'));
        }

        if (newStatus === 'Shipped') {
            // BR-27: a tracking number is required
            const tracking = typeof b.TrackingNumber === 'string' ? b.TrackingNumber.trim() : '';
            if (!/^[A-Za-z0-9-]{3,50}$/.test(tracking)) {
                throw new HttpError(400, 'A tracking number (3–50 letters, numbers or hyphens) is required to mark an order as Shipped');
            }
            await dbRun(`UPDATE ORDERS SET OrderStatus = 'Shipped', TrackingNumber = ? WHERE OrderID = ?`, [tracking, id]);
            return;
        }

        if (newStatus === 'Cancelled' && order.OrderStatus === 'Paid') {
            // BR-15: put the stock back and refund the payment
            const items = await dbAll('SELECT VariantID, Quantity FROM ORDER_ITEMS WHERE OrderID = ?', [id]);
            for (const item of items) {
                await dbRun('UPDATE INVENTORY SET QuantityOnHand = QuantityOnHand + ? WHERE VariantID = ?',
                            [item.Quantity, item.VariantID]);
            }
            await dbRun(`UPDATE PAYMENTS SET PaymentStatus = 'Refunded'
                         WHERE OrderID = ? AND PaymentStatus = 'Successful'`, [id]);
        }

        await dbRun('UPDATE ORDERS SET OrderStatus = ? WHERE OrderID = ?', [newStatus, id]);
    });

    res.json({ message: `Order updated to ${newStatus}`, order: await loadOrder(id) });
}));

// ---------- Enquiries from the Contact page (BR-38: admins only) ----------
const ENQUIRY_STATUSES = ['New', 'In Progress', 'Resolved'];

app.get('/api/admin/enquiries', route(async (req, res) => {
    const status = ENQUIRY_STATUSES.includes(req.query.status) ? req.query.status : null;
    res.json(await dbAll(`
        SELECT EnquiryID, FullName, Email, Phone, Subject, Message, Status, SubmittedAt
        FROM ENQUIRIES WHERE (? IS NULL OR Status = ?)
        ORDER BY SubmittedAt DESC, EnquiryID DESC`, [status, status]));
}));

app.put('/api/admin/enquiries/:id/status', route(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) throw new HttpError(400, 'Enquiry ID must be a positive whole number');
    const b = requireBody(req.body);
    if (!ENQUIRY_STATUSES.includes(b.Status)) {
        throw new HttpError(400, `Status must be one of: ${ENQUIRY_STATUSES.join(', ')}`);
    }
    const result = await withTransaction(() =>
        dbRun('UPDATE ENQUIRIES SET Status = ? WHERE EnquiryID = ?', [b.Status, id]));
    if (result.changes === 0) throw new HttpError(404, `Enquiry ${id} not found`);
    res.json({ message: `Enquiry marked as ${b.Status}` });
}));

// ---------- Low-stock alerts (BR-16) ----------
app.get('/api/admin/low-stock', route(async (req, res) => {
    res.json(await dbAll(`
        SELECT v.VariantID, p.ProductID, p.ProductName, v.SKU, v.Colour, v.StorageOrSize,
               i.QuantityOnHand, i.LowStockThreshold
        FROM INVENTORY i
        JOIN PRODUCT_VARIANTS v ON v.VariantID = i.VariantID
        JOIN PRODUCTS p ON p.ProductID = v.ProductID
        WHERE v.IsActive = 1 AND p.IsActive = 1 AND i.QuantityOnHand <= i.LowStockThreshold
        ORDER BY i.QuantityOnHand, p.ProductName`));
}));

// ---------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------

// Unknown address
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Badly formatted JSON in the request body, or any unexpected error
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Request body is not valid JSON' });
    }
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request body is too large' });
    }
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server' });
});

// ---------------------------------------------------------------------
// Start the server
// ---------------------------------------------------------------------
app.listen(PORT, () => {
    console.log('Server Started');
    console.log(`Open http://localhost:${PORT}/index.html in your browser`);
    console.log(`Admin page: http://localhost:${PORT}/admin.html`);
});
