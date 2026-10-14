# Database – Secure Retail Product Catalogue System

SQLite database built from our Week 4 design (`docs/week4/data-dictionary.md` and `docs/week4/erd.png`).

| File | Purpose |
|---|---|
| `project.db` | The SQLite database, with all tables and sample data |
| `schema.sql` | Creates all 16 tables, keys, constraints, indexes and triggers |
| `sample-data.sql` | Inserts realistic sample records into every table |
| `validation.sql` | Queries used to check the data (Steps 6 and 7) |
| `screenshots/` | Screenshots of each populated table |

## How to rebuild the database

In the VS Code terminal, from the `database` folder:

```bash
sqlite3 project.db < schema.sql
sqlite3 project.db < sample-data.sql
```

Or open `project.db` in **DB Browser for SQLite** → **Execute SQL** → run `schema.sql`, then `sample-data.sql`.

> SQLite notes: the data dictionary was written for MySQL 8. In SQLite, `ENUM` values are enforced with `CHECK` constraints, `BOOLEAN` is stored as 0/1, and `JSON` is stored as text checked with `json_valid()`. Foreign keys require `PRAGMA foreign_keys = ON;`.

## Tables and sample records

| Area | Table | Type | Records |
|---|---|---|---|
| Customer & account | USERS | Main | 10 |
| | ADDRESSES | Main | 10 |
| | ENQUIRIES | Transaction | 10 |
| Product catalogue | CATEGORIES | Reference | 5 |
| | BRANDS | Reference | 6 |
| | PRODUCTS | Main | 10 |
| | PRODUCT_VARIANTS | Main | 16 |
| | PRODUCT_IMAGES | Main | 15 |
| | INVENTORY | Main | 16 |
| | REVIEWS | Transaction | 10 |
| | WISHLIST_ITEMS | Transaction | 10 |
| Cart, orders & payments | CARTS | Main | 6 |
| | CART_ITEMS | Transaction | 10 |
| | ORDERS | Transaction | 10 |
| | ORDER_ITEMS | Transaction | 14 |
| | PAYMENTS | Transaction | 11 |

Minimums met: main tables ≥ 5, reference tables ≥ 5, transaction tables ≥ 10.

All people, emails, phone numbers, addresses and payment references are fictional. Password hashes are placeholders in bcrypt format. No card numbers are stored (BR-30).

## Step 4 – Relationships

| # | Parent table | Child table | Linking field (FK) | Relationship |
|---|---|---|---|---|
| R1 | USERS | ADDRESSES | ADDRESSES.UserID | One user → many addresses |
| R2 | USERS | CARTS | CARTS.UserID (unique) | One user → zero or one cart |
| R3 | USERS | WISHLIST_ITEMS | WISHLIST_ITEMS.UserID | One user → many wishlist items |
| R4 | USERS | REVIEWS | REVIEWS.UserID | One user → many reviews |
| R5 | USERS | ORDERS | ORDERS.UserID | One user → many orders |
| R6 | USERS | ENQUIRIES | ENQUIRIES.UserID (optional) | One user → many enquiries (guests allowed) |
| R7 | ADDRESSES | ORDERS | ORDERS.AddressID (optional) | One address → many orders |
| R8 | CATEGORIES | PRODUCTS | PRODUCTS.CategoryID | One category → many products |
| R9 | BRANDS | PRODUCTS | PRODUCTS.BrandID | One brand → many products |
| R10 | PRODUCTS | PRODUCT_VARIANTS | PRODUCT_VARIANTS.ProductID | One product → many variants |
| R11 | PRODUCTS | PRODUCT_IMAGES | PRODUCT_IMAGES.ProductID | One product → many images |
| R12 | PRODUCTS | REVIEWS | REVIEWS.ProductID | One product → many reviews |
| R13 | PRODUCTS | WISHLIST_ITEMS | WISHLIST_ITEMS.ProductID | One product → many wishlist items |
| R14 | PRODUCT_VARIANTS | INVENTORY | INVENTORY.VariantID (unique) | One variant → exactly one inventory record |
| R15 | CARTS | CART_ITEMS | CART_ITEMS.CartID | One cart → many cart items |
| R16 | PRODUCT_VARIANTS | CART_ITEMS | CART_ITEMS.VariantID | One variant → many cart items |
| R17 | ORDERS | ORDER_ITEMS | ORDER_ITEMS.OrderID | One order → many order items |
| R18 | PRODUCT_VARIANTS | ORDER_ITEMS | ORDER_ITEMS.VariantID | One variant → many order items |
| R19 | ORDERS | PAYMENTS | PAYMENTS.OrderID | One order → many payment attempts |

Many-to-many relationships are resolved with junction tables: WISHLIST_ITEMS and REVIEWS (users ↔ products), CART_ITEMS (carts ↔ variants) and ORDER_ITEMS (orders ↔ variants).

## Step 6 – Data checks

Run `validation.sql`. Results at the time of submission:

| Check | Result |
|---|---|
| All records appear in every table | ✅ All 16 tables populated (see counts above) |
| No empty mandatory fields | ✅ Enforced by `NOT NULL` on every required field |
| Relationships are valid | ✅ `PRAGMA foreign_key_check` returns no rows |
| No duplicate primary keys | ✅ Every table uses `INTEGER PRIMARY KEY AUTOINCREMENT` |
| Database integrity | ✅ `PRAGMA integrity_check` returns `ok` |
| Business-rule checks (11 queries) | ✅ All return 0 problems |

Constraint tests – the database correctly **rejects**: negative stock (BR-14), duplicate emails (BR-01), a rating of 6 (BR-33), a product with a missing category (foreign key), and a Click & Collect order with a delivery address (BR-25).

## Step 7 – Validation

| Question | Answer |
|---|---|
| Does every entity from the ERD exist as a table? | Yes – all 16 entities, 114 fields, matching the data dictionary |
| Do all tables contain data? | Yes – every table meets the minimum record count |
| Have relationships been identified? | Yes – 19 relationships, each enforced by a foreign key |
| Can records be viewed successfully? | Yes – viewed in DB Browser for SQLite (see `screenshots/`) |
| Is the database organised logically? | Yes – three areas (account, catalogue, orders), consistent naming, indexes on foreign keys |
