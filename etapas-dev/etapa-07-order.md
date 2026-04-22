# Etapa 07 — Entidade Order (criação com múltiplas tabelas)

> Objetivo: implementar a entidade Order, que é a **mais complexa** do sistema. A criação de um pedido envolve **duas tabelas** (`orders` + `order_items`), a regra **RN05** (foto do preço no momento da venda) e o **cálculo automático do total** (RF09).

## Pré-requisitos

- Etapas 01 a 06 concluídas.

## Resultado esperado ao final da etapa

- `src/repositories/order.repository.ts`
- `src/services/order.service.ts`
- `src/controllers/order.controller.ts`
- `src/routes/order.routes.ts`
- A rota `GET /customers/:id/orders` registrada (dentro de `customer.routes.ts`).

## Passo a passo

### 1. Repository

Crie **`src/repositories/order.repository.ts`** com exatamente este conteúdo:

```typescript
import { db } from "../config/database";
import { Order, OrderItem, OrderWithItems } from "../models/order.model";

export const orderRepository = {
  createOrder(customerId: number, total: number): Promise<number> {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO orders (customer_id, total) VALUES (?, ?)",
        [customerId, total],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  },

  addItem(orderId: number, productId: number, quantity: number, unitPrice: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)",
        [orderId, productId, quantity, unitPrice],
        (err) => err ? reject(err) : resolve()
      );
    });
  },

  findById(id: number): Promise<OrderWithItems | null> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM orders WHERE id = ?", [id], (err, order: Order | undefined) => {
        if (err) return reject(err);
        if (!order) return resolve(null);
        db.all("SELECT * FROM order_items WHERE order_id = ?", [id], (err2, items: OrderItem[]) => {
          if (err2) reject(err2);
          else resolve({ ...order, items });
        });
      });
    });
  },

  findAll(): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM orders ORDER BY id DESC", (err, rows: Order[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findByCustomerId(customerId: number): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC",
        [customerId],
        (err, rows: Order[]) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
};
```

> **Observação sobre transação**: idealmente, `createOrder` + múltiplos `addItem` deveriam rodar dentro de uma transação (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`). Para manter o nível didático, deixamos essa melhoria como desafio no README. Neste estágio, se a inserção de um item falhar no meio, o pedido pode ficar parcial.

### 2. Service

Crie **`src/services/order.service.ts`** com exatamente este conteúdo:

```typescript
import { orderRepository } from "../repositories/order.repository";
import { productRepository } from "../repositories/product.repository";
import { customerRepository } from "../repositories/customer.repository";
import { CreateOrderInput } from "../models/order.model";
import { AppError } from "../errors/app-error";

export const orderService = {
  async create(input: CreateOrderInput) {
    const customer = await customerRepository.findById(input.customer_id);
    if (!customer) throw new AppError("Cliente não encontrado", 404);

    const prepared: Array<{ product_id: number; quantity: number; unit_price: number }> = [];
    let total = 0;

    for (const item of input.items) {
      const product = await productRepository.findById(item.product_id);
      if (!product) throw new AppError(`Produto ${item.product_id} não encontrado`, 404);

      prepared.push({
        product_id: product.id,
        quantity: item.quantity,
        unit_price: product.price  // RN05: fotografia do preço no momento da venda
      });
      total += product.price * item.quantity;
    }

    const orderId = await orderRepository.createOrder(input.customer_id, total);
    for (const it of prepared) {
      await orderRepository.addItem(orderId, it.product_id, it.quantity, it.unit_price);
    }
    return orderRepository.findById(orderId);
  },

  async getById(id: number) {
    const order = await orderRepository.findById(id);
    if (!order) throw new AppError("Pedido não encontrado", 404);
    return order;
  },

  list() {
    return orderRepository.findAll();
  },

  async listByCustomer(customerId: number) {
    const customer = await customerRepository.findById(customerId);
    if (!customer) throw new AppError("Cliente não encontrado", 404);
    return orderRepository.findByCustomerId(customerId);
  }
};
```

> **Por que duas varreduras (prepared + gravação)?** Primeiro validamos todos os produtos e calculamos o total. Só depois inserimos. Isso evita criar um pedido parcial quando um dos produtos não existe.

### 3. Controller

Crie **`src/controllers/order.controller.ts`** com exatamente este conteúdo:

```typescript
import { Request, Response, NextFunction } from "express";
import { orderService } from "../services/order.service";
import { createOrderSchema } from "../schemas/order.schema";

export const orderController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.list());
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createOrderSchema.parse(req.body);
      res.status(201).json(await orderService.create(data));
    } catch (err) { next(err); }
  },

  async listByCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await orderService.listByCustomer(Number(req.params.id)));
    } catch (err) { next(err); }
  }
};
```

> **Por que não há `update` nem `delete`?** Um pedido é um **fato histórico**. A decisão de não permitir alteração/remoção está documentada na seção 12 do `Analise.md`.

### 4. Routes de Order

Crie **`src/routes/order.routes.ts`** com exatamente este conteúdo:

```typescript
import { Router } from "express";
import { orderController } from "../controllers/order.controller";

const router = Router();

router.get("/",    orderController.list);
router.get("/:id", orderController.getById);
router.post("/",   orderController.create);

export default router;
```

### 5. Adicionar `GET /customers/:id/orders`

Edite **`src/routes/customer.routes.ts`** (criado na etapa 06) para registrar a rota que lista pedidos de um cliente. O arquivo deve ficar assim:

```typescript
import { Router } from "express";
import { customerController } from "../controllers/customer.controller";
import { orderController } from "../controllers/order.controller";

const router = Router();

router.get("/",              customerController.list);
router.get("/:id",           customerController.getById);
router.get("/:id/orders",    orderController.listByCustomer);
router.post("/",             customerController.create);
router.put("/:id",           customerController.update);
router.delete("/:id",        customerController.remove);

export default router;
```

> **Atenção**: `router.get("/:id/orders", ...)` precisa estar **depois** de `router.get("/:id", ...)`. A ordem de declaração não muda o resultado no Express quando as rotas têm paths distintos, mas manter a rota composta próxima do `:id` ajuda a leitura.

## Verificação

1. Os quatro arquivos novos existem.
2. `customer.routes.ts` agora importa `orderController` e expõe `GET /:id/orders`.
3. `npx tsc --noEmit` não reporta erros.
4. Fluxos que o Service cobre:
   - `POST /orders` com cliente inexistente → 404.
   - `POST /orders` com algum produto inexistente → 404.
   - `POST /orders` válido → 201, total calculado, `unit_price` igual ao `price` atual do produto.

## Próxima etapa

Siga para **[etapa-08-rotas-e-middleware.md](etapa-08-rotas-e-middleware.md)** para agregar as rotas e criar o middleware centralizado de erro.
