const mongoose = require('mongoose');
const cron = require('node-cron');
const User = require('../models/User');
const config = require('../config/config');

async function resetDailyCounters() {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await User.updateMany(
      {},
      { $set: { aiUsageCount: 0 } }
    );

    console.log(`[${new Date().toISOString()}] Reset AI counters for ${result.nModified} users`);
  } catch (error) {
    console.error('Error resetting counters:', error);
  } finally {
    await mongoose.disconnect();
  }
}

cron.schedule('0 0 * * *', () => {
  console.log('Running daily reset...');
  resetDailyCounters();
});

// resetDailyCounters();