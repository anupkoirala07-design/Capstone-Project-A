// =====================================================================
// orders.html – the logged-in customer's orders
// =====================================================================
(async () => {
    const { api, money, el, showError, requireUser } = Shop;
    const view = document.getElementById('ordersView');
    const message = document.getElementById('ordersMessage');

    if (!(await requireUser())) return;

    const placed = new URLSearchParams(location.search).get('placed');
    const statusBadge = (s) => el('span', { class: `status status-${s.replace(' ', '-')}`, text: s });
    const date = (d) => new Date(d.replace(' ', 'T')).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

    function orderDetails(o) {
        const address = o.FulfilmentMethod === 'Delivery'
            ? [o.AddressLine1, o.AddressLine2, `${o.Suburb} ${o.State} ${o.Postcode}`].filter(Boolean).join(', ')
            : 'Click & Collect from our Sydney store';
        return el('div', { class: 'mt-3 border-top pt-3' },
            el('table', { class: 'table table-sm' },
                el('tbody', {}, o.Items.map((i) => el('tr', {},
                    el('td', { text: `${i.ProductName}${i.StorageOrSize ? ` (${i.StorageOrSize})` : ''}${i.Colour ? ` – ${i.Colour}` : ''}` }),
                    el('td', { class: 'text-muted', text: `${i.Quantity} × ${money(i.UnitPrice)}` }),
                    el('td', { class: 'text-end', text: money(i.LineTotal) }))))),
            el('div', { class: 'row small' },
                el('div', { class: 'col-md-6' },
                    el('div', {}, el('strong', { text: 'Delivery: ' }), address),
                    o.EstimatedDeliveryDate ? el('div', {}, el('strong', { text: 'Estimated arrival: ' }), date(o.EstimatedDeliveryDate)) : null,
                    o.TrackingNumber ? el('div', {}, el('strong', { text: 'Tracking number: ' }), o.TrackingNumber) : null,
                    o.Payments.map((p) => el('div', {}, el('strong', { text: 'Payment: ' }),
                        `${p.PaymentMethod} – ${p.PaymentStatus} (ref ${p.GatewayReference || 'n/a'})`))),
                el('div', { class: 'col-md-6 text-md-end' },
                    el('div', { text: `Subtotal ${money(o.Subtotal)}` }),
                    el('div', { text: `Delivery ${o.DeliveryCost ? money(o.DeliveryCost) : 'Free'}` }),
                    el('div', { class: 'fw-bold fs-5', text: `Total ${money(o.TotalAmount)}` }))));
    }

    function orderCard(o) {
        const details = el('div');
        const toggle = el('button', { class: 'btn btn-sm btn-outline-primary', type: 'button', text: 'View details' });
        toggle.addEventListener('click', async () => {
            if (details.childElementCount) {
                details.replaceChildren();
                toggle.textContent = 'View details';
                return;
            }
            try {
                details.replaceChildren(orderDetails(await api(`/api/orders/${o.OrderID}`)));
                toggle.textContent = 'Hide details';
            } catch (err) {
                showError(details, err);
            }
        });
        if (String(o.OrderID) === placed) setTimeout(() => toggle.click(), 0);

        return el('div', { class: 'panel mb-3' },
            el('div', { class: 'd-flex flex-wrap justify-content-between align-items-center gap-2' },
                el('div', {},
                    el('div', { class: 'fw-bold', text: o.OrderNumber }),
                    el('div', { class: 'small text-muted', text: `${date(o.CreatedAt)} · ${o.ItemCount} item${o.ItemCount === 1 ? '' : 's'} · ${o.FulfilmentMethod === 'Delivery' ? 'Delivery' : 'Click & Collect'}` })),
                el('div', { class: 'd-flex align-items-center gap-3' },
                    statusBadge(o.OrderStatus),
                    el('span', { class: 'fw-bold', text: money(o.TotalAmount) }),
                    toggle)),
            details);
    }

    try {
        const orders = await api('/api/orders');
        if (placed) {
            const o = orders.find((x) => String(x.OrderID) === placed);
            if (o) {
                message.replaceChildren(el('div', { class: 'alert alert-success' },
                    el('i', { class: 'bi bi-check-circle-fill' }),
                    ` Thank you! Order ${o.OrderNumber} has been placed and paid.`));
            }
        }
        view.replaceChildren(...(orders.length ? orders.map(orderCard)
            : [el('div', { class: 'panel text-center' },
                el('p', { text: 'You have not placed any orders yet.' }),
                el('a', { href: 'index.html#products', class: 'btn btn-primary', text: 'Start shopping' }))]));
    } catch (err) {
        showError(view, err);
    }
})();
