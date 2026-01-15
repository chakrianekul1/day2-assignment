const redis = require('redis');
const db = require('./db');
const publisher = redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });
const subscriber = redis.createClient({ url: process.env.REDIS_URL || 'redis://redis:6379' });

async function initPubSub() {
    await publisher.connect();
    await subscriber.connect();

    await subscriber.subscribe('EXPENSE_CREATED', async (message) => {
        const { payerId, shares } = JSON.parse(message);
        
        for (const share of shares) {
            if (share.userId === payerId) continue; // Payer doesn't owe themselves [cite: 6, 14]

            const debtor = share.userId;
            const creditor = payerId;
            const newDebtAmount = share.share;

            // NETTING LOGIC: Check if creditor already owes debtor [cite: 7, 16]
            const opposite = await db.query(
                'SELECT amount FROM balances WHERE user_id = $1 AND owes_to = $2',
                [creditor, debtor]
            );

            if (opposite.rows.length > 0) {
                const oppAmt = parseFloat(opposite.rows[0].amount);
                if (oppAmt > newDebtAmount) {
                    // Reduce existing debt [cite: 8, 15]
                    await db.query('UPDATE balances SET amount = amount - $1 WHERE user_id = $2 AND owes_to = $3', [newDebtAmount, creditor, debtor]);
                } else if (oppAmt === newDebtAmount) {
                    // Debts perfectly cancel out [cite: 8, 16]
                    await db.query('DELETE FROM balances WHERE user_id = $1 AND owes_to = $2', [creditor, debtor]);
                } else {
                    // New debt is larger: delete opposite and create net row [cite: 15, 17]
                    await db.query('DELETE FROM balances WHERE user_id = $1 AND owes_to = $2', [creditor, debtor]);
                    const diff = newDebtAmount - oppAmt;
                    await db.query('INSERT INTO balances (user_id, owes_to, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, owes_to) DO UPDATE SET amount = balances.amount + EXCLUDED.amount', [debtor, creditor, diff]);
                }
            } else {
                // No netting needed, just add debt 
                await db.query('INSERT INTO balances (user_id, owes_to, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, owes_to) DO UPDATE SET amount = balances.amount + EXCLUDED.amount', [debtor, creditor, newDebtAmount]);
            }
        }
        console.log("✅ Netting logic processed via Pub/Sub.");
    });
}

module.exports = { initPubSub, publisher };