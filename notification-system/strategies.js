// Strategy Pattern: Handles different channels [cite: 4, 8, 16]
class EmailStrategy {
    async send(userId, itemName) { console.log(`📧 Email sent to User ${userId} for ${itemName}`); }
}
class SMSStrategy {
    async send(userId, itemName) { console.log(`📱 SMS sent to User ${userId} for ${itemName}`); }
}

module.exports = {
    'Email': new EmailStrategy(),
    'SMS': new SMSStrategy()
};