import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import TopHeader from './TopHeader.jsx';

const pageMeta = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Overview of invoices, revenue, and payments',
  },
  '/customers': {
    title: 'Customers',
    subtitle: 'Manage your customer directory',
  },
  '/invoices': {
    title: 'Invoices',
    subtitle: 'Create and manage invoices',
  },
  '/invoices/new': {
    title: 'Create Invoice',
    subtitle: 'Generate and send a new invoice',
  },
  '/reports': {
    title: 'Reports',
    subtitle: 'Revenue analytics and filtered insights',
  },
};

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const meta = pageMeta[location.pathname] || {
    title: location.pathname.startsWith('/invoices') ? 'Invoices' : 'Invoice CRM',
    subtitle: '',
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-h-screen lg:pl-72">
        <TopHeader
          title={meta.title}
          subtitle={meta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:px-8 lg:pt-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
