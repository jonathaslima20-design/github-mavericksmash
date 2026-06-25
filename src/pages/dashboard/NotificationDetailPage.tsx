import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader as Loader2, Trash2, Check, ExternalLink, MessageSquare, Eye, CreditCard, Phone, Tag, Info, ShoppingBag, TriangleAlert as AlertTriangle, PackageX, Gift, UserPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/contexts/NotificationContext';
import { getNotificationNavigationAction } from '@/lib/notificationNavigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';

const ICON_MAP: Record<NotificationType, React.ElementType> = {
  new_lead: MessageSquare,
  whatsapp_click: Phone,
  view_milestone: Eye,
  subscription_expiring: CreditCard,
  subscription_expired: CreditCard,
  product_sold: Tag,
  new_order: ShoppingBag,
  low_stock: AlertTriangle,
  out_of_stock: PackageX,
  referral_signup: UserPlus,
  referral_upgrade: Gift,
  promotional_offer: Tag,
  novidades: Sparkles,
  system: Info,
};

const COLOR_MAP: Record<NotificationType, string> = {
  new_lead: 'text-blue-500 bg-blue-500/10',
  whatsapp_click: 'text-green-500 bg-green-500/10',
  view_milestone: 'text-amber-500 bg-amber-500/10',
  subscription_expiring: 'text-orange-500 bg-orange-500/10',
  subscription_expired: 'text-red-500 bg-red-500/10',
  product_sold: 'text-emerald-500 bg-emerald-500/10',
  new_order: 'text-teal-500 bg-teal-500/10',
  low_stock: 'text-amber-600 bg-amber-500/10',
  out_of_stock: 'text-red-600 bg-red-500/10',
  referral_signup: 'text-cyan-500 bg-cyan-500/10',
  referral_upgrade: 'text-emerald-600 bg-emerald-500/10',
  promotional_offer: 'text-pink-500 bg-pink-500/10',
  novidades: 'text-sky-500 bg-sky-500/10',
  system: 'text-muted-foreground bg-muted',
};

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { notifications, loading, markAsRead, deleteNotification, refresh } = useNotifications();
  const [localLoading, setLocalLoading] = useState(true);

  const notification = notifications.find((n) => n.id === id);

  useEffect(() => {
    if (!loading && notifications.length === 0) {
      refresh().then(() => setLocalLoading(false));
    } else {
      setLocalLoading(false);
    }
  }, [loading, notifications.length, refresh]);

  useEffect(() => {
    if (notification && !notification.is_read) {
      markAsRead(notification.id);
    }
  }, [notification, markAsRead]);

  if (localLoading || loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!notification) {
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-2xl">
        <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => navigate('/dashboard/notifications')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Info className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground">Notificação não encontrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Esta notificação pode ter sido excluída.</p>
            <Button className="mt-4" onClick={() => navigate('/dashboard/notifications')}>
              Ver todas as notificações
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const Icon = ICON_MAP[notification.type] || Info;
  const colorClass = COLOR_MAP[notification.type] || COLOR_MAP.system;
  const formattedDate = format(new Date(notification.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });

  const action = getNotificationNavigationAction(notification);

  const handleActionClick = () => {
    if (action.type === 'navigate') {
      navigate(action.path);
    } else if (action.type === 'external') {
      window.open(action.url, '_blank');
    }
  };

  const handleDelete = async () => {
    await deleteNotification(notification.id);
    navigate('/dashboard/notifications');
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/dashboard/notifications')}>
        <ArrowLeft className="h-4 w-4" />
        Voltar para notificações
      </Button>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-4">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', colorClass)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold leading-tight">{notification.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {(action.type === 'navigate' || action.type === 'external') && (
              <Button onClick={handleActionClick} className="gap-1.5">
                {action.type === 'external' ? 'Abrir link' : 'Ir para tela'}
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}

            {!notification.is_read && (
              <Button variant="outline" onClick={() => markAsRead(notification.id)} className="gap-1.5">
                <Check className="h-4 w-4" />
                Marcar como lida
              </Button>
            )}

            <Button
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
