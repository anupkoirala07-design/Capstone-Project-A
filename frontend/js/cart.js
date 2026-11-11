// =====================================================================
// cart.html – view the cart, change quantities, remove items
// =====================================================================
(async () => {
    const { api, money, el, productImage, setCartCount, showError, requireUser } = Shop;
    const view = document.getElementById('cartView');
    const message = document.getElementById('cartMessage');

    if (!(await requireUser())) return;

    function render(cart) {
        setCartCount(cart.itemCount);
        message.replaceChildren();

        if (!cart.items.length) {
            view.replaceChildren(el('div', { class: 'panel text-center' },
                el('i', { class: 'bi bi-cart-x display-4 text-muted' }),
                el('p', { class: 'mt-3', text: 'Your cart is empty.' }),
                el('a', { href: 'index.html#products', class: 'btn btn-primary', text: 'Browse products' })));
            return;
        }

        const rows = cart.items.map((item) => {
            const qty = el('input', {
                class: 'form-control qty-input', type: 'number', min: 1, value: item.Quantity,
                max: Math.max(1, item.MaxQuantity), 'aria-label': `Quantity of ${item.ProductName}`
            });
            qty.addEventListener('change', () => changeQuantity(item, qty));

            return el('tr', {},
                el('td', {}, el('div', { class: 'd-flex gap-3 align-items-center' },
                    productImage(item, 'cart-thumb'),
                    el('div', {},
                        el('a', { href: `product.html?id=${item.ProductID}`, class: 'fw-semibold text-reset', text: item.ProductName }),
                        el('div', { class: 'small text-muted', text: [item.Colour, item.StorageOrSize].filter(Boolean).join(' · ') }),
                        item.Problem ? el('div', { class: 'small text-danger fw-semibold', text: item.Problem }) : null))),
                el('td', {}, money(item.UnitPrice),
                    item.UnitPrice < item.Price ? el('div', { class: 'small text-muted' }, el('del', { text: money(item.Price) })) : null),
                el('td', {}, qty),
                el('td', { class: 'fw-semibold', text: money(item.LineTotal) }),
                el('td', { class: 'text-end' }, el('button', {
                    class: 'btn btn-sm btn-outline-danger', type: 'button', 'aria-label': `Remove ${item.ProductName}`,
                    onclick: () => removeItem(item)
                }, el('i', { class: 'bi bi-trash' }))));
        });

        const delivery = cart.deliveryCost === 0 ? 'Free' : money(cart.deliveryCost);
        const total = cart.subtotal + cart.deliveryCost;

        view.replaceChildren(el('div', { class: 'row g-4' },
            el('div', { class: 'col-lg-8' }, el('div', { class: 'panel table-responsive' },
                el('table', { class: 'table mb-0' },
                    el('thead', {}, el('tr', {}, ['Product', 'Price', 'Qty', 'Total', ''].map((h) => el('th', { text: h })))),
                    el('tbody', {}, rows)))),
            el('div', { class: 'col-lg-4' }, el('div', { class: 'panel' },
                el('h2', { class: 'h5 mb-3', text: 'Summary' }),
                el('div', { class: 'summary-row' }, el('span', { text: `Items (${cart.itemCount})` }), el('span', { text: money(cart.subtotal) })),
                el('div', { class: 'summary-row' }, el('span', { text: 'Delivery' }), el('span', { text: delivery })),
                el('div', { class: 'summary-row summary-total' }, el('span', { text: 'Estimated total' }), el('span', { text: money(total) })),
                el('p', { class: 'small text-muted', text: `Free delivery on orders of ${money(cart.freeDeliveryFrom)} or more. Click & Collect is always free.` }),
                el('a', {
                    href: cart.canCheckout ? 'checkout.html' : null,
                    class: `btn btn-primary w-100 ${cart.canCheckout ? '' : 'disabled'}`,
                    'aria-disabled': cart.canCheckout ? null : 'true',
                    text: 'Go to checkout'
                }),
                cart.canCheckout ? null : el('p', { class: 'small text-danger mt-2', text: 'Please fix the items marked in red first.' })))));
    }

    async function changeQuantity(item, input) {
        const quantity = Number(input.value);
        if (!Number.isInteger(quantity) || quantity < 1) {
            input.value = item.Quantity;
            return;
        }
        try {
            const result = await api(`/api/cart/items/${item.CartItemID}`, { method: 'PUT', body: { Quantity: quantity } });
            render(result.cart);
        } catch (err) {
            input.value = item.Quantity;
            showError(message, err);
        }
    }

    async function removeItem(item) {
        try {
            const result = await api(`/api/cart/items/${item.CartItemID}`, { method: 'DELETE' });
            render(result.cart);
        } catch (err) {
            showError(message, err);
        }
    }

    try {
        render(await api('/api/cart'));
    } catch (err) {
        showError(view, err);
    }
})();
