const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const [emailInput, role] = process.argv.slice(2);
const email = emailInput?.trim().toLowerCase();

if (!email || !['user', 'admin'].includes(role)) {
  console.error('Usage: node scripts/setUserRole.js <email> <user|admin>');
  process.exit(1);
}

async function updateRole() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured');
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const user = await User.findOneAndUpdate({ email }, { role }, { new: true }).select('name email role');
    if (!user) {
      console.error(`No account found for ${email}. Register it first, then run this command again.`);
      process.exitCode = 1;
      return;
    }
    console.log(`Updated ${user.email}: role is now ${user.role}.`);
  } catch (error) {
    console.error(`Could not update account role: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

updateRole();
