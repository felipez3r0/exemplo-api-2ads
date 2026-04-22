# Etapa 04 — Erros customizados e validações Zod

> Objetivo: ter o ferramental para **lançar erros com status HTTP** (a partir dos Services) e para **validar payloads de entrada** (nos Controllers) antes que os dados alcancem a camada de negócio.

## Pré-requisitos

- Etapas 01 a 03 concluídas.

## Resultado esperado ao final da etapa

- `src/errors/app-error.ts` — classe `AppError`.
- `src/schemas/product.schema.ts` — schemas Zod de create/update de produto.
- `src/schemas/customer.schema.ts` — schemas Zod de create/update de cliente.
- `src/schemas/order.schema.ts` — schema Zod de criação de pedido.

## Passo a passo

### 1. Classe de erro customizada

Crie **`src/errors/app-error.ts`** com exatamente este conteúdo:

```typescript
export class AppError extends Error {
  constructor(public message: string, public statusCode = 400) {
    super(message);
  }
}
```

> **Como funciona**: sempre que um Service precisar interromper o fluxo com uma mensagem significativa (ex.: "Produto não encontrado", "E-mail já cadastrado"), ele lança `new AppError("mensagem", statusCode)`. O middleware de erro (etapa 08) captura e devolve a resposta HTTP correta.

### 2. Schema de validação de Product

Crie **`src/schemas/product.schema.ts`** com exatamente este conteúdo:

```typescript
import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive()
});

export const updateProductSchema = createProductSchema.partial();
```

### 3. Schema de validação de Customer

Crie **`src/schemas/customer.schema.ts`** com exatamente este conteúdo:

```typescript
import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional()
});

export const updateCustomerSchema = createCustomerSchema.partial();
```

### 4. Schema de validação de Order

Crie **`src/schemas/order.schema.ts`** com exatamente este conteúdo:

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

> **Notas**:
> - `.min(1)` no array apoia a RN03 (pedido tem pelo menos um item).
> - `quantity: z.number().int().positive()` apoia a RN04.
> - `price: z.number().positive()` no product apoia a RN02.
> - Usar `updateCustomerSchema = createCustomerSchema.partial()` permite `PUT` parcial.

## Verificação

1. Os quatro arquivos devem existir.
2. Executar `npx tsc --noEmit` não deve reportar erros.
3. Nenhum arquivo de schema importa de `express` ou do banco — schemas são puros.

## Próxima etapa

Siga para **[etapa-05-product.md](etapa-05-product.md)** para implementar a primeira entidade completa (Product), da Repository até as Routes.
