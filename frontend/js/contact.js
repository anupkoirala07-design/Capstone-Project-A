// =====================================================================
// contact.html – sends the enquiry form to the database (/api/enquiries)
// =====================================================================
(() => {
    const { api, toast } = Shop;
    const form = document.querySelector('form.needs-validation');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        form.classList.add('was-validated');
        if (!form.checkValidity()) return;

        const [name, email, phone] = form.querySelectorAll('input');
        const subject = form.querySelector('select');
        const text = form.querySelector('textarea');
        const button = form.querySelector('button[type="submit"]');

        button.disabled = true;
        try {
            const result = await api('/api/enquiries', {
                method: 'POST',
                body: { FullName: name.value, Email: email.value, Phone: phone.value, Subject: subject.value, Message: text.value }
            });
            toast(result.message);
            form.reset();
            form.classList.remove('was-validated');
        } catch (err) {
            toast([err.message, ...(err.details || [])].join(' – '), 'danger');
        } finally {
            button.disabled = false;
        }
    });
})();
