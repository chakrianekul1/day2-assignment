const express = require('express');
const db = require('./db');
const strategies = require('./strategies');
const { initPubSub, publisher } = require('./expenseService');

const app = express();
app.use(express.json());

// 1. Create Users [cite: 10]
app.post('/users', async (req, res) => {
    const { name, email } = req.body;
    const result = await db.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', [name, email]);
    res.status(201).json(result.rows[0]);
});

// 2. Create Groups [cite: 11]
app.post('/groups', async (req, res) => {
    const { name } = req.body;
    const result = await db.query('INSERT INTO groups (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(result.rows[0]);
});

// 3. Add Expenses via HTTP [cite: 13, 14]
app.post('/expenses', async (req, res) => {
    const { description, amount, payerId, groupId, splitType, participants } = req.body;
    try {
        const expenseRes = await db.query(
            'INSERT INTO expenses (description, amount, payer_id, group_id, split_type) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [description, amount, payerId, groupId, splitType]
        );

        const strategy = strategies[splitType];
        const shares = strategy.calculate(amount, participants);

        // Fault-proof: Publish to Redis and return success immediately [cite: 7]
        await publisher.publish('EXPENSE_CREATED', JSON.stringify({ payerId, shares }));

        res.status(201).json({ message: "Expense added, balance update queued", expense: expenseRes.rows[0] });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 4. View Balances [cite: 17]
app.get('/balances', async (req, res) => {
    const result = await db.query('SELECT * FROM balances');
    res.json(result.rows);
});

app.listen(3000, async () => {
    await initPubSub();
    console.log('🚀 Splitwise System running at http://localhost:3000');
});