import express from "express";
import db from './config/database.js';
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import session from 'express-session';
import connectSqlite3 from 'connect-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Importando rotas
import propostaRoutes from './routes/propostaRoutes.js';
import contatoRoutes from './routes/contatoRoutes.js'; // Nova rota de contato
//Rotas de autenticação
import authRoutes from './routes/authRoutes.js';

// Configuração do Armazenamento de Sessão com SQLite
const SQLiteStore = connectSqlite3(session);

// Configuração das Sessões
app.use(session({
  store: new SQLiteStore({
    db: 'db.sqlite',    
    dir: './config',    
    table: 'sessions' 
  }),
  secret: 'secret-key', // Chave secreta para assinar o cookie da sessão 
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Em produção, usar true com HTTPS
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // Duração do cookie (ex: 1 dia)
  }
}));

// Middleware para expor informações da sessão para todas as views
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.userId; // Verdadeiro se userId existir na sessão
  res.locals.currentUser = req.session.user || null;  // Informações do usuário logado
  next();
});

//rotas de autenticação
app.use('/auth', authRoutes);



app.set("view engine", "ejs"); // Configura o EJS como template engine
app.use(express.static("public")); // Serve arquivos estáticos da pasta public


// Rotas
app.get("/", (req, res) => {
  res.render("index"); // Renderiza index.ejs
});

app.get("/login", (req, res) => {
  res.render("login"); // Renderiza login.ejs
});

app.use('/contato', contatoRoutes); // Diz ao app para usar o contatoRoutes para qualquer caminho que comece com /contato

app.get("/estoques", (req, res) => {
  res.render("estoques"); // Renderiza estoques.ejs
});

// Diz ao app para usar o propostaRoutes para qualquer caminho que comece com /proposta
app.use('/proposta', propostaRoutes);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta: ${PORT}`);
});
