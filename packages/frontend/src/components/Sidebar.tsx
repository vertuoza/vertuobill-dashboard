import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  HomeIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Général', href: '/dashboard', icon: HomeIcon },
  // Futures sections à ajouter
  // { name: 'Clients', href: '/dashboard/clients', icon: UserGroupIcon },
  // { name: 'Factures', href: '/dashboard/invoices', icon: DocumentTextIcon },
  // { name: 'Entreprises', href: '/dashboard/companies', icon: BuildingOfficeIcon },
];

const Sidebar: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex flex-col w-64 bg-slate-800 shadow-lg">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-slate-900">
        <div className="flex items-center space-x-3">
          <img 
            src="/logo.png" 
            alt="VertuoBill Logo" 
            className="w-8 h-8"
            onError={(e) => {
              // Fallback si l'image ne charge pas
              e.currentTarget.style.display = 'none';
            }}
          />
          <h1 className="text-xl font-bold text-white">VertuoBill</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                isActive
                  ? 'bg-slate-700 text-white border-r-2 border-white'
                  : 'text-white hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <item.icon
              className="mr-3 h-5 w-5 flex-shrink-0"
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-4 border-t border-slate-600">
        <button
          onClick={handleLogout}
          className="group flex items-center w-full px-2 py-2 text-sm font-medium text-white rounded-md hover:bg-red-600 hover:text-white transition-colors duration-200"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
          Déconnexion
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
