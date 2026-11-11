// =====================================================================
// product.html?id=1 – one product, choose a variant, add to cart
// =====================================================================
(() => {
    const { api, money, el, productImage, addToCart } = Shop;
    const view = document.getElementById('productView');
    const id = new URLSearchParams(location.search).get('id');

    function variantLabel(v) {
        return [v.Colour, v.StorageOrSize].filter(Boolean).join(' · ') || v.SKU;
    }

    function render(p) {
        document.title = `${p.ProductName} – Secure Retail`;
        let selected = p.Variants.find((v) => v.QuantityOnHand > 0) || p.Variants[0];

        const price = el('div', { class: 'h3 text-primary my-3' });
        const stock = el('div', { class: 'mb-3' });
        const qty = el('input', { class: 'form-control qty-input', type: 'number', min: 1, value: 1, 'aria-label': 'Quantity' });
        const addButton = el('button', { class: 'btn btn-primary btn-lg', type: 'button' }, '🛒 Add to Cart');
        const options = el('div', { class: 'row g-2 mb-4' });

        function update() {
            options.querySelectorAll('.variant-option').forEach((b) =>
                b.classList.toggle('selected', Number(b.dataset.id) === selected?.VariantID));
            if (!selected) {
                price.textContent = 'Not available yet';
                addButton.disabled = true;
                return;
            }
            const onSale = selected.CurrentPrice < selected.Price;
            price.replaceChildren(money(selected.CurrentPrice), ' ',
                onSale ? el('small', { class: 'text-muted fs-5' }, el('del', { text: money(selected.Price) })) : '');

            const max = Math.min(selected.QuantityOnHand, selected.PurchaseLimit || Infinity);
            qty.max = max;
            if (Number(qty.value) > max) qty.value = Math.max(1, max);
            addButton.disabled = selected.QuantityOnHand === 0;

            const colour = selected.StockStatus === 'In stock' ? 'success'
                         : selected.StockStatus === 'Low stock' ? 'warning' : 'danger';
            stock.replaceChildren(
                el('span', { class: `badge bg-${colour}`, text: selected.StockStatus }),
                selected.StockStatus === 'Low stock' ? ` Only ${selected.QuantityOnHand} left` : '',
                selected.PurchaseLimit ? el('span', { class: 'ms-2 text-muted small', text: `Limit ${selected.PurchaseLimit} per customer` }) : '');
        }

        p.Variants.forEach((v) => {
            options.append(el('div', { class: 'col-sm-6' },
                el('button', {
                    type: 'button', class: 'variant-option', 'data-id': v.VariantID,
                    onclick: () => { selected = v; update(); }
                },
                el('div', { class: 'fw-semibold', text: variantLabel(v) }),
                el('div', { class: 'small text-muted', text: `${money(v.CurrentPrice)} · ${v.StockStatus}` }))));
        });

        addButton.addEventListener('click', () => {
            const quantity = Number(qty.value);
            if (!Number.isInteger(quantity) || quantity < 1) {
                qty.value = 1;
                return;
            }
            addToCart(selected.VariantID, quantity);
        });

        const specs = p.Specifications
            ? el('table', { class: 'table spec-table mt-4' },
                el('tbody', {}, Object.entries(p.Specifications).map(([k, v]) =>
                    el('tr', {}, el('th', { text: k.replace(/([a-z])([A-Z])/g, '$1 $2') }), el('td', { text: String(v) })))))
            : null;

        view.replaceChildren(el('div', { class: 'row g-5' },
            el('div', { class: 'col-lg-6' }, productImage(p, 'product-photo shadow')),
            el('div', { class: 'col-lg-6' },
                el('div', { class: 'text-muted text-uppercase small', text: `${p.BrandName} · ${p.CategoryName}` }),
                el('h1', { class: 'mt-2', text: p.ProductName }),
                el('p', { class: 'lead', text: p.Description }),
                price,
                stock,
                p.Variants.length ? el('h2', { class: 'h6', text: 'Choose an option' }) : null,
                options,
                el('div', { class: 'd-flex gap-3 align-items-center' }, qty, addButton),
                el('p', { class: 'small text-muted mt-3' },
                    el('i', { class: 'bi bi-shield-check' }), ` ${p.WarrantyMonths}-month warranty · Free delivery on orders of $1,000+`),
                specs)));
        update();
    }

    if (!id) {
        view.replaceChildren(el('div', { class: 'alert alert-warning', text: 'No product was chosen.' }));
        return;
    }
    api(`/api/products/${encodeURIComponent(id)}`)
        .then(render)
        .catch((err) => view.replaceChildren(el('div', { class: 'alert alert-danger', text: err.message })));
})();
