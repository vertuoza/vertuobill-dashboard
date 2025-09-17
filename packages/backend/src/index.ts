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

// Middleware de logging pour diagnostiquer les requêtes
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`📥 [${timestamp}] ${req.method} ${req.url} - IP: ${req.ip} - User-Agent: ${req.get('User-Agent')}`);
  
  // Log des headers importants
  console.log(`📋 Headers: Host=${req.get('Host')}, Origin=${req.get('Origin')}, Referer=${req.get('Referer')}`);
  
  // Intercepter la réponse pour logger le statut
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`📤 [${timestamp}] Response: ${res.statusCode} for ${req.method} ${req.url}`);
    return originalSend.call(this, data);
  };
  
  next();
});

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

// Logs détaillés pour le diagnostic
console.log('🔍 DIAGNOSTIC DÉMARRAGE:');
console.log(`📍 NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`📍 PORT: ${PORT}`);
console.log(`📍 FRONTEND_URL: ${process.env.FRONTEND_URL}`);
console.log(`📍 Working Directory: ${process.cwd()}`);
console.log(`📍 __dirname: ${__dirname}`);

// Vérification des fichiers statiques en production
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '../../frontend/dist');
  console.log(`📍 Frontend dist path: ${frontendDistPath}`);
  
  try {
    const fs = require('fs');
    const exists = fs.existsSync(frontendDistPath);
    console.log(`📍 Frontend dist exists: ${exists}`);
    if (exists) {
      const files = fs.readdirSync(frontendDistPath);
      console.log(`📍 Frontend files: ${files.join(', ')}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification des fichiers frontend:', error);
  }
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ SERVEUR DÉMARRÉ AVEC SUCCÈS');
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🌐 Interface: 0.0.0.0 (sécurisé dans le container Docker)`);
  console.log(`📊 API Health Check: http://0.0.0.0:${PORT}/api/health`);
  console.log(`🏠 Frontend: http://0.0.0.0:${PORT}/`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // TEMPORAIRE : Désactivation des connexions DB pour test avec données mockées
  console.log('🔄 Mode test : Utilisation des données mockées uniquement');
  console.log('⚠️ Connexions aux bases de données désactivées temporairement');
  console.log('💡 Les routes utiliseront les données mockées pour validation du déploiement');
  
  // Tentative de connexion à la base de données en arrière-plan (non-bloquante)
  // COMMENTÉ TEMPORAIREMENT POUR TEST
  /*
  console.log('🔄 Tentative de connexion aux bases de données...');
  dbService.connect()
    .then(() => {
      console.log('✅ Connexion aux bases de données réussie');
    })
    .catch(error => {
      console.warn('⚠️ Impossible de se connecter à la base de données, utilisation des données mockées');
      console.warn('💡 Configurez les variables DB_* dans votre fichier .env pour utiliser MySQL');
      console.error('❌ Détails de l\'erreur DB:', error.message);
      console.error('❌ Stack trace:', error.stack);
    });
  */
});

// Gestion des erreurs du serveur
server.on('error', (error: any) => {
  console.error('❌ ERREUR SERVEUR:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Le port ${PORT} est déjà utilisé`);
  }
  process.exit(1);
});

// Logs pour les signaux de fermeture
process.on('SIGTERM', () => {
  console.log('📡 Signal SIGTERM reçu, fermeture gracieuse...');
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📡 Signal SIGINT reçu, fermeture gracieuse...');
  server.close(() => {
    console.log('✅ Serveur fermé proprement');
    process.exit(0);
  });
});
