import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import clientsRoutes from './routes/clients';
import dashboardRoutes from './routes/dashboard';
import { dbService } from './services/database';

// Load environment variables from root directory
dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
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

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erreur:', err);
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📊 API Dashboard disponible sur http://localhost:${PORT}`);
  
  // Tentative de connexion à la base de données
  try {
    await dbService.connect();
  } catch (error) {
    console.warn('⚠️ Impossible de se connecter à la base de données, utilisation des données mockées');
    console.warn('💡 Configurez les variables DB_* dans votre fichier .env pour utiliser MySQL');
  }
});
