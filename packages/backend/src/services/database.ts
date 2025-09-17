import mysql from 'mysql2/promise';
import { Client } from '@dashboard/shared';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DatabaseService {
  private pool: mysql.Pool | null = null;
  private pool2: mysql.Pool | null = null;

  // Test de connectivité réseau
  private async testNetworkConnectivity(host: string, port: number): Promise<boolean> {
    try {
      console.log(`🌐 Test de connectivité réseau vers ${host}:${port}...`);
      
      // Test de ping (si possible)
      try {
        const { stdout } = await execAsync(`ping -c 1 -W 3 ${host}`);
        console.log(`📡 Ping vers ${host}: OK`);
      } catch (pingError) {
        console.warn(`⚠️ Ping vers ${host} échoué (normal dans certains environnements)`);
      }

      // Test de connectivité TCP avec timeout
      const net = require('net');
      return new Promise((resolve) => {
        const socket = new net.Socket();
        const timeout = 5000;

        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
          console.log(`✅ Connectivité TCP vers ${host}:${port} - OK`);
          socket.destroy();
          resolve(true);
        });

        socket.on('timeout', () => {
          console.error(`❌ Timeout TCP vers ${host}:${port} après ${timeout}ms`);
          socket.destroy();
          resolve(false);
        });

        socket.on('error', (err: any) => {
          console.error(`❌ Erreur TCP vers ${host}:${port}:`, err.message);
          socket.destroy();
          resolve(false);
        });

        socket.connect(port, host);
      });
    } catch (error) {
      console.error(`❌ Erreur lors du test de connectivité vers ${host}:${port}:`, error);
      return false;
    }
  }

  // Logs détaillés de configuration
  private logDatabaseConfig() {
    console.log('🔍 CONFIGURATION BASE DE DONNÉES:');
    console.log('📋 Base principale:');
    console.log(`   - Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   - Port: ${process.env.DB_PORT || '3306'}`);
    console.log(`   - Database: ${process.env.DB_NAME || 'dashboard'}`);
    console.log(`   - User: ${process.env.DB_USER || 'root'}`);
    console.log(`   - Password: ${process.env.DB_PASSWORD ? '***SET***' : '***NOT SET***'}`);
    
    console.log('📋 Base secondaire:');
    console.log(`   - Host: ${process.env.DB2_HOST || 'localhost'}`);
    console.log(`   - Port: ${process.env.DB2_PORT || '3306'}`);
    console.log(`   - Database: ${process.env.DB2_NAME || 'legal_unit_db'}`);
    console.log(`   - User: ${process.env.DB2_USER || 'root'}`);
    console.log(`   - Password: ${process.env.DB2_PASSWORD ? '***SET***' : '***NOT SET***'}`);
  }

  async connect() {
    const startTime = Date.now();
    console.log('🚀 DÉBUT DE LA CONNEXION AUX BASES DE DONNÉES');
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    
    // Afficher la configuration
    this.logDatabaseConfig();

    try {
      // Variables de configuration
      const db1Config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dashboard',
        port: parseInt(process.env.DB_PORT || '3306')
      };

      const db2Config = {
        host: process.env.DB2_HOST || 'localhost',
        user: process.env.DB2_USER || 'root',
        password: process.env.DB2_PASSWORD || '',
        database: process.env.DB2_NAME || 'legal_unit_db',
        port: parseInt(process.env.DB2_PORT || '3306')
      };

      // Test de connectivité réseau AVANT les connexions MySQL
      console.log('🌐 PHASE 1: Tests de connectivité réseau');
      const db1NetworkOk = await this.testNetworkConnectivity(db1Config.host, db1Config.port);
      const db2NetworkOk = await this.testNetworkConnectivity(db2Config.host, db2Config.port);

      if (!db1NetworkOk) {
        throw new Error(`Connectivité réseau échouée vers DB1: ${db1Config.host}:${db1Config.port}`);
      }
      if (!db2NetworkOk) {
        throw new Error(`Connectivité réseau échouée vers DB2: ${db2Config.host}:${db2Config.port}`);
      }

      console.log('🔗 PHASE 2: Création des pools de connexions MySQL');
      
      // Connexion à la base principale avec logs détaillés
      console.log('🔄 Création du pool pour la base principale...');
      this.pool = mysql.createPool({
        ...db1Config,
        connectionLimit: 10,
        idleTimeout: 60000,
        maxIdle: 10
      });
      
      // Connexion à la base secondaire avec logs détaillés
      console.log('🔄 Création du pool pour la base secondaire...');
      this.pool2 = mysql.createPool({
        ...db2Config,
        connectionLimit: 5,
        idleTimeout: 60000,
        maxIdle: 5
      });
      
      console.log('🧪 PHASE 3: Tests de connexion MySQL');
      
      // Test de la connexion principale avec logs détaillés
      console.log('🔄 Test de connexion à la base de données principale...');
      const db1TestStart = Date.now();
      try {
        const connection1 = await Promise.race([
          this.pool.getConnection(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connexion DB1 après 10s')), 10000))
        ]) as mysql.PoolConnection;
        
        const db1ConnectTime = Date.now() - db1TestStart;
        console.log(`⚡ Connexion DB1 obtenue en ${db1ConnectTime}ms`);
        
        await connection1.ping();
        console.log('🏓 Ping DB1 réussi');
        
        connection1.release();
        console.log('✅ Connexion DB1 libérée');
      } catch (db1Error: any) {
        const db1ConnectTime = Date.now() - db1TestStart;
        console.error(`❌ Erreur DB1 après ${db1ConnectTime}ms:`, db1Error);
        throw new Error(`DB1 Connection Failed: ${db1Error?.message || db1Error}`);
      }
      
      // Test de la connexion secondaire avec logs détaillés
      console.log('🔄 Test de connexion à la base de données secondaire...');
      const db2TestStart = Date.now();
      try {
        const connection2 = await Promise.race([
          this.pool2.getConnection(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connexion DB2 après 10s')), 10000))
        ]) as mysql.PoolConnection;
        
        const db2ConnectTime = Date.now() - db2TestStart;
        console.log(`⚡ Connexion DB2 obtenue en ${db2ConnectTime}ms`);
        
        await connection2.ping();
        console.log('🏓 Ping DB2 réussi');
        
        connection2.release();
        console.log('✅ Connexion DB2 libérée');
      } catch (db2Error: any) {
        const db2ConnectTime = Date.now() - db2TestStart;
        console.error(`❌ Erreur DB2 après ${db2ConnectTime}ms:`, db2Error);
        throw new Error(`DB2 Connection Failed: ${db2Error?.message || db2Error}`);
      }
      
      const totalTime = Date.now() - startTime;
      console.log('🎉 CONNEXIONS RÉUSSIES !');
      console.log(`✅ Pool de connexions à la base de données principale établi`);
      console.log(`📡 Connecté à ${db1Config.host}:${db1Config.port} - DB: ${db1Config.database}`);
      console.log(`✅ Pool de connexions à la base de données secondaire établi`);
      console.log(`📡 Connecté à ${db2Config.host}:${db2Config.port} - DB: ${db2Config.database}`);
      console.log(`⏱️ Temps total de connexion: ${totalTime}ms`);
      
    } catch (error: any) {
      const totalTime = Date.now() - startTime;
      console.error('💥 ÉCHEC DE LA CONNEXION AUX BASES DE DONNÉES');
      console.error(`⏱️ Temps écoulé: ${totalTime}ms`);
      console.error('❌ Erreur détaillée:', error);
      console.error('📚 Stack trace:', error?.stack);
      
      // Informations supplémentaires sur l'erreur
      if (error?.code) {
        console.error(`🔍 Code d'erreur: ${error.code}`);
      }
      if (error?.errno) {
        console.error(`🔍 Errno: ${error.errno}`);
      }
      if (error?.sqlState) {
        console.error(`🔍 SQL State: ${error.sqlState}`);
      }
      
      // Nettoyer les pools en cas d'erreur
      console.log('🧹 Nettoyage des pools de connexions...');
      if (this.pool) {
        await this.pool.end().catch((endError) => {
          console.error('❌ Erreur lors de la fermeture du pool DB1:', endError);
        });
        this.pool = null;
      }
      if (this.pool2) {
        await this.pool2.end().catch((endError) => {
          console.error('❌ Erreur lors de la fermeture du pool DB2:', endError);
        });
        this.pool2 = null;
      }
      
      throw error;
    }
  }

  // Méthode pour obtenir l'état des connexions
  getConnectionStatus() {
    return {
      db1Connected: this.pool !== null,
      db2Connected: this.pool2 !== null,
      timestamp: new Date().toISOString()
    };
  }

  // Méthode pour tester la connexion DB1
  async testDB1Connection(): Promise<{ success: boolean; responseTime?: number; error?: string; code?: string; errno?: number }> {
    if (!this.pool) {
      return { success: false, error: 'Pool DB1 non initialisé' };
    }

    try {
      const testStart = Date.now();
      const [rows] = await this.pool.execute('SELECT 1 as test');
      const responseTime = Date.now() - testStart;
      return { success: true, responseTime };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || error,
        code: error?.code,
        errno: error?.errno
      };
    }
  }

  // Méthode pour tester la connexion DB2
  async testDB2Connection(): Promise<{ success: boolean; responseTime?: number; error?: string; code?: string; errno?: number }> {
    if (!this.pool2) {
      return { success: false, error: 'Pool DB2 non initialisé' };
    }

    try {
      const testStart = Date.now();
      const [rows] = await this.pool2.execute('SELECT 1 as test');
      const responseTime = Date.now() - testStart;
      return { success: true, responseTime };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || error,
        code: error?.code,
        errno: error?.errno
      };
    }
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
    if (this.pool2) {
      await this.pool2.end();
      this.pool2 = null;
    }
  }

  // Méthode pour vérifier l'existence dans la table legal_unit
  async checkLegalUnitExists(tenantId: string): Promise<boolean> {
    if (!this.pool2) {
      console.warn('Base de données secondaire non connectée pour legal_unit');
      return false;
    }

    try {
      const [rows] = await this.pool2.execute(
        'SELECT COUNT(*) as count FROM legal_unit WHERE tenant_id = ?',
        [tenantId]
      );
      const count = (rows as any[])[0].count;
      return count > 0;
    } catch (error) {
      console.error('Erreur lors de la vérification legal_unit:', error);
      return false;
    }
  }

  async getClients(params: {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ clients: Client[]; total: number }> {
    if (!this.pool) {
      throw new Error('Base de données non connectée');
    }

    const { page, limit, sortBy = 'societe_name', sortOrder = 'asc', search, dateFrom, dateTo } = params;
    const offset = (page - 1) * limit;

    // Construction de la requête principale pour obtenir les sociétés
    let whereConditions = ['s.pack_id = 11', 's.societe_valid = 1'];
    let queryParams: any[] = [];

    // Filtrage par recherche
    if (search && search.trim()) {
      whereConditions.push('(s.societe_name LIKE ? OR a.adresse_rue LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Filtrage par date - UNIQUEMENT pour les sociétés (date de début seulement)
    if (dateFrom) {
      whereConditions.push('s.societe_datecrea >= ?');
      queryParams.push(dateFrom);
    }
    // Note: pas de filtre de date de fin pour les sociétés selon les spécifications

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Requête pour compter le total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM societe s 
      INNER JOIN adresse a ON a.adresse_id = s.societe_adresse_id
      ${whereClause}
    `;

    // Requête principale pour récupérer les données avec formatage de l'adresse et du pays
    const mainQuery = `
      SELECT 
        s.societe_id,
        s.societe_name, 
        a.adresse_rue,
        a.adresse_numero,
        a.adresse_cp,
        CASE 
          WHEN a.adresse_pays = 'PAYS_BELGIQUE' THEN 'Belgique'
          ELSE a.adresse_pays
        END as adresse_pays,
        s.societe_valid, 
        s.societe_datecrea
      FROM societe s 
      INNER JOIN adresse a ON a.adresse_id = s.societe_adresse_id
      ${whereClause}
      ORDER BY ${this.getSafeColumnName(sortBy)} ${sortOrder.toUpperCase()}
      LIMIT ${limit} OFFSET ${offset}
    `;

    try {
      // Exécuter la requête de comptage
      const [countResult] = await this.pool.execute(countQuery, queryParams);
      const total = (countResult as any[])[0].total;

      // Exécuter la requête principale sans paramètres pour LIMIT et OFFSET
      const [rows] = await this.pool.execute(mainQuery, queryParams);
      const societes = rows as any[];

      // Pour chaque société, récupérer les informations complémentaires
      const clients: Client[] = await Promise.all(
        societes.map(async (societe) => {
          const societeId = societe.societe_id;

          // Récupérer le contact principal
          const [contactRows] = await this.pool!.execute(
            'SELECT u.user_pname, u.user_name, u.user_phone FROM user u WHERE u.user_societe_id = ? AND u.user_compte = 1 AND u.user_type = 1 AND u.user_valid = 1 LIMIT 1',
            [societeId]
          );
          const contact = (contactRows as any[])[0];

          // Récupérer les compteurs
          const [facturesCount] = await this.pool!.execute(
            'SELECT count(*) as count FROM facturation WHERE societe_id = ?',
            [societeId]
          );

          const [contactsCount] = await this.pool!.execute(
            'SELECT count(*) as count FROM contacts WHERE societe_id = ?',
            [societeId]
          );

          const [entreprisesCount] = await this.pool!.execute(
            'SELECT count(*) as count FROM entreprise WHERE societe_id = ?',
            [societeId]
          );

          const [facturesFournisseursCount] = await this.pool!.execute(
            'SELECT count(*) as count FROM facture_fournisseur WHERE societe_id = ?',
            [societeId]
          );

          // Vérifier l'existence dans legal_unit (utiliser societeId comme tenant_id)
          const hasLegalUnit = await this.checkLegalUnitExists(societeId.toString());

          // Formater l'adresse avec les champs séparés
          const addressParts = [
            societe.adresse_rue,
            societe.adresse_numero,
            societe.adresse_cp,
            societe.adresse_pays
          ].filter(part => part && part.trim()).join(' ');

          return {
            id: societeId.toString(),
            societe_name: societe.societe_name,
            email: contact?.user_pname || contact?.user_name || '',
            phone: contact?.user_phone || '',
            address: addressParts,
            created_at: societe.societe_datecrea,
            updated_at: societe.societe_datecrea,
            factures_count: (facturesCount as any[])[0].count,
            contacts_count: (contactsCount as any[])[0].count,
            entreprises_count: (entreprisesCount as any[])[0].count,
            factures_fournisseurs_count: (facturesFournisseursCount as any[])[0].count,
            has_legal_unit: hasLegalUnit
          };
        })
      );

      return { clients, total };
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<{
    totalClients: number;
    totalFactures: number;
    totalContacts: number;
    totalEntreprises: number;
    totalFacturesFournisseurs: number;
  }> {
    if (!this.pool) {
      throw new Error('Base de données non connectée');
    }

    try {
      // Total clients (sociétés valides avec pack_id = 11)
      const [clientsResult] = await this.pool.execute(
        'SELECT count(*) as count FROM societe WHERE pack_id = 11 AND societe_valid = 1'
      );
      const totalClients = (clientsResult as any[])[0].count;

      // Total factures (avec pack_id = 11)
      const [facturesResult] = await this.pool.execute(
        'SELECT count(*) as count FROM facturation INNER JOIN societe ON societe.societe_id = facturation.societe_id WHERE pack_id = 11 AND societe_valid = 1'
      );
      const totalFactures = (facturesResult as any[])[0].count;

      // Total contacts (avec pack_id = 11 et societe_valid = 1)
      const [contactsResult] = await this.pool.execute(
        'SELECT count(*) as count FROM contacts INNER JOIN societe ON societe.societe_id = contacts.societe_id WHERE pack_id = 11 AND societe_valid = 1'
      );
      const totalContacts = (contactsResult as any[])[0].count;

      // Total entreprises (avec pack_id = 11 et entreprise_valid = 1)
      const [entreprisesResult] = await this.pool.execute(
        'SELECT count(*) as count FROM entreprise INNER JOIN societe ON societe.societe_id = entreprise.societe_id WHERE pack_id = 11 AND entreprise_valid = 1 AND societe_valid = 1'
      );
      const totalEntreprises = (entreprisesResult as any[])[0].count;

      // Total factures fournisseurs (avec pack_id = 11 et facture_fournisseur_valid = 1)
      const [facturesFournisseursResult] = await this.pool.execute(
        'SELECT count(*) as count FROM facture_fournisseur INNER JOIN societe ON societe.societe_id = facture_fournisseur.societe_id WHERE pack_id = 11 AND facture_fournisseur_valid = 1 AND societe_valid = 1'
      );
      const totalFacturesFournisseurs = (facturesFournisseursResult as any[])[0].count;

      return {
        totalClients,
        totalFactures,
        totalContacts,
        totalEntreprises,
        totalFacturesFournisseurs
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  private getSafeColumnName(sortBy: string): string {
    // Mapping des colonnes pour éviter les injections SQL
    const columnMapping: { [key: string]: string } = {
      'societe_name': 's.societe_name',
      'created_at': 's.societe_datecrea',
      'factures_count': 's.societe_name', // Fallback sur le nom pour les compteurs
      'contacts_count': 's.societe_name',
      'entreprises_count': 's.societe_name',
      'factures_fournisseurs_count': 's.societe_name'
    };

    return columnMapping[sortBy] || 's.societe_name';
  }
}

export const dbService = new DatabaseService();
