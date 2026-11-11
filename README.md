# Secure Retail – Product Catalogue System

An online electronics store built by our team for the Capstone Project (A and B). Customers can browse laptops, smartphones, smart watches, tablets and accessories. They can create an account, add items to a cart and check out. Staff use an admin area to manage products, prices, stock, orders and customer enquiries.

The site runs on a **Node.js + Express** backend with a **SQLite** database, and a **Bootstrap** frontend.

---

## Contents

- [What the website does](#what-the-website-does)
- [Technologies used](#technologies-used)
- [Project structure](#project-structure)
- [How to run it](#how-to-run-it)
- [Demo accounts](#demo-accounts)
- [Pages](#pages)
- [API endpoints](#api-endpoints)
- [Database](#database)
- [Security](#security)
- [Business rules in the code](#business-rules-in-the-code)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Team](#team)
- [Project timeline](#project-timeline)
- [Future improvements](#future-improvements)

---

## What the website does

### For customers

- **Browse products** that come straight from the database, with category filters and a search bar.
- **View a product** and choose an option (colour or storage). The page shows the price, any sale price, stock level and purchase limit.
- **Create an account** or **log in**.
- **Use the cart:** add items, change quantities and remove items. Stock and purchase limits are checked as you go.
- **Check out:** choose **Delivery** or **Click & Collect**, pick or add an address, choose a payment method (Card, PayPal or Afterpay) and place the order.
- **My Orders:** see past orders, with items, totals, status and tracking number.
- **Contact form:** send an enquiry, which is saved for staff to answer.

### For admins

- **Dashboard** showing products, orders, orders to ship, revenue, new enquiries and low-stock items.
- **Products:** add, edit and delete products.
- **Prices & stock:** manage each product's variants, including SKU, price, promotion price and dates, purchase limit, stock level and low-stock alert level.
- **Orders:** mark orders **Shipped** (with a tracking number) or **Delivered**, or **cancel** them. Cancelling a paid order refunds it and puts the stock back.
- **Enquiries:** read messages from the Contact page and set them to New, In Progress or Resolved.
- **Low stock:** see which variants are running out, with a Restock button.

> **Payment is simulated.** The checkout records a payment without asking for card details, so no card numbers are ever entered or stored. A live store would hand over to a payment provider at that step (see [Future improvements](#future-improvements)).

---

## Technologies used

| Area | Technology |
|---|---|
| Frontend | HTML5, CSS3, Bootstrap 5.3, Bootstrap Icons, JavaScript (no framework) |
| Backend | Node.js, Express 5 |
| Database | SQLite (`sqlite3` package) |
| Logins | `bcryptjs` for password hashing, `express-session` for sessions |
| Tools | Visual Studio Code, Git and GitHub, Postman, DB Browser for SQLite |

---

## Project structure

```
Capstone-Project-A/
├── backend/
│   ├── server.js               Express server: all API routes and serves the frontend
│   ├── set-demo-passwords.js   Gives the sample users real passwords (run once)
│   ├── package.json            Node packages used by the backend
│   └── Screenshots/            Week 7 evidence screenshots
├── database/
│   ├── project.db              The SQLite database
│   ├── schema.sql              Creates the 16 tables, constraints, indexes and triggers
│   ├── sample-data.sql         Inserts the sample data
│   ├── validation.sql          Checks the constraints and relationships
│   └── screenshots/            Screenshots of every table
├── docs/
│   ├── week2-data-analysis.md
│   ├── week3-industry-investigation.md / .pdf
│   ├── week4/                  Data dictionary, ERD, business rules, relationship map …
│   └── final-features-guide.md How login, cart, checkout and admin were added
├── frontend/
│   ├── index.html              Home page and product grid
│   ├── about.html              About page
│   ├── contact.html            Contact form
│   ├── login.html              Log in / create account
│   ├── product.html            Product details and options
│   ├── cart.html               Shopping cart
│   ├── checkout.html           Checkout
│   ├── orders.html             My Orders
│   ├── admin.html              Admin area
│   ├── style.css               Main design (from Capstone A)
│   ├── shop.css                Extra styles for the shop and admin pages
│   └── js/                     JavaScript for each page (shop.js is shared)
└── README.md
```

---

## How to run it

### What you need

- **Node.js** (LTS version) – download from [nodejs.org](https://nodejs.org). Check it is installed with `node -v`.
- **Git**, if you are cloning the repository.

### Steps

**1. Get the code.**

```
git clone https://github.com/anupkoirala07-design/Capstone-Project-A.git
cd Capstone-Project-A
```

Or download it from GitHub (**Code → Download ZIP**) and extract it.

**2. Install the backend packages.**

```
cd backend
npm install
```

**3. Set the demo passwords.** You only need to do this once, and again after rebuilding the database.

```
node set-demo-passwords.js
```

**4. Start the server.**

```
node server.js
```

The terminal should show:

```
Server Started
Open http://localhost:3000/index.html in your browser
Admin page: http://localhost:3000/admin.html
Connected to SQLite database: ...\database\project.db
Database check: 10 products found
```

**5. Open the website.**

| Page | Address |
|---|---|
| Shop (home page) | http://localhost:3000/index.html |
| Admin area | http://localhost:3000/admin.html |
| Server check | http://localhost:3000 → shows "Server Running" |
| Product data (JSON) | http://localhost:3000/api/products |

> Always open the pages through `http://localhost:3000/...`. Double-clicking the HTML files won't work, because the pages need the server for products, logins and the cart.

Keep the terminal open while you use the site. To stop the server, press **Ctrl + C**.

---

## Demo accounts

These are test passwords for the local demo database only. They are set by `set-demo-passwords.js`.

| Role | Email | Password |
|---|---|---|
| Admin | anika.sharma@secureretail.com.au | `Admin@2026` |
| Admin | liam.nguyen@secureretail.com.au | `Admin@2026` |
| Customer | olivia.brown@example.com | `Customer@2026` |
| Customer | jack.wilson@example.com | `Customer@2026` |
| Deactivated customer (login is blocked) | ethan.khan@example.com | `Customer@2026` |

You can also create your own customer account on the **Log in** page. New accounts are always customers, never admins.

---

## Pages

| Page | Who can use it | What it does |
|---|---|---|
| `index.html` | Everyone | Hero banner, categories and the live product grid with filters and search |
| `about.html` | Everyone | About the store, mission, values and team |
| `contact.html` | Everyone | Contact form that saves enquiries to the database |
| `product.html?id=1` | Everyone | Product details, options, stock and Add to Cart |
| `login.html` | Everyone | Log in or create an account |
| `cart.html` | Logged-in users | View and change the cart |
| `checkout.html` | Logged-in users | Delivery or Click & Collect, address, payment, place order |
| `orders.html` | Logged-in users | The user's own orders |
| `admin.html` | Admins only | Dashboard, products, prices & stock, orders, enquiries, low stock |

---

## API endpoints

All endpoints return JSON. "Login" means the user must be logged in. "Admin" means the user must be logged in with an Admin account.

### Accounts

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a customer account and log in |
| POST | `/api/auth/login` | Public | Log in |
| POST | `/api/auth/logout` | Public | Log out |
| GET | `/api/auth/me` | Public | Who is logged in, plus cart count |

### Products and catalogue

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/products` | Public | List products (`?search=iphone`, `?category=2`) |
| GET | `/api/products/:id` | Public | One product with its variants |
| POST | `/api/products` | Admin | Add a product |
| PUT | `/api/products/:id` | Admin | Update a product |
| DELETE | `/api/products/:id` | Admin | Delete a product, or deactivate it if it has history |
| GET | `/api/categories` | Public | List categories |
| GET | `/api/brands` | Public | List brands |
| POST | `/api/enquiries` | Public | Send a Contact page enquiry |

### Cart, checkout and orders

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/cart` | Login | View my cart |
| POST | `/api/cart/items` | Login | Add a variant to my cart |
| PUT | `/api/cart/items/:id` | Login | Change the quantity |
| DELETE | `/api/cart/items/:id` | Login | Remove an item |
| GET | `/api/addresses` | Login | My saved addresses |
| POST | `/api/addresses` | Login | Add an address |
| POST | `/api/checkout` | Login | Place the order and pay (simulated) |
| GET | `/api/orders` | Login | My orders |
| GET | `/api/orders/:id` | Login | One of my orders |

### Admin

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| GET | `/api/admin/summary` | Admin | Dashboard numbers |
| GET | `/api/admin/products/:id/variants` | Admin | A product's variants with price and stock |
| POST | `/api/admin/products/:id/variants` | Admin | Add a variant and its stock record |
| PUT | `/api/admin/variants/:id` | Admin | Update price, promotion, limit and stock |
| DELETE | `/api/admin/variants/:id` | Admin | Delete a variant, or deactivate it if it has been ordered |
| GET | `/api/admin/orders` | Admin | All orders (`?status=Paid`) |
| GET | `/api/admin/orders/:id` | Admin | One order |
| PUT | `/api/admin/orders/:id/status` | Admin | Change status to Shipped, Delivered or Cancelled |
| GET | `/api/admin/enquiries` | Admin | Contact page enquiries |
| PUT | `/api/admin/enquiries/:id/status` | Admin | Change an enquiry's status |
| GET | `/api/admin/low-stock` | Admin | Low-stock alerts |

**Testing in Postman:** send `POST /api/auth/login` first, with the body
`{ "Email": "anika.sharma@secureretail.com.au", "Password": "Admin@2026" }`. Postman keeps the login cookie, so the admin requests after it will work.

---

## Database

The SQLite database (`database/project.db`) was designed from our Week 4 data dictionary and ERD. It has **16 tables** in three areas:

| Area | Tables |
|---|---|
| Customers and accounts | USERS, ADDRESSES, ENQUIRIES, WISHLIST_ITEMS |
| Product catalogue | CATEGORIES, BRANDS, PRODUCTS, PRODUCT_VARIANTS, PRODUCT_IMAGES, INVENTORY, REVIEWS |
| Cart, orders and payments | CARTS, CART_ITEMS, ORDERS, ORDER_ITEMS, PAYMENTS |

- Foreign keys enforce the relationships between tables.
- CHECK constraints, unique indexes and triggers enforce many of the business rules at database level.

**To rebuild the database from scratch:** delete `project.db`, then run these in the `database` folder. You need the SQLite command-line tool.

```
sqlite3 project.db < schema.sql
sqlite3 project.db < sample-data.sql
```

Then run `node set-demo-passwords.js` again from the `backend` folder.

> `project.db` changes on your computer when you set the passwords or place test orders. Don't commit those local changes. To go back to the clean copy from GitHub, run `git checkout -- database/project.db` from the main project folder, then set the demo passwords again.

---

## Security

| Area | How it is handled |
|---|---|
| Passwords | Stored only as **bcrypt hashes**, never as plain text |
| Login errors | A wrong email and a wrong password give the same message, so attackers can't find out which emails are registered |
| Sessions | The login is kept on the server. The browser only gets a random ID in an **HttpOnly** cookie that page scripts can't read |
| Admin access | Every admin route checks the user's role **on the server**. Guests get 401 and customers get 403, even if they call the API directly |
| Customer data | Customers can only see and change their own cart, addresses and orders |
| Prices | Totals are always calculated **by the server** from database prices. Prices sent from the browser are ignored |
| SQL injection | Every query uses `?` placeholders instead of joining user input into SQL |
| XSS | Pages add text with `textContent`, and HTML tags are removed from enquiries |
| Payments | No card numbers or security codes are collected or stored |
| Stock | Checkout runs as one database **transaction**, so the same last item can't be sold twice |

---

## Business rules in the code

The full list is in `docs/week4/Business rules.md`. Some key examples:

| Rule | What happens |
|---|---|
| BR-02 | Passwords are stored as bcrypt hashes |
| BR-03 | Only admins can manage products and orders |
| BR-04 | Deactivated accounts can't log in |
| BR-12 | Products and variants with order history are deactivated, not deleted |
| BR-15 | Stock goes down when an order is paid, and back up if a paid order is cancelled |
| BR-16 | Low-stock alerts appear when stock is at or below the alert level |
| BR-17 | Out-of-stock items can't be added to the cart |
| BR-20 / BR-31 | Cart quantities can't go over the stock or the purchase limit (e.g. "Limit 2 per customer") |
| BR-23 / BR-24 | Order prices are copied from the database at checkout and totals are calculated by the server |
| BR-25 | Delivery orders need an address. Click & Collect is free and needs no address |
| BR-26 | Order status only moves forward: Pending → Paid → Shipped → Delivered (or Cancelled) |
| BR-27 | A tracking number is required to mark an order as Shipped |
| BR-30 | Card details are never stored |
| BR-37 | Enquiry messages are limited to 2,000 characters and HTML is removed |

**Delivery charge:** $9.95, or free on orders of $1,000 or more. Click & Collect is always free. To change this, edit `DELIVERY_FEE` and `FREE_DELIVERY_FROM` at the top of `backend/server.js`.

---

## Testing

The login, cart, checkout and admin features were tested against **13 test cases** covering security, business rules and normal use. All 13 passed.

| Area | What was tested |
|---|---|
| Logins | Guests are sent to the login page, wrong passwords are rejected, deactivated accounts are blocked, password rules apply |
| Cart | Purchase limit ("Limit 2 per customer") and out-of-stock items |
| Checkout | Delivery under $1,000 ($9.95 charge), Click & Collect (free, no address) |
| Admin | Customers can't open the admin page, tracking number required to ship, cancelling a paid order refunds it and restores stock, new products and low-stock alerts |
| Contact | Enquiries are saved and appear in the admin area |

Full results with screenshots: [docs/testing/test-results.md](docs/testing/test-results.md)

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm : ... npm.ps1 cannot be loaded because running scripts is disabled` (PowerShell) | Use `npm.cmd install`, or open **Command Prompt** instead of PowerShell |
| `Cannot find module 'sqlite3'` | Run `npm install` in the `backend` folder. If it still fails, run `npm install-scripts approve sqlite3` and then `npm rebuild sqlite3` |
| `npm audit` reports a vulnerability | Run `npm audit fix` |
| Login says "Email or password is incorrect" for demo accounts | Run `node set-demo-passwords.js` in the `backend` folder |
| `Database connection failed` | Start the server from inside the `backend` folder, and check `database/project.db` exists |
| `EADDRINUSE: address already in use :::3000` | The server is already running in another terminal. Close it with **Ctrl + C** |
| Pages show no products | Open the site through `http://localhost:3000/index.html`, not by double-clicking the file |
| `Route GET /something.html not found` | That file is missing from the `frontend` folder |

---

## Team

| Name | Role |
|---|---|
| Anup Koirala | Project Manager |
| Ishwor Subedi | Backend Developer |
| Darshan Paudel | Frontend Developer |
| Kushal Gurung | Designer |
| Bibek Pokharel | Reviewer |
| Sanju Kumar Kushiyiat | Tester |

We worked in sprints. Each feature was built on its own branch, reviewed through a pull request and merged into `main`.

---

## Project timeline

| Stage | What we did |
|---|---|
| **Capstone A** | Designed and built the responsive frontend (Home, About and Contact pages) with HTML5, CSS3 and Bootstrap |
| **Week 2** | Data analysis: data inventory, data flow diagrams, data quality risks |
| **Week 3** | Industry investigation of similar retail websites |
| **Week 4** | Database design: entity list, data dictionary, ERD, business rules and relationship map |
| **Week 6** | Reorganised the repository into frontend, backend and database folders; built the SQLite database with sample data |
| **Week 7** | Built the Express server, connected it to the database and created the first API endpoint |
| **Weeks 8–9** | Product CRUD: add, view, update and delete products, with validation |
| **Final** | Customer login, cart, checkout, My Orders and the admin area, as planned in our Capstone A presentation |

---

## Future improvements

- A real payment provider (e.g. Stripe or PayPal) instead of the simulated payment
- Real product photos uploaded by admins (the site currently uses category photos)
- Wishlist and product reviews (the database tables already exist)
- Order confirmation emails and password reset
- Login rate limiting and HTTPS when deployed
- Hosting the site online so it can be used outside localhost

---

## Licence

This project was developed for educational purposes as part of the Capstone Project assessment.

© 2026 Secure Retail Product Catalogue System
