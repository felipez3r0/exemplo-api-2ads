import { db } from '../config/database';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '../models/product.model';

export const productRepository = {
  findAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM products ORDER BY id', (err, rows: Product[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById(id: number): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM products WHERE id = ?',
        [id],
        (err, row: Product | undefined) => {
          if (err) reject(err);
          else resolve(row ?? null);
        },
      );
    });
  },

  create(input: CreateProductInput): Promise<Product> {
    return new Promise((resolve, reject) => {
      const { name, description, price } = input;
      db.run(
        'INSERT INTO products (name, description, price) VALUES (?, ?, ?)',
        [name, description ?? null, price],
        function (err) {
          if (err) return reject(err);
          productRepository
            .findById(this.lastID)
            .then((p) => resolve(p!))
            .catch(reject);
        },
      );
    });
  },

  update(id: number, input: UpdateProductInput): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined) {
        fields.push('name = ?');
        values.push(input.name);
      }
      if (input.description !== undefined) {
        fields.push('description = ?');
        values.push(input.description);
      }
      if (input.price !== undefined) {
        fields.push('price = ?');
        values.push(input.price);
      }
      if (fields.length === 0)
        return productRepository.findById(id).then(resolve).catch(reject);

      values.push(id);
      db.run(
        `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
        values,
        (err) => {
          if (err) return reject(err);
          productRepository.findById(id).then(resolve).catch(reject);
        },
      );
    });
  },

  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  existsInOrder(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        },
      );
    });
  },
};
