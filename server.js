import express from 'express';
import cors from 'cors';
import Piscina from 'piscina';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const piscina = new Piscina({
  filename: path.join(__dirname, 'worker.js'),
});

// API: CHECK-CODE (Valida se código existe e não foi usado)
app.post('/api/check-code', async (req, res) => {
  try {
    const { codigo } = req.body;

    if (!codigo) {
      return res.status(400).json({ OK: false, razão: 'Código não fornecido' });
    }

    const resultado = await piscina.consulta(
      'SELECT * FROM codigos WHERE UPPER(codigo) = UPPER(?)',
      [codigo]
    );

    if (resultado.length === 0) {
      return res.status(400).json({ OK: false, razão: 'Código inválido' });
    }

    const codigoData = resultado[0];

    if (codigoData.usado) {
      return res.status(400).json({ OK: false, razão: 'Código já utilizado' });
    }

    res.json({ OK: true, codigo: codigoData.codigo });
  } catch (erro) {
    console.error('Erro em check-code:', erro.message);
    res.status(500).json({ OK: false, razão: 'Erro ao validar código' });
  }
});

// API: USE-CODE (Marca código como usado após validação)
app.post('/api/use-code', async (req, res) => {
  try {
    const { codigo, buyerName, planoData } = req.body;

    if (!codigo) {
      return res.status(400).json({ OK: false, razão: 'Código não fornecido' });
    }

    // Marca como usado - APENAS esse código específico
    const agora = new Date();
    await piscina.consulta(
      'UPDATE codigos SET usado = true, usado_em = ?, nome_do_comprador = COALESCE(?, "nulo") WHERE UPPER(codigo) = UPPER(?)',
      [agora, buyerName || null, codigo]
    );

    // Salva dados do plano (opcional)
    if (planoData) {
      await piscina.consulta(
        'INSERT INTO planos (codigo_usado, nome, objetivo, sexo, idade, peso, altura, rot, dias, tempo, nivel, divisao, foco, estilo, refeitórios, tdee, alvo_calórico, proteina_g, carboidrato, g) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          codigo.toUpperCase(),
          buyerName,
          planoData.objetivo,
          planoData.sexo,
          planoData.idade,
          planoData.peso,
          planoData.altura,
          planoData.rot,
          planoData.dias,
          planoData.tempo,
          planoData.nivel,
          planoData.divisão,
          planoData.foco,
          planoData.estilo,
          planoData.refeitórios,
          planoData.tdee,
          planoData.alvo_calórico,
          planoData.proteina_g,
          planoData.carboidrato,
          planoData.g
        ]
      );
    }

    res.json({ OK: true, verdadeiro: codigo, usado_em: agora });
  } catch (erro) {
    console.error('Erro em use-code:', erro.message);
    res.status(500).json({ OK: false, razão: 'Erro ao usar código' });
  }
});

// API: GERAR-CÓDIGO (Administrador)
app.post('/api/generate-code', checkAdmin, (req, res) => {
  const { nome_do_comprador, email } = req.body;

  try {
    if (!nome_do_comprador || !email) {
      return res.status(400).json({ OK: false, razão: 'Nome e email obrigatórios' });
    }

    const codigo = codigoAleatório();
    const criadoEm = new Date();

    piscina.consulta(
      'INSERT INTO codigos (codigo, nome_do_comprador, email, criado_em) VALUES (?, ?, ?, ?)',
      [codigo, nome_do_comprador, email, criadoEm]
    ).then(() => {
      res.json({ OK: true, codigo, email });
    }).catch((erro) => {
      console.error('Erro ao gerar código:', erro.message);
      res.status(500).json({ OK: false, razão: 'Erro ao gerar código' });
    });
  } catch (erro) {
    console.error('Erro em generate-code:', erro.message);
    res.status(500).json({ OK: false, razão: 'Erro ao processar requisição' });
  }
});

// Função para gerar código aleatório
function codigoAleatório(len = 6) {
  const personagens = 'ABCDEFGHJKMNPQRSTU';
  let código = '';
  for (let eu = 0; eu < len; eu++) {
    código += personagens[Math.floor(Math.random() * personagens.length)];
  }
  return código;
}

// Middleware: Verificar senha admin
function checkAdmin(req, res, next) {
  const { senha } = req.query;
  if (senha === '01010924Clo#') {
    next();
  } else {
    res.status(401).json({ OK: false, razão: 'Não autorizado' });
  }
}

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
