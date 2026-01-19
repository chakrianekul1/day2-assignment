const db = require('./db');
const strategies = require('./strategies');
const fs = require('fs').promises;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function processRestock(itemId) {
    const client = await db.connect();
    const temporaryLogs = [];

    try {
        await client.query('BEGIN'); 

        const itemRes = await client.query('SELECT name FROM items WHERE id = $1', [itemId]);
        const itemName = itemRes.rows[0].name;

        const subs = await client.query(
            "SELECT * FROM subscriptions WHERE item_id = $1 AND status = 'PENDING' FOR UPDATE",
            [itemId]
        );

        for (const sub of subs.rows) {
            await client.query('UPDATE subscriptions SET status = $1 WHERE id = $2', ['NOTIFIED', sub.id]);

            await delay(2000);

            const strategy = strategies[sub.channel];
            if (strategy) {
                await strategy.send(sub.user_id, itemName);
            }

            temporaryLogs.push({ 
                user_id: sub.user_id, 
                item_id: itemId, 
                timestamp: new Date().toISOString() 
            });
        }

        await client.query('COMMIT'); 

        if (temporaryLogs.length > 0) {
            const logLines = temporaryLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
            await fs.appendFile('notifications.json', logLines);
        }

    } catch (e) {
        await client.query('ROLLBACK'); 
        console.error("❌ Transaction failed. Database reverted and no logs written.");
    } finally {
        client.release();
    }
}

module.exports = { processRestock };