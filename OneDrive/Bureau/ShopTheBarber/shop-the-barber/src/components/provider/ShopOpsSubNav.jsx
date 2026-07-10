import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { isNavActive } from '@/lib/navActive';
import { cn } from '@/lib/utils';
import { isFeatureEnabled } from '@/lib/featureRegistry';

const SHOP_OPS_TABS = [
  { label: 'Team', page: 'StaffRoster' },
  { label: 'Schedules', page: 'StaffSchedule' },
  { label: 'Staff HR', page: 'ShopEmployeeManagement' },
  { label: 'Inventory', page: 'ShopInventoryManagement' },
  { label: 'Expenses', page: 'ShopExpenseTracking' },
  { label: 'Branding', page: 'ShopBrandingManagement' },
  { label: 'Analytics', page: 'ShopAnalytics' },
];

export default function ShopOpsSubNav() {
  const location = useLocation();

  if (!isFeatureEnabled('shop_ops')) return null;

  return (
    <nav
      aria-label="Shop operations"
      className="mb-6 -mx-1 px-1 overflow-x-auto scrollbar-thin"
    >
      <div className="inline-flex gap-1 p-1 bg-muted/80 rounded-lg border border-foreground/10 min-w-max">
        {SHOP_OPS_TABS.map((tab) => {
          const active = isNavActive(location.pathname, tab.page, { exact: true });
          return (
            <Link
              key={tab.page}
              to={createPageUrl(tab.page)}
              className={cn(
                'px-3 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-card/70',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
