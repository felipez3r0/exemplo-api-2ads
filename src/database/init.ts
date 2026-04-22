import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.db');
const schemaPath = path.resolve(__dirname, 'schema.sql');

const schema = fs.readFileSync(schemaPath, 'utf-8');
const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error('Erro ao criar o schema:', err);
    process.exit(1);
  }
  console.log('Banco inicializado com sucesso em', dbPath);
  db.close();
});
