# API REST — Armazém do Seu João

Projeto didático de **API REST** construído em **TypeScript + Node + Express + SQLite**, seguindo uma arquitetura em camadas. O objetivo é servir como **referência passo a passo** para alunos do segundo semestre de Análise e Desenvolvimento de Sistemas que estão tendo o primeiro contato com desenvolvimento backend.

> O problema que esta API resolve, o levantamento de requisitos e as decisões de negócio estão documentados em **[Analise.md](Analise.md)**. Recomenda-se ler a análise antes deste README.

---

## Sumário

1. [Pré-requisitos](#1-pré-requisitos)
2. [Tecnologias e por que usamos cada uma](#2-tecnologias-e-por-que-usamos-cada-uma)
3. [Arquitetura em camadas](#3-arquitetura-em-camadas)
4. [Estrutura de pastas](#4-estrutura-de-pastas)
5. [Passo a passo: construindo o projeto do zero](#5-passo-a-passo-construindo-o-projeto-do-zero)
6. [Como executar](#6-como-executar)
7. [Endpoints e exemplos](#7-endpoints-e-exemplos)
8. [Tratamento de erros](#8-tratamento-de-erros)
9. [Dicas de estudo](#9-dicas-de-estudo)
10. [Desafios propostos](#10-desafios-propostos)

---

## 1. Pré-requisitos

Antes de começar, garanta que você tem instalado:

- **Node.js 20 ou superior** — [download](https://nodejs.org)
- **npm** (vem junto com o Node)
- Um editor de código — recomendamos **VS Code**
- **Extensão REST Client** no VS Code (para testar os endpoints com o arquivo `.http`)

Verifique as versões no terminal:

```bash
node --version   # esperado: v20.x ou superior
npm --version
```

---

## 2. Tecnologias e por que usamos cada uma

| Tecnologia | Papel no projeto | Por que esta escolha |
|---|---|---|
| **TypeScript** | Linguagem | Adiciona tipos ao JavaScript — o editor avisa de erros antes de rodar e ajuda a entender o fluxo de dados entre camadas. |
| **Node.js** | Runtime | Executa o JavaScript fora do navegador. É o motor do nosso servidor. |
| **Express** | Framework HTTP | Simplifica a criação de rotas, o parse de JSON e o uso de middlewares. |
| **sqlite3** | Banco de dados | Banco relacional em arquivo único, sem servidor. Perfeito para aprendizado. |
| **Zod** | Validação | Garante que os dados que chegam nos endpoints estão no formato esperado. |
| **tsx** | Executor de TS em dev | Roda arquivos TypeScript direto, com reload automático. |

---

## 3. Arquitetura em camadas

A aplicação é organizada em **camadas**, onde cada camada **só conversa com a camada imediatamente abaixo**. Isso mantém cada peça com uma única responsabilidade.

```
        ┌──────────────────────┐
        │       Cliente        │  (navegador, app, Postman, arquivo .http)
        └──────────┬───────────┘
                   │ HTTP
        ┌──────────▼───────────┐
        │       Routes         │  Define as URLs e os métodos HTTP
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │     Controller       │  Recebe a requisição, valida entrada,
        │                      │  responde com status + JSON
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │       Service        │  Regras de negócio (RN01..RN07)
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │      Repository      │  Acesso ao banco (SQL puro)
        └──────────┬───────────┘
                   │
        ┌──────────▼───────────┐
        │       SQLite         │  armazenamento físico (arquivo .db)
        └──────────────────────┘
```

### Responsabilidade de cada camada

- **Model**: descreve o **formato dos dados**. No nosso projeto, os Models são **interfaces TypeScript** (`Product`, `Customer`, `Order`, `OrderItem`).
- **Repository**: a **única camada que fala com o banco**. Contém o SQL. Devolve dados como objetos simples.
- **Service**: contém as **regras de negócio**. Decide *o que* pode e *o que* não pode acontecer (ex.: "e-mail duplicado não é permitido"). Não conhece HTTP nem SQL.
- **Controller**: adapta o **mundo HTTP** para o **mundo do Service**. Lê `req.body`, `req.params`, chama o Service, devolve `res.status(...).json(...)`.
- **Routes**: liga **URL + método HTTP** a uma função do Controller.

> **Regra de ouro**: Se você está escrevendo SQL em um Controller, ou status HTTP em um Service, a camada errada está fazendo o trabalho. Pare e mova o código.

---

## 4. Estrutura de pastas

```
exemplo-api-2ads/
├── src/
│   ├── config/
│   │   └── database.ts           # conexão com o SQLite
│   ├── models/                   # interfaces TypeScript das entidades
│   │   ├── product.model.ts
│   │   ├── customer.model.ts
│   │   └── order.model.ts
│   ├── repositories/             # acesso ao banco (SQL puro)
│   │   ├── product.repository.ts
│   │   ├── customer.repository.ts
│   │   └── order.repository.ts
│   ├── services/                 # regras de negócio
│   │   ├── product.service.ts
│   │   ├── customer.service.ts
│   │   └── order.service.ts
│   ├── controllers/              # adaptam HTTP ↔ Service
│   │   ├── product.controller.ts
│   │   ├── customer.controller.ts
│   │   └── order.controller.ts
│   ├── routes/                   # definição das URLs
│   │   ├── product.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── order.routes.ts
│   │   └── index.ts              # agrega todas as rotas
│   ├── middlewares/
│   │   └── error-handler.ts      # trata erros de forma centralizada
│   ├── schemas/                  # validações Zod
│   │   ├── product.schema.ts
│   │   ├── customer.schema.ts
│   │   └── order.schema.ts
│   ├── errors/
│   │   └── app-error.ts          # classe de erro customizada
│   ├── database/
│   │   ├── schema.sql            # estrutura do banco
│   │   └── seed.ts               # dados iniciais
│   ├── app.ts                    # configura o Express
│   └── server.ts                 # sobe o servidor
├── requests.http                 # exemplos de chamadas aos endpoints
├── package.json
├── tsconfig.json
├── .gitignore
├── README.md
└── Analise.md
```

---

## 5. Passo a passo: construindo o projeto do zero

> Esta seção é a **parte mais importante** para o aluno. Siga os passos **na ordem**. Cada passo constrói em cima do anterior.

> **Roteiro em etapas (para quem está automatizando com IA)**: cada grupo de passos desta seção também está descrito de forma mais detalhada e autocontida em [etapas-dev/](etapas-dev/). Cada arquivo tem pré-requisitos, código completo e critérios de verificação, permitindo que um agente de IA mais simples execute a etapa sem precisar cruzar informação com o restante do README.
>
> | Etapa | Passos cobertos | Link |
> |---|---|---|
> | 01 — Setup inicial | 1 a 7 | [etapa-01-setup.md](etapas-dev/etapa-01-setup.md) |
> | 02 — Banco de dados | 8 a 10 | [etapa-02-banco-de-dados.md](etapas-dev/etapa-02-banco-de-dados.md) |
> | 03 — Models | 11 | [etapa-03-models.md](etapas-dev/etapa-03-models.md) |
> | 04 — Erros e validações | 12 e 13 | [etapa-04-erros-e-validacoes.md](etapas-dev/etapa-04-erros-e-validacoes.md) |
> | 05 — Entidade Product | 14 | [etapa-05-product.md](etapas-dev/etapa-05-product.md) |
> | 06 — Entidade Customer | 15 | [etapa-06-customer.md](etapas-dev/etapa-06-customer.md) |
> | 07 — Entidade Order | 16 | [etapa-07-order.md](etapas-dev/etapa-07-order.md) |
> | 08 — Agregador de rotas e middleware | 17 e 18 | [etapa-08-rotas-e-middleware.md](etapas-dev/etapa-08-rotas-e-middleware.md) |
> | 09 — App e server | 19 e 20 | [etapa-09-app-e-server.md](etapas-dev/etapa-09-app-e-server.md) |
> | 10 — Seed e `requests.http` | 21 e 22 | [etapa-10-seed-e-requests.md](etapas-dev/etapa-10-seed-e-requests.md) |

### Passo 1 — Inicializar o projeto

> Etapa detalhada: [etapas-dev/etapa-01-setup.md](etapas-dev/etapa-01-setup.md) (cobre os passos 1 a 7).

```bash
npm init -y
```

Isso cria um `package.json` com valores padrão.

### Passo 2 — Instalar dependências de produção

```bash
npm install express sqlite3 zod
```

- `express` — framework HTTP
- `sqlite3` — driver do banco
- `zod` — validação

### Passo 3 — Instalar dependências de desenvolvimento

```bash
npm install -D typescript tsx @types/node @types/express
```

- `typescript` — compilador TS
- `tsx` — executor TS com hot-reload
- `@types/*` — tipagens

### Passo 4 — Configurar o TypeScript

Crie o arquivo `tsconfig.json` na raiz com:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

> **O que é `strict: true`?** Liga todas as checagens rigorosas do TypeScript. Força você a pensar em `null`/`undefined` e tipos desde o início — é o que queremos em um projeto de aprendizado.

### Passo 5 — Adicionar scripts no `package.json`

No `package.json`, substitua o campo `"scripts"` por:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:init": "tsx src/database/init.ts",
  "db:seed": "tsx src/database/seed.ts"
}
```

### Passo 6 — Criar o `.gitignore`

```
node_modules/
dist/
*.db
.env
```

> O arquivo do banco (`.db`) **não** é versionado — cada máquina gera o seu.

### Passo 7 — Criar a estrutura de pastas

No terminal, a partir da raiz do projeto:

```bash
mkdir -p src/{config,models,repositories,services,controllers,routes,middlewares,schemas,errors,database}
```

### Passo 8 — Escrever o schema do banco

> Etapa detalhada: [etapas-dev/etapa-02-banco-de-dados.md](etapas-dev/etapa-02-banco-de-dados.md) (cobre os passos 8 a 10).

Crie `src/database/schema.sql`:

```sql
CREATE TABLE IF NOT EXISTS customers (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  phone      TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  description TEXT,
  price       REAL NOT NULL CHECK (price > 0),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  total       REAL NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity   INTEGER NOT NULL CHECK (quantity > 0),
  unit_price REAL    NOT NULL CHECK (unit_price > 0),
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Passo 9 — Script de inicialização do banco

Crie `src/database/init.ts`:

```typescript
import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve(__dirname, "../../database.db");
const schemaPath = path.resolve(__dirname, "schema.sql");

const schema = fs.readFileSync(schemaPath, "utf-8");
const db = new sqlite3.Database(dbPath);

db.exec(schema, (err) => {
  if (err) {
    console.error("Erro ao criar o schema:", err);
    process.exit(1);
  }
  console.log("Banco inicializado com sucesso em", dbPath);
  db.close();
});
```

### Passo 10 — Conexão centralizada com o banco

Crie `src/config/database.ts`:

```typescript
import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../database.db");

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco:", err);
    process.exit(1);
  }
});

db.run("PRAGMA foreign_keys = ON;");
```

> **Por que `PRAGMA foreign_keys = ON`?** Por padrão, o SQLite **não** aplica as regras de chave estrangeira. Essa linha liga a verificação.

### Passo 11 — Models (interfaces)

> Etapa detalhada: [etapas-dev/etapa-03-models.md](etapas-dev/etapa-03-models.md).

**`src/models/product.model.ts`**

```typescript
export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  created_at: string;
}

export type CreateProductInput = Omit<Product, "id" | "created_at">;
export type UpdateProductInput = Partial<CreateProductInput>;
```

**`src/models/customer.model.ts`**

```typescript
export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export type CreateCustomerInput = Omit<Customer, "id" | "created_at">;
export type UpdateCustomerInput = Partial<CreateCustomerInput>;
```

**`src/models/order.model.ts`**

```typescript
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id: number;
  customer_id: number;
  total: number;
  created_at: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface CreateOrderInput {
  customer_id: number;
  items: Array<{ product_id: number; quantity: number }>;
}
```

### Passo 12 — Classe de erro customizada

> Etapa detalhada: [etapas-dev/etapa-04-erros-e-validacoes.md](etapas-dev/etapa-04-erros-e-validacoes.md) (cobre os passos 12 e 13).

Crie `src/errors/app-error.ts`:

```typescript
export class AppError extends Error {
  constructor(public message: string, public statusCode = 400) {
    super(message);
  }
}
```

> Com essa classe conseguimos **lançar erros com um código HTTP** direto do Service. O middleware de erros vai capturar e formatar a resposta.

### Passo 13 — Schemas de validação (Zod)

**`src/schemas/product.schema.ts`**

```typescript
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive()
});

export const updateProductSchema = createProductSchema.partial();
```

**`src/schemas/customer.schema.ts`**

```typescript
import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();
```

**`src/schemas/order.schema.ts`**

```typescript
import { z } from "zod";

export const createOrderSchema = z.object({
  customer_id: z.number().int().positive(),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive()
      })
    )
    .min(1)
});
```

### Passo 14 — Implementando a primeira entidade: **Product**

> Etapa detalhada: [etapas-dev/etapa-05-product.md](etapas-dev/etapa-05-product.md).

Vamos implementar a entidade mais simples primeiro (ela não depende de nenhuma outra). Siga a ordem: **Repository → Service → Controller → Routes**.

#### 14.1. Repository

O SQLite original usa callbacks. Para deixar o código mais limpo, vamos usar o padrão *Promise wrapper*.

**`src/repositories/product.repository.ts`**

```typescript
import { db } from "../config/database";
import { Product, CreateProductInput, UpdateProductInput } from "../models/product.model";

export const productRepository = {
  findAll(): Promise<Product[]> {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM products ORDER BY id", (err, rows: Product[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  findById(id: number): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM products WHERE id = ?", [id], (err, row: Product | undefined) => {
        if (err) reject(err);
        else resolve(row ?? null);
      });
    });
  },

  create(input: CreateProductInput): Promise<Product> {
    return new Promise((resolve, reject) => {
      const { name, description, price } = input;
      db.run(
        "INSERT INTO products (name, description, price) VALUES (?, ?, ?)",
        [name, description ?? null, price],
        function (err) {
          if (err) return reject(err);
          productRepository.findById(this.lastID).then((p) => resolve(p!)).catch(reject);
        }
      );
    });
  },

  update(id: number, input: UpdateProductInput): Promise<Product | null> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: unknown[] = [];
      if (input.name !== undefined)        { fields.push("name = ?");        values.push(input.name); }
      if (input.description !== undefined) { fields.push("description = ?"); values.push(input.description); }
      if (input.price !== undefined)       { fields.push("price = ?");       values.push(input.price); }
      if (fields.length === 0) return productRepository.findById(id).then(resolve).catch(reject);

      values.push(id);
      db.run(`UPDATE products SET ${fields.join(", ")} WHERE id = ?`, values, (err) => {
        if (err) return reject(err);
        productRepository.findById(id).then(resolve).catch(reject);
      });
    });
  },

  delete(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM products WHERE id = ?", [id], function (err) {
        if (err) reject(err);
        else resolve(this.changes > 0);
      });
    });
  },

  existsInOrder(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1",
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

#### 14.2. Service

**`src/services/product.service.ts`**

```typescript
import { productRepository } from "../repositories/product.repository";
import { CreateProductInput, UpdateProductInput } from "../models/product.model";
import { AppError } from "../errors/app-error";

export const productService = {
  list() {
    return productRepository.findAll();
  },

  async getById(id: number) {
    const product = await productRepository.findById(id);
    if (!product) throw new AppError("Produto não encontrado", 404);
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
      throw new AppError("Produto não pode ser removido: há pedidos associados", 409);
    }
    await productRepository.delete(id);
  }
};
```

#### 14.3. Controller

**`src/controllers/product.controller.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import { productService } from "../services/product.service";
import { createProductSchema, updateProductSchema } from "../schemas/product.schema";

export const productController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.list());
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      res.json(await productService.getById(Number(req.params.id)));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      res.status(201).json(await productService.create(data));
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const data = updateProductSchema.parse(req.body);
      res.json(await productService.update(Number(req.params.id), data));
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.remove(Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  }
};
```

#### 14.4. Routes

**`src/routes/product.routes.ts`**

```typescript
import { Router } from "express";
import { productController } from "../controllers/product.controller";

const router = Router();

router.get("/",       productController.list);
router.get("/:id",    productController.getById);
router.post("/",      productController.create);
router.put("/:id",    productController.update);
router.delete("/:id", productController.remove);

export default router;
```

### Passo 15 — Repetir o padrão para **Customer**

> Etapa detalhada: [etapas-dev/etapa-06-customer.md](etapas-dev/etapa-06-customer.md).

A estrutura é idêntica à de Product. Aplique as regras:
- **RN01**: e-mail único → antes de criar/atualizar, verifique se o e-mail já existe com outro `id`. Se existir, lance `new AppError("E-mail já cadastrado", 409)`.
- **RN06**: não remover cliente com pedidos → crie um método `existsInOrder(customerId)` no repository, análogo ao de product.

Siga o mesmo passo a passo: `customer.repository.ts` → `customer.service.ts` → `customer.controller.ts` → `customer.routes.ts`.

### Passo 16 — Implementando **Order** (a mais complexa)

> Etapa detalhada: [etapas-dev/etapa-07-order.md](etapas-dev/etapa-07-order.md).

A criação de um pedido envolve **mais de uma tabela** (`orders` + `order_items`). Por isso, o Service de pedidos precisa:

1. Validar que o cliente existe.
2. Para cada item, buscar o produto no banco e **copiar o preço atual** (RN05).
3. Calcular o `total` somando `quantity * unit_price`.
4. Inserir o registro em `orders`.
5. Inserir todos os registros em `order_items`.
6. Devolver o pedido com seus itens.

> **Dica importante**: tudo isso deveria ocorrer dentro de uma **transação** (`BEGIN TRANSACTION` … `COMMIT` / `ROLLBACK`). Se a inserção de um item falhar no meio, o pedido ficaria corrompido. Deixamos a implementação da transação como **desafio** (seção 10).

**`src/repositories/order.repository.ts`** (esqueleto)

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

  findAll(): Promise<Order[]> { /* SELECT * FROM orders ORDER BY id DESC */ return new Promise((r) => r([])); },
  findByCustomerId(customerId: number): Promise<Order[]> { /* similar, filtrado */ return new Promise((r) => r([])); }
};
```

**`src/services/order.service.ts`** (essência)

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
  }
  // ...getById, list, listByCustomer
};
```

Controller e Routes seguem o mesmo padrão dos anteriores.

### Passo 17 — Agregador de rotas

> Etapa detalhada: [etapas-dev/etapa-08-rotas-e-middleware.md](etapas-dev/etapa-08-rotas-e-middleware.md) (cobre os passos 17 e 18).

**`src/routes/index.ts`**

```typescript
import { Router } from "express";
import productRoutes from "./product.routes";
import customerRoutes from "./customer.routes";
import orderRoutes from "./order.routes";

const router = Router();

router.use("/products", productRoutes);
router.use("/customers", customerRoutes);
router.use("/orders", orderRoutes);

export default router;
```

### Passo 18 — Middleware de tratamento de erros

**`src/middlewares/error-handler.ts`**

```typescript
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Dados inválidos", details: err.issues });
  }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Erro interno no servidor" });
}
```

> **Importante**: este middleware precisa ter **4 parâmetros** — é assim que o Express reconhece que ele é um handler de erro.

### Passo 19 — Configurando o Express (`app.ts`)

> Etapa detalhada: [etapas-dev/etapa-09-app-e-server.md](etapas-dev/etapa-09-app-e-server.md) (cobre os passos 19 e 20).

**`src/app.ts`**

```typescript
import express from "express";
import routes from "./routes";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();

app.use(express.json());
app.use(routes);
app.use(errorHandler);   // sempre por último
```

### Passo 20 — Subindo o servidor (`server.ts`)

**`src/server.ts`**

```typescript
import { app } from "./app";

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
```

### Passo 21 — Seed (dados iniciais de exemplo)

> Etapa detalhada: [etapas-dev/etapa-10-seed-e-requests.md](etapas-dev/etapa-10-seed-e-requests.md) (cobre os passos 21 e 22).

**`src/database/seed.ts`**

```typescript
import { db } from "../config/database";

db.serialize(() => {
  db.run("DELETE FROM order_items");
  db.run("DELETE FROM orders");
  db.run("DELETE FROM products");
  db.run("DELETE FROM customers");

  db.run("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)", ["Maria Silva", "maria@email.com", "11999990001"]);
  db.run("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)", ["João Pereira", "joao@email.com", "11999990002"]);

  db.run("INSERT INTO products (name, description, price) VALUES (?, ?, ?)", ["Arroz 5kg", "Arroz branco tipo 1", 28.90]);
  db.run("INSERT INTO products (name, description, price) VALUES (?, ?, ?)", ["Feijão 1kg", "Feijão carioca", 9.50]);
  db.run("INSERT INTO products (name, description, price) VALUES (?, ?, ?)", ["Óleo de Soja 900ml", null, 7.20]);

  console.log("Seed executado com sucesso.");
});
```

### Passo 22 — Arquivo de requisições (`requests.http`)

Crie na raiz do projeto um arquivo `requests.http` com exemplos (veja seção 7 abaixo).

---

## 6. Como executar

```bash
# 1. Instalar dependências
npm install

# 2. Criar o banco de dados (só precisa fazer uma vez)
npm run db:init

# 3. (Opcional) Popular o banco com dados de exemplo
npm run db:seed

# 4. Subir o servidor em modo desenvolvimento (com hot-reload)
npm run dev
```

O servidor ficará disponível em `http://localhost:3000`.

Para **testar os endpoints** sem precisar do Postman ou Insomnia:
1. Instale a extensão **REST Client** no VS Code.
2. Abra o arquivo `requests.http`.
3. Clique em **Send Request** acima de cada requisição.

---

## 7. Endpoints e exemplos

O arquivo `requests.http` contém requisições prontas para todos os endpoints. Abaixo está um resumo.

### Produtos

```http
### Listar todos os produtos
GET http://localhost:3000/products

### Buscar um produto
GET http://localhost:3000/products/1

### Criar um produto
POST http://localhost:3000/products
Content-Type: application/json

{
  "name": "Açúcar Refinado 1kg",
  "description": "Açúcar cristal refinado",
  "price": 5.90
}

### Atualizar um produto
PUT http://localhost:3000/products/1
Content-Type: application/json

{
  "price": 29.90
}

### Remover um produto
DELETE http://localhost:3000/products/1
```

### Clientes

```http
### Criar um cliente
POST http://localhost:3000/customers
Content-Type: application/json

{
  "name": "Ana Souza",
  "email": "ana@email.com",
  "phone": "11988887777"
}

### Listar pedidos de um cliente
GET http://localhost:3000/customers/1/orders
```

### Pedidos

```http
### Criar um pedido
POST http://localhost:3000/orders
Content-Type: application/json

{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 2, "quantity": 3 }
  ]
}

### Ver um pedido específico (com os itens)
GET http://localhost:3000/orders/1
```

### Códigos de status esperados

| Ação | Status |
|---|---|
| GET com sucesso | 200 |
| POST com sucesso (criação) | 201 |
| DELETE com sucesso | 204 |
| Dados inválidos | 400 |
| Recurso não encontrado | 404 |
| Conflito (ex.: e-mail duplicado, produto em uso) | 409 |
| Erro inesperado | 500 |

---

## 8. Tratamento de erros

Todos os erros passam pelo middleware `errorHandler`, que padroniza a resposta em JSON:

```json
{ "error": "Produto não encontrado" }
```

Para erros de validação do Zod, o formato é:

```json
{
  "error": "Dados inválidos",
  "details": [
    { "path": ["price"], "message": "Expected number, received string" }
  ]
}
```

> **Importante**: nenhuma camada além do middleware deve chamar `res.status(500)`. Os Services lançam `AppError` e o middleware cuida de traduzir para HTTP.

---

## 9. Dicas de estudo

Conforme for implementando, faça os seguintes exercícios:

1. **Desenhe o fluxo**: para cada endpoint, escreva em uma folha o caminho `Request → Routes → Controller → Service → Repository → SQL → volta`. Isso fixa a arquitetura.
2. **Erre de propósito**: mande um POST sem o campo `name`, mande um preço negativo, tente criar um pedido com um cliente que não existe. Veja se os erros respondem o que deveriam.
3. **Leia o SQL**: abra o arquivo `.db` com a extensão [SQLite Viewer](https://marketplace.visualstudio.com/items?itemName=qwtel.sqlite-viewer) do VS Code e acompanhe os dados sendo inseridos.
4. **Experimente quebrar a arquitetura**: tente chamar o Repository direto do Controller. Note o desconforto. Essa é a dor que a arquitetura em camadas evita.

---

## 10. Desafios propostos

Depois que você tiver o CRUD funcionando, tente resolver estes problemas **sem olhar a solução**:

1. **Transação na criação de pedido**: envolva a criação de `orders` + inserção de `order_items` em uma transação (`BEGIN TRANSACTION` / `COMMIT` / `ROLLBACK`). Se qualquer inserção falhar, nada deve ser persistido.
2. **Filtros na listagem de produtos**: adicione `GET /products?name=arroz` que filtre por nome.
3. **Paginação**: aceite `?page=1&pageSize=10` em `/orders`.
4. **Controle de estoque**: adicione um campo `stock` em `products`. Ao criar um pedido, **abata** a quantidade comprada e rejeite o pedido se não houver estoque suficiente.
5. **Soft delete**: em vez de apagar clientes, marque-os como `deleted_at` e filtre das listagens.
6. **Relatório simples**: crie `GET /reports/top-products` que retorne os 5 produtos mais vendidos (soma de `quantity` em `order_items`).

---

## Créditos

Projeto didático desenvolvido para apoiar estudantes de **Análise e Desenvolvimento de Sistemas** no primeiro contato com APIs REST em Node + TypeScript.

Leitura complementar obrigatória: **[Analise.md](Analise.md)**.
