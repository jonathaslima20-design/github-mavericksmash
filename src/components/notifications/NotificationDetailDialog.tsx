import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
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
  ExternalLink,
  Check,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification, NotificationType } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface NotificationDetailDialogProps {
  notification: AppNotification | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationDetailDialog({
  notification,
  open,
  onOpenChange,
  onRead,
  onDelete,
}: NotificationDetailDialogProps) {
  const navigate = useNavigate();

  if (!notification) return null;

  const Icon = ICON_MAP[notification.type] || Info;
  const colorClass = COLOR_MAP[notification.type] || COLOR_MAP.system;

  const formattedDate = format(new Date(notification.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  const handleMarkAsRead = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
  };

  const handleDelete = () => {
    onDelete(notification.id);
    onOpenChange(false);
  };

  const handleCtaClick = () => {
    if (!notification.is_read) {
      onRead(notification.id);
    }
    onOpenChange(false);
    if (notification.cta_url) {
      if (notification.cta_url.startsWith('http')) {
        window.open(notification.cta_url, '_blank');
      } else {
        navigate(notification.cta_url);
      }
    } else if (notification.related_entity_type === 'order') {
      navigate('/dashboard/orders');
    } else if (notification.related_entity_type === 'product' && notification.related_entity_id) {
      navigate('/dashboard/listings');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                colorClass
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base leading-tight">
                {notification.title}
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                {formattedDate}
              </DialogDescription>
            </div>
            {!notification.is_read && (
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {notification.message}
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            {notification.cta_label && (
              <Button size="sm" className="gap-1.5" onClick={handleCtaClick}>
                {notification.cta_label}
                <ExternalLink className="h-3.5 w-3.5" />
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
      </DialogContent>
    </Dialog>
  );
}
