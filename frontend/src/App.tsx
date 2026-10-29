import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import type { PageId } from './types/navigation';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileDrawer } from './components/layout/MobileDrawer';

import { OverviewPage } from './pages/OverviewPage';
import { ScannerPage } from './pages/ScannerPage';
import { BatchPage } from './pages/BatchPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { ModelReportPage } from './pages/ModelReportPage';
import { LibraryPage } from './pages/LibraryPage';
import { HelpPage } from './pages/HelpPage';

export function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'overview':
        return <OverviewPage onNavigate={setCurrentPage} />;
      case 'scanner':
        return <ScannerPage />;
      case 'batch':
        return <BatchPage />;
      case 'monitoring':
        return <MonitoringPage />;
      case 'report':
        return <ModelReportPage />;
      case 'library':
        return <LibraryPage />;
      case 'help':
        return <HelpPage />;
      default:
        return <OverviewPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-navy-950 transition-colors duration-150">
        {/* Desktop Sidebar */}
        <Sidebar
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
        />

        {/* Mobile Navigation Drawer */}
        <MobileDrawer
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentPage={currentPage}
          onSelectPage={setCurrentPage}
        />

        {/* Workspace Column */}
        <div className="flex flex-col flex-1 min-w-0">
          <Header
            currentPage={currentPage}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            isDemoMode={true}
          />
          <main className="flex-1 overflow-y-auto">
            {renderCurrentPage()}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
