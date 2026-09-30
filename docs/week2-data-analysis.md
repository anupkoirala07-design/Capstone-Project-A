# Week 2 – Project Data Analysis & Planning

**Project:** Secure Retail – Product Catalogue System

| Team Member | Role | Week 2 Contribution |
|---|---|---|
| Anup Koirala | Project Manager | Data Inventory, Planning answers |
| Kushal Gurung | Designer | Data discovery – About & Contact pages |
| Bibek Pokharel | Reviewer | Pull Request review |
| Sanju Kumar Kushiyiat | Tester | Risk analysis, validation check |
| Ishwor Subedi | Backend Developer | Data Flow Diagrams, docs setup |
| Darshan Paudel | Frontend Developer | Data discovery – Home page |

---

## 1. Module Data Discovery

Data items identified across the Home, About and Contact pages, plus items planned for Capstone B.

| Area | Data Items |
|---|---|
| Product Catalogue (Home) | Product ID, Product Name, Description, Price, Discount/Promo Price, Category, Image, Stock Level, Featured Flag |
| Cart & Wishlist (UI only) | Cart Item (Product ID + Quantity), Cart Total, Wishlist Item |
| Contact Form (Contact) | Full Name, Email, Phone Number, Subject, Message, Submission Date/Time |
| Trust Content (Home/About) | Testimonial Name, Testimonial Text/Rating, Store Statistics, Business Contact Details, Social Media Links |
| Planned – Capstone B | User Account (Username, Email, Password, Role), Order Number & Order Status |

**Total: 25 data items**

---

## 2. Project Data Inventory

| # | Data Item | Purpose | Who Creates It? | Who Uses It? | Required? |
|---|---|---|---|---|---|
| 1 | Product ID | Uniquely identifies each product | System (auto-generated) | System, Administrator | Yes |
| 2 | Product Name | Identifies the product to customers | Administrator | Customers, Administrator | Yes |
| 3 | Product Description | Explains product features | Administrator | Customers | Yes |
| 4 | Product Price | Shows the cost of the product | Administrator | Customers, Cart, Reports | Yes |
| 5 | Discount / Promo Price | Shows reduced price during promotions | Administrator | Customers | No |
| 6 | Product Category | Groups products for browsing | Administrator | Customers, Administrator | Yes |
| 7 | Product Image | Visual display of the product | Administrator | Customers | Yes |
| 8 | Stock Level | Shows product availability | Administrator / Inventory system | Customers, Administrator | Yes |
| 9 | Featured Product Flag | Decides which products appear on the homepage | Administrator | System (Home page) | No |
| 10 | Cart Item (Product ID + Qty) | Tracks what the customer wants to buy | Customer | Customer, Order system | Yes (for checkout) |
| 11 | Cart Total | Shows total cost before checkout | System (calculated) | Customer | Yes |
| 12 | Wishlist Item | Saves products for later | Customer | Customer | No |
| 13 | Customer Full Name | Identifies who sent the enquiry | Customer | Administrator / Support | Yes |
| 14 | Customer Email | Allows the business to reply | Customer | Administrator / Support | Yes |
| 15 | Phone Number | Alternative contact method | Customer | Administrator / Support | No |
| 16 | Enquiry Subject | Categorises the enquiry | Customer | Administrator / Support | Yes |
| 17 | Enquiry Message | The customer's question or issue | Customer | Administrator / Support | Yes |
| 18 | Enquiry Date/Time | Records when the enquiry was sent | System (auto) | Administrator, Reports | Yes |
| 19 | Testimonial Name | Shows who gave the review | Customer (approved by Admin) | Visitors | Yes (if shown) |
| 20 | Testimonial Text / Rating | Builds trust through social proof | Customer (approved by Admin) | Visitors | Yes (if shown) |
| 21 | Store Statistics | Shows business credibility | System / Administrator | Visitors | No |
| 22 | Business Contact Details | Lets customers reach the store | Administrator | Customers | Yes |
| 23 | Social Media Links | Connects customers to social channels | Administrator | Customers | No |
| 24 | User Account (Username, Email, Password, Role) | Login and access control *(Capstone B)* | Customer / Administrator | System, Administrator | Yes |
| 25 | Order Number & Status | Tracks customer orders *(Capstone B)* | System | Customer, Administrator | Yes |

---
