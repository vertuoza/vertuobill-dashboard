import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import clientsRoutes from './routes/clients';
import dashboardRoutes from './routes/dashboard';
import { dbService } from './services/database';

// Load environment variables from root directory
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API Dashboard fonctionne correctement',
    timestamp: new Date().toISOString()
  });
});

// Servir les fichiers statiques du frontend en production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendDistPath));
  
  // Catch-all handler: renvoie index.html pour toutes les routes non-API
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// 404 handler pour les routes API uniquement (en développement)
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route API non trouvée'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API Dashboard disponible sur http://0.0.0.0:${PORT}`);
  
  // Tentative de connexion à la base de données en arrière-plan (non-bloquante)
  dbService.connect().catch(error => {
    console.warn('⚠️ Impossible de se connecter à la base de données, utilisation des données mockées');
    console.warn('💡 Configurez les variables DB_* dans votre fichier .env pour utiliser MySQL');
    console.error('Détails de l\'erreur DB:', error.message);
  });
});
