import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { LoginRequest, AuthResponse, ApiResponse } from '@dashboard/shared';
import { defaultUser } from '../data/mockData';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Nom d\'utilisateur et mot de passe requis'
      } as ApiResponse);
    }

    // Vérification avec l'utilisateur par défaut
    if (username !== defaultUser.username || password !== defaultUser.password) {
      return res.status(401).json({
        success: false,
        error: 'Identifiants invalides'
      } as ApiResponse);
    }

    // Génération du token JWT
    const token = jwt.sign(
      { 
        id: defaultUser.id, 
        username: defaultUser.username, 
        email: defaultUser.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: defaultUser.id,
        username: defaultUser.username,
        email: defaultUser.email
      }
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    } as ApiResponse);
  }
});

export default router;
