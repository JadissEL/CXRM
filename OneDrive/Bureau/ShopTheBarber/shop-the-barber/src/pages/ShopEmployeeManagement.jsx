import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useManagedShop } from '@/hooks/useManagedShop';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import ShopOpsPageIntro from '@/components/provider/ShopOpsPageIntro';
import { PageLoading } from '@/components/ui/page-loading';
import { Users, Calendar, Pencil } from 'lucide-react';

export default function ShopEmployeeManagement() {
  const { shopId, shop, isManager, isLoading } = useManagedShop();

  const { data: team = [], isLoading: teamLoading } = useQuery({
    queryKey: ['shop-team-hr', shopId],
    queryFn: () => sovereign.shop.getTeam(shopId),
    enabled: !!shopId && isManager,
  });

  if (isLoading) return <PageLoading message="Loading HR…" />;

  if (!isManager || !shopId) {
    return <ShopOpsPageIntro />;
  }

  return (
    <div className="stb-page pb-24 lg:pb-8">
      <MetaTags title="Staff HR" description={`HR overview for ${shop?.name || 'your shop'}`} />
      <PageHeader
        label="Provider"
        title="Staff HR"
        subtitle="Roles, employment status, and booking eligibility for your team."
        compact
        variant="light"
        tier="app"
      >
        <Button asChild variant="outline">
          <Link to={createPageUrl('StaffRoster')}>
            <Pencil className="w-4 h-4 mr-2" /> Edit roster
          </Link>
        </Button>
        <Button asChild>
          <Link to={createPageUrl('StaffSchedule')}>
            <Calendar className="w-4 h-4 mr-2" /> Schedules
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        <ShopOpsPageIntro>
          {teamLoading ? (
            <PageLoading message="Loading team records…" />
          ) : team.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center space-y-4">
                <Users className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">No team members yet. Add barbers from the Team roster.</p>
                <Button asChild>
                  <Link to={createPageUrl('StaffRoster')}>Go to Team roster</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {team.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <UserAvatar
                      src={member.barber?.image_url}
                      name={member.barber?.name}
                      className="w-12 h-12"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{member.barber?.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{member.role || 'barber'}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="secondary" className="capitalize">{member.status || 'active'}</Badge>
                        <Badge variant={member.booking_enabled !== false ? 'default' : 'outline'}>
                          {member.booking_enabled !== false ? 'Bookable online' : 'Not bookable'}
                        </Badge>
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link to={createPageUrl('StaffRoster')}>Manage</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ShopOpsPageIntro>
      </PageContent>
    </div>
  );
}
