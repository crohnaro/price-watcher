// src/storage.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FILE = path.join(__dirname, 'storage', 'lowest.json');

export function readLowest() {
    if (!fs.existsSync(FILE)) return {};
    return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export function saveLowest(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
