// =====================================================================
// Secure Retail – give the sample users real passwords (run once)
//
// The sample data from Week 6 has placeholder password hashes, so nobody
// can log in with them. This script replaces them with real bcrypt
// hashes (BR-02) so the team can demo the login, cart and admin pages.
//
// Run:   node set-demo-passwords.js
// Run it again whenever the database is rebuilt from schema.sql + sample-data.sql.
//
// These are TEST passwords for our local demo database only.
// =====================================================================

const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const ADMIN_PASSWORD = 'Admin@2026';
const CUSTOMER_PASSWORD = 'Customer@2026';

const dbPath = path.join(__dirname, '..', 'database', 'project.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error('Could not open the database:', err.message);
        process.exit(1);
    }
});

db.all('SELECT UserID, Email, Role, IsActive FROM USERS ORDER BY UserID', async (err, users) => {
    if (err) {
        console.error(err.message);
        process.exit(1);
    }

    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 12);

    db.serialize(() => {
        const update = db.prepare('UPDATE USERS SET PasswordHash = ? WHERE UserID = ?');
        for (const u of users) {
            update.run(u.Role === 'Admin' ? adminHash : customerHash, u.UserID);
        }
        update.finalize(() => {
            console.log('Demo passwords set:\n');
            for (const u of users) {
                const pw = u.Role === 'Admin' ? ADMIN_PASSWORD : CUSTOMER_PASSWORD;
                const note = u.IsActive ? '' : '   (deactivated – login is blocked, BR-04)';
                console.log(`  ${u.Role.padEnd(8)} ${u.Email.padEnd(36)} ${pw}${note}`);
            }
            db.close();
        });
    });
});
