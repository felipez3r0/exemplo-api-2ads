# Etapa 02 — Banco de dados (schema, init e conexão)

> Objetivo: criar a estrutura física do banco SQLite e a conexão compartilhada que todas as demais camadas usarão.

## Pré-requisitos

- Etapa 01 concluída (pastas criadas, dependências instaladas).

## Resultado esperado ao final da etapa

- Arquivo `src/database/schema.sql` com as 4 tabelas do sistema.
- Arquivo `src/database/init.ts` que cria o banco físico a partir do schema.
- Arquivo `src/config/database.ts` que exporta a conexão `db` usada por toda a aplicação.
- Comando `npm run db:init` funcionando e gerando o arquivo `database.db` na raiz.

## Passo a passo

### 1. Criar o schema SQL

Crie o arquivo **`src/database/schema.sql`** com exatamente este conteúdo:

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

> **Detalhes importantes**:
> - `email` em `customers` é `UNIQUE` (apoia a RN01).
> - `price` em `products` tem `CHECK (price > 0)` (apoia a RN02).
> - `quantity` e `unit_price` em `order_items` também têm `CHECK > 0` (apoia RN02 e RN04).
> - `ON DELETE CASCADE` em `order_items.order_id` garante que remover um pedido remove seus itens.

### 2. Criar o script de inicialização

Crie o arquivo **`src/database/init.ts`** com exatamente este conteúdo:

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

### 3. Criar a conexão centralizada

Crie o arquivo **`src/config/database.ts`** com exatamente este conteúdo:

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

> **Por que `PRAGMA foreign_keys = ON`?** Por padrão o SQLite **não** aplica chaves estrangeiras. Essa linha liga a verificação — sem ela, as FKs de `orders` e `order_items` seriam ignoradas.

### 4. Executar a inicialização do banco

```bash
npm run db:init
```

## Verificação

1. O comando `npm run db:init` deve imprimir `Banco inicializado com sucesso em ...`.
2. O arquivo `database.db` deve existir na raiz do projeto (`ls database.db`).
3. O arquivo **não** deve aparecer em `git status` (o `.gitignore` da etapa 01 o ignora).

## Próxima etapa

Siga para **[etapa-03-models.md](etapa-03-models.md)** para definir as interfaces TypeScript das entidades.
