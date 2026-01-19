const express = require('express');
const db = require('./db');
const { processRestock } = require('./notificationService');

const app = express();
app.use(express.json());

app.post('/subscribe', async (req, res) => {
    const { user_id, item_id, channel } = req.body;
    try {
        await db.query(
            'INSERT INTO subscriptions (user_id, item_id, channel) VALUES ($1, $2, $3)', 
            [user_id, item_id, channel]
        );
        res.status(201).send('Subscribed');
    } catch (err) {
        res.status(400).send('Subscription failed');
    }
});

app.post('/restock', async (req, res) => {
    const { item_id, new_stock } = req.body;
    if (new_stock > 0) {
        await db.query('UPDATE items SET stock_count = $1 WHERE id = $2', [new_stock, item_id]);
        await processRestock(item_id); 
    }
    res.send('Processed');
});

app.listen(3000, () => console.log('🚀 Server started at http://localhost:3000'));