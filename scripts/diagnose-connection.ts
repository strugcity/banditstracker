#!/usr/bin/env tsx
/**
 * Deep Diagnostic Script for Supabase Connection
 *
 * This script performs detailed diagnostics to identify connection issues
 */

/* eslint-disable no-console */

import { config } from 'dotenv';

// Load .env file
config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

console.log(`\n${colors.bold}🔬 Deep Supabase Connection Diagnostics${colors.reset}\n`);

// Test 1: Environment variables
console.log(`${colors.blue}1. Environment Variables${colors.reset}`);
const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

console.log(`   URL: ${url ? colors.green + '✓ SET' : colors.red + '✗ MISSING'}${colors.reset}`);
console.log(`   URL value: ${url}`);
console.log(`   Key: ${key ? colors.green + '✓ SET' : colors.red + '✗ MISSING'}${colors.reset}`);
console.log(`   Key length: ${key?.length || 0} characters`);
console.log(`   Key starts with: ${key?.substring(0, 20)}...`);

// Test 2: Node.js version
console.log(`\n${colors.blue}2. Node.js Environment${colors.reset}`);
console.log(`   Node version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Fetch available: ${typeof fetch !== 'undefined' ? colors.green + '✓ YES' : colors.red + '✗ NO'}${colors.reset}`);

// Test 3: Basic DNS resolution
console.log(`\n${colors.blue}3. Network Connectivity${colors.reset}`);
try {
  const dns = await import('dns/promises');
  const hostname = url?.replace('https://', '').replace('http://', '') || '';
  console.log(`   Testing DNS resolution for: ${hostname}`);
  const addresses = await dns.resolve4(hostname);
  console.log(`   ${colors.green}✓${colors.reset} DNS resolved to: ${addresses.join(', ')}`);
} catch (error) {
  console.log(`   ${colors.red}✗${colors.reset} DNS resolution failed: ${error}`);
}

// Test 4: Basic HTTP connectivity with native fetch
console.log(`\n${colors.blue}4. Basic HTTP Test (native fetch)${colors.reset}`);
if (!url || !key) {
  console.log(`   ${colors.red}✗${colors.reset} Skipped - missing credentials`);
} else {
  try {
    console.log(`   Testing: ${url}/rest/v1/`);
    const response = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    });
    console.log(`   ${colors.green}✓${colors.reset} HTTP Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);

    const text = await response.text();
    console.log(`   Response preview: ${text.substring(0, 200)}...`);
  } catch (error: any) {
    console.log(`   ${colors.red}✗${colors.reset} Fetch failed`);
    console.log(`   Error name: ${error.name}`);
    console.log(`   Error message: ${error.message}`);
    console.log(`   Error cause: ${error.cause}`);
    console.log(`   Full error:`, error);
  }
}

// Test 5: Test with Supabase client
console.log(`\n${colors.blue}5. Supabase Client Test${colors.reset}`);
if (!url || !key) {
  console.log(`   ${colors.red}✗${colors.reset} Skipped - missing credentials`);
} else {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    console.log(`   Creating Supabase client...`);

    // Try to import Database type
    let Database;
    try {
      const types = await import('../src/lib/types.js');
      Database = types.Database;
      console.log(`   ${colors.green}✓${colors.reset} Database types imported`);
    } catch (e) {
      console.log(`   ${colors.yellow}⚠${colors.reset} Could not import Database types (not critical)`);
    }

    const supabase = createClient(url, key);
    console.log(`   ${colors.green}✓${colors.reset} Client created`);

    console.log(`   Testing query: programs table`);
    const { data, error, status, statusText } = await supabase
      .from('programs')
      .select('count')
      .limit(1);

    console.log(`   Status: ${status}`);
    console.log(`   Status Text: ${statusText}`);

    if (error) {
      console.log(`   ${colors.red}✗${colors.reset} Query failed`);
      console.log(`   Error details:`, JSON.stringify(error, null, 2));
    } else {
      console.log(`   ${colors.green}✓${colors.reset} Query successful!`);
      console.log(`   Data:`, data);
    }
  } catch (error: any) {
    console.log(`   ${colors.red}✗${colors.reset} Supabase client test failed`);
    console.log(`   Error:`, error.message);
    console.log(`   Stack:`, error.stack);
  }
}

// Test 6: Check SSL/TLS
console.log(`\n${colors.blue}6. SSL/TLS Certificate Check${colors.reset}`);
if (!url) {
  console.log(`   ${colors.red}✗${colors.reset} Skipped - missing URL`);
} else {
  try {
    const https = await import('https');
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: '/',
      method: 'GET',
    };

    await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        console.log(`   ${colors.green}✓${colors.reset} SSL connection successful`);
        console.log(`   TLS version: ${res.socket?.getProtocol?.()}`);
        console.log(`   Cipher: ${res.socket?.getCipher?.()?.name}`);
        resolve(res);
      });

      req.on('error', (error) => {
        console.log(`   ${colors.red}✗${colors.reset} SSL connection failed: ${error.message}`);
        reject(error);
      });

      req.end();
    });
  } catch (error: any) {
    console.log(`   ${colors.red}✗${colors.reset} SSL test failed: ${error.message}`);
  }
}

// Test 7: Check proxy settings
console.log(`\n${colors.blue}7. Proxy Configuration${colors.reset}`);
console.log(`   HTTP_PROXY: ${process.env.HTTP_PROXY || 'not set'}`);
console.log(`   HTTPS_PROXY: ${process.env.HTTPS_PROXY || 'not set'}`);
console.log(`   NO_PROXY: ${process.env.NO_PROXY || 'not set'}`);

console.log(`\n${colors.bold}Diagnostics Complete${colors.reset}\n`);
