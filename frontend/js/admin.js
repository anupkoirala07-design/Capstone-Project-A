// =====================================================================
// admin.html – admin area (admins only)
//   Products: add / edit / delete (Week 8–9 CRUD) + variants with price and stock
//   Orders:   view orders, mark Shipped / Delivered, cancel
//   Enquiries from the Contact page, and low-stock alerts
// Every request is checked again by the server, so hiding this page is
// not the only protection – a customer calling the API directly gets 403.
// =====================================================================
(async () => {
    const { api, money, el, toast, showError, requireUser, logout } = Shop;
    const $ = (id) => document.getElementById(id);

    const user = await requireUser({ admin: true });
    if (!user) return;
    $('adminName').textContent = `Logged in as ${user.FirstName} (Admin)`;
    $('logoutButton').addEventListener('click', logout);

    const message = $('message');
    const clearMessage = () => message.replaceChildren();
    const fail = (err) => { showError(message, err); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const statusBadge = (s) => el('span', { class: `status status-${s.replace(' ', '-')}`, text: s });
    const date = (d) => new Date(d.replace(' ', 'T')).toLocaleDateString('en-AU',
        { day: 'numeric', month: 'short', year: 'numeric' });
    const numberOrNull = (v) => (v === '' ? null : Number(v));

    // ---------------------------------------------------------------
    // Tabs
    // ---------------------------------------------------------------
    const loaders = { products: loadProducts, orders: loadOrders, enquiries: loadEnquiries, stock: loadLowStock };
    function openTab(name) {
        document.querySelectorAll('[data-tab]').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
        document.querySelectorAll('.admin-tab').forEach((s) => s.classList.toggle('d-none', s.id !== `tab-${name}`));
        clearMessage();
        loaders[name]();
    }
    document.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => openTab(b.dataset.tab)));

    // ---------------------------------------------------------------
    // Dashboard tiles
    // ---------------------------------------------------------------
    async function loadSummary() {
        try {
            const s = await api('/api/admin/summary');
            const tile = (label, value, icon, tab) => el('div', { class: 'col-6 col-md-4 col-xl-2' },
                el('div', { class: 'stat-tile', role: tab ? 'button' : null, onclick: tab ? () => openTab(tab) : null },
                    el('div', { class: 'label' }, el('i', { class: `bi ${icon}` }), ` ${label}`),
                    el('div', { class: 'value', text: value })));
            $('summaryTiles').replaceChildren(
                tile('Products', s.Products, 'bi-box-seam', 'products'),
                tile('Orders', s.Orders, 'bi-receipt', 'orders'),
                tile('To ship', s.OrdersToShip, 'bi-truck', 'orders'),
                tile('Revenue', money(s.Revenue), 'bi-cash-coin'),
                tile('New enquiries', s.NewEnquiries, 'bi-envelope', 'enquiries'),
                tile('Low stock', s.LowStock, 'bi-exclamation-triangle', 'stock'));
        } catch (err) {
            fail(err);
        }
    }

    // ---------------------------------------------------------------
    // PRODUCTS (Week 8–9 CRUD)
    // ---------------------------------------------------------------
    async function loadOptions() {
        const [categories, brands] = await Promise.all([api('/api/categories'), api('/api/brands')]);
        $('categoryId').replaceChildren(new Option('Choose…', ''), ...categories.map((c) => new Option(c.CategoryName, c.CategoryID)));
        $('brandId').replaceChildren(new Option('Choose…', ''), ...brands.map((b) => new Option(b.BrandName, b.BrandID)));
    }

    async function loadProducts() {
        try {
            const search = $('search').value.trim();
            const products = await api(search ? `/api/products?search=${encodeURIComponent(search)}` : '/api/products');
            $('productRows').replaceChildren(...products.map((p) => el('tr', {},
                el('td', { text: p.ProductID }),
                el('td', { text: p.ProductName }),
                el('td', { text: p.CategoryName }),
                el('td', { text: p.BrandName }),
                el('td', { text: p.PriceFrom ? money(p.PriceFrom) : '–' }),
                el('td', {}, p.VariantCount ? String(p.TotalStock ?? 0)
                    : el('span', { class: 'badge bg-warning text-dark', text: 'No variants' })),
                el('td', { class: 'text-end text-nowrap' },
                    el('button', { class: 'btn btn-sm btn-outline-success me-1', type: 'button', text: 'Prices & stock', onclick: () => openVariants(p.ProductID) }),
                    el('button', { class: 'btn btn-sm btn-outline-primary me-1', type: 'button', text: 'Edit', onclick: () => startEdit(p.ProductID) }),
                    el('button', { class: 'btn btn-sm btn-outline-danger', type: 'button', text: 'Delete', onclick: () => deleteProduct(p) })))));
            if (!products.length) {
                $('productRows').replaceChildren(el('tr', {}, el('td', { colspan: 7, class: 'text-muted', text: 'No products found.' })));
            }
        } catch (err) {
            fail(err);
        }
    }

    async function startEdit(id) {
        try {
            const p = await api(`/api/products/${id}`);
            $('productId').value = p.ProductID;
            $('productName').value = p.ProductName;
            $('description').value = p.Description;
            $('categoryId').value = p.CategoryID;
            $('brandId').value = p.BrandID;
            $('warrantyMonths').value = p.WarrantyMonths;
            $('isFeatured').checked = p.IsFeatured;
            $('formTitle').textContent = `Edit product #${p.ProductID}`;
            $('saveButton').textContent = 'Save changes';
            $('cancelButton').classList.remove('d-none');
            $('productForm').scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            fail(err);
        }
    }

    function resetProductForm() {
        $('productForm').reset();
        $('productId').value = '';
        $('formTitle').textContent = 'Add a product';
        $('saveButton').textContent = 'Add product';
        $('cancelButton').classList.add('d-none');
    }

    $('productForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();
        const id = $('productId').value;
        const product = {
            ProductName: $('productName').value,
            Description: $('description').value,
            CategoryID: $('categoryId').value ? Number($('categoryId').value) : null,
            BrandID: $('brandId').value ? Number($('brandId').value) : null,
            WarrantyMonths: numberOrNull($('warrantyMonths').value),
            IsFeatured: $('isFeatured').checked
        };
        try {
            const result = await api(id ? `/api/products/${id}` : '/api/products', { method: id ? 'PUT' : 'POST', body: product });
            toast(result.message);
            resetProductForm();
            await loadProducts();
            loadSummary();
            if (!id) openVariants(result.product.ProductID);   // new product → add its first variant
        } catch (err) {
            fail(err);
        }
    });

    async function deleteProduct(p) {
        if (!confirm(`Remove "${p.ProductName}"?`)) return;
        clearMessage();
        try {
            const result = await api(`/api/products/${p.ProductID}`, { method: 'DELETE' });
            toast(result.message);
            if (Number($('variantPanel').dataset.productId) === p.ProductID) $('variantPanel').classList.add('d-none');
            loadProducts();
            loadSummary();
        } catch (err) {
            fail(err);
        }
    }

    $('cancelButton').addEventListener('click', resetProductForm);
    $('search').addEventListener('input', loadProducts);

    // ---------------------------------------------------------------
    // VARIANTS – price, promotion, purchase limit and stock
    // ---------------------------------------------------------------
    let currentVariants = [];

    async function openVariants(productId) {
        try {
            const product = await api(`/api/admin/products/${productId}/variants`);
            currentVariants = product.Variants;
            $('variantPanel').dataset.productId = productId;
            $('variantTitle').textContent = `Prices & stock – ${product.ProductName}`;
            $('variantRows').replaceChildren(...product.Variants.map((v) => el('tr', {},
                el('td', { text: v.SKU }),
                el('td', { text: v.Colour || '–' }),
                el('td', { text: v.StorageOrSize || '–' }),
                el('td', { text: money(v.Price) }),
                el('td', { text: v.PromoPrice ? `${money(v.PromoPrice)} (${v.PromoStartDate} to ${v.PromoEndDate})` : '–' }),
                el('td', { text: v.PurchaseLimit || '–' }),
                el('td', {}, v.QuantityOnHand <= v.LowStockThreshold
                    ? el('span', { class: 'badge bg-warning text-dark', text: v.QuantityOnHand })
                    : String(v.QuantityOnHand)),
                el('td', { text: v.LowStockThreshold }),
                el('td', { class: 'text-end text-nowrap' },
                    el('button', { class: 'btn btn-sm btn-outline-primary me-1', type: 'button', text: 'Edit', onclick: () => editVariant(v) }),
                    el('button', { class: 'btn btn-sm btn-outline-danger', type: 'button', text: 'Delete', onclick: () => deleteVariant(v) })))));
            if (!product.Variants.length) {
                $('variantRows').replaceChildren(el('tr', {}, el('td', { colspan: 9, class: 'text-muted', text: 'No variants yet – add one below so customers can buy this product.' })));
            }
            resetVariantForm();
            $('variantPanel').classList.remove('d-none');
            $('variantPanel').scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            fail(err);
        }
    }

    function resetVariantForm() {
        $('variantForm').reset();
        $('variantId').value = '';
        $('vStock').value = 0;
        $('vThreshold').value = 5;
        $('variantFormTitle').textContent = 'Add a variant';
        $('variantSave').textContent = 'Add variant';
        $('variantCancel').classList.add('d-none');
    }

    function editVariant(v) {
        $('variantId').value = v.VariantID;
        $('vSku').value = v.SKU;
        $('vColour').value = v.Colour || '';
        $('vSize').value = v.StorageOrSize || '';
        $('vPrice').value = v.Price;
        $('vLimit').value = v.PurchaseLimit || '';
        $('vStock').value = v.QuantityOnHand;
        $('vThreshold').value = v.LowStockThreshold;
        $('vPromo').value = v.PromoPrice || '';
        $('vPromoStart').value = v.PromoStartDate || '';
        $('vPromoEnd').value = v.PromoEndDate || '';
        $('variantFormTitle').textContent = `Edit variant ${v.SKU}`;
        $('variantSave').textContent = 'Save variant';
        $('variantCancel').classList.remove('d-none');
        $('variantForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    $('variantForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        clearMessage();
        const productId = $('variantPanel').dataset.productId;
        const id = $('variantId').value;
        const body = {
            SKU: $('vSku').value,
            Colour: $('vColour').value,
            StorageOrSize: $('vSize').value,
            Price: numberOrNull($('vPrice').value),
            PurchaseLimit: numberOrNull($('vLimit').value),
            QuantityOnHand: numberOrNull($('vStock').value),
            LowStockThreshold: numberOrNull($('vThreshold').value),
            PromoPrice: numberOrNull($('vPromo').value),
            PromoStartDate: $('vPromoStart').value || null,
            PromoEndDate: $('vPromoEnd').value || null
        };
        try {
            const result = await api(id ? `/api/admin/variants/${id}` : `/api/admin/products/${productId}/variants`,
                                     { method: id ? 'PUT' : 'POST', body });
            toast(result.message);
            await openVariants(productId);
            loadProducts();
            loadSummary();
        } catch (err) {
            showError(message, err);
            message.scrollIntoView({ behavior: 'smooth' });
        }
    });

    async function deleteVariant(v) {
        if (!confirm(`Remove variant ${v.SKU}?`)) return;
        try {
            const result = await api(`/api/admin/variants/${v.VariantID}`, { method: 'DELETE' });
            toast(result.message);
            openVariants($('variantPanel').dataset.productId);
            loadProducts();
            loadSummary();
        } catch (err) {
            fail(err);
        }
    }

    $('variantCancel').addEventListener('click', resetVariantForm);
    $('closeVariants').addEventListener('click', () => $('variantPanel').classList.add('d-none'));

    // ---------------------------------------------------------------
    // ORDERS
    // ---------------------------------------------------------------
    // Same rules as the server (BR-26): status only moves forward
    const NEXT_STATUS = { Pending: ['Cancelled'], Paid: ['Shipped', 'Cancelled'], Shipped: ['Delivered'], Delivered: [], Cancelled: [] };

    async function loadOrders() {
        try {
            const status = $('orderFilter').value;
            const orders = await api(`/api/admin/orders${status ? `?status=${encodeURIComponent(status)}` : ''}`);
            $('orderRows').replaceChildren(...orders.map((o) => el('tr', {},
                el('td', { class: 'fw-semibold', text: o.OrderNumber }),
                el('td', { class: 'small', text: date(o.CreatedAt) }),
                el('td', {}, el('div', { text: o.CustomerName }), el('div', { class: 'small text-muted', text: o.CustomerEmail })),
                el('td', { text: o.ItemCount }),
                el('td', { text: money(o.TotalAmount) }),
                el('td', {}, statusBadge(o.OrderStatus)),
                el('td', { class: 'text-end' },
                    el('button', { class: 'btn btn-sm btn-outline-primary', type: 'button', text: 'Manage', onclick: () => showOrder(o.OrderID) })))));
            if (!orders.length) {
                $('orderRows').replaceChildren(el('tr', {}, el('td', { colspan: 7, class: 'text-muted', text: 'No orders found.' })));
            }
        } catch (err) {
            fail(err);
        }
    }

    async function showOrder(id) {
        const panel = $('orderDetail');
        try {
            const o = await api(`/api/admin/orders/${id}`);
            const address = o.FulfilmentMethod === 'Delivery'
                ? [o.AddressLine1, o.AddressLine2, `${o.Suburb} ${o.State} ${o.Postcode}`].filter(Boolean).join(', ')
                : 'Click & Collect';

            const tracking = el('input', { class: 'form-control form-control-sm w-auto', placeholder: 'Tracking number', maxlength: 50, 'aria-label': 'Tracking number' });
            const actions = NEXT_STATUS[o.OrderStatus].map((next) => {
                if (next === 'Shipped') {
                    return el('div', { class: 'd-flex gap-2' }, tracking,
                        el('button', { class: 'btn btn-sm btn-primary', type: 'button', text: 'Mark as shipped',
                                       onclick: () => changeStatus(o, 'Shipped', tracking.value) }));
                }
                if (next === 'Delivered') {
                    return el('button', { class: 'btn btn-sm btn-success', type: 'button', text: 'Mark as delivered',
                                          onclick: () => changeStatus(o, 'Delivered') });
                }
                return el('button', { class: 'btn btn-sm btn-outline-danger', type: 'button', text: 'Cancel order',
                                      onclick: () => changeStatus(o, 'Cancelled') });
            });

            panel.replaceChildren(
                el('div', { class: 'd-flex justify-content-between align-items-start flex-wrap gap-2 mb-3' },
                    el('div', {},
                        el('h2', { class: 'h5 mb-1' }, `Order ${o.OrderNumber} `, statusBadge(o.OrderStatus)),
                        el('div', { class: 'small text-muted', text: `${o.CustomerName} · ${o.CustomerEmail} · placed ${date(o.CreatedAt)}` })),
                    el('button', { class: 'btn btn-sm btn-outline-secondary', type: 'button', text: 'Close', onclick: () => panel.classList.add('d-none') })),
                el('table', { class: 'table table-sm' },
                    el('thead', {}, el('tr', {}, ['Item', 'SKU', 'Qty', 'Unit price', 'Total'].map((h) => el('th', { text: h })))),
                    el('tbody', {}, o.Items.map((i) => el('tr', {},
                        el('td', { text: `${i.ProductName}${i.StorageOrSize ? ` (${i.StorageOrSize})` : ''}${i.Colour ? ` – ${i.Colour}` : ''}` }),
                        el('td', { class: 'small', text: i.SKU }),
                        el('td', { text: i.Quantity }),
                        el('td', { text: money(i.UnitPrice) }),
                        el('td', { text: money(i.LineTotal) }))))),
                el('div', { class: 'row small mb-3' },
                    el('div', { class: 'col-md-6' },
                        el('div', {}, el('strong', { text: 'Fulfilment: ' }), address),
                        o.TrackingNumber ? el('div', {}, el('strong', { text: 'Tracking: ' }), o.TrackingNumber) : null,
                        o.Payments.map((p) => el('div', {}, el('strong', { text: 'Payment: ' }),
                            `${p.PaymentMethod} ${money(p.Amount)} – ${p.PaymentStatus} (${p.GatewayReference || 'no ref'})`))),
                    el('div', { class: 'col-md-6 text-md-end' },
                        el('div', { text: `Subtotal ${money(o.Subtotal)}` }),
                        el('div', { text: `Delivery ${money(o.DeliveryCost)}` }),
                        el('div', { class: 'fw-bold', text: `Total ${money(o.TotalAmount)}` }))),
                actions.length
                    ? el('div', { class: 'd-flex flex-wrap gap-3 align-items-center' }, el('strong', { text: 'Update status:' }), actions)
                    : el('p', { class: 'text-muted small mb-0', text: 'This order is finished – no further changes allowed.' }));
            panel.classList.remove('d-none');
            panel.scrollIntoView({ behavior: 'smooth' });
        } catch (err) {
            fail(err);
        }
    }

    async function changeStatus(order, status, trackingNumber) {
        if (status === 'Cancelled' && !confirm(`Cancel order ${order.OrderNumber}? Paid orders are refunded and the stock is put back.`)) return;
        clearMessage();
        try {
            const result = await api(`/api/admin/orders/${order.OrderID}/status`,
                                     { method: 'PUT', body: { OrderStatus: status, TrackingNumber: trackingNumber } });
            toast(result.message);
            await loadOrders();
            showOrder(order.OrderID);
            loadSummary();
        } catch (err) {
            fail(err);
        }
    }

    $('orderFilter').addEventListener('change', loadOrders);

    // ---------------------------------------------------------------
    // ENQUIRIES
    // ---------------------------------------------------------------
    async function loadEnquiries() {
        try {
            const status = $('enquiryFilter').value;
            const enquiries = await api(`/api/admin/enquiries${status ? `?status=${encodeURIComponent(status)}` : ''}`);
            $('enquiryRows').replaceChildren(...enquiries.map((q) => {
                const select = el('select', { class: 'form-select form-select-sm', 'aria-label': 'Enquiry status' },
                    ['New', 'In Progress', 'Resolved'].map((s) => el('option', { value: s, text: s, selected: s === q.Status })));
                select.addEventListener('change', async () => {
                    try {
                        const result = await api(`/api/admin/enquiries/${q.EnquiryID}/status`, { method: 'PUT', body: { Status: select.value } });
                        toast(result.message);
                        loadSummary();
                    } catch (err) {
                        select.value = q.Status;
                        fail(err);
                    }
                });
                return el('tr', {},
                    el('td', { class: 'small text-nowrap', text: date(q.SubmittedAt) }),
                    el('td', {}, el('div', { text: q.FullName }),
                        el('a', { class: 'small', href: `mailto:${q.Email}`, text: q.Email }),
                        q.Phone ? el('div', { class: 'small text-muted', text: q.Phone }) : null),
                    el('td', { text: q.Subject }),
                    el('td', { class: 'message-cell', text: q.Message }),
                    el('td', {}, select));
            }));
            if (!enquiries.length) {
                $('enquiryRows').replaceChildren(el('tr', {}, el('td', { colspan: 5, class: 'text-muted', text: 'No enquiries found.' })));
            }
        } catch (err) {
            fail(err);
        }
    }

    $('enquiryFilter').addEventListener('change', loadEnquiries);

    // ---------------------------------------------------------------
    // LOW STOCK (BR-16)
    // ---------------------------------------------------------------
    async function loadLowStock() {
        try {
            const rows = await api('/api/admin/low-stock');
            $('stockRows').replaceChildren(...rows.map((r) => el('tr', {},
                el('td', { text: r.ProductName }),
                el('td', { class: 'small', text: r.SKU }),
                el('td', { text: [r.Colour, r.StorageOrSize].filter(Boolean).join(' · ') || '–' }),
                el('td', {}, el('span', { class: `badge ${r.QuantityOnHand === 0 ? 'bg-danger' : 'bg-warning text-dark'}`, text: r.QuantityOnHand })),
                el('td', { text: r.LowStockThreshold }),
                el('td', { class: 'text-end' }, el('button', {
                    class: 'btn btn-sm btn-outline-success', type: 'button', text: 'Restock',
                    onclick: async () => {
                        openTab('products');
                        await openVariants(r.ProductID);
                        const v = currentVariants.find((x) => x.VariantID === r.VariantID);
                        if (v) editVariant(v);
                    }
                })))));
            if (!rows.length) {
                $('stockRows').replaceChildren(el('tr', {}, el('td', { colspan: 6, class: 'text-muted', text: 'Everything is well stocked.' })));
            }
        } catch (err) {
            fail(err);
        }
    }

    // ---------------------------------------------------------------
    // Start
    // ---------------------------------------------------------------
    loadSummary();
    try {
        await loadOptions();
    } catch (err) {
        fail(err);
    }
    loadProducts();
})();
