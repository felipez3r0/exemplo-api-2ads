# Etapa 05 — Entidade Product (CRUD completo)

> Objetivo: implementar a **primeira entidade de ponta a ponta**, seguindo a ordem `Repository → Service → Controller → Routes`. Product é escolhido primeiro por **não depender de nenhuma outra entidade**.

## Pré-requisitos

- Etapas 01 a 04 concluídas.

## Resultado esperado ao final da etapa

- `src/repositories/product.repository.ts`
- `src/services/product.service.ts`
- `src/controllers/product.controller.ts`
- `src/routes/product.routes.ts`

Ao final, as operações de produto estão prontas para serem plugadas no agregador de rotas (etapa 08). A entidade respeita a **RN07** (não remover produto que esteja em algum pedido).

## Passo a passo

### 1. Repository

Crie **`src/repositories/product.repository.ts`** com exatamente este conteúdo:

```typescript
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
```

> **Detalhes**:
>
> - O SQLite do driver `sqlite3` usa **callbacks**. Envolvemos em `Promise` para o código consumidor poder usar `async/await`.
> - `function (err)` (função tradicional, não arrow) é necessária em `db.run` para acessar `this.lastID` e `this.changes`.
> - `existsInOrder` serve à RN07, consultada pelo Service.

### 2. Service

Crie **`src/services/product.service.ts`** com exatamente este conteúdo:

```typescript
import { productRepository } from '../repositories/product.repository';
import {
  CreateProductInput,
  UpdateProductInput,
} from '../models/product.model';
import { AppError } from '../errors/app-error';

export const productService = {
  list() {
    return productRepository.findAll();
  },

  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError('Produto não encontrado', 404);
    return product;
  },

  create(input: CreateProductInput) {
    return productRepository.create(input);
  },

  async update(id: number, input: UpdateProductInput) {
    await this.getById(id); // garante que existe (ou lança 404)
    return productRepository.update(id, input);
  },

  async remove(id: number) {
    await this.getById(id);
    // RN07: não pode remover produto que já está em pedido
    if (await productRepository.existsInOrder(id)) {
      throw new AppError(
        'Produto não pode ser removido: há pedidos associados',
        409,
      );
    }
    await productRepository.delete(id);
  },
};
```

### 3. Controller

Crie **`src/controllers/product.controller.ts`** com exatamente este conteúdo:

```typescript
import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import {
  createProductSchema,
  updateProductSchema,
} from '../schemas/product.schema';

export const productController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.list());
    } catch (err) {
      next(err);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.getById(Number(req.params.id)));
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createProductSchema.parse(req.body);
      const data = { ...parsed, description: parsed.description ?? null };
      res.status(201).json(await productService.create(data));
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      res.json(await productService.update(Number(req.params.id), data));
    } catch (err) {
      next(err);
    }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
```

> **Padrão `try/catch + next(err)`**: todo erro é encaminhado ao middleware centralizado (etapa 08). O Controller **nunca** chama `res.status(500)` diretamente.

> **Atenção — incompatibilidade de tipos entre Zod e o Model**: o schema define `description` como `z.string().optional()`, que resulta no tipo `string | undefined`. Já o model `CreateProductInput` (derivado de `Product`) declara `description: string | null`. Para compatibilizar, o método `create` do controller separa o parse do envio: primeiro extrai os dados com `parsed`, depois converte `undefined` para `null` com `parsed.description ?? null` antes de chamar o service.

### 4. Routes

Crie **`src/routes/product.routes.ts`** com exatamente este conteúdo:

```typescript
import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

router.get('/', productController.list);
router.get('/:id', productController.getById);
router.post('/', productController.create);
router.put('/:id', productController.update);
router.delete('/:id', productController.remove);

export default router;
```

## Verificação

1. Todos os quatro arquivos existem nos caminhos corretos.
2. `npx tsc --noEmit` não reporta erros.
3. As rotas ainda não respondem via HTTP — isso só acontecerá depois da etapa 09. Ao final da etapa 08, os testes reais via `requests.http` passarão a funcionar.

## Próxima etapa

Siga para **[etapa-06-customer.md](etapa-06-customer.md)** para replicar o padrão em Customer, aplicando RN01 e RN06.
