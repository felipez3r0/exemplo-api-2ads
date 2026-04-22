# Etapa 06 — Entidade Customer (CRUD completo + RN01 + RN06)

> Objetivo: implementar a entidade Customer seguindo o mesmo padrão de Product, com duas regras de negócio adicionais:
> - **RN01**: e-mail único por cliente.
> - **RN06**: não remover cliente que já tenha pedidos.

## Pré-requisitos

- Etapas 01 a 05 concluídas.

## Resultado esperado ao final da etapa

- `src/repositories/customer.repository.ts`
- `src/services/customer.service.ts`
- `src/controllers/customer.controller.ts`
- `src/routes/customer.routes.ts`

## Passo a passo

### 1. Repository

Crie **`src/repositories/customer.repository.ts`** com exatamente este conteúdo:

```typescript
import { db } from "../config/database";
import { Customer, CreateCustomerInput, UpdateCustomerInput } from "../models/customer.model";

export const customerRepository = {
  findAll(): Promise<Customer[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM customers ORDER BY id", (err, rows: Customer[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById(id: number): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM customers WHERE id = ?", [id], (err, row: Customer | undefined) => {
        if (err) reject(err);
        else resolve(row ?? null);
      });
    });
  },

  findByEmail(email: string): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM customers WHERE email = ?", [email], (err, row: Customer | undefined) => {
        if (err) reject(err);
        else resolve(row ?? null);
      });
    });
  },

  create(input: CreateCustomerInput): Promise<Customer> {
    return new Promise((resolve, reject) => {
      const { name, email, phone } = input;
      db.run(
        "INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)",
        [name, email, phone ?? null],
        function (err) {
          if (err) return reject(err);
          customerRepository.findById(this.lastID).then((c) => resolve(c!)).catch(reject);
        }
      );
    });
  },

  update(id: number, input: UpdateCustomerInput): Promise<Customer | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined)  { fields.push("name = ?");  values.push(input.name); }
      if (input.email !== undefined) { fields.push("email = ?"); values.push(input.email); }
      if (input.phone !== undefined) { fields.push("phone = ?"); values.push(input.phone); }
      if (fields.length === 0) return customerRepository.findById(id).then(resolve).catch(reject);

      values.push(id);
      db.run(`UPDATE customers SET ${fields.join(", ")} WHERE id = ?`, values, (err) => {
        if (err) return reject(err);
        customerRepository.findById(id).then(resolve).catch(reject);
      });
    });
  },

  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM customers WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  existsInOrder(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT 1 FROM orders WHERE customer_id = ? LIMIT 1",
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(!!row);
        }
      );
    });
  }
};
```

> **Diferenças em relação a Product**:
> - Existe um `findByEmail` para apoiar a RN01.
> - `existsInOrder` consulta a tabela `orders` (e não `order_items`), pois o vínculo cliente↔pedido está em `orders.customer_id`.

### 2. Service

Crie **`src/services/customer.service.ts`** com exatamente este conteúdo:

```typescript
import { customerRepository } from "../repositories/customer.repository";
import { CreateCustomerInput, UpdateCustomerInput } from "../models/customer.model";
import { AppError } from "../errors/app-error";

export const customerService = {
  list() {
    return customerRepository.findAll();
  },

  async getById(id: number) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new AppError("Cliente não encontrado", 404);
    return customer;
  },

  async create(input: CreateCustomerInput) {
    // RN01: e-mail único
    const existing = await customerRepository.findByEmail(input.email);
    if (existing) throw new AppError("E-mail já cadastrado", 409);
    return customerRepository.create(input);
  },

  async update(id: number, input: UpdateCustomerInput) {
    await this.getById(id);
    // RN01: se mudar o e-mail, não pode colidir com outro cliente
    if (input.email) {
      const existing = await customerRepository.findByEmail(input.email);
      if (existing && existing.id !== id) {
        throw new AppError("E-mail já cadastrado", 409);
      }
    }
    return customerRepository.update(id, input);
  },

  async remove(id: number) {
    await this.getById(id);
    // RN06: não remover cliente com pedidos
    if (await customerRepository.existsInOrder(id)) {
      throw new AppError("Cliente não pode ser removido: há pedidos associados", 409);
    }
    await customerRepository.delete(id);
  }
};
```

### 3. Controller

Crie **`src/controllers/customer.controller.ts`** com exatamente este conteúdo:

```typescript
import { Request, Response, NextFunction } from "express";
import { customerService } from "../services/customer.service";
import { createCustomerSchema, updateCustomerSchema } from "../schemas/customer.schema";

export const customerController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.list());
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await customerService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCustomerSchema.parse(req.body);
      res.status(201).json(await customerService.create(data));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateCustomerSchema.parse(req.body);
      res.json(await customerService.update(Number(req.params.id), data));
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  }
};
```

### 4. Routes

Crie **`src/routes/customer.routes.ts`** com exatamente este conteúdo:

```typescript
import { Router } from "express";
import { customerController } from "../controllers/customer.controller";

const router = Router();

router.get("/",       customerController.list);
router.get("/:id",    customerController.getById);
router.post("/",      customerController.create);
router.put("/:id",    customerController.update);
router.delete("/:id", customerController.remove);

export default router;
```

> **Sobre `GET /customers/:id/orders`**: essa rota pertence ao módulo de pedidos e será adicionada na **etapa 07**, usando o `orderController`. Não colocamos aqui para não criar uma dependência cruzada de controllers.

## Verificação

1. Os quatro arquivos existem.
2. `npx tsc --noEmit` não reporta erros.
3. As regras implementadas cobrem:
   - Criar cliente com e-mail já existente → erro 409.
   - Atualizar cliente mudando e-mail para um já usado por outro cliente → erro 409.
   - Atualizar cliente mantendo o mesmo e-mail → ok.
   - Remover cliente com pedido registrado → erro 409.

## Próxima etapa

Siga para **[etapa-07-order.md](etapa-07-order.md)** para implementar a entidade Order, que envolve duas tabelas e a regra RN05.
