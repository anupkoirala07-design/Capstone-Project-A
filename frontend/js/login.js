// =====================================================================
// login.html – log in and create an account
// =====================================================================
(() => {
    const { api, showError, safeNext, el, loadSession } = Shop;
    const message = document.getElementById('authMessage');
    const $ = (id) => document.getElementById(id);

    // Where to go after logging in: back to the page they came from,
    // or the admin page for admins
    function goNext(user) {
        location.href = safeNext(user.Role === 'Admin' ? 'admin.html' : 'index.html');
    }

    loadSession().then((state) => {
        if (state.user) {
            message.replaceChildren(el('div', { class: 'alert alert-info' },
                `You are already logged in as ${state.user.FirstName}. `,
                el('a', { href: safeNext('index.html'), text: 'Continue shopping' })));
        }
    });

    $('loginForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        message.replaceChildren();
        try {
            const result = await api('/api/auth/login', {
                method: 'POST',
                body: { Email: $('loginEmail').value, Password: $('loginPassword').value }
            });
            goNext(result.user);
        } catch (err) {
            $('loginPassword').value = '';
            showError(message, err);
        }
    });

    $('registerForm').addEventListener('submit', async (event) => {
        event.preventDefault();
        message.replaceChildren();
        try {
            const result = await api('/api/auth/register', {
                method: 'POST',
                body: {
                    FirstName: $('regFirst').value,
                    LastName: $('regLast').value,
                    Email: $('regEmail').value,
                    Phone: $('regPhone').value,
                    Password: $('regPassword').value
                }
            });
            goNext(result.user);
        } catch (err) {
            showError(message, err);
        }
    });
})();
