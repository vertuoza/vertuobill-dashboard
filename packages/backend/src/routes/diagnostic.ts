import express from 'express';
import { dbService } from '../services/database';

const router = express.Router();

// Endpoint de diagnostic détaillé de la base de données
router.get('/db-test', async (req, res) => {
  const startTime = Date.now();
  console.log('🔍 DIAGNOSTIC DB - Début du test de connectivité');
  
  try {
    // Obtenir l'état actuel des connexions
    const connectionStatus = dbService.getConnectionStatus();
    console.log('📊 État actuel des connexions:', connectionStatus);
    
    // Informations sur l'environnement
    const envInfo = {
      nodeEnv: process.env.NODE_ENV,
      db1: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '3306',
        database: process.env.DB_NAME || 'dashboard',
        user: process.env.DB_USER || 'root',
        passwordSet: !!process.env.DB_PASSWORD
      },
      db2: {
        host: process.env.DB2_HOST || 'localhost',
        port: process.env.DB2_PORT || '3306',
        database: process.env.DB2_NAME || 'legal_unit_db',
        user: process.env.DB2_USER || 'root',
        passwordSet: !!process.env.DB2_PASSWORD
      }
    };
    
    // Test de reconnexion si les connexions sont fermées
    let reconnectionAttempted = false;
    if (!connectionStatus.db1Connected || !connectionStatus.db2Connected) {
      console.log('🔄 Tentative de reconnexion...');
      reconnectionAttempted = true;
      try {
        await dbService.connect();
        console.log('✅ Reconnexion réussie');
      } catch (reconnectError: any) {
        console.error('❌ Échec de la reconnexion:', reconnectError);
        const totalTime = Date.now() - startTime;
        
        return res.status(500).json({
          success: false,
          error: 'Échec de la connexion à la base de données',
          details: {
            message: reconnectError?.message || reconnectError,
            code: reconnectError?.code,
            errno: reconnectError?.errno,
            sqlState: reconnectError?.sqlState,
            connectionStatus,
            envInfo,
            reconnectionAttempted,
            testDuration: totalTime
          }
        });
      }
    }
    
    // Test de requête simple sur DB1
    console.log('🧪 Test de requête sur DB1...');
    const db1TestResult = await dbService.testDB1Connection();
    if (db1TestResult.success) {
      console.log(`✅ Test DB1 réussi en ${db1TestResult.responseTime}ms`);
    } else {
      console.error('❌ Erreur test DB1:', db1TestResult.error);
    }
    
    // Test de requête simple sur DB2
    console.log('🧪 Test de requête sur DB2...');
    const db2TestResult = await dbService.testDB2Connection();
    if (db2TestResult.success) {
      console.log(`✅ Test DB2 réussi en ${db2TestResult.responseTime}ms`);
    } else {
      console.error('❌ Erreur test DB2:', db2TestResult.error);
    }
    
    const totalTime = Date.now() - startTime;
    const finalConnectionStatus = dbService.getConnectionStatus();
    
    console.log(`🏁 DIAGNOSTIC DB - Terminé en ${totalTime}ms`);
    
    res.json({
      success: true,
      message: 'Diagnostic de base de données terminé',
      details: {
        testDuration: totalTime,
        connectionStatus: finalConnectionStatus,
        envInfo,
        reconnectionAttempted,
        db1Test: db1TestResult,
        db2Test: db2TestResult,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    const totalTime = Date.now() - startTime;
    console.error('💥 DIAGNOSTIC DB - Erreur générale:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors du diagnostic de base de données',
      details: {
        message: error?.message || error,
        stack: error?.stack,
        testDuration: totalTime,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Endpoint pour forcer une reconnexion
router.post('/db-reconnect', async (req, res) => {
  console.log('🔄 DIAGNOSTIC DB - Reconnexion forcée demandée');
  
  try {
    // Fermer les connexions existantes
    await dbService.disconnect();
    console.log('🔌 Connexions fermées');
    
    // Reconnecter
    await dbService.connect();
    console.log('✅ Reconnexion réussie');
    
    const connectionStatus = dbService.getConnectionStatus();
    
    res.json({
      success: true,
      message: 'Reconnexion forcée réussie',
      connectionStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la reconnexion forcée:', error);
    
    res.status(500).json({
      success: false,
      error: 'Échec de la reconnexion forcée',
      details: {
        message: error?.message || error,
        code: error?.code,
        errno: error?.errno,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// Endpoint pour obtenir l'état des connexions
router.get('/db-status', (req, res) => {
  const connectionStatus = dbService.getConnectionStatus();
  
  res.json({
    success: true,
    connectionStatus,
    timestamp: new Date().toISOString()
  });
});

export default router;
