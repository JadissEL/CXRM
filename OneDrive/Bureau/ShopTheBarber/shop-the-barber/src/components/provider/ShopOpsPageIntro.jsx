import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import { PageLoading } from '@/components/ui/page-loading';
import PageContent from '@/components/layout/PageContent';
import ShopOpsSubNav from '@/components/provider/ShopOpsSubNav';
import { useManagedShop } from '@/hooks/useManagedShop';
import { stb } from '@/lib/stbUi';

/**
 * Shared access gate + horizontal shop-ops nav for Team / Schedules / HR / Inventory / etc.
 */
export default function ShopOpsPageIntro({ children }) {
  const { isManager, shopId, isLoading, isLoadingAuth } = useManagedShop();

  if (isLoadingAuth || isLoading) {
    return <PageLoading message="Loading shop tools…" />;
  }

  if (!isManager || !shopId) {
    return (
      <div className={stb.page}>
        <PageContent narrow className="py-20 text-center space-y-4">
          <p className="text-muted-foreground">Shop owner or manager access is required for these tools.</p>
          <ContextualBackLink className="text-primary font-bold" />
          <Link to={createPageUrl('ProviderDashboard')} className="text-sm text-primary hover:underline block">
            Back to dashboard
          </Link>
        </PageContent>
      </div>
    );
  }

  return (
    <>
      <ShopOpsSubNav />
      {children}
    </>
  );
}
