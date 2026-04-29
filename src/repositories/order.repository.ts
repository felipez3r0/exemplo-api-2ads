import { db } from '../config/database';
import { Order, OrderItem, OrderWithItems } from '../models/order.model';

export const orderRepository = {
  createOrder(customerId: number, total: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO orders (customer_id, total) VALUES (?, ?)',
        [customerId, total],
        function (err) {
          err ? reject(err) : resolve(this.lastID);
        },
      );
    });
  },

  addItem(
    orderId: number,
    productId: number,
    quantity: number,
    unitPrice: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
        [orderId, productId, quantity, unitPrice],
        (err) => (err ? reject(err) : resolve()),
      );
    });
  },

  findById(id: number): Promise<OrderWithItems | null> {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM orders WHERE id = ?',
        [id],
        (err, order: Order | undefined) => {
          if (err) return reject(err);
          if (!order) return resolve(null);
          db.all(
            'SELECT * FROM order_items WHERE order_id = ?',
            [id],
            (err2, items: OrderItem[]) => {
              if (err2) reject(err2);
              else resolve({ ...order, items });
            },
          );
        },
      );
    });
  },

  findAll(): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM orders ORDER BY id DESC', (err, rows: Order[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findByCustomerId(customerId: number): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC',
        [customerId],
        (err, rows: Order[]) => {
          if (err) reject(err);
          else resolve(rows);
        },
      );
    });
  },
};
