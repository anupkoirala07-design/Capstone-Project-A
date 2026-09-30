# Week 3 – Industry Investigation & Data Discovery

| | |
|---|---|
| **Project** | Secure Retail – Product Catalogue System |
| **Unit** | Capstone B – Week 3 |
| **Investigation type** | Option B – Online Investigation |
| **Date** | 30 September 2026 |
| **Investigated by** | Anup Koirala – Secure Retail Team |
| **Comparison product** | Apple iPhone 18 Pro Max (256GB) |
| **Full report with screenshots** | [week3-industry-investigation.pdf](week3-industry-investigation.pdf) |

---

## Contents

- [Purpose and Method](#purpose-and-method)
- [Task 1 – Organisations Investigated](#task-1--organisations-investigated)
- [Task 2 – Data Discovery](#task-2--data-discovery)
- [Task 3 – Module Investigation Summary](#task-3--module-investigation-summary)
- [Task 4 – User Insights](#task-4--user-insights)
- [Task 5 – Data Gap Analysis](#task-5--data-gap-analysis)
- [Task 6 – Product Improvement Workshop](#task-6--product-improvement-workshop)
- [Task 7 – Jira Items Created](#task-7--jira-items-created)
- [Conclusion and Next Steps](#conclusion-and-next-steps)

---

## Purpose and Method

In Capstone A our team built a **Frontend MVP** of the Secure Retail Product Catalogue. Before designing the database and backend for Capstone B, we investigated how real Australian retailers collect, display and use product data.

**Method**

1. Selected three online retailers that sell the same product categories as our project.
2. Searched each site for the **same product** (iPhone 18 Pro Max 256GB) so results could be compared fairly.
3. Reviewed the home page, search results, filters, product page, cart and wishlist, delivery, policies and help links.
4. Captured **18 screenshots** as evidence (Figures 1–18 in the [full report](week3-industry-investigation.pdf)).
5. Extracted the data items used and compared each system with our MVP.

> Prices and stock were recorded on 30 September 2026 and may have changed since.

---

## Task 1 – Organisations Investigated

### Comparison at a glance

| | JB Hi-Fi | Officeworks | Amazon AU |
|---|---|---|---|
| **Type** | Electronics retailer | Office & tech retailer | Online marketplace |
| **Search results** | 16 | 59 (incl. accessories) | 1,000+ |
| **256GB price** | $2,299 | $2,297 | $2,297 |
| **Price range** | $2,299 – $4,699 | $2,297 – $4,697 | From $2,297 |
| **Rating** | 2.7★ (7 reviews) | No reviews yet | 2.4★ (3 ratings) |
| **Filters** | Price only | Availability, Category, Price | 12+ filter groups |
| **Stock / fulfilment** | Stock by postcode or location | Pick up in-store or Deliver | Out-of-stock pre-order |
| **Returns** | Faulty goods and warranties guide | 365 days (OnePass) | 30 days change of mind |
| **Standout feature** | Price-match ("JB Deal") | AI assistant "Ask Ollie" | Rating breakdown + Verified Purchase |

### JB Hi-Fi (Figures 1–7)

- Every storage option shows **its own price**.
- **Stock availability** is checked by postcode or current location.
- Detailed product data: **model, SKU** and a **30+ field specifications table**.
- Trust features: price-match, live chat, phone support, scam alerts and 8 payment methods.
- Business rule: **"Limit 2 per customer"**.

### Officeworks (Figures 8–13)

- Customers choose **Pick up in-store** or **Deliver to me** before adding to cart.
- Filters include **Availability**: Delivery, In Store, Click & Collect.
- Product information is split into **Specifications, Customer Reviews, Q & As and Delivery**.
- Trust signals: Price Beat Guarantee, 365-day returns, product recalls notice.
- **"Ask Ollie"** AI shopping assistant.

### Amazon Australia (Figures 14–18)

- The most filters: Prime, **delivery day**, condition (New / Renewed / Used), seller and rating.
- Reviews show a **star breakdown (%)** and **Verified Purchase** labels.
- Out-of-stock items can still be ordered; payment is taken **only when the item ships**.
- **Estimated delivery dates** appear in search results.
- Sponsored results and "Best Seller" badges appear in search results.

---

## Task 2 – Data Discovery

**25 data items** were identified. Items marked **(New)** were not in our Week 2 Data Inventory.

| # | Data Item | Why Is It Important? | Who Uses It? | Evidence |
|---|---|---|---|---|
| 1 | Product Name / Title | Identifies the product in search results | Customers, Staff | Fig 1, 8, 14 |
| 2 | Product Price | Supports purchasing decisions | Customers, Finance | Fig 2, 10, 16 |
| 3 | Variant Price **(New)** | Shows the cost difference between options | Customers | Fig 2, 10, 16 |
| 4 | Product Variants – colour, storage **(New)** | Customer picks the exact version | Customers, Inventory | Fig 2, 10, 16 |
| 5 | SKU / Model / Product Code **(New)** | Uniquely identifies stock | Staff, Inventory system | Fig 2, 10 |
| 6 | Product Images / Video | Customers see the product before buying | Customers | Fig 2, 10, 16 |
| 7 | Specifications | Detailed feature comparison | Customers | Fig 5, 12, 16 |
| 8 | Product Category | Browsing and filtering | Customers, Admin | Fig 8 |
| 9 | Average Star Rating | Quick signal of quality | Customers, Managers | Fig 1, 10, 18 |
| 10 | Review Count | Shows how reliable the rating is | Customers | Fig 1, 14 |
| 11 | Rating Breakdown **(New)** | Shows the spread of opinions | Customers, Managers | Fig 18 |
| 12 | Review Text + Verified Purchase **(New)** | Builds trust with real experiences | Customers, Admin | Fig 18 |
| 13 | Stock Level / Availability | Prevents selling unavailable items | Customers, Inventory | Fig 4, 14, 17 |
| 14 | Store Location / Postcode **(New)** | Local stock and delivery options | Customers, Logistics | Fig 4, 11 |
| 15 | Fulfilment Method **(New)** | Delivery or Click & Collect | Customers, Store staff | Fig 8, 11 |
| 16 | Delivery Cost **(New)** | Affects the total price | Customers, Finance | Fig 9, 14 |
| 17 | Estimated Delivery Date **(New)** | Sets customer expectations | Customers, Logistics | Fig 14 |
| 18 | Promotion / Discount | Drives sales | Customers, Marketing | Fig 1, 16 |
| 19 | Purchase Limit per Customer **(New)** | Stops bulk buying of popular stock | System, Staff | Fig 3 |
| 20 | Payment Methods | Flexible, trusted payment | Customers, Finance | Fig 2, 7, 13 |
| 21 | Warranty Period **(New)** | Gives purchase confidence | Customers, Support | Fig 6 |
| 22 | Returns Policy **(New)** | Reduces purchase risk | Customers, Support | Fig 9, 17 |
| 23 | Seller / Shipper **(New)** | Shows who the customer buys from | Customers | Fig 17 |
| 24 | Wishlist Items | Saves products and shows demand | Customers, Marketing | Fig 3, 10, 17 |
| 25 | Order Number / Tracking Status | Lets customers follow their delivery | Customers, Support | Fig 7, 13 |

---

## Task 3 – Module Investigation Summary

**Module:** Product Catalogue
**Question:** What information helps customers choose products?

| Group | What real systems show | Evidence |
|---|---|---|
| **Price and value** | Price for every variant, promotions, price-match promises, flexible payment (Afterpay, Zip, Latitude) | Fig 1, 2, 10, 11, 16 |
| **Product details** | 6–11 images plus video, key features, full specifications, SKU | Fig 2, 5, 12, 16 |
| **Social proof** | Star rating, review count, rating breakdown, Verified Purchase, Q&A | Fig 1, 12, 18 |
| **Availability and delivery** | Stock by postcode, pick up in-store, delivery cost and date | Fig 4, 11, 14 |
| **Finding and comparing** | Search, filters, sort, compare, "frequently bought together" | Fig 1, 3, 8, 14 |

> **Key insight:** The iPhone 18 Pro Max had **low ratings (2.4–2.7★)** on JB Hi-Fi and Amazon. Customers see this before buying, so review data has a strong effect on purchasing decisions.

---

## Task 4 – User Insights

> **Note:** The three people below are **fictional user personas** created from the Task 1–3 findings. They are **not real interview participants**. Real interviews will be added when completed.

| Question | Maya, 21 – Student | Daniel, 44 – Small business owner | Margaret, 66 – Retiree |
|---|---|---|---|
| **Profile** | Shops on her phone, budget-conscious | Buys devices for 5 staff, values time | Less confident online, worried about scams |
| **Information expected before purchase** | Price of each option, reviews, Afterpay | Exact specs, SKU, warranty | Clear price, stock nearby |
| **What builds trust** | Many reviews, "verified purchase" | Returns policy, warranty, known seller | Phone number, secure payment logos |
| **What saves time** | Filters, sort by price | Stock and delivery date before checkout | Simple layout, Click & Collect |
| **What is often missing** | Honest reviews on new products | Multi-store stock, business invoices | Plain-English specifications |
| **What would improve the experience** | Price-drop alerts, saved wishlist | Order tracking, saved accounts | Live chat or phone help, larger text |

**Key themes**

- All three need **clear price and stock information** before buying.
- **Trust signals differ by user type**: reviews (students), warranty and returns (business buyers), phone support and scam warnings (older users).
- **Time-saving features** matter to everyone: filters, delivery dates, Click & Collect.
- **Accessibility** (simple layout, readable text) is a gap in our MVP.

---

## Task 5 – Data Gap Analysis

| # | Our MVP | Industry System | Missing Opportunity |
|---|---|---|---|
| 1 | Featured products on the Home page only | Search with a results count | Product search |
| 2 | Browse by category only | Price, availability, brand, rating and condition filters | Product filters |
| 3 | No sorting | 6–9 sort options | Sort options |
| 4 | Product cards only | Product page with gallery and specifications | Product detail page |
| 5 | One price per product | Colour and storage variants with their own price | Variants and variant pricing |
| 6 | No product code | Model, SKU and product code | SKU field |
| 7 | Store testimonials only | Product reviews with breakdown and Verified Purchase | Product reviews |
| 8 | No stock information | Stock by postcode, "Only 2 left in stock" | Stock level |
| 9 | No delivery information | Delivery cost, date and Click & Collect | Delivery options |
| 10 | Add to Cart (UI only) | Working cart plus Buy Now | Functional cart |
| 11 | Wishlist (UI only) | Wishlist saved to an account | Saved wishlist |
| 12 | No user accounts | Sign in, create account, password reset | Secure user accounts |
| 13 | No order tracking | "Track my order" | Order tracking |
| 14 | No compare feature | Compare / Add to Compare | Product comparison |
| 15 | Contact form only | Live chat, phone, AI assistant | More support channels |
| 16 | No policy information | Warranty, returns, secure transaction | Trust and policy information |

---

## Task 6 – Product Improvement Workshop

Improvements for **Capstone B – Version 2**, prioritised using **MoSCoW**:

| Must Have | Should Have | Nice To Have |
|---|---|---|
| Product search | Filters and sort options | Product comparison |
| Product detail page with specs and SKU | Product reviews with rating breakdown | Stock by store and Click & Collect |
| Stock level on products | Delivery cost, estimate and returns info | "Frequently bought together" |
| Secure user accounts (hashed passwords, roles) | Wishlist saved to account | "Notify me when back in stock" |
| Functional cart stored in the database | Order tracking page | Live chat / AI assistant |
| Variants with a price per variant | | "Buy Now" one-step purchase |

```mermaid
flowchart LR
    A[Week 3 findings] --> B[Must Have features]
    B --> C[Database design]
    C --> D[Backend and APIs]
    D --> E[Capstone B Version 2]
```

---

## Task 7 – Jira Items Created

| Key | Type | Summary | Priority |
|---|---|---|---|
| SR-20 | Research Finding | Week 3 industry investigation: JB Hi-Fi, Officeworks, Amazon AU | Medium |
| SR-21 | Data Requirement | Add SKU, variants and variant price to product data | High |
| SR-22 | Data Requirement | Add stock level / availability field to products | High |
| SR-23 | Data Requirement | Add review data: rating, text, verified purchase, date | Medium |
| SR-24 | User Story | As a customer, I want to search products so that I can quickly find what I need | High |
| SR-25 | User Story | As a customer, I want a product page with specifications so that I can compare features | High |
| SR-26 | User Story | As a customer, I want to see stock availability so that I don't order unavailable items | High |
| SR-27 | User Story | As a customer, I want a secure account so that my cart and wishlist are saved | High |
| SR-28 | Feature Request | Filters (price, category, availability) and sort options | Medium |
| SR-29 | Feature Request | Product reviews and ratings with star breakdown | Medium |
| SR-30 | Enhancement | Show delivery cost, estimate and returns policy on the product page | Medium |
| SR-31 | Enhancement | Save wishlist to user account | Medium |
| SR-32 | Feature Request | Product comparison and "frequently bought together" | Low |
| SR-33 | Research Finding | User personas created; real user interviews still to be completed | Medium |

---

## Conclusion and Next Steps

Our Capstone A MVP shows **name, image, price and category**. Real retailers rely on much richer data: **variants, SKUs, specifications, reviews, stock and delivery information**. This investigation gives us evidence-based requirements for the Capstone B database and backend.

**Next steps**

- [ ] Complete real user interviews and add them to the report
- [ ] Update the Week 2 Data Inventory with the **(New)** data items
- [ ] Begin database design for Products, Variants, Reviews, Stock, Users and Orders

