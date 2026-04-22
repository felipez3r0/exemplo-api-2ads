# Etapa 01 — Setup inicial do projeto

> Objetivo: preparar do zero o ambiente do projeto: `package.json`, dependências, TypeScript, scripts, `.gitignore` e a estrutura de pastas vazia. Ao final desta etapa, **nenhum código de aplicação ainda foi escrito** — só o esqueleto está pronto.

## Pré-requisitos

- Node.js **20 ou superior** instalado (`node --version`).
- `npm` disponível (`npm --version`).
- Estar em um diretório vazio (ou na raiz do repositório `exemplo-api-2ads`).

## Resultado esperado ao final da etapa

- `package.json` criado com scripts `dev`, `build`, `start`, `db:init`, `db:seed`.
- Dependências de produção instaladas: `express`, `sqlite3`, `zod`.
- Dependências de desenvolvimento instaladas: `typescript`, `tsx`, `@types/node`, `@types/express`.
- `tsconfig.json` configurado com `strict: true`.
- `.gitignore` criado.
- Pastas criadas dentro de `src/`: `config/`, `models/`, `repositories/`, `services/`, `controllers/`, `routes/`, `middlewares/`, `schemas/`, `errors/`, `database/`.

## Passo a passo

### 1. Inicializar o `package.json`

Execute na raiz do projeto:

```bash
npm init -y
```

### 2. Instalar dependências de produção

```bash
npm install express sqlite3 zod
```

### 3. Instalar dependências de desenvolvimento

```bash
npm install -D typescript tsx @types/node @types/express
```

### 4. Criar o `tsconfig.json` na raiz

Crie o arquivo **`tsconfig.json`** com exatamente este conteúdo:

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

### 5. Ajustar scripts no `package.json`

Abra `package.json` e **substitua** o campo `"scripts"` inteiro por:

```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "db:init": "tsx src/database/init.ts",
  "db:seed": "tsx src/database/seed.ts"
}
```

> Se o `package.json` já tiver um `scripts` com `"test"` padrão do `npm init`, remova-o e coloque o bloco acima no lugar.

### 6. Criar o `.gitignore` na raiz

Crie o arquivo **`.gitignore`** com exatamente este conteúdo:

```
node_modules/
dist/
*.db
.env
```

### 7. Criar a estrutura de pastas

Execute o comando abaixo a partir da raiz do projeto:

```bash
mkdir -p src/config src/models src/repositories src/services src/controllers src/routes src/middlewares src/schemas src/errors src/database
```

## Verificação

Após seguir os passos:

1. O comando `ls src` deve listar: `config`, `controllers`, `database`, `errors`, `middlewares`, `models`, `repositories`, `routes`, `schemas`, `services`.
2. O comando `cat tsconfig.json` deve mostrar `"strict": true`.
3. O comando `cat package.json | grep dev` deve mostrar a linha `"dev": "tsx watch src/server.ts"`.
4. `node_modules/` deve existir na raiz.

## Próxima etapa

Siga para **[etapa-02-banco-de-dados.md](etapa-02-banco-de-dados.md)** para criar o schema SQL e a conexão com o SQLite.
