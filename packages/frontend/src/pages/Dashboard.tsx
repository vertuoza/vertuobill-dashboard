import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';
import ClientsTable from '@/components/ClientsTable';
import { dashboardApi } from '@/lib/api';

const Dashboard: React.FC = () => {
  // Récupérer les statistiques depuis l'API
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  // Configuration des statistiques avec les vraies données dans l'ordre demandé
  const stats = [
    {
      name: 'Total Clients',
      value: statsData?.totalClients || '0',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Entreprises',
      value: statsData?.totalEntreprises || '0',
      icon: BuildingOfficeIcon,
      color: 'bg-purple-500',
      change: '+3%',
      changeType: 'positive'
    },
    {
      name: 'Contacts',
      value: statsData?.totalContacts || '0',
      icon: UserGroupIcon,
      color: 'bg-indigo-500',
      change: '+5%',
      changeType: 'positive'
    },
    {
      name: 'Factures Créées',
      value: statsData?.totalFactures || '0',
      icon: DocumentTextIcon,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Fact. Fournisseurs',
      value: statsData?.totalFacturesFournisseurs || '0',
      icon: CurrencyEuroIcon,
      color: 'bg-orange-500',
      change: '+15%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Général</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    {/* Pourcentages cachés provisoirement */}
                    {/* <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change}
                    </div> */}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clients Table */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Clients</h2>
        </div>
        <div className="p-6">
          <ClientsTable />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
