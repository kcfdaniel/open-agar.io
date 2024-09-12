import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import config from './config';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
const sqlInfo = config.sqlinfo;
const dbPath = path.join(__dirname, 'db', sqlInfo.fileName);

// Ensure the database folder exists
const dbFolder = path.dirname(dbPath);
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
  console.log(`Created the database folder: ${dbFolder}`);
}

// Create the database connection
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err: Error | null) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Connected to the SQLite database.');

    // Perform any necessary table creations
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS failed_login_attempts (
        username TEXT,
        ip_address TEXT
      )`, (err: Error | null) => {
        if (err) {
          console.error(err);
        }
        else {
          console.log("Created failed_login_attempts table");
        }
      });

      db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        username TEXT,
        message TEXT,
        ip_address TEXT,
        timestamp INTEGER
      )`, (err: Error | null) => {
        if (err) {
          console.error(err);
        }
        else {
          console.log("Created chat_messages table");
        }
      });
    });
  }
});

process.on('beforeExit', () => {
  db.close((err: Error | null) => {
    if (err) {
      console.error('Error closing the database connection. ', err);
    } else {
      console.log('Closed the database connection.');
    }
  });
});

export default db;
