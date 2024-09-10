import express from 'express';
import connection from '../database/database.js';
import { SECRET_KEY } from '../middleware/jwt.js';
import { verifyToken } from '../middleware/jwt.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [results] = await connection.query(
            `SELECT 
                u.*, (SELECT m.message_text FROM messages AS m 
                WHERE u.id IN (m.sender_id, m.receiver_id)
                ORDER BY m.created_at DESC LIMIT 1) AS last_message
            FROM users AS u WHERE u.username = ? AND u.password = ?`, 
            [username, password]
        );

        if (results.length > 0) {
            const user = results[0];
            const token = jwt.sign({ 
                id: user.id, 
                username: user.username,
                nomor: user.nomor
            }, SECRET_KEY, { expiresIn: '24h' });

            res.status(200).json({ 
                message: "Success login", 
                token: token,
                user: {
                    id: user.id, 
                    username: user.username,
                    nomor: user.nomor
                }
            });
        } else {
            res.status(401).json({ message: "Login failed: Invalid username or password" });
        }
    } catch (error) {
        console.log("An error occurred while fetching data from the user table.", error);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});


router.get('/get-profile', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});

router.post('/logout', (req, res) => {
    res.status(200).json({ message: "Successfully logged out"});
});

router.get('/userData/:id_user', async (req, res) => {
    const id_user = parseInt(req.params.id_user, 10);
    console.log("Ending Page: ", id_user);
    try {
        const [user] = await connection.query(
            `SELECT u.id_user, u.username, u.nomor_hp, u.password_naked, r.name_role, u.nama
             FROM users AS u
             JOIN roles AS r ON u.id_role = r.id_role
             WHERE u.id_user = ?`,
            [id_user]
        );
        res.status(200).json(user);
    } catch (error) {
        console.error("Terjadi kesalahan saat mengambil data dari tabel pengguna:", error);
        res.status(500).json({ error: 'Gagal mengambil data' });
    }
});

router.get('/cekToken', verifyToken, (req, res) => {
    res.status(200).json({ exp: req.exp });
});
export default router