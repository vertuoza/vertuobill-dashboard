import mysql from 'mysql2/promise';
import { Client } from '@dashboard/shared';

export class DatabaseService {
  private pool: mysql.Pool | null = null;
  private pool2: mysql.Pool | null = null;

  async connect() {
    try {
      // Connexion à la base principale avec timeout réduit
      this.pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'dashboard',
        port: parseInt(process.env.DB_PORT || '3306'),
        connectionLimit: 10,
        idleTimeout: 60000, // Réduit à 1 minute
        maxIdle: 10
      });
      
      // Connexion à la base secondaire (legal_unit) avec timeout réduit
      this.pool2 = mysql.createPool({
        host: process.env.DB2_HOST || 'localhost',
        user: process.env.DB2_USER || 'root',
        password: process.env.DB2_PASSWORD || '',
        database: process.env.DB2_NAME || 'legal_unit_db',
        port: parseInt(process.env.DB2_PORT || '3306'),
        connectionLimit: 5,
        idleTimeout: 60000, // Réduit à 1 minute
        maxIdle: 5
      });
      
      // Test des connexions avec timeout
      console.log('🔄 Test de connexion à la base de données principale...');
      const connection1 = await Promise.race([
        this.pool.getConnection(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connexion DB1')), 5000))
      ]) as mysql.PoolConnection;
      await connection1.ping();
      connection1.release();
      
      console.log('🔄 Test de connexion à la base de données secondaire...');
      const connection2 = await Promise.race([
        this.pool2.getConnection(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout connexion DB2')), 5000))
      ]) as mysql.PoolConnection;
      await connection2.ping();
      connection2.release();
      
      console.log('✅ Pool de connexions à la base de données principale établi');
      console.log(`📡 Connecté à ${process.env.DB_HOST}:${process.env.DB_PORT} - DB: ${process.env.DB_NAME}`);
      console.log('✅ Pool de connexions à la base de données secondaire établi');
      console.log(`📡 Connecté à ${process.env.DB2_HOST}:${process.env.DB2_PORT} - DB: ${process.env.DB2_NAME}`);
    } catch (error) {
      console.error('❌ Erreur de connexion à la base de données:', error);
      // Nettoyer les pools en cas d'erreur
      if (this.pool) {
        await this.pool.end().catch(() => {});
        this.pool = null;
      }
      if (this.pool2) {
        await this.pool2.end().catch(() => {});
        this.pool2 = null;
      }
      throw error;
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
