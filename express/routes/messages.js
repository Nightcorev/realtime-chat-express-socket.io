import express from 'express';
import connection from '../database/database.js';

const router = express.Router();

router.get('/', async(req, res) => {
    try {
        const [messages] = await connection.query(`
            SELECT * FROM messages ORDER BY created_at ASC
        `);

        if (messages.length > 0) {
            res.status(200).json(messages);
        } else {
            res.status(404).json({ error: 'No messages found' });
        }
    } catch (error) {
        console.error("Error loading messages:", error.message);
        res.status(500).json({ error: 'An error occurred while retrieving messages' });
    }
});


router.get('/:contactId', async(req, res) => {
    const { contactId } = req.params;
    try {
        const [messages] = await connection.query(`
            SELECT * FROM messages 
            WHERE sender_id = ? OR receiver_id = ? 
            ORDER BY created_at ASC
        `, [contactId, contactId]);

        if (messages.length > 0) {
            res.status(200).json(messages);
        } else {
            res.status(404).json({ error: 'No messages found' });
        }
    } catch (error) {
        console.error("Error loading messages:", error.message);
        res.status(500).json({ error: 'An error occurred while retrieving messages' });
    }
});
export default router;