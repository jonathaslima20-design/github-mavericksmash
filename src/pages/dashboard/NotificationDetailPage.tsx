import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader as Loader2,
  Trash2,
  Check,
  ExternalLink,
  MessageSquare,
  Eye,
  CreditCard,
  Phone,
  Tag,
  Info,
  ShoppingBag,
  TriangleAlert as AlertTriangle,
  PackageX,
  Gift,
  UserPlus,
  Sparkles,
  Clock,
  Bell,
  MailOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationContext';
import { getNotificationNavigationAction } from '@/lib/notificationNavigation';
import { format, formatDistanceToNow } from 'date-fns';
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

const TYPE_LABELS: Record<NotificationType, string> = {
  new_lead: 'Novo contato',
  whatsapp_click: 'WhatsApp',
  view_milestone: 'Visualizações',
  subscription_expiring: 'Assinatura',
  subscription_expired: 'Assinatura',
  product_sold: 'Venda',
  new_order: 'Pedido',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Esgotado',
  referral_signup: 'Indicação',
  referral_upgrade: 'Upgrade de indicação',
  promotional_offer: 'Oferta promocional',
  novidades: 'Novidades',
  system: 'Sistema',
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
      <div className="container mx-auto p-4 md:p-6 max-w-2xl space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => navigate('/dashboard/notifications')}>
          <ArrowLeft className="h-4 w-4" />
          Voltar para notificações
        </Button>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Bell className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">Notificação não encontrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1 max-w-xs">
              Esta notificação pode ter sido excluída ou o link está incorreto.
            </p>
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
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: ptBR });

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

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-5">
          {/* Header com icone e titulo */}
          <div className="flex items-start gap-4">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-full', colorClass)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h1 className="text-xl font-semibold leading-tight">{notification.title}</h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] font-medium">
                  {TYPE_LABELS[notification.type]}
                </Badge>
                {!notification.is_read && (
                  <Badge className="text-[10px] bg-primary/90 hover:bg-primary/90">
                    Não lida
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadados */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MailOpen className="h-3.5 w-3.5" />
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Mensagem completa */}
          <div className="bg-muted/40 rounded-lg p-4">
            <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>
          </div>

          {/* Acoes */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
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
