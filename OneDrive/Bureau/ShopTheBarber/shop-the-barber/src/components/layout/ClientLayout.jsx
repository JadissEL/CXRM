import ClientDesktopSidebar from '@/components/layout/ClientDesktopSidebar';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { DashboardShellProvider } from '@/components/layout/DashboardShellContext';
import { DashboardBreadcrumbProvider } from '@/components/layout/DashboardBreadcrumbContext';
import DashboardBreadcrumbs from '@/components/layout/DashboardBreadcrumbs';

/**
 * Client zone layout: desktop = sidebar + main; mobile = main + bottom nav.
 * ClientBottomNav is rendered once here; hidden on desktop via useIsDesktop.
 * Breakpoint: lg (1024px).
 */
export default function ClientLayout({ children }) {
  return (
    <DashboardShellProvider>
      <DashboardBreadcrumbProvider>
        <div className="flex-1 flex min-h-0 bg-background stb-site-bg">
          <ClientDesktopSidebar />
          <main id="main-content" className="flex-1 min-w-0 flex flex-col overflow-auto pb-nav lg:pb-0">
            <DashboardBreadcrumbs />
            <div className="flex-1 min-h-0">{children}</div>
          </main>
          <ClientBottomNav />
        </div>
      </DashboardBreadcrumbProvider>
    </DashboardShellProvider>
  );
}
