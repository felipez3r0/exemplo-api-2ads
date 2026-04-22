# Etapa 08 — Agregador de rotas e middleware de erros

> Objetivo: reunir as rotas de todas as entidades em um único `Router` e implementar o middleware centralizado que traduz exceções em respostas HTTP.

## Pré-requisitos

- Etapas 01 a 07 concluídas (as três entidades já têm rotas).

## Resultado esperado ao final da etapa

- `src/routes/index.ts` — agregador que monta `/products`, `/customers`, `/orders`.
- `src/middlewares/error-handler.ts` — middleware com **4 parâmetros** que trata `ZodError`, `AppError` e erros genéricos.

## Passo a passo

### 1. Agregador de rotas

Crie **`src/routes/index.ts`** com exatamente este conteúdo:

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

> Cada `router.use(prefixo, subRouter)` monta o sub-roteador sob aquele prefixo. Assim, `GET /` definido em `product.routes.ts` passa a responder em `GET /products`.

### 2. Middleware de tratamento de erros

Crie **`src/middlewares/error-handler.ts`** com exatamente este conteúdo:

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

> **Regras críticas deste middleware**:
> - A assinatura **precisa ter exatamente 4 parâmetros** (`err, req, res, next`). É assim que o Express distingue um middleware de erro de um middleware normal. Mesmo que `_req` e `_next` não sejam usados, eles precisam estar presentes.
> - A ordem dos `if`s importa: `ZodError` primeiro (erro de validação → 400), depois `AppError` (status customizado), e por último o fallback 500.
> - Qualquer outra camada **não** deve responder com 500 diretamente — deixe o erro propagar e este middleware resolve.

## Verificação

1. Os dois arquivos existem.
2. `npx tsc --noEmit` não reporta erros.
3. Em `errorHandler`, a função tem `err, _req, res, _next` nessa ordem.

## Próxima etapa

Siga para **[etapa-09-app-e-server.md](etapa-09-app-e-server.md)** para plugar o Express e subir o servidor.
