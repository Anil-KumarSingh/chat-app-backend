const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
const privateEnvPath = path.resolve(__dirname, '..', '.env.local');
require('dotenv').config({ path: envPath });
require('dotenv').config({ path: privateEnvPath, override: true });

const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/User');

const name = process.env.ADMIN_NAME?.trim();
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const currentEmail = (process.env.ADMIN_CURRENT_EMAIL || email)?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

async function createAdmin() {
  try {
    if (!name || !email || !password) {
      throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in backend/.env first.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('ADMIN_EMAIL must be a valid email address.');
    if (password.length < 12) throw new Error('ADMIN_PASSWORD must be at least 12 characters.');
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');

    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    const admin = await User.findOne({ email: currentEmail });
    const emailInUse = await User.exists({ email, ...(admin ? { _id: { $ne: admin._id } } : {}) });
    if (emailInUse) {
      throw new Error('The new email already belongs to another account. Choose a different email.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    if (admin) {
      if (admin.role !== 'admin') {
        throw new Error('The account configured as ADMIN_CURRENT_EMAIL is not an admin account.');
      }
      admin.name = name;
      admin.email = email;
      admin.password = hashedPassword;
      await admin.save();
      console.log(`Admin credentials updated for ${admin.email}. Sign in at /admin/login.`);
    } else {
      if (process.env.ADMIN_CURRENT_EMAIL) {
        throw new Error('No existing admin was found for ADMIN_CURRENT_EMAIL.');
      }
      if (await User.exists({ email })) {
        throw new Error('That email already has a regular account. Choose a separate email for the admin account.');
      }
      const createdAdmin = await User.create({ name, email, password: hashedPassword, role: 'admin' });
      console.log(`Admin account created for ${createdAdmin.email}. Sign in at /admin/login.`);
    }
  } catch (error) {
    console.error(`Admin account was not created: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
}

createAdmin();
