// =====================================================================
// checkout.html – choose delivery, address and payment, then place the order
// The browser only sends the choices. The server works out the prices
// and totals itself (BR-24) and takes a simulated payment.
// =====================================================================
(async () => {
    const { api, money, el, showError, requireUser, setCartCount } = Shop;
    const $ = (id) => document.getElementById(id);
    const message = $('checkoutMessage');

    if (!(await requireUser())) return;

    let cart;
    let addresses = [];
    const FREE_FROM = 1000;
    const FEE = 9.95;

    const method = () => document.querySelector('input[name="fulfilment"]:checked').value;
    const payment = () => document.querySelector('input[name="payment"]:checked').value;
    const chosenAddress = () => document.querySelector('input[name="address"]:checked')?.value;

    // Order summary on the right (an estimate – the server has the final say)
    function renderSummary() {
        $('summaryItems').replaceChildren(...cart.items.map((i) =>
            el('div', { class: 'summary-row small' },
                el('span', { text: `${i.Quantity} × ${i.ProductName}${i.StorageOrSize ? ` (${i.StorageOrSize})` : ''}` }),
                el('span', { text: money(i.LineTotal) }))));
        const delivery = method() === 'ClickAndCollect' || cart.subtotal >= FREE_FROM ? 0 : FEE;
        $('sumSubtotal').textContent = money(cart.subtotal);
        $('sumDelivery').textContent = delivery ? money(delivery) : 'Free';
        $('sumTotal').textContent = money(cart.subtotal + delivery);

        const isDelivery = method() === 'Delivery';
        $('addressPanel').classList.toggle('d-none', !isDelivery);
        $('paymentStep').textContent = isDelivery ? '3' : '2';
    }

    function renderAddresses(selectId) {
        const list = $('addressList');
        if (!addresses.length) {
            list.replaceChildren(el('p', { class: 'text-muted', text: 'You have no saved addresses yet. Add one below.' }));
            $('addressForm').classList.remove('d-none');
            return;
        }
        const pick = selectId || addresses.find((a) => a.IsDefault)?.AddressID || addresses[0].AddressID;
        list.replaceChildren(...addresses.map((a) => el('label', { class: 'choice' },
            el('input', { type: 'radio', name: 'address', value: a.AddressID, checked: a.AddressID === pick }),
            [a.AddressLine1, a.AddressLine2, `${a.Suburb} ${a.State} ${a.Postcode}`].filter(Boolean).join(', '),
            a.IsDefault ? el('span', { class: 'badge bg-light text-dark ms-2', text: 'Default' }) : null)));
    }

    $('showAddressForm').addEventListener('click', () => $('addressForm').classList.toggle('d-none'));

    $('addressForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
            const result = await api('/api/addresses', {
                method: 'POST',
                body: {
                    AddressLine1: $('addr1').value, AddressLine2: $('addr2').value,
                    Suburb: $('suburb').value, State: $('state').value, Postcode: $('postcode').value.trim()
                }
            });
            addresses = await api('/api/addresses');
            renderAddresses(result.address.AddressID);
            $('addressForm').reset();
            $('addressForm').classList.add('d-none');
            $('addressMessage').replaceChildren();
        } catch (err) {
            showError($('addressMessage'), err);
        }
    });

    document.querySelectorAll('input[name="fulfilment"]').forEach((r) => r.addEventListener('change', renderSummary));

    $('placeOrder').addEventListener('click', async () => {
        message.replaceChildren();
        const body = { FulfilmentMethod: method(), PaymentMethod: payment() };
        if (body.FulfilmentMethod === 'Delivery') {
            if (!chosenAddress()) {
                showError(message, new Error('Please choose or add a delivery address'));
                return;
            }
            body.AddressID = Number(chosenAddress());
        }

        $('placeOrder').disabled = true;
        $('placeOrder').textContent = 'Processing payment…';
        try {
            const result = await api('/api/checkout', { method: 'POST', body });
            setCartCount(0);
            location.href = `orders.html?placed=${result.order.OrderID}`;
        } catch (err) {
            showError(message, err);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            $('placeOrder').disabled = false;
            $('placeOrder').textContent = 'Place order and pay';
        }
    });

    try {
        [cart, addresses] = await Promise.all([api('/api/cart'), api('/api/addresses')]);
        if (!cart.items.length) {
            location.href = 'cart.html';
            return;
        }
        if (!cart.canCheckout) {
            showError(message, new Error('Some items in your cart need attention. Please go back to your cart.'));
            $('placeOrder').disabled = true;
        }
        renderAddresses();
        renderSummary();
    } catch (err) {
        showError(message, err);
    }
})();
