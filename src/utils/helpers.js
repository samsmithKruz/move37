// .scripts/utils/helpers.js
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

export function fileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

export function copyFile(source, destination) {
  fs.copyFileSync(path.resolve(source), path.resolve(destination));
}


export function copyEnv() {
  try {
    if (!fileExists('.env.example')) {
      console.log('⚠️  .env.example file not found - skipping');
      return;
    }

    if (fileExists('.env')) {
      console.log('✅ .env file already exists');
      return;
    }

    copyFile('.env.example', '.env');
    console.log('✅ .env file created from .env.example');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }
}


const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = '7d';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email }, // payload
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}