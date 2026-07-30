const express = require('express');
const pg = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
// Rota específica para admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});// ═══════════════════════════════════════════════════════════════════
// CONFIGURAÇÃO POSTGRESQL
// ═══════════════════════════════════════════════════════════════════

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Testa conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ ERRO na conexão PostgreSQL:', err.message);
  } else {
    console.log('✅ Conectado ao PostgreSQL');
  }
});

// ═══════════════════════════════════════════════════════════════════
// CRIAR TABELAS (se não existirem)
// ═══════════════════════════════════════════════════════════════════

async function initDatabase() {
  try {
    // Tabela de códigos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS codigos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(6) UNIQUE NOT NULL,
        usado BOOLEAN DEFAULT false,
        criado_em TIMESTAMP DEFAULT NOW(),
        usado_em TIMESTAMP,
        nome_comprador VARCHAR(255),
        email_comprador VARCHAR(255)
      );
    `);

    // Tabela de planos gerados
    await pool.query(`
      CREATE TABLE IF NOT EXISTS planos (
        id SERIAL PRIMARY KEY,
        codigo_usado VARCHAR(6),
        nome VARCHAR(255),
        objetivo VARCHAR(50),
        sexo VARCHAR(10),
        idade INT,
        peso DECIMAL(5,2),
        altura INT,
        rotina VARCHAR(100),
        dias INT,
        tempo VARCHAR(50),
        nivel VARCHAR(50),
        divisao VARCHAR(100),
        foco VARCHAR(100),
        estilo VARCHAR(100),
        refeicoes INT,
        tdee INT,
        alvo_calorico INT,
        proteina_g INT,
        carbo_g INT,
        gordura_g INT,
        criado_em TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY(codigo_usado) REFERENCES codigos(codigo)
      );
    `);

    console.log('✅ Banco de dados inicializado');
  } catch (err) {
    console.error('❌ Erro ao inicializar banco:', err.message);
  }
}

initDatabase();

// ═══════════════════════════════════════════════════════════════════
// AUTENTICAÇÃO - Middleware
// ═══════════════════════════════════════════════════════════════════

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'senha_padrao_change_me';

function checkAdmin(req, res, next) {
  const auth = req.headers['authorization'] || '';
  if (auth !== ADMIN_PASSWORD) {
    return res.status(401).json({ ok: false, reason: 'unauthorized' });
  }
  next();
}

// ═══════════════════════════════════════════════════════════════════
// API: CHECK-CODE
// ═══════════════════════════════════════════════════════════════════

app.post('/api/check-code', async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({ ok: false, reason: 'missing_code' });
    }

    const result = await pool.query(
      'SELECT * FROM codigos WHERE codigo = $1',
      [codigo.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ ok: false, reason: 'code_not_found' });
    }

    const codeData = result.rows[0];

    if (codeData.usado) {
      return res.status(400).json({ ok: false, reason: 'code_already_used' });
    }

    return res.json({ ok: true, valid: true, buyerName: codeData.nome_comprador });

  } catch (err) {
    console.error('Erro em check-code:', err.message);
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// API: USE-CODE
// ═══════════════════════════════════════════════════════════════════

app.post('/api/use-code', async (req, res) => {
  try {
    const { codigo, buyerName, planoData } = req.body;

    if (!codigo) {
      return res.status(400).json({ ok: false, reason: 'missing_code' });
    }

    // Verifica se código existe
    const checkResult = await pool.query(
      'SELECT * FROM codigos WHERE codigo = $1',
      [codigo.toUpperCase()]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ ok: false, reason: 'code_not_found' });
    }

    const codeData = checkResult.rows[0];

    if (codeData.usado) {
      return res.status(400).json({ ok: false, reason: 'code_already_used' });
    }

    // Marca como usado
    const usedAt = new Date();
    await pool.query(
      'UPDATE codigos SET usado = true, usado_em = $1, nome_comprador = $2 WHERE codigo = $3',
      [usedAt, buyerName || null, codigo.toUpperCase()]
    );

    // Salva dados do plano (opcional)
    if (planoData) {
      await pool.query(
        `INSERT INTO planos (
          codigo_usado, nome, objetivo, sexo, idade, peso, altura, rotina,
          dias, tempo, nivel, divisao, foco, estilo, refeicoes,
          tdee, alvo_calorico, proteina_g, carbo_g, gordura_g
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          codigo.toUpperCase(),
          buyerName,
          planoData.objetivo,
          planoData.sexo,
          planoData.idade,
          planoData.peso,
          planoData.altura,
          planoData.rotina,
          planoData.dias,
          planoData.tempo,
          planoData.nivel,
          planoData.divisao,
          planoData.foco,
          planoData.estilo,
          planoData.refeicoes,
          planoData.tdee,
          planoData.alvo_calorico,
          planoData.proteina_g,
          planoData.carbo_g,
          planoData.gordura_g
        ]
      );
    }

    res.json({ ok: true, codigo, usedAt });

  } catch (err) {
    console.error('Erro em use-code:', err.message);
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// API: GENERATE-CODE (Admin)
// ═══════════════════════════════════════════════════════════════════

app.post('/api/generate-code', checkAdmin, async (req, res) => {
  try {
    const { buyerName, email } = req.body;

    // Função pra gerar código aleatório
    function randomCode(len = 6) {
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < len; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    }

    let codigo;
    let tries = 0;

    // Gera código único
    do {
      codigo = randomCode();
      const exists = await pool.query('SELECT id FROM codigos WHERE codigo = $1', [codigo]);
      if (exists.rows.length === 0) break;
      tries++;
    } while (tries < 10);

    if (tries >= 10) {
      return res.status(500).json({ ok: false, reason: 'could_not_generate_unique_code' });
    }

    // Insere no banco
    await pool.query(
      'INSERT INTO codigos (codigo, nome_comprador, email_comprador) VALUES ($1, $2, $3)',
      [codigo, buyerName || null, email || null]
    );

    res.json({ ok: true, codigo });

  } catch (err) {
    console.error('Erro em generate-code:', err.message);
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// API: LIST-CODES (Admin)
// ═══════════════════════════════════════════════════════════════════

app.post('/api/list-codes', checkAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM codigos ORDER BY criado_em DESC'
    );

    res.json({
      ok: true,
      codes: result.rows,
      total: result.rows.length
    });

  } catch (err) {
    console.error('Erro em list-codes:', err.message);
    res.status(500).json({ ok: false, reason: 'server_error', message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ═══════════════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Admin: http://localhost:${PORT}/admin.html`);
  console.log(`🎯 Quiz: http://localhost:${PORT}/`);
});
