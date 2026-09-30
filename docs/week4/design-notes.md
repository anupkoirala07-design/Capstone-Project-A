# Week 4 – Design Notes

**Project:** Secure Retail – Product Catalogue System  
**Workshop:** Entity Relationship Diagram (ERD) – Database Design and Data Modelling

## Week 4 documents

| Document | Contents |
|---|---|
| [erd.png](erd.png) / [erd.svg](erd.svg) | Final ERD (crow's foot notation) |
| [data-dictionary.md](data-dictionary.md) | 16 tables, 114 fields, data types and validation |
| [entity-list.md](entity-list.md) | Final entities, primary and foreign keys, changes from earlier weeks |
| [relationship-map.md](relationship-map.md) | 19 relationships with cardinality and foreign keys |
| [business-rules.md](business-rules.md) | 38 business rules linked to entities |
| design-notes.md | Design decisions, review and team record (this file) |

## 1. Inputs

| Previous activity | How it was used in the ERD |
|---|---|
| Week 2 Data Inventory (25 items) | Starting point for attributes |
| Week 2 Data Flow Diagrams | Confirmed the purchase journey (browse → cart → order) and contact enquiry flow |
| Week 2 Data Quality & Risk Analysis | Turned into validation rules and business rules |
| Week 2 Planning answers | Separated permanent data from frequently changing data |
| Week 3 Industry Investigation | Added variants, SKU, reviews, delivery and fulfilment data |
| Week 3 MoSCoW list | Decided which entities are in Version 2 |

## 2. Data Dictionary review (Step 1 discussion notes)

| Question | Outcome |
|---|---|
| Have we identified all required data? | Yes. The Week 2 inventory was extended with 13 items found in Week 3 (variant price, SKU, rating breakdown, verified purchase, fulfilment method, delivery cost and more). |
| Are any important fields missing? | Added `CreatedAt`/`UpdatedAt` timestamps, `IsActive` flags for deactivation, and `AltText` for image accessibility. |
| Are field names meaningful? | Renamed vague names, e.g. "Required?" became explicit NOT NULL rules and "Stock" became `QuantityOnHand`. |
| Are there duplicate fields? | Removed Cart Total and Store Statistics (calculated instead). The same address is no longer re-entered for each order. |
| Will backend developers need more information? | Each field now has a MySQL data type, size, key, nullability and validation rule. |
| Can another developer understand each field? | Each field has a plain-English description in the Data Dictionary. |

## 3. Key design decisions

1. **Products and variants are separate tables.** Shared details (name, description, specifications) live in PRODUCTS. Colour, storage, SKU and price live in PRODUCT_VARIANTS. This follows what JB Hi-Fi, Officeworks and Amazon do, and avoids repeating product details for every option.
2. **The price paid is stored on each order line.** `ORDER_ITEMS.UnitPrice` keeps a record of what the customer paid, even if the variant's price changes later.
3. **Inventory is a separate 1:1 table.** Stock changes with every sale, while product details rarely change. Keeping them apart makes updates simpler and allows stock-by-store to be added later.
4. **The cart holds variants; the wishlist holds products.** A customer must choose an exact option before buying, but can save a product without choosing one yet.
5. **Calculated values are not stored** when they can go out of date: average rating, review count, cart total and store statistics. Order totals *are* stored because they are a legal record of the sale.
6. **Deactivate instead of delete.** `IsActive` flags protect order history and reviews. Foreign keys use RESTRICT for records with history.
7. **Payments are a separate table** so that failed attempts and retries are recorded. No card data is stored; only the gateway reference is saved.
8. **Guests can send enquiries,** so `ENQUIRIES.UserID` is optional.
9. **Specifications use a JSON column.** Laptops, phones and watches have different specification fields, and a JSON column avoids a table with dozens of mostly empty columns.

## 4. Normalisation check

| Normal form | Check | Result |
|---|---|---|
| 1NF | Each field holds one value; no repeating groups (images, variants and order lines are separate tables). | ✅ |
| 2NF | Every non-key field depends on the whole primary key. All tables use a single-column surrogate key. | ✅ |
| 3NF | No non-key field depends on another non-key field. Category and brand names live in their own tables, not in PRODUCTS. | ✅ |

**Deliberate exceptions:**

- `ORDER_ITEMS.LineTotal` and `ORDERS.Subtotal`/`TotalAmount` are derived values. They are kept as a permanent record of the sale.
- `PRODUCTS.Specifications` is JSON, as explained in decision 9.

## 5. How the ERD supports the backend and APIs

Each entity maps to a group of REST API endpoints for Capstone B:

| Entity | Example endpoints | Access |
|---|---|---|
| PRODUCTS, PRODUCT_VARIANTS, PRODUCT_IMAGES | `GET /api/products?search=&category=&brand=&minPrice=&maxPrice=&sort=`, `GET /api/products/{id}`, `POST/PUT/DELETE /api/admin/products` | Public read; Admin write |
| CATEGORIES, BRANDS | `GET /api/categories`, `GET /api/brands` | Public read; Admin write |
| INVENTORY | `PUT /api/admin/variants/{id}/stock` | Admin |
| USERS | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/users/me` | Public / signed in |
| ADDRESSES | `GET/POST/PUT/DELETE /api/users/me/addresses` | Signed in (own data) |
| CARTS, CART_ITEMS | `GET /api/cart`, `POST /api/cart/items`, `PATCH/DELETE /api/cart/items/{id}` | Signed in |
| WISHLIST_ITEMS | `GET/POST/DELETE /api/wishlist` | Signed in |
| ORDERS, ORDER_ITEMS | `POST /api/orders` (checkout), `GET /api/orders`, `GET /api/orders/{orderNumber}` | Signed in; Admin updates status |
| PAYMENTS | `POST /api/orders/{id}/payments` (via payment gateway) | Signed in |
| REVIEWS | `GET /api/products/{id}/reviews`, `POST /api/products/{id}/reviews`, `PATCH /api/admin/reviews/{id}` | Public read; signed-in write; Admin moderation |
| ENQUIRIES | `POST /api/enquiries`, `GET/PATCH /api/admin/enquiries` | Public submit; Admin read |

This covers every Must Have and Should Have item from Week 3: search, filters and sort, a product detail page, stock levels, variants, a database cart, secure accounts, reviews, delivery information, saved wishlists and order tracking.

## 6. Database design review (Step 8)

| Review question | Yes / No | Evidence |
|---|---|---|
| Can all required project data be stored? | Yes | All 25 Week 2 items and 13 new Week 3 items map to a field (see Data Dictionary). |
| Have all important entities been included? | Yes | 16 entities covering accounts, catalogue, cart, orders, payments, reviews and enquiries. |
| Are Primary Keys defined correctly? | Yes | Every table has a single auto-increment `<Entity>ID` primary key. |
| Are Foreign Keys defined correctly? | Yes | 19 foreign keys (one per relationship); each one matches the name of the primary key it references. |
| Are relationships logical? | Yes | 19 relationships, each described in both directions in the Relationship Map. |
| Are cardinalities correct? | Yes | Minimum and maximum shown for both ends of every relationship. |
| Can another team understand the ERD? | *Confirm at team review* | Legend, colour-coded areas and consistent naming are included. |
| Could a backend developer implement this database? | Yes | Data types, sizes, constraints and ON DELETE actions are specified. |

**Team approval:** ☐ Design approved by team – Date: __________

## 7. Team contribution record

Each member commits their own file to `docs/week4/` so that everyone's contribution is visible in GitHub.

| Team member | Role | Week 4 task | File(s) | Status |
|---|---|---|---|---|
| Anup Koirala | Project Manager | Coordinate the workshop, write design notes, final review and merge | design-notes.md | |
| Kushal Gurung | Designer | ERD layout and visual review | erd.png, erd.svg | |
| Bibek Pokharel | Reviewer | Run the Step 8 design review and review the pull request | Pull request review | |
| Sanju Kumar Kushiyiat | Tester | Business rules and traceability to Week 2 risks | business-rules.md | |
| Ishwor Subedi | Backend Developer | Data types, constraints and relationships | data-dictionary.md, relationship-map.md | |
| Darshan Paudel | Frontend Developer | Final entity list and page-to-entity mapping | entity-list.md | |

*Update the Status column (e.g. Done + commit link) once each task is committed.*

## 8. Week 4 success checklist

- [x] Data Dictionary completed
- [x] Entities identified
- [x] Attributes reviewed
- [x] Primary Keys identified
- [x] Foreign Keys identified
- [x] Relationships mapped
- [x] Cardinality defined
- [x] Business Rules documented
- [x] ERD completed
- [ ] GitHub documentation uploaded
- [ ] Team contributions recorded
- [ ] Design approved by team

