import bcrypt from 'bcryptjs'; 
import db from '../config/database.js'; 

// --- Funções de Cadastro ---
export const showRegisterForm = (req, res) => {
  res.render('register', { // Renderiza views/register.ejs
    mensagemErro: null,
    // Para repreencher em caso de erro, inicializar as variáveis
    name: '',
    email: '',
    cpf: '',
    telefone: ''
  });
};

export const registerUser = async (req, res) => {
  const { name, email, cpf, telefone, password, confirmPassword } = req.body;
  const erros = [];

  // Validações básicas
  if (!name || !email || !cpf || !telefone || !password || !confirmPassword) {
    erros.push({ text: 'Todos os campos são obrigatórios!' });
  }
  if (password !== confirmPassword) {
    erros.push({ text: 'As senhas não coincidem!' });
  }
  if (password && password.length < 6) {
    erros.push({ text: 'A senha deve ter no mínimo 6 caracteres.' });
  }
  // Validação simples de CPF (apenas formato)
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
  if (cpf && !cpfRegex.test(cpf)) {
    erros.push({ text: 'Formato de CPF inválido. Use XXX.XXX.XXX-XX' });
  }
  // Validação simples de telefone (apenas se são números e tamanho)
  const telefoneRegex = /^\d{10,11}$/;
  if (telefone && !telefoneRegex.test(telefone.replace(/\D/g, ''))) { // Remove não dígitos para testar
    erros.push({ text: 'Número de telefone inválido.' });
  }

  if (erros.length > 0) {
    // Concatena todas as mensagens de erro em uma única string ou passa o array
    const mensagemErroConcatenada = erros.map(e => e.text).join(' ');
    return res.status(400).render('register', {
      mensagemErro: mensagemErroConcatenada,
      // Passa os dados de volta para repreencher o formulário
      name: name,
      email: email,
      cpf: cpf,
      telefone: telefone
    });
  }

  try {
    // Verificar se o email ou CPF já existem no banco
    const userExistsSql = `SELECT * FROM users WHERE email = ? OR cpf = ?`;
    db.get(userExistsSql, [email, cpf], async (err, row) => {
      if (err) {
        console.error('Erro ao verificar usuário existente:', err.message);
        return res.status(500).render('register', {
          mensagemErro: 'Erro interno ao tentar cadastrar. Tente novamente.',
          name, email, cpf, telefone // Repreencher
        });
      }
      if (row) {
        let mensagem = '';
        if (row.email === email) mensagem = 'Este email já está cadastrado.';
        else if (row.cpf === cpf) mensagem = 'Este CPF já está cadastrado.';
        return res.status(400).render('register', {
          mensagemErro: mensagem,
          name, email, cpf, telefone // Repreencher
        });
      }

      // Criptografar a senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Inserir usuário no banco
      const insertSql = `INSERT INTO users (name, email, cpf, telefone, password) VALUES (?, ?, ?, ?, ?)`;
      const params = [name, email, cpf, telefone, hashedPassword];

      db.run(insertSql, params, function (err) {
        if (err) {
          console.error('Erro ao inserir usuário no banco:', err.message);
          return res.status(500).render('register', {
            mensagemErro: 'Erro ao salvar seus dados. Tente novamente.',
            name, email, cpf, telefone // Repreencher
          });
        }
        console.log(`Novo usuário inserido com ID: ${this.lastID}`);
        // Fazer login automático após o cadastro
        // req.session.isLoggedIn = true;
        // req.session.userId = this.lastID;
        // req.session.user = { id: this.lastID, name: name, email: email };
        // return res.redirect('/'); // Redireciona para a home

        // Ou redirecionar para a página de login com mensagem de login com mensagem de sucesso
        // Para isso, precisaria configurar flash messages ou query params
        // Por enquanto, redirecionar para login:
        res.redirect('/auth/login?status=registered'); // Adiciona um query param para a msg
      });
    });
  } catch (error) {
    console.error('Erro no processo de cadastro:', error);
    res.status(500).render('register', {
      mensagemErro: 'Ocorreu um erro inesperado. Tente mais tarde.',
      name, email, cpf, telefone // Repreencher
    });
  }
};

// --- Funções de Login ---
export const showLoginForm = (req, res) => {
  // Verifica se há uma mensagem de sucesso do cadastro via query param
  let mensagemSucesso = null;
  if (req.query.status === 'registered') {
    mensagemSucesso = 'Cadastro realizado com sucesso! Faça o login.';
  }
  if (req.query.status === 'loggedout') {
    mensagemSucesso = 'Logout realizado com sucesso!';
  }

  res.render('login', { // Renderiza views/login.ejs
    mensagemErro: null,
    mensagemSucesso: mensagemSucesso,
    email: '' // Para repreencher em caso de erro de login
  });
};

export const loginUser = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).render('login', {
      mensagemErro: 'Email e senha são obrigatórios.',
      email: email // Repreencher email
    });
  }

  const sql = `SELECT * FROM users WHERE email = ?`;
  db.get(sql, [email], async (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      return res.status(500).render('login', {
        mensagemErro: 'Erro interno. Tente novamente.',
        email: email
      });
    }
    if (!user) {
      return res.status(400).render('login', {
        mensagemErro: 'Email ou senha inválidos.', // Mensagem genérica por segurança
        email: email
      });
    }

    // Comparar a senha fornecida com o hash armazenado
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', {
        mensagemErro: 'Email ou senha inválidos.', // Mensagem genérica
        email: email
      });
    }

    // Se a senha corresponder, criar a sessão
    req.session.isLoggedIn = true;
    req.session.userId = user.id;
    req.session.user = { // Armazena informações úteis na sessão, mas não a senha!
      id: user.id,
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      telefone: user.telefone
    };

    console.log('Usuário logado com sucesso:', user.email);
    res.redirect('/'); // Redireciona para a página inicial após o login
  });
};

// --- Função de Logout ---
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
      // Mesmo com erro, tenta redirecionar
      return res.redirect('/');
    }
    // Limpa o cookie do lado do cliente também
    res.clearCookie('connect.sid'); // 'connect.sid' é o nome padrão do cookie de sessão do express-session
    console.log('Logout realizado com sucesso.');
    res.redirect('/auth/login?status=loggedout'); // Redireciona para login com mensagem
  });
};