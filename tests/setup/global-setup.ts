// tests/setup/global-setup.ts
// Jest global setup: set env vars, initialize in-memory DB, etc.

import * as dotenv from 'dotenv';
import { existsSync } from 'fs';

export default async () => {
  // Prefer .env.test, fallback to .env
  if (existsSync('.env.test')) {
    dotenv.config({ path: '.env.test' });
  } else if (existsSync('.env')) {
    dotenv.config({ path: '.env' });
  }
  // Example: process.env.NODE_ENV = 'test';
  // You can add more setup logic here if needed
}; 