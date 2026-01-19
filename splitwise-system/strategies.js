class EqualSplitStrategy {
    calculate(amount, participants) {
        const share = (amount / participants.length).toFixed(2);
        return participants.map(userId => ({ userId: parseInt(userId), share: parseFloat(share) }));
    }
}

class ExactSplitStrategy {
    calculate(amount, participantsWithAmounts) {
        return participantsWithAmounts.map(p => ({ userId: p.userId, share: p.amount }));
    }
}

module.exports = {
    'EQUAL': new EqualSplitStrategy(),
    'EXACT': new ExactSplitStrategy()
};