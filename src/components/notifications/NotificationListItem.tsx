import { useState } from 'react';
import {
  MessageSquare,
  Eye,
  CreditCard,
  Phone,
  Tag,
  Info,
  X,
  ShoppingBag,
  TriangleAlert as AlertTriangle,
  PackageX,
  Gift,
  UserPlus,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Check,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationType } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { getNotificationNavigationAction } from '@/lib/notificationNavigation';
import { Button } from '@/components/ui/button';

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
  low_stock: 'Estoque',
  out_of_stock: 'Esgotado',
  referral_signup: 'Indicação',
  referral_upgrade: 'Indicação',
  promotional_offer: 'Oferta',
  novidades: 'Novidades',
  system: 'Sistema',
};

interface NotificationListItemProps {
  notification: AppNotification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationListItem({
  notification,
  onRead,
  onDelete,
}: NotificationListItemProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const Icon = ICON_MAP[notification.type] || Info;
  const colorClass = COLOR_MAP[notification.type] || COLOR_MAP.system;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const fullDate = format(new Date(notification.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!notification.is_read) {
      onRead(notification.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  const handleNavigate = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }

    const action = getNotificationNavigationAction(notification);

    if (action.type === 'navigate') {
      navigate(action.path);
    } else if (action.type === 'external') {
      window.open(action.url, '_blank');
    }
  };

  const action = getNotificationNavigationAction(notification);
  const hasDestination = action.type === 'navigate' || action.type === 'external';

  return (
    <div
      className={cn(
        'group border-b border-border/50 last:border-b-0 transition-colors',
        !notification.is_read && 'bg-primary/[0.02]'
      )}
    >
      {/* Header sempre visivel */}
      <div
        className={cn(
          'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors',
          expanded && 'bg-muted/30'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', colorClass)}>
          <Icon className="h-4.5 w-4.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn('text-sm', !notification.is_read ? 'font-semibold' : 'font-medium')}>
              {notification.title}
            </p>
            {!notification.is_read && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {notification.message}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] text-muted-foreground/60">{timeAgo}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/70 font-medium">
              {TYPE_LABELS[notification.type]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Conteudo expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-0">
          <div className="ml-12 space-y-4">
            {/* Data completa */}
            <p className="text-xs text-muted-foreground/60">{fullDate}</p>

            {/* Mensagem completa */}
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {notification.message}
            </p>

            {/* Acoes */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {hasDestination && (
                <Button size="sm" className="gap-1.5" onClick={handleNavigate}>
                  {action.type === 'external' ? 'Abrir link' : 'Ir para tela'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}

              {!notification.is_read && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleMarkAsRead}
                >
                  <Check className="h-3.5 w-3.5" />
                  Marcar como lida
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
