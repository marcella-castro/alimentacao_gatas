const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../frontend')));
// Também expor a raiz do projeto para servir imagens que fiquem no root (ex.: "icon marte.png")
app.use(express.static(path.join(__dirname, '..')));

// Conectar ao SQLite (usar caminho absoluto relativo ao projeto)
const dbPath = path.join(__dirname, '..', 'alimentacao.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados SQLite:', dbPath);
    // Criar tabela se não existir
    db.run(`CREATE TABLE IF NOT EXISTS alimentacao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gata TEXT NOT NULL,
      data TEXT NOT NULL,
      racao TEXT NOT NULL,
      quantidade REAL NOT NULL,
      kcalTotal REAL NOT NULL,
      tipo TEXT DEFAULT 'seca',
      molhadaTipo TEXT
    )`);

    // Garantir colunas antigas em DBs existentes: adicionar se faltar
    db.all("PRAGMA table_info('alimentacao')", [], (err, cols) => {
      if (err) return console.error('Erro PRAGMA:', err);
      const names = cols.map(c => c.name);
      if (!names.includes('tipo')) {
        db.run("ALTER TABLE alimentacao ADD COLUMN tipo TEXT DEFAULT 'seca'");
      }
      if (!names.includes('molhadaTipo')) {
        db.run("ALTER TABLE alimentacao ADD COLUMN molhadaTipo TEXT");
      }
    });
  }
});

// Rotas
app.get('/api/alimentacao', (req, res) => {
  db.all('SELECT * FROM alimentacao ORDER BY data', [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.json(rows);
  });
});

// Endpoint para download do arquivo SQLite (alimentacao.db)
app.get('/api/download-db', (req, res) => {
  const dbFile = dbPath; // definido acima
  res.download(dbFile, 'alimentacao.db', (err) => {
    if (err) {
      console.error('Erro ao enviar DB para download:', err);
      if (!res.headersSent) res.status(500).json({ message: 'Erro ao disponibilizar o arquivo de banco de dados' });
    }
  });
});

app.post('/api/alimentacao', (req, res) => {
  let { gata, data, racao, quantidade, kcalTotal, tipo, molhadaTipo } = req.body;

  // Normalizações e parsing
  quantidade = Number(quantidade) || 0;
  tipo = tipo || 'seca';
  molhadaTipo = molhadaTipo || null;

  // Mapeamentos de calorias conhecidos
  const secaKcalPerKg = {
    'Quatree Life': 3960,
    'Granplus Filhote': 4000,
    'Granplus Adulto': 3950
  };

  const molhadaKcalPer100 = {
    'Sachê Whiskas': 90,
    'Sachê GranPlus': 85,
    'Ração Úmida Pet Delícia': 300
  };

  // Sempre calcular kcalTotal no servidor a partir de tipo e ração fornecidos
  if (tipo === 'molhada') {
    const per100 = molhadaKcalPer100[molhadaTipo] || 0;
    kcalTotal = (quantidade / 100.0) * per100;
  } else {
    const perKg = secaKcalPerKg[racao] || 0;
    kcalTotal = (quantidade / 1000.0) * perKg;
  }

  db.run(
    'INSERT INTO alimentacao (gata, data, racao, quantidade, kcalTotal, tipo, molhadaTipo) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [gata, data, racao, quantidade, kcalTotal, tipo, molhadaTipo],
    function(err) {
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        gata,
        data,
        racao,
        quantidade,
        kcalTotal,
        tipo,
        molhadaTipo
      });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse em http://localhost:${PORT}/`);
});