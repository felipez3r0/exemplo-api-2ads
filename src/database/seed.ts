import { db } from '../config/database';

db.serialize(() => {
  db.run('DELETE FROM order_items');
  db.run('DELETE FROM orders');
  db.run('DELETE FROM products');
  db.run('DELETE FROM customers');

  db.run('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [
    'Maria Silva',
    'maria@email.com',
    '11999990001',
  ]);
  db.run('INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)', [
    'João Pereira',
    'joao@email.com',
    '11999990002',
  ]);

  db.run('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [
    'Arroz 5kg',
    'Arroz branco tipo 1',
    28.9,
  ]);
  db.run('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [
    'Feijão 1kg',
    'Feijão carioca',
    9.5,
  ]);
  db.run('INSERT INTO products (name, description, price) VALUES (?, ?, ?)', [
    'Óleo de Soja 900ml',
    null,
    7.2,
  ]);

  console.log('Seed executado com sucesso.');
});
