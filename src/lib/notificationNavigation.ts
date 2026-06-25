import type { AppNotification, NotificationType } from '@/types';

export type NavigationAction =
  | { type: 'navigate'; path: string }
  | { type: 'external'; url: string }
  | { type: 'detail'; notificationId: string }
  | { type: 'none' };

const TYPE_ROUTE_MAP: Record<NotificationType, string | null> = {
  new_lead: '/dashboard/orders',
  whatsapp_click: '/dashboard/orders',
  view_milestone: '/dashboard',
  subscription_expiring: '/dashboard/account',
  subscription_expired: '/dashboard/account',
  product_sold: '/dashboard/orders',
  new_order: '/dashboard/orders',
  low_stock: '/dashboard/inventory',
  out_of_stock: '/dashboard/inventory',
  referral_signup: '/dashboard/referral',
  referral_upgrade: '/dashboard/referral',
  promotional_offer: '/dashboard/notifications',
  novidades: '/dashboard/notifications',
  system: '/dashboard/notifications',
};

export function getNotificationNavigationAction(notification: AppNotification): NavigationAction {
  if (notification.cta_url) {
    if (notification.cta_url.startsWith('http')) {
      return { type: 'external', url: notification.cta_url };
    }
    return { type: 'navigate', path: notification.cta_url };
  }

  if (notification.related_entity_type === 'order') {
    return { type: 'navigate', path: '/dashboard/orders' };
  }

  if (notification.related_entity_type === 'product' && notification.related_entity_id) {
    return { type: 'navigate', path: '/dashboard/listings' };
  }

  const route = TYPE_ROUTE_MAP[notification.type];
  if (route) {
    return { type: 'navigate', path: route };
  }

  return { type: 'detail', notificationId: notification.id };
}

export function shouldOpenDetail(notification: AppNotification): boolean {
  const action = getNotificationNavigationAction(notification);
  return action.type === 'detail' || action.type === 'none';
}
