# Week 4 – Data Dictionary

**Project:** Secure Retail – Product Catalogue System  
**Target database:** MySQL 8  
**Version:** 2.0 (updated from the Week 2 Data Inventory with the Week 3 industry findings)

Every table and field in this dictionary appears in the ERD ([erd.png](erd.png)) with the same name.

## Conventions

- Table names: `UPPER_SNAKE_CASE`, plural (e.g. `ORDER_ITEMS`).
- Field names: `PascalCase`; primary keys are `<Entity>ID` (e.g. `ProductID`).
- A foreign key uses the same name as the primary key it references.
- Money: `DECIMAL(10,2)` in Australian dollars, GST inclusive. Never `FLOAT`.
- Dates and times: stored in UTC, displayed in the customer's local time.
- **Key:** PK = primary key, FK = foreign key, UK = unique. **Null:** "No" means the field is required.

## Contents

- [USERS](#users)
- [ADDRESSES](#addresses)
- [ENQUIRIES](#enquiries)
- [CATEGORIES](#categories)
- [BRANDS](#brands)
- [PRODUCTS](#products)
- [PRODUCT_VARIANTS](#product_variants)
- [PRODUCT_IMAGES](#product_images)
- [INVENTORY](#inventory)
- [REVIEWS](#reviews)
- [WISHLIST_ITEMS](#wishlist_items)
- [CARTS](#carts)
- [CART_ITEMS](#cart_items)
- [ORDERS](#orders)
- [ORDER_ITEMS](#order_items)
- [PAYMENTS](#payments)

---

## USERS

Registered customers and administrators.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `UserID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each user |
| FirstName | VARCHAR(50) |  | No | 1–50 letters, spaces, hyphens | User's first name |
| LastName | VARCHAR(50) |  | No | 1–50 letters, spaces, hyphens | User's last name |
| Email | VARCHAR(255) | UK | No | Valid email format; unique; stored lower-case | Login name and contact email |
| PasswordHash | VARCHAR(255) |  | No | bcrypt hash only; plain text never stored | Hashed password |
| Phone | VARCHAR(20) |  | Yes | Digits, spaces, +; Australian format | Contact phone number |
| Role | ENUM('Customer','Admin') |  | No | Default 'Customer' | Controls access permissions |
| IsActive | BOOLEAN |  | No | Default TRUE | FALSE disables login without deleting data |
| CreatedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the account was created |
| UpdatedAt | DATETIME |  | No | Auto-updated on change | When the account was last changed |

---

## ADDRESSES

Delivery addresses saved by a user.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `AddressID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each address |
| UserID | INT | FK → USERS | No | Must reference an existing user | Owner of the address |
| AddressLine1 | VARCHAR(100) |  | No | Required | Street number and name |
| AddressLine2 | VARCHAR(100) |  | Yes | Optional | Unit, level or building |
| Suburb | VARCHAR(60) |  | No | Required | Suburb or town |
| State | ENUM('NSW','VIC','QLD','WA','SA','TAS','ACT','NT') |  | No | One of the listed values | Australian state or territory |
| Postcode | CHAR(4) |  | No | Exactly 4 digits | Australian postcode |
| IsDefault | BOOLEAN |  | No | Default FALSE; max one TRUE per user | Default delivery address |

---

## ENQUIRIES

Messages submitted through the Contact page.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `EnquiryID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each enquiry |
| UserID | INT | FK → USERS | Yes | NULL for guest enquiries | Linked user if signed in |
| FullName | VARCHAR(100) |  | No | Required | Name entered on the form |
| Email | VARCHAR(255) |  | No | Valid email format | Reply address |
| Phone | VARCHAR(20) |  | Yes | Digits, spaces, + | Optional phone number |
| Subject | ENUM('General Enquiry','Product Information','Technical Support','Order Status','Returns') |  | No | One of the listed values (matches contact.html) | Enquiry category |
| Message | TEXT |  | No | 10–2000 characters; HTML stripped (XSS prevention) | Customer's message |
| Status | ENUM('New','In Progress','Resolved') |  | No | Default 'New' | Support progress |
| SubmittedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the enquiry was sent |

---

## CATEGORIES

Product groupings used for browsing and filtering.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `CategoryID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each category |
| CategoryName | VARCHAR(50) | UK | No | Unique; e.g. Laptops, Smartphones, Smart Watches, Accessories | Category name shown to customers |
| Description | VARCHAR(255) |  | Yes | Optional | Short category description |
| IsActive | BOOLEAN |  | No | Default TRUE | Hides the category when FALSE |

---

## BRANDS

Product manufacturers (Apple, Samsung, Dell, Sony, Lenovo, ASUS).

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `BrandID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each brand |
| BrandName | VARCHAR(50) | UK | No | Unique | Brand name used for display and filtering |

---

## PRODUCTS

Shared information for a product, independent of colour or storage option.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `ProductID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each product |
| CategoryID | INT | FK → CATEGORIES | No | Must reference an existing category | Category the product belongs to |
| BrandID | INT | FK → BRANDS | No | Must reference an existing brand | Product brand |
| ProductName | VARCHAR(150) |  | No | Required | Name shown in search results and product page |
| Description | TEXT |  | No | Required | Product overview and key features |
| Specifications | JSON |  | Yes | Valid JSON of name/value pairs | Technical specifications table |
| WarrantyMonths | INT |  | No | 0–60; default 12 | Manufacturer warranty period |
| IsFeatured | BOOLEAN |  | No | Default FALSE | Shows the product in Featured Products on the Home page |
| IsActive | BOOLEAN |  | No | Default TRUE | Hides the product without deleting order history |
| CreatedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the product was added |
| UpdatedAt | DATETIME |  | No | Auto-updated on change | When the product was last changed |

---

## PRODUCT_VARIANTS

A specific sellable version of a product (e.g. iPhone, Black, 256GB). Each variant has its own SKU and price.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `VariantID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each variant |
| ProductID | INT | FK → PRODUCTS | No | Must reference an existing product | Parent product |
| SKU | VARCHAR(40) | UK | No | Unique; letters, digits, hyphens | Stock keeping unit / product code |
| Colour | VARCHAR(30) |  | Yes | Optional | Colour option |
| StorageOrSize | VARCHAR(30) |  | Yes | Optional | Storage capacity or size option |
| Price | DECIMAL(10,2) |  | No | > 0 | Normal selling price (AUD, incl. GST) |
| PromoPrice | DECIMAL(10,2) |  | Yes | > 0 and < Price | Promotional price |
| PromoStartDate | DATE |  | Yes | Required if PromoPrice is set | Promotion start date |
| PromoEndDate | DATE |  | Yes | Required if PromoPrice is set; ≥ PromoStartDate | Promotion end date |
| PurchaseLimit | INT |  | Yes | ≥ 1; NULL = no limit | Maximum quantity per order (e.g. "Limit 2 per customer") |
| IsActive | BOOLEAN |  | No | Default TRUE | Hides the variant when FALSE |

---

## PRODUCT_IMAGES

Gallery images for a product.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `ImageID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each image |
| ProductID | INT | FK → PRODUCTS | No | Must reference an existing product | Product the image belongs to |
| ImageURL | VARCHAR(255) |  | No | Valid URL or path; JPG, PNG or WebP | Image location |
| AltText | VARCHAR(150) |  | No | Required (accessibility) | Text description for screen readers |
| SortOrder | INT |  | No | ≥ 0; default 0 | Display order in the gallery |
| IsPrimary | BOOLEAN |  | No | Default FALSE; exactly one TRUE per product | Main image used on product cards |

---

## INVENTORY

Current stock for each variant.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `InventoryID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each stock record |
| VariantID | INT | FK → PRODUCT_VARIANTS, UK | No | Unique (one stock record per variant) | Variant being tracked |
| QuantityOnHand | INT |  | No | ≥ 0 | Units available to sell |
| LowStockThreshold | INT |  | No | ≥ 0; default 5 | Level that triggers a low-stock alert |
| UpdatedAt | DATETIME |  | No | Auto-updated on change | When stock last changed |

---

## REVIEWS

Product reviews and star ratings written by customers.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `ReviewID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each review |
| ProductID | INT | FK → PRODUCTS | No | Must reference an existing product | Product being reviewed |
| UserID | INT | FK → USERS | No | Must reference an existing user; one review per user per product | Review author |
| Rating | TINYINT |  | No | Whole number 1–5 | Star rating |
| Title | VARCHAR(100) |  | Yes | Optional | Review heading |
| Comment | TEXT |  | Yes | Max 2000 characters; HTML stripped | Review text |
| IsVerifiedPurchase | BOOLEAN |  | No | Set by the system, not the user | TRUE if the user has a delivered order containing the product |
| Status | ENUM('Pending','Approved','Rejected') |  | No | Default 'Pending' | Moderation status |
| CreatedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the review was written |

---

## WISHLIST_ITEMS

Products a user has saved for later. Resolves the many-to-many link between USERS and PRODUCTS.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `WishlistItemID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each saved item |
| UserID | INT | FK → USERS | No | Unique together with ProductID | User who saved the product |
| ProductID | INT | FK → PRODUCTS | No | Unique together with UserID | Saved product |
| AddedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the product was saved |

---

## CARTS

A user's active shopping cart (one per user).

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `CartID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each cart |
| UserID | INT | FK → USERS, UK | No | Unique (one cart per user) | Cart owner |
| CreatedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the cart was created |
| UpdatedAt | DATETIME |  | No | Auto-updated on change | When the cart last changed |

---

## CART_ITEMS

Variants currently in a cart. Resolves the many-to-many link between CARTS and PRODUCT_VARIANTS.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `CartItemID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each cart line |
| CartID | INT | FK → CARTS | No | Unique together with VariantID | Cart the line belongs to |
| VariantID | INT | FK → PRODUCT_VARIANTS | No | Unique together with CartID | Variant being bought |
| Quantity | INT |  | No | ≥ 1; ≤ stock; ≤ PurchaseLimit | Number of units |
| AddedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the line was added |

---

## ORDERS

A confirmed customer order.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `OrderID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each order |
| OrderNumber | VARCHAR(20) | UK | No | Unique; format SR-YYYYMMDD-#### generated by system | Order reference shown to the customer |
| UserID | INT | FK → USERS | No | Must reference an existing user | Customer who placed the order |
| AddressID | INT | FK → ADDRESSES | Yes | Required when FulfilmentMethod = Delivery; NULL for Click & Collect | Delivery address |
| FulfilmentMethod | ENUM('Delivery','ClickAndCollect') |  | No | One of the listed values | How the order is received |
| OrderStatus | ENUM('Pending','Paid','Shipped','Delivered','Cancelled') |  | No | Default 'Pending'; forward-only (see BR-26) | Order progress |
| Subtotal | DECIMAL(10,2) |  | No | = sum of ORDER_ITEMS.LineTotal; calculated on server | Items total |
| DeliveryCost | DECIMAL(10,2) |  | No | ≥ 0; 0 for Click & Collect | Delivery charge |
| TotalAmount | DECIMAL(10,2) |  | No | = Subtotal + DeliveryCost; calculated on server | Amount payable |
| EstimatedDeliveryDate | DATE |  | Yes | ≥ order date | Expected delivery date |
| TrackingNumber | VARCHAR(50) |  | Yes | Required once status = Shipped | Courier tracking reference |
| CreatedAt | DATETIME |  | No | Default CURRENT_TIMESTAMP | When the order was placed |
| UpdatedAt | DATETIME |  | No | Auto-updated on change | When the order last changed |

---

## ORDER_ITEMS

Variants included in an order, with the price at the time of purchase. Resolves the many-to-many link between ORDERS and PRODUCT_VARIANTS.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `OrderItemID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each order line |
| OrderID | INT | FK → ORDERS | No | Must reference an existing order | Order the line belongs to |
| VariantID | INT | FK → PRODUCT_VARIANTS | No | Must reference an existing variant | Variant purchased |
| Quantity | INT |  | No | ≥ 1 | Units purchased |
| UnitPrice | DECIMAL(10,2) |  | No | > 0; copied from the variant at checkout | Price paid per unit |
| LineTotal | DECIMAL(10,2) |  | No | = Quantity × UnitPrice | Line amount |

---

## PAYMENTS

Payment attempts for an order, processed by an external payment gateway.

| Field | Data Type | Key | Null | Validation / Constraints | Description |
|---|---|---|---|---|---|
| `PaymentID` | INT AUTO_INCREMENT | PK | No | Unique, system-generated | Unique identifier for each payment |
| OrderID | INT | FK → ORDERS | No | Must reference an existing order | Order being paid for |
| PaymentMethod | ENUM('Card','PayPal','Afterpay') |  | No | One of the listed values | Payment method used |
| PaymentStatus | ENUM('Pending','Successful','Failed','Refunded') |  | No | Default 'Pending' | Result from the gateway |
| Amount | DECIMAL(10,2) |  | No | > 0; must equal order TotalAmount for a successful payment | Amount charged |
| GatewayReference | VARCHAR(100) |  | Yes | Returned by gateway; card numbers are never stored | Transaction ID from the payment provider |
| PaidAt | DATETIME |  | Yes | Set when PaymentStatus = Successful | When payment was confirmed |

---

**Total:** 16 tables, 114 fields.
