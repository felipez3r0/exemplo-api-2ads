# Etapa 10 — Seed de dados e `requests.http`

> Objetivo: popular o banco com dados iniciais para testar rapidamente e criar um arquivo `requests.http` com requisições prontas para usar com a extensão REST Client do VS Code.

## Pré-requisitos

- Etapas 01 a 09 concluídas (servidor sobe em `npm run dev`).

## Resultado esperado ao final da etapa

- `src/database/seed.ts` — script que limpa e insere dados de exemplo (2 clientes, 3 produtos).
- `requests.http` na raiz — requisições prontas para todos os endpoints.
- `npm run db:seed` executa sem erros e popula o banco.

## Passo a passo

### 1. Script de seed

Crie **`src/database/seed.ts`** com exatamente este conteúdo:

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

> **Ordem das deleções importa**: por causa das chaves estrangeiras, é preciso apagar primeiro `order_items`, depois `orders`, depois `products` e `customers`. `db.serialize` garante que os comandos rodam em sequência.

### 2. Executar o seed

```bash
npm run db:seed
```

Deve imprimir `Seed executado com sucesso.` no terminal.

### 3. Arquivo `requests.http`

Crie **`requests.http`** na **raiz do projeto** com exatamente este conteúdo:

```http
### ---------- PRODUCTS ----------

### Listar todos os produtos
GET http://localhost:3000/products

### Buscar um produto pelo id
GET http://localhost:3000/products/1

### Criar um produto
POST http://localhost:3000/products
Content-Type: application/json

{
  "name": "Açúcar Refinado 1kg",
  "description": "Açúcar cristal refinado",
  "price": 5.90
}

### Atualizar parcialmente um produto
PUT http://localhost:3000/products/1
Content-Type: application/json

{
  "price": 29.90
}

### Remover um produto
DELETE http://localhost:3000/products/1


### ---------- CUSTOMERS ----------

### Listar todos os clientes
GET http://localhost:3000/customers

### Buscar um cliente
GET http://localhost:3000/customers/1

### Criar um cliente
POST http://localhost:3000/customers
Content-Type: application/json

{
  "name": "Ana Souza",
  "email": "ana@email.com",
  "phone": "11988887777"
}

### Atualizar um cliente
PUT http://localhost:3000/customers/1
Content-Type: application/json

{
  "phone": "11911112222"
}

### Listar pedidos de um cliente
GET http://localhost:3000/customers/1/orders

### Remover um cliente
DELETE http://localhost:3000/customers/1


### ---------- ORDERS ----------

### Listar todos os pedidos
GET http://localhost:3000/orders

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

### Ver um pedido específico (com itens)
GET http://localhost:3000/orders/1


### ---------- CASOS DE ERRO (para testar validações) ----------

### 400 — payload inválido (sem name)
POST http://localhost:3000/products
Content-Type: application/json

{
  "price": 10
}

### 404 — produto inexistente
GET http://localhost:3000/products/9999

### 409 — e-mail já cadastrado
POST http://localhost:3000/customers
Content-Type: application/json

{
  "name": "Duplicado",
  "email": "maria@email.com"
}
```

### 4. Testar manualmente no VS Code

1. Instale a extensão **REST Client** (autor: Huachao Mao).
2. Abra `requests.http`.
3. Clique em **Send Request** logo acima de cada requisição (aparece como link no editor).

Ou, via `curl`, rode por exemplo:

```bash
curl -s http://localhost:3000/products | head
curl -s -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"customer_id":1,"items":[{"product_id":1,"quantity":2},{"product_id":2,"quantity":3}]}'
```

## Verificação final

Com o servidor rodando (`npm run dev`) e o seed aplicado:

1. `GET /products` devolve 3 produtos.
2. `GET /customers` devolve 2 clientes.
3. `POST /orders` com o body de exemplo acima devolve status **201** e um JSON com `id`, `total = 2*28.90 + 3*9.50 = 86.3` e a lista `items` preenchida.
4. `GET /orders/1` devolve o pedido com `items`.
5. `GET /customers/1/orders` devolve a lista de pedidos do cliente 1.
6. Os casos de erro do final do `requests.http` retornam, respectivamente, 400, 404 e 409.

## Fim do roteiro

A API está completa em relação ao escopo descrito em `Analise.md`. Próximos passos recomendados (opcionais): atacar os **desafios propostos** listados na seção 10 do `README.md` — transação, filtros, paginação, estoque, soft delete e relatório.
