# Controle de Alimentação - Marte e Vênus

Sistema para controle e acompanhamento da alimentação das gatas Marte e Vênus.

## Funcionalidades

- Registro diário da alimentação
- Acompanhamento por gráficos
- Controle de gramas e calorias
- Médias semanais
- Diferentes tipos de ração com valores calóricos

## Tecnologias Utilizadas

- HTML
- CSS
- JavaScript
- Chart.js para gráficos
- Node.js e SQLite para backend

## Como usar

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor:
   ```bash
   npm start
   ```
4. Acesse o sistema em `http://localhost:3000`

## Estrutura do Projeto

```
alimentacao_gatas/
├── backend/           # Servidor Node.js
├── frontend/         # Interface do usuário
│   ├── css/         # Estilos
│   ├── js/          # JavaScript
│   └── index.html   # Página principal
└── package.json     # Dependências
```