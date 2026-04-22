# Etapa 03 — Models (interfaces TypeScript)

> Objetivo: descrever o **formato dos dados** com interfaces TypeScript. Esses tipos serão usados por Repositories, Services e Controllers para trafegar dados entre as camadas.

## Pré-requisitos

- Etapas 01 e 02 concluídas (pastas criadas, banco inicializado).

## Resultado esperado ao final da etapa

- `src/models/product.model.ts` — interface `Product` + tipos de input de criação/atualização.
- `src/models/customer.model.ts` — interface `Customer` + tipos de input.
- `src/models/order.model.ts` — interfaces `Order`, `OrderItem`, `OrderWithItems` + tipo de input.

> Models **não** contêm lógica, SQL, HTTP nem validação. São apenas contratos de tipo.

## Passo a passo

### 1. Product

Crie **`src/models/product.model.ts`** com exatamente este conteúdo:

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

### 2. Customer

Crie **`src/models/customer.model.ts`** com exatamente este conteúdo:

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

### 3. Order e OrderItem

Crie **`src/models/order.model.ts`** com exatamente este conteúdo:

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

> **Notas importantes**:
> - `OrderWithItems` estende `Order` adicionando a lista de itens — é o formato devolvido em `GET /orders/:id`.
> - `CreateOrderInput` **não** tem `total`: o total é calculado pelo Service (RF09), não vem do cliente HTTP.
> - O `unit_price` também **não** está em `CreateOrderInput`: ele é copiado do produto no momento da venda (RN05).

## Verificação

1. Os três arquivos devem existir em `src/models/`.
2. Nenhum deles deve importar nada de `express`, `sqlite3` ou `zod` — Models são puros.
3. Executar `npx tsc --noEmit` **não** deve reportar erros nestes arquivos.

## Próxima etapa

Siga para **[etapa-04-erros-e-validacoes.md](etapa-04-erros-e-validacoes.md)** para criar a classe de erro customizada e os schemas Zod.
