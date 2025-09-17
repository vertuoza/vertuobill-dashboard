import { Router, Request, Response } from 'express';
import { PaginationParams, PaginatedResponse, Client, ApiResponse } from '@dashboard/shared';
import { mockClients } from '../data/mockData';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { dbService } from '../services/database';

const router = Router();

// Appliquer l'authentification à toutes les routes
router.use(authenticateToken);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'societe_name',
      sortOrder = 'asc',
      search = '',
      dateFrom = '',
      dateTo = ''
    } = req.query as any;

    // Essayer d'utiliser la base de données, sinon fallback sur les données mockées
    let clients: Client[];
    let total: number;

    try {
      const result = await dbService.getClients({
        page: Number(page),
        limit: Number(limit),
        sortBy,
        sortOrder,
        search,
        dateFrom,
        dateTo
      });
      clients = result.clients;
      total = result.total;
      console.log('✅ Données récupérées depuis la base de données');
    } catch (dbError) {
      console.warn('⚠️ Erreur DB, utilisation des données mockées:', dbError);
      
      // Fallback sur les données mockées avec la logique existante
      let filteredClients = mockClients;
      
      if (search) {
        const searchLower = search.toLowerCase();
        filteredClients = filteredClients.filter(client =>
          client.societe_name.toLowerCase().includes(searchLower) ||
          client.email?.toLowerCase().includes(searchLower) ||
          client.phone?.includes(search)
        );
      }

      if (dateFrom || dateTo) {
        filteredClients = filteredClients.filter(client => {
          const clientDate = new Date(client.created_at);
          let isValid = true;

          if (dateFrom) {
            const fromDate = new Date(dateFrom);
            isValid = isValid && clientDate >= fromDate;
          }

          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            isValid = isValid && clientDate <= toDate;
          }

          return isValid;
        });
      }

      filteredClients.sort((a, b) => {
        let aValue: any = a[sortBy as keyof Client];
        let bValue: any = b[sortBy as keyof Client];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (sortOrder === 'desc') {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });

      const startIndex = (Number(page) - 1) * Number(limit);
      const endIndex = startIndex + Number(limit);
      clients = filteredClients.slice(startIndex, endIndex);
      total = filteredClients.length;
    }

    const response: PaginatedResponse<Client> = {
      data: clients,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    };

    res.json({
      success: true,
      data: response
    } as ApiResponse<PaginatedResponse<Client>>);

  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    } as ApiResponse);
  }
});

// Route pour obtenir un client spécifique
router.get('/:id', (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const client = mockClients.find(c => c.id === id);

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client non trouvé'
      } as ApiResponse);
    }

    res.json({
      success: true,
      data: client
    } as ApiResponse<Client>);

  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    } as ApiResponse);
  }
});

export default router;
