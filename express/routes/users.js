import express from 'express';
import connection from '../database/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
    const { id } = req.query;
    try {
        const [users] = await connection.query(`
            SELECT 
                u.*, 
                (SELECT m.message_text 
                FROM messages AS m 
                WHERE u.id = m.sender_id OR u.id = m.receiver_id
                ORDER BY m.created_at DESC 
                LIMIT 1) AS last_message,
                (SELECT m.image 
                FROM messages AS m 
                WHERE u.id = m.sender_id OR u.id = m.receiver_id
                ORDER BY m.created_at DESC 
                LIMIT 1) AS image,
                (SELECT 
                    m.sender_id
                FROM messages AS m 
                WHERE u.id = m.sender_id OR u.id = m.receiver_id
                ORDER BY m.created_at DESC 
                LIMIT 1) AS is_sender
            FROM users AS u 
            WHERE u.id <> ?;
            `, [id]);
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error.message);
        res.status(500).json({ error: 'An error occurred while retrieving users' });
    }
});


export default router;