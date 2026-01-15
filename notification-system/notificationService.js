const db = require('./db');
const strategies = require('./strategies');
const fs = require('fs').promises;

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function processRestock(itemId) {
    const client = await db.connect();
    const temporaryLogs = []; // Store logs in memory during the loop

    try {
        await client.query('BEGIN'); // Start Transaction 

        const itemRes = await client.query('SELECT name FROM items WHERE id = $1', [itemId]);
        const itemName = itemRes.rows[0].name;

        const subs = await client.query(
            "SELECT * FROM subscriptions WHERE item_id = $1 AND status = 'PENDING' FOR UPDATE",
            [itemId]
        );

        for (const sub of subs.rows) {
            // 1. Mark as NOTIFIED in DB [cite: 16, 30]
            await client.query('UPDATE subscriptions SET status = $1 WHERE id = $2', ['NOTIFIED', sub.id]);

            await delay(2000); // Test delay to allow Ctrl+C

            // 2. Send notification via Strategy [cite: 4, 8]
            const strategy = strategies[sub.channel];
            if (strategy) {
                await strategy.send(sub.user_id, itemName);
            }

            // 3. Queue the log entry (DO NOT write to file yet) [cite: 22]
            temporaryLogs.push({ 
                user_id: sub.user_id, 
                item_id: itemId, 
                timestamp: new Date().toISOString() 
            });
        }

        // 4. Final Database Commit 
        await client.query('COMMIT'); 

        // 5. SUCCESS: Database is updated, now safe to write logs to JSON 
        if (temporaryLogs.length > 0) {
            const logLines = temporaryLogs.map(log => JSON.stringify(log)).join('\n') + '\n';
            await fs.appendFile('notifications.json', logLines);
        }

    } catch (e) {
        // If server crashes or error occurs before COMMIT, everything here is lost
        await client.query('ROLLBACK'); 
        console.error("❌ Transaction failed. Database reverted and no logs written.");
    } finally {
        client.release();
    }
}

module.exports = { processRestock };