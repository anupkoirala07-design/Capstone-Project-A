// =====================================================================
// Secure Retail – shared code used by every page
//   - talking to the backend API (fetch)
//   - who is logged in + the cart count in the navbar
//   - small helpers: money format, building HTML safely, messages
// =====================================================================

const Shop = (() => {
    const state = { user: null, cartCount: 0 };

    // Calls our backend. Sends/receives JSON and turns error responses
    // into a JavaScript Error with the server's message.
    async function api(url, options = {}) {
        const opts = { credentials: 'same-origin', ...options, headers: { ...(options.headers || {}) } };
        if (opts.body !== undefined && typeof opts.body !== 'string') {
            opts.headers['Content-Type'] = 'application/json';
            opts.body = JSON.stringify(opts.body);
        }

        let response;
        try {
            response = await fetch(url, opts);
        } catch {
            throw new Error('Could not reach the server. Is it running? (node server.js)');
        }

        let data = null;
        try { data = await response.json(); } catch { /* no JSON body */ }

        if (!response.ok) {
            const error = new Error((data && data.error) || `Request failed (${response.status})`);
            error.status = response.status;
            error.details = (data && data.details) || [];
            throw error;
        }
        return data;
    }

    // $1,234.50 in Australian dollars
    const money = (n) => Number(n || 0).toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });

    // Builds an element. Text is always added with textContent, so anything
    // typed by a user (names, messages) can never run as HTML (stops XSS).
    function el(tag, attrs = {}, ...children) {
        const node = document.createElement(tag);
        for (const [key, value] of Object.entries(attrs)) {
            if (value === null || value === undefined || value === false) continue;
            if (key === 'class') node.className = value;
            else if (key === 'text') node.textContent = value;
            else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
            else node.setAttribute(key, value === true ? '' : value);
        }
        for (const child of children.flat()) {
            if (child === null || child === undefined || child === false) continue;
            node.append(child instanceof Node ? child : document.createTextNode(String(child)));
        }
        return node;
    }

    // Product photos: uses the image saved in PRODUCT_IMAGES if the file exists,
    // otherwise a stock photo for the product's category
    const CATEGORY_IMAGES = {
        1: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80',
        2: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80',
        3: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=700&q=80',
        4: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80',
        5: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80'
    };
    const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=700&q=80';

    function productImage(product, className = '') {
        const fallback = CATEGORY_IMAGES[product.CategoryID] || DEFAULT_IMAGE;
        const img = el('img', {
            class: className,
            alt: product.ImageAlt || product.ProductName,
            src: product.ImageURL || fallback,
            loading: 'lazy'
        });
        img.addEventListener('error', () => { if (img.src !== fallback) img.src = fallback; }, { once: true });
        return img;
    }

    // A message that pops up in the corner for a few seconds
    function toast(message, type = 'success') {
        let holder = document.getElementById('toastHolder');
        if (!holder) {
            holder = el('div', { id: 'toastHolder', class: 'sr-toasts', 'aria-live': 'polite' });
            document.body.append(holder);
        }
        const box = el('div', { class: `alert alert-${type} shadow-sm mb-2`, role: 'status', text: message });
        holder.append(box);
        setTimeout(() => box.remove(), 4000);
    }

    // Shows an error (and the server's list of validation problems) inside a box
    function showError(box, error) {
        box.replaceChildren(el('div', { class: 'alert alert-danger' },
            el('div', { text: error.message }),
            error.details && error.details.length
                ? el('ul', { class: 'mb-0 mt-2' }, error.details.map((d) => el('li', { text: d })))
                : null));
    }

    // ---------- Login state and navbar ----------
    async function loadSession() {
        try {
            const me = await api('/api/auth/me');
            state.user = me.user;
            state.cartCount = me.cartCount;
        } catch {
            state.user = null;
            state.cartCount = 0;
        }
        renderNav();
        return state;
    }

    function setCartCount(count) {
        state.cartCount = count;
        const badge = document.getElementById('cartCount');
        if (badge) {
            badge.textContent = count;
            badge.classList.toggle('d-none', !count);
        }
    }

    function renderNav() {
        const holder = document.getElementById('navAccount');
        if (!holder) return;

        const cart = el('a', { href: 'cart.html', class: 'btn btn-outline-light position-relative' },
            el('i', { class: 'bi bi-cart3' }), ' Cart ',
            el('span', { id: 'cartCount', class: 'badge rounded-pill bg-warning text-dark', text: state.cartCount }));

        const items = [];
        if (state.user) {
            if (state.user.Role === 'Admin') {
                items.push(el('a', { href: 'admin.html', class: 'btn btn-warning' }, el('i', { class: 'bi bi-speedometer2' }), ' Admin'));
            }
            items.push(el('a', { href: 'orders.html', class: 'btn btn-outline-light', title: 'My orders' },
                el('i', { class: 'bi bi-person-circle' }), ` ${state.user.FirstName}`));
            items.push(cart);
            items.push(el('button', { type: 'button', class: 'btn btn-link nav-link px-2', onclick: logout, text: 'Log out' }));
        } else {
            items.push(cart);
            items.push(el('a', { href: `login.html?next=${encodeURIComponent(currentPage())}`, class: 'btn btn-primary' },
                el('i', { class: 'bi bi-box-arrow-in-right' }), ' Log in'));
        }
        holder.replaceChildren(...items);
        setCartCount(state.cartCount);
    }

    const currentPage = () => location.pathname.split('/').pop() + location.search;

    async function logout() {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
        location.href = 'index.html';
    }

    // Sends people who are not logged in (or not admins) to the login page
    async function requireUser({ admin = false } = {}) {
        await loadSession();
        if (!state.user) {
            location.href = `login.html?next=${encodeURIComponent(currentPage())}`;
            return null;
        }
        if (admin && state.user.Role !== 'Admin') {
            location.href = 'index.html';
            return null;
        }
        return state.user;
    }

    // ---------- Cart ----------
    async function addToCart(variantId, quantity = 1) {
        if (!state.user) {
            location.href = `login.html?next=${encodeURIComponent(currentPage())}`;
            return;
        }
        try {
            const result = await api('/api/cart/items', { method: 'POST', body: { VariantID: variantId, Quantity: quantity } });
            setCartCount(result.cart.itemCount);
            toast('Added to your cart');
        } catch (err) {
            toast(err.message, 'danger');
        }
    }

    // The search box in the navbar: shows matching products on the home page
    function wireSearch() {
        const form = document.querySelector('nav form');
        if (!form) return;
        const input = form.querySelector('input');
        const params = new URLSearchParams(location.search);
        if (input && params.get('search')) input.value = params.get('search');

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const term = input ? input.value.trim() : '';
            if (typeof window.searchProducts === 'function') {
                window.searchProducts(term);
            } else {
                location.href = `index.html${term ? `?search=${encodeURIComponent(term)}` : ''}#products`;
            }
        });
    }

    // Only allows "next=" links that stay on our own site
    function safeNext(fallback) {
        const next = new URLSearchParams(location.search).get('next');
        return next && /^[A-Za-z0-9_-]+\.html([?#].*)?$/.test(next) ? next : fallback;
    }

    document.addEventListener('DOMContentLoaded', () => {
        wireSearch();
        if (!document.body.dataset.noSession) loadSession();
    });

    return { state, api, money, el, productImage, toast, showError, loadSession, requireUser,
             addToCart, setCartCount, safeNext, logout };
})();
