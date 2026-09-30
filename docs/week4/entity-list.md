# Week 4 – Final Entity List

**Project:** Secure Retail – Product Catalogue System

The final design has **16 entities**, grouped into three areas. Each entity becomes one database table. Attributes and data types are in the [Data Dictionary](data-dictionary.md), and all entities are shown in the [ERD](erd.png).

## Summary

| # | Entity | Description | Primary Key | Foreign Keys | Source | Priority |
|---|---|---|---|---|---|---|
| **Customer & account** | | | | | | |
| 1 | USERS | Registered customers and administrators | UserID | – | Week 2 (User Account) | Must Have |
| 2 | ADDRESSES | Delivery addresses saved by a user | AddressID | UserID | Week 2 planning (shipping address) | Must Have |
| 3 | ENQUIRIES | Messages from the Contact page | EnquiryID | UserID (optional) | Week 2 (Contact form) | Must Have |
| 4 | WISHLIST_ITEMS | Products a user has saved for later | WishlistItemID | UserID, ProductID | Week 2 (Wishlist) | Should Have |
| **Product catalogue** | | | | | | |
| 5 | CATEGORIES | Product groupings (Laptops, Smartphones, Smart Watches, Accessories) | CategoryID | – | Week 2 | Must Have |
| 6 | BRANDS | Manufacturers used for display and filtering | BrandID | – | Week 3 (brand filter) | Should Have |
| 7 | PRODUCTS | Information shared by all versions of a product | ProductID | CategoryID, BrandID | Week 2 | Must Have |
| 8 | PRODUCT_VARIANTS | A sellable version with its own SKU and price (e.g. Black, 256GB) | VariantID | ProductID | **Week 3 – new** | Must Have |
| 9 | PRODUCT_IMAGES | Gallery images with alt text | ImageID | ProductID | Week 2 image, Week 3 gallery | Must Have |
| 10 | INVENTORY | Stock on hand for each variant | InventoryID | VariantID | Week 2 (Stock Level) | Must Have |
| 11 | REVIEWS | Product ratings and reviews | ReviewID | ProductID, UserID | **Week 3 – new** | Should Have |
| **Cart, orders & payments** | | | | | | |
| 12 | CARTS | A user's active shopping cart | CartID | UserID | Week 2 (Cart) | Must Have |
| 13 | CART_ITEMS | Variants and quantities in a cart | CartItemID | CartID, VariantID | Week 2 (Cart Item) | Must Have |
| 14 | ORDERS | A confirmed customer order | OrderID | UserID, AddressID | Week 2 planning (Order) | Must Have |
| 15 | ORDER_ITEMS | Variants in an order, with the price paid | OrderItemID | OrderID, VariantID | Week 2 planning | Must Have |
| 16 | PAYMENTS | Payment attempts processed by a payment gateway | PaymentID | OrderID | Week 2 planning (Payment status) | Must Have |

Priorities follow the MoSCoW list from the Week 3 Product Improvement Workshop.

## Entity review checklist

- [x] All entities identified – every data item from the Week 2 inventory and Week 3 findings has a home table.
- [x] Duplicate entities removed – see changes below.
- [x] Missing entities added – PRODUCT_VARIANTS, BRANDS, REVIEWS, ADDRESSES and PAYMENTS.
- [x] Appropriate names used – plural, `UPPER_SNAKE_CASE`, no abbreviations.
- [ ] Team review completed – *to be ticked after the team walkthrough.*

## Changes from earlier weeks

| Earlier item | Decision | Reason |
|---|---|---|
| Product (single price) | Split into PRODUCTS and PRODUCT_VARIANTS | All three retailers in Week 3 showed a different price for each colour/storage option. |
| Stock Level (field on product) | Moved to INVENTORY (1:1 with variant) | Stock belongs to a specific variant and changes far more often than product details. |
| Testimonials | Replaced by REVIEWS | Week 3 showed customers trust product-level reviews with verified purchase labels. Home page testimonials stay as static content. |
| Featured Product Flag | Kept as `PRODUCTS.IsFeatured` | A yes/no attribute, not a separate object. |
| Cart Total | Not stored – calculated | Stored totals can go out of date; the cart total is recalculated from CART_ITEMS. |
| Store Statistics | Not stored – calculated | Counts such as number of products and customers come from queries. |
| Business Contact Details, Social Media Links | Not tables – site configuration | Single values that rarely change; they do not need relationships. |
| User Account | Became USERS plus ADDRESSES | A user can have several delivery addresses. |
| Order Number & Status | Became ORDERS, ORDER_ITEMS and PAYMENTS | An order contains many items and can have more than one payment attempt. |

## Out of scope for Version 2

These Nice To Have items from Week 3 are **not** in this design. They can be added later without changing existing tables:

- **Stock by store and Click & Collect by store** – would add a STORES table and a StoreID on INVENTORY.
- **Product comparison** and **"Frequently bought together"** – can be built from existing PRODUCTS and ORDER_ITEMS data.
- **"Notify me when back in stock"** – would add a STOCK_ALERTS table (UserID, VariantID).
- **Audit log** of price and stock changes – would add an AUDIT_LOGS table.
