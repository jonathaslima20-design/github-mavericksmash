import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Filter, Loader as Loader2, Inbox, MailOpen } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchNotifications } from '@/lib/notificationService';
import NotificationListItem from '@/components/notifications/NotificationListItem';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AppNotification, NotificationType } from '@/types';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TYPE_LABELS: Record<NotificationType | 'all', string> = {
  all: 'Todos os tipos',
  new_lead: 'Novos contatos',
  whatsapp_click: 'Cliques no WhatsApp',
  view_milestone: 'Marcos de visualizações',
  subscription_expiring: 'Assinatura expirando',
  subscription_expired: 'Assinatura expirada',
  product_sold: 'Vendas',
  new_order: 'Novos pedidos',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Produto esgotado',
  referral_signup: 'Indicações',
  referral_upgrade: 'Upgrades de indicação',
  promotional_offer: 'Ofertas promocionais',
  novidades: 'Novidades',
  system: 'Sistema',
};

interface NotificationGroup {
  label: string;
  items: AppNotification[];
}

function groupByDate(notifications: AppNotification[]): NotificationGroup[] {
  const groups: Record<string, AppNotification[]> = {};
  const order: string[] = [];

  for (const n of notifications) {
    const date = new Date(n.created_at);
    let label: string;
    if (isToday(date)) label = 'Hoje';
    else if (isYesterday(date)) label = 'Ontem';
    else if (isThisWeek(date)) label = 'Esta semana';
    else label = format(date, "MMMM 'de' yyyy", { locale: ptBR });

    if (!groups[label]) {
      groups[label] = [];
      order.push(label);
    }
    groups[label].push(n);
  }

  return order.map((label) => ({ label, items: groups[label] }));
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { markAsRead, markAllAsRead, deleteNotification, unreadCount, refresh } = useNotifications();

  const [allNotifications, setAllNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 30;

  const loadPage = useCallback(
    async (pageNum: number, replace = false) => {
      if (!user?.id) return;
      setLoading(true);
      try {
        const { data, count } = await fetchNotifications(user.id, LIMIT, pageNum * LIMIT);
        setAllNotifications((prev) => (replace ? data : [...prev, ...data]));
        setHasMore((pageNum + 1) * LIMIT < (count || 0));
      } catch (err) {
        console.error('Failed to load notifications page:', err);
      } finally {
        setLoading(false);
      }
    },
    [user?.id]
  );

  useEffect(() => {
    setPage(0);
    loadPage(0, true);
  }, [loadPage]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadPage(next);
  };

  const filtered = allNotifications.filter((n) => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (readFilter === 'unread' && n.is_read) return false;
    if (readFilter === 'read' && !n.is_read) return false;
    return true;
  });

  const groups = groupByDate(filtered);

  const handleItemRead = async (id: string) => {
    await markAsRead(id);
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleItemDelete = async (id: string) => {
    await deleteNotification(id);
    setAllNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
    setAllNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCountFiltered = filtered.filter((n) => !n.is_read).length;
  const readCountFiltered = filtered.filter((n) => n.is_read).length;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Notificações</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `Você tem ${unreadCount} não lida${unreadCount > 1 ? 's' : ''}`
                : 'Todas as notificações estão lidas'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-start">
        <Tabs
          value={readFilter}
          onValueChange={(v) => setReadFilter(v as 'all' | 'unread' | 'read')}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full sm:w-auto grid-cols-3">
            <TabsTrigger value="all" className="gap-1.5 text-xs">
              <Inbox className="h-3.5 w-3.5" />
              Todas
              <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                {filtered.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5 text-xs">
              <MailOpen className="h-3.5 w-3.5" />
              Não lidas
              {unreadCountFiltered > 0 && (
                <Badge variant="default" className="h-4 px-1 text-[10px]">
                  {unreadCountFiltered}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-1.5 text-xs">
              <CheckCheck className="h-3.5 w-3.5" />
              Lidas
              {readCountFiltered > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                  {readCountFiltered}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v as NotificationType | 'all')}
        >
          <SelectTrigger className="sm:w-[220px]">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista */}
      {loading && allNotifications.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              Nenhuma notificação encontrada
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
              {typeFilter !== 'all' || readFilter !== 'all'
                ? 'Tente alterar os filtros para ver mais notificações.'
                : 'Você receberá notificações sobre contatos, visualizações e sua assinatura.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-2 px-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </p>
                <div className="flex-1 h-px bg-border/60" />
                <Badge variant="outline" className="text-[10px] h-5">
                  {group.items.length}
                </Badge>
              </div>
              <Card className="overflow-hidden shadow-sm">
                <CardContent className="p-0">
                  {group.items.map((notification) => (
                    <NotificationListItem
                      key={notification.id}
                      notification={notification}
                      onRead={handleItemRead}
                      onDelete={handleItemDelete}
                    />
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={loading}
                className="gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Carregar mais notificações
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
