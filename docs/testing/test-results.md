# Test Results – Login, Cart, Checkout and Admin

**Project:** Secure Retail – Product Catalogue System
**Tested by:** ______________________
**Date tested:** 11 / 11 / 2026
**Browser:** Google Chrome on Windows 11
**How the site was run:** `node server.js` in the `backend` folder, opened at http://localhost:3000/index.html. The database was reset to the clean GitHub copy (`git checkout -- database/project.db`) and the demo passwords were set (`node set-demo-passwords.js`) before testing.

**Demo accounts used:**

- Admin: anika.sharma@secureretail.com.au / Admin@2026
- Customer: olivia.brown@example.com / Customer@2026
- Deactivated customer: ethan.khan@example.com / Customer@2026

---

## Summary

| Total tests | Passed | Failed |
|---|---|---|
| 13 | 13 | 0 |

---

## Customer tests

| # | Test | Steps | Expected result | Actual result | Pass / Fail | Screenshot |
|---|---|---|---|---|---|---|
| 1 | Guest must log in to use the cart | Logged out, click **Add to Cart** on Dell XPS 13 | Taken to the Log in page | Redirected to `login.html?next=index.html` | Pass | [T01](Screenshots/T01-guest-redirect-login.png) |
| 2 | Wrong password | Log in as olivia.brown@example.com with password `wrong123` | Message "Email or password is incorrect" | "Email or password is incorrect" shown, password box cleared | Pass | [T02](Screenshots/T02-wrong-password.png) |
| 3 | Deactivated account (BR-04) | Log in as ethan.khan@example.com / Customer@2026 | Message "This account has been deactivated" | "This account has been deactivated" shown, not logged in | Pass | [T03](Screenshots/T03-deactivated-account.png) |
| 4 | Password rules | Create an account with password `short` | Message about the password rules | "Validation failed – Password must be at least 8 characters", no account created | Pass | [T04](Screenshots/T04-password-rules.png) |
| 5 | Purchase limit (BR-31) | Log in as Olivia, open Apple iPhone 18 Pro Max, set quantity to 3, click **Add to Cart** | Message "Limit 2 per customer" | "Limit 2 per customer for Apple iPhone 18 Pro Max" shown, nothing added to the cart | Pass | [T05](Screenshots/T05-purchase-limit.png) |
| 6 | Out of stock (BR-17) | Find Samsung Galaxy Watch8 on the home page | Shows "OUT OF STOCK" and the button is disabled | "OUT OF STOCK" badge and a disabled "Out of stock" button | Pass | [T06](Screenshots/T06-out-of-stock.png) |
| 7 | Delivery checkout under $1,000 | Empty the cart, add one Apple Watch Series 11 ($699), check out with **Delivery** and a saved address, payment **Card** | Delivery $9.95, total $708.95, order shows as **Paid**, cart is empty | Summary showed $699.00 + $9.95 delivery = $708.95. Order SR-20261111-1011 placed as **Paid** (Card, Successful), cart emptied | Pass | [T07a](Screenshots/T07a-checkout-delivery.png) [T07b](Screenshots/T07b-order-paid.png) |
| 8 | Click & Collect checkout (BR-25) | Add Dell XPS 13, check out with **Click & Collect**, payment **PayPal** | No address needed, delivery Free, order placed | Order SR-20261111-1012 placed: Click & Collect from Sydney store, delivery Free, PayPal Successful, total $2,499.00 | Pass | [T08](Screenshots/T08-click-and-collect.png) |

## Admin tests

| # | Test | Steps | Expected result | Actual result | Pass / Fail | Screenshot |
|---|---|---|---|---|---|---|
| 9 | Customer can't open admin (BR-03) | Logged in as Olivia, go to http://localhost:3000/admin.html | Sent back to the home page | Redirected to `index.html`; the admin page was not shown | Pass | [T09](Screenshots/T09-customer-blocked-admin.png) |
| 10 | Tracking number required (BR-27) | As admin, **Manage** the Paid order SR-20261111-1011, click **Mark as shipped** with the tracking box empty | Error asking for a tracking number | "A tracking number (3–50 letters, numbers or hyphens) is required to mark an order as Shipped"; status stayed Paid | Pass | [T10](Screenshots/T10-tracking-required.png) |
| 11 | Cancel a paid order (BR-15, BR-26) | As admin, **Cancel order** on SR-20261111-1011 | Status Cancelled, payment Refunded, stock goes back up | Status **Cancelled**, payment "Card $708.95 – Refunded", "no further changes allowed". Apple Watch (APL-AWS11-42-BLK) stock went back to 30 and revenue dropped by $708.95 | Pass | [T11](Screenshots/T11-cancel-refund.png) |
| 12 | Add product + variant, low-stock alert (BR-16) | As admin, add "Test Phone", then add variant TEST-PHONE-1 with price $499, stock 3, alert level 5 | Product appears in the shop and in **Low stock** | "Test Phone" shown in the shop at $499.00 with Add to Cart; TEST-PHONE-1 listed in Low stock with 3 in stock (alert at 5) | Pass | [T12a](Screenshots/T12a-new-product-shop.png) [T12b](Screenshots/T12b-low-stock.png) |
| 13 | Contact form saved (BR-36) | Logged out, send a message from the Contact page, then log in as admin → **Enquiries** | Success message, and the enquiry shows as **New** | "Thanks! Your message has been sent…" shown; the enquiry appeared at the top of Admin → Enquiries with status **New** | Pass | [T13a](Screenshots/T13a-contact-sent.png) [T13b](Screenshots/T13b-enquiry-admin.png) |

---

## Bugs found

| # | Page | What happened | Steps to repeat | Fixed? |
|---|---|---|---|---|
| 1 | All shop pages (navbar) | On medium-width screens (992–1399px, e.g. a 1024px laptop window) the navbar was too wide, so the **Cart** and **Log in** buttons were pushed off the right edge of the screen | Open index.html in a browser window about 1024px wide | Yes – `frontend/shop.css` now makes the navbar items smaller on desktop screens and hides the search box between 992px and 1199px. Retested before the tests above |

---

## Notes

- Tests were run in the order above, because some depend on earlier ones (Test 11 cancels the order placed in Test 7).
- Payment is simulated, so no real card or PayPal details were used (BR-30).
- After testing, the database should be reset with `git checkout -- database/project.db` and `node set-demo-passwords.js`, so test orders are not committed.
