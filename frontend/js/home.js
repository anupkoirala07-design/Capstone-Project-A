// =====================================================================
// index.html – product grid loaded from the database (/api/products)
// =====================================================================
(() => {
    const { api, money, el, productImage, addToCart, toast } = Shop;
    const grid = document.getElementById('productGrid');
    const pills = document.getElementById('categoryPills');
    const heading = document.getElementById('productsHeading');
    if (!grid) return;

    let categoryId = null;
    let search = new URLSearchParams(location.search).get('search') || '';

    // A product card, in the same style as the Capstone A design
    function productCard(p) {
        const onSale = p.PriceFrom < p.RegularPriceFrom;
        const soldOut = !p.TotalStock;
        const badge = soldOut ? el('span', { class: 'badge bg-secondary position-absolute m-3', text: 'OUT OF STOCK' })
                    : onSale ? el('span', { class: 'badge bg-danger position-absolute m-3', text: 'SALE' })
                    : p.IsFeatured ? el('span', { class: 'badge bg-warning text-dark position-absolute m-3', text: 'FEATURED' })
                    : null;
        const link = `product.html?id=${p.ProductID}`;

        return el('div', { class: 'col-lg-3 col-md-6' },
            el('div', { class: 'card product-card h-100' },
                badge,
                productImage(p, 'card-img-top'),
                el('div', { class: 'overlay' },
                    el('a', { class: 'btn btn-light', href: link, text: 'Quick View' })),
                el('div', { class: 'card-body d-flex flex-column' },
                    el('div', { class: 'brand', text: `${p.BrandName} · ${p.CategoryName}` }),
                    el('h5', { class: 'fw-bold' }, el('a', { href: link, class: 'text-reset', text: p.ProductName })),
                    el('p', { text: p.Description }),
                    el('h4', { class: 'text-primary mt-auto' },
                        p.PriceFrom ? `${p.VariantCount > 1 ? 'From ' : ''}${money(p.PriceFrom)} ` : 'Coming soon',
                        onSale ? el('small', { class: 'text-muted' }, el('del', { text: money(p.RegularPriceFrom) })) : null),
                    el('div', { class: 'd-grid gap-2' },
                        el('button', {
                            class: 'btn btn-primary', type: 'button', disabled: soldOut || !p.VariantCount,
                            onclick: () => quickAdd(p),
                            text: soldOut ? 'Out of stock' : (p.VariantCount > 1 ? 'Choose options' : '🛒 Add to Cart')
                        }),
                        el('a', { class: 'btn btn-outline-secondary', href: link, text: 'View details' })))));
    }

    // One version → add it straight away. Several versions → let the customer choose.
    async function quickAdd(p) {
        if (p.VariantCount > 1) {
            location.href = `product.html?id=${p.ProductID}`;
            return;
        }
        try {
            const product = await api(`/api/products/${p.ProductID}`);
            const variant = product.Variants.find((v) => v.QuantityOnHand > 0);
            if (variant) addToCart(variant.VariantID, 1);
            else toast('Sorry, this product is out of stock', 'warning');
        } catch (err) {
            toast(err.message, 'danger');
        }
    }

    async function loadProducts() {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (categoryId) params.set('category', categoryId);

        heading.textContent = search ? `Results for "${search}"` : 'Our Products';
        try {
            const products = await api(`/api/products?${params}`);
            grid.replaceChildren(...products.map(productCard));
            if (!products.length) {
                grid.replaceChildren(el('p', { class: 'text-center text-muted', text: 'No products match your search.' }));
            }
        } catch (err) {
            grid.replaceChildren(el('div', { class: 'alert alert-danger', text: err.message }));
        }
    }

    // Category filter buttons
    async function loadCategories() {
        const categories = await api('/api/categories').catch(() => []);
        const button = (label, id) => el('button', {
            type: 'button',
            class: `btn btn-sm ${categoryId === id ? 'btn-primary' : 'btn-outline-secondary'}`,
            text: label,
            onclick: () => { categoryId = id; loadCategories(); loadProducts(); }
        });
        pills.replaceChildren(button('All', null), ...categories.map((c) => button(c.CategoryName, c.CategoryID)));

        // The "Shop by Category" boxes higher up the page also filter the grid
        document.querySelectorAll('.icon-box').forEach((box) => {
            const name = box.querySelector('h4')?.textContent.trim();
            const match = categories.find((c) => c.CategoryName === name);
            if (!match || box.dataset.wired) return;
            box.dataset.wired = '1';
            box.style.cursor = 'pointer';
            box.addEventListener('click', () => {
                categoryId = match.CategoryID;
                loadCategories();
                loadProducts();
                document.getElementById('products').scrollIntoView();
            });
        });
    }

    // Used by the navbar search box (see shop.js)
    window.searchProducts = (term) => {
        search = term;
        loadProducts();
        document.getElementById('products').scrollIntoView();
    };

    loadCategories();
    loadProducts();
})();
