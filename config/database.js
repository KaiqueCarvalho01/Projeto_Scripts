// database.js
import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Obter o diretório atual para garantir que o caminho do banco de dados seja relativo ao projeto
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define o caminho e o nome do arquivo do banco de dados
const DBSOURCE = join(__dirname, "db.sqlite");

// Inicializa o banco de dados SQLite
// sqlite3.verbose() pode ajudar com debugging, mostrando mais informações sobre as operações.
const db = new sqlite3.Database(DBSOURCE, (err) => {
  if (err) {
    // Não pode abrir o banco de dados
    console.error('Erro ao abrir o banco de dados:', err.message);
    throw err;
  } else {
    console.log('Conectado ao banco de dados SQLite.');
    db.run("PRAGMA foreign_keys = ON;", (pragmaErr) => {
      if (pragmaErr) {
        console.error("Erro ao habilitar chaves estrangeiras:", pragmaErr.message);
      }
    });

    // Criação das tabelas se não existirem
    // Tabela para Contatos
    db.run(`CREATE TABLE IF NOT EXISTS contatos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      telefone TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) {
        // Erro ao criar tabela
        console.error('Erro ao criar tabela contatos:', tableErr.message);
      } else {
        console.log("Tabela 'contatos' pronta ou já existente.");
      }
    });

    // Tabela para Propostas
    db.run(`CREATE TABLE IF NOT EXISTS propostas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      telefone TEXT,
      cpf TEXT,
      message TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) {
        // Erro ao criar tabela
        console.error('Erro ao criar tabela propostas:', tableErr.message);
      } else {
        console.log("Tabela 'propostas' pronta ou já existente.");
      }
    });

    // Tabela para Usuários
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE, -- Email deve ser único
      password TEXT NOT NULL,     -- Armazenará o hash da senha
      cpf TEXT UNIQUE,            -- CPF também pode ser único
      telefone TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (tableErr) => {
      if (tableErr) {
        console.error('Erro ao criar tabela users:', tableErr.message);
      } else {
        console.log("Tabela 'users' pronta ou já existente.");
      }
    });
  }
});

// Exporta a instância do banco de dados para ser usada em outros módulos
export default db;