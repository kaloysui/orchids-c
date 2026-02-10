import { obfuscateUrl, generateSignature } from './src/lib/protection';

const url = "https://one.techparadise-92b.workers.dev/dewshine74.xyz/file2/pAERwzr3C~3d1LB3KpT7w26SOSpPS7+kyBZkHGWP6NarmfYytks~hmaSQtoKbh2OYVAVIAZkgC6eQjNzf9g7P3qLsRqUZf09qwwK9cDiFph7QRnYetuhv81ZPsfkbSGS0eS~qAWkrCLCs~pm~9AJ4bCwVsblW1QBktT8Rhnb6vA=/MTA4MA==/aW5kZXgubTN1OA==.m3u8";
const obfuscated = obfuscateUrl(url);
const sig = generateSignature(obfuscated);
const headers = JSON.stringify({ "Origin": "https://videasy.net", "Referer": "https://videasy.net/" });
console.log(`http://localhost:3000/api/proxy?d=${encodeURIComponent(obfuscated)}&s=${sig}&headers=${encodeURIComponent(headers)}`);
