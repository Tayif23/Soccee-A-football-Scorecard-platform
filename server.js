const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'soccee_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, conn) => {
    if (err) {
        console.error("\n❌ SERVER CRITICAL INITIALIZATION ERROR: Pool linking failure ->", err.message);
    } else {
        console.log("✅ DATABASE PIPELINE LINKED: Linked safely to connection pool schema 'soccee_db'.");
        conn.release();
    }
});

app.post('/api/auth/register', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: "Validation Exception: Complete all registration fields." });
    }

    const saltHash = bcrypt.hashSync(password, 10);
    const sqlInsert = 'INSERT INTO accounts (username, email, password) VALUES (?, ?, ?)';

    db.query(sqlInsert, [username, email, saltHash], (err, results) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "System Mismatch: Email address already has an active account profile." });
            }
            return res.status(500).json({ success: false, message: "Database transactional processing fault." });
        }
        return res.json({ success: true, message: "Registration Pipeline Complete." });
    });
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const sqlQuery = 'SELECT * FROM accounts WHERE email = ?';

    db.query(sqlQuery, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ success: false, message: "SQL transaction sequence exception." });
        }

        if (results.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid Account" });
        }

        const registeredProfile = results[0];
        const matchTokenResult = bcrypt.compareSync(password, registeredProfile.password);

        if (!matchTokenResult) {
            return res.status(400).json({ success: false, message: "Invalid Account" });
        }

        return res.json({ success: true, message: "Authorization tokens verified." });
    });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`\n🚀 SOCCEE Central Platform Gateway Engine operational on target port: http://localhost:${PORT}`);
});
