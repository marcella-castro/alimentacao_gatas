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

// Conectar ao SQLite
const db = new sqlite3.Database('alimentacao.db', (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
  } else {
    console.log('Conectado ao banco de dados SQLite');
    // Criar tabela se não existir
    db.run(`CREATE TABLE IF NOT EXISTS alimentacao (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gata TEXT NOT NULL,
      data TEXT NOT NULL,
      racao TEXT NOT NULL,
      quantidade REAL NOT NULL,
      kcalTotal REAL NOT NULL
    )`);
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

app.post('/api/alimentacao', (req, res) => {
  const { gata, data, racao, quantidade, kcalTotal } = req.body;
  db.run(
    'INSERT INTO alimentacao (gata, data, racao, quantidade, kcalTotal) VALUES (?, ?, ?, ?, ?)',
    [gata, data, racao, quantidade, kcalTotal],
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
        kcalTotal
      });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse em http://localhost:${PORT}/`);
});