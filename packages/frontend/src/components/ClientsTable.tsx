import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Client, PaginationParams } from '@dashboard/shared';
import { clientsApi } from '@/lib/api';

const ClientsTable: React.FC = () => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchInput, setSearchInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [params, setParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'societe_name',
    sortOrder: 'asc',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Auto-apply search filter only (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams(prev => ({
        ...prev,
        search: searchInput,
        page: 1
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, isFetching } = useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.getClients(params),
    staleTime: 0, // Données considérées comme périmées immédiatement
    refetchOnWindowFocus: false, // Pas de refetch au focus
  });

  // Restaurer le focus après chaque requête de recherche
  useEffect(() => {
    if (!isFetching && searchInput && searchInputRef.current) {
      // Petit délai pour s'assurer que le DOM est mis à jour
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isFetching, searchInput]);

  const handleSort = useCallback((field: keyof Client) => {
    setParams(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc',
      page: 1
    }));
  }, []);

  const handleSearchInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setSearchInput(e.target.value);
  }, []);

  const handleDateFromChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDateFrom(e.target.value);
  }, []);

  const handleDateToChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setDateTo(e.target.value);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const applyFilters = useCallback(() => {
    setParams(prev => ({
      ...prev,
      dateFrom,
      dateTo,
      page: 1
    }));
  }, [dateFrom, dateTo]);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setParams(prev => ({
      ...prev,
      search: '',
      dateFrom: '',
      dateTo: '',
      page: 1
    }));
  }, []);

  const getSortIcon = (field: keyof Client) => {
    if (params.sortBy !== field) return null;
    return params.sortOrder === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4" /> : 
      <ChevronDownIcon className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-700">Erreur lors du chargement des clients</p>
      </div>
    );
  }

  const clients = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="space-y-4">
          {/* Date Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Date de début</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{top: '20px'}}>
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                value={dateFrom}
                onChange={handleDateFromChange}
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Date de fin</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{top: '20px'}}>
                <CalendarIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="date"
                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                value={dateTo}
                onChange={handleDateToChange}
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Filtrer
              </button>
              {(searchInput || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  title="Effacer les filtres"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Search - Taille réduite */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="block text-xs font-medium text-gray-700 mb-1">Recherche</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" style={{top: '20px'}}>
                <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher par nom de société..."
                className="block w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                value={searchInput}
                onChange={handleSearchInput}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('societe_name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Société</span>
                  {getSortIcon('societe_name')}
                </div>
              </th>
              <th className="table-header">Contact</th>
              <th className="table-header">Electronic invoicing</th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('entreprises_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Entreprises</span>
                  {getSortIcon('entreprises_count')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('contacts_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Contacts</span>
                  {getSortIcon('contacts_count')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('factures_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Factures</span>
                  {getSortIcon('factures_count')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('factures_fournisseurs_count')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fact. Fournisseurs</span>
                  {getSortIcon('factures_fournisseurs_count')}
                </div>
              </th>
              <th 
                className="table-header cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center space-x-1">
                  <span>Créé le</span>
                  {getSortIcon('created_at')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50">
                <td className="table-cell">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {client.societe_name}
                    </div>
                    {client.address && (
                      <div className="text-sm text-gray-500">
                        {client.address}
                      </div>
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <div>
                    {client.email && (
                      <div className="text-sm text-gray-900">{client.email}</div>
                    )}
                    {client.phone && (
                      <div className="text-sm text-gray-500">{client.phone}</div>
                    )}
                  </div>
                </td>
                <td className="table-cell">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.has_legal_unit 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.has_legal_unit ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {client.entreprises_count}
                  </span>
                </td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {client.contacts_count}
                  </span>
                </td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {client.factures_count}
                  </span>
                </td>
                <td className="table-cell">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    {client.factures_fournisseurs_count}
                  </span>
                </td>
                <td className="table-cell text-sm text-gray-500">
                  {new Date(client.created_at).toLocaleDateString('fr-FR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{' '}
                à{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                sur{' '}
                <span className="font-medium">{pagination.total}</span> résultats
              </p>
              
              {/* Sélecteur de pagination en bas à gauche */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-700">Éléments par page:</label>
                <select
                  className="px-2 py-1 text-sm border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  value={params.limit}
                  onChange={(e) => setParams(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={1000}>Tous</option>
                </select>
              </div>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                
                {/* Page numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, pagination.page - 2) + i;
                  if (pageNum > pagination.totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === pagination.page
                          ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsTable;
