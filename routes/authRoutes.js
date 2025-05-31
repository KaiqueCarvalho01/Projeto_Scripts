import express from 'express';
import {
  showRegisterForm,
  registerUser,
  showLoginForm,
  loginUser,
  logoutUser
} from '../controllers/authController.js'; 

const router = express.Router();

// Rotas de Cadastro
router.get('/register', showRegisterForm);
router.post('/register', registerUser);

// Rotas de Login
router.get('/login', showLoginForm);
router.post('/login', loginUser);

// Rota de Logout
router.get('/logout', logoutUser); 

export default router;