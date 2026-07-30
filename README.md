# 🎯 Método SculptX - Sistema de Códigos

Sistema completo de geração e bloqueio de códigos para protocolo de treino e dieta personalizado.

---

## 📋 O QUE TEM AQUI

```
sculptx-render/
├── server.js ................. Backend (Node.js + Express + PostgreSQL)
├── package.json .............. Dependências
├── .env.example .............. Template de configuração
├── .gitignore ................ Ignorar arquivos
└── public/
    ├── index.html ............ Quiz SculptX (frontend)
    └── admin.html ............ Painel administrativo
```

---

## 🚀 COMO FAZER DEPLOY NO RENDER (5 MINUTOS)

### PASSO 1: Criar conta no Render
1. Vai pra **render.com**
2. Clica "Sign up"
3. Autoriza com GitHub

### PASSO 2: Criar PostgreSQL (banco de dados)
1. No Dashboard do Render, clica **"New +"**
2. Seleciona **"PostgreSQL"**
3. Preenche:
   - Name: `sculptx-db`
   - Database: `sculptx_db`
   - User: `postgres`
   - Region: São Paulo
   - Plan: **Free**
4. Clica "Create Database"
5. ⏳ Espera 1-2 minutos criar
6. Quando aparecer: **Clica em "Info"**
7. **COPIA a "Internal Database URL"** (vai precisar!)

### PASSO 3: Fazer upload pra GitHub
1. Abre Terminal/PowerShell nesta pasta
2. Roda:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/sculptx-render.git
git push -u origin main
```

### PASSO 4: Criar Web Service no Render
1. No Dashboard, clica **"New +"**
2. Seleciona **"Web Service"**
3. Autoriza GitHub
4. Procura e seleciona: **`sculptx-render`**
5. Preenche:
   - Name: `sculptx-app`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Plan: **Free**
6. Clica "Create Web Service"
7. ⏳ Espera 2-3 minutos fazer deploy

### PASSO 5: Configurar variáveis de ambiente
1. No seu Web Service, clica em **"Environment"**
2. Clica **"Add Environment Variable"**
3. Adiciona:
   ```
   DATABASE_URL = (aquela URL que você copiou do PostgreSQL no Passo 2)
   ```
4. Clica "Add"
5. Adiciona OUTRA variável:
   ```
   ADMIN_PASSWORD = 01010924Clo#
   ```
6. Clica "Add"
7. ⏳ Render faz redeploy automático

---

## ✅ TESTAR SE FUNCIONOU

Sua URL vai aparecer assim: `https://sculptx-app-xxxx.onrender.com`

1. **Testar se tá online:**
   ```
   https://sua-url.onrender.com/health
   ```
   Deve mostrar: `{"status":"ok"}`

2. **Acessar o quiz:**
   ```
   https://sua-url.onrender.com/
   ```
   Deve carregar a página do quiz

3. **Acessar painel admin:**
   ```
   https://sua-url.onrender.com/admin.html
   ```
   - Digita senha: `01010924Clo#`
   - Clica "Entrar"
   - Testa gerar um código

4. **Testar o código no quiz:**
   ```
   https://sua-url.onrender.com/?code=ABC123
   ```
   (substitui ABC123 pelo código que gerou)
   - Completa o quiz
   - Baixa PDF
   - Verifica se marcou como "USADO" no painel

---

## 🔑 SENHAS E URLS

- **Admin Password:** `01010924Clo#` (MUDE DEPOIS!)
- **Admin Panel:** `https://sua-url.onrender.com/admin.html`
- **Quiz:** `https://sua-url.onrender.com/`
- **API Check Code:** `POST /api/check-code`
- **API Use Code:** `POST /api/use-code`
- **API Generate Code:** `POST /api/generate-code` (requer senha)
- **API List Codes:** `POST /api/list-codes` (requer senha)

---

## ⚠️ LIMITAÇÕES DO PLANO GRATUITO

- **PostgreSQL:** Expira após 30 dias
  - Solução: Upgrade pra $7-15/mês OU recriar a cada 30 dias
- **Web Service:** Dorme após 15 min (demora 1 min pra acordar)
  - Solução: Upgrade pra $7/mês OU não é problema (funciona normal)

---

## 📞 SUPORTE

- Render Docs: `docs.render.com`
- Status: `status.render.com`

---

**PRONTO! 🚀**

Seu sistema está 100% pronto pra usar!
