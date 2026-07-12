import {
  LayoutDashboard, Users, Pill, FileText, Bell, User, ShoppingCart,
  Package, RefreshCw, CreditCard, RotateCcw, UserCog,
} from 'lucide-react';
import { ROLES } from '../utils/constants';

export const NAV_ITEMS = {
  [ROLES.ADMIN]: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Manager Management', path: '/admin/managers', icon: UserCog },
  ],
  [ROLES.MANAGER]: [
    { label: 'Dashboard', path: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Staff', path: '/manager/staff', icon: Users },
    { label: 'Medicines', path: '/manager/medicines', icon: Pill },
    { label: 'Reports', path: '/manager/reports', icon: FileText },
    { label: 'Notifications', path: '/manager/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  [ROLES.PHARMACIST]: [
    { label: 'Dashboard', path: '/pharmacist/dashboard', icon: LayoutDashboard },
    { label: 'Medicines', path: '/pharmacist/medicines', icon: Pill },
    { label: 'Create Sale', path: '/pharmacist/sales/new', icon: ShoppingCart },
    { label: 'Manage Stock', path: '/pharmacist/medicines/manage', icon: Package },
    { label: 'Restock', path: '/pharmacist/restock', icon: RefreshCw },
    { label: 'Reports', path: '/pharmacist/reports', icon: FileText },
    { label: 'Profile', path: '/profile', icon: User },
  ],
  [ROLES.CASHIER]: [
    { label: 'Dashboard', path: '/cashier/dashboard', icon: LayoutDashboard },
    { label: 'Pending Payments', path: '/cashier/payments/pending', icon: CreditCard },
    { label: 'Returns', path: '/cashier/returns', icon: RotateCcw },
    { label: 'Reports', path: '/cashier/reports', icon: FileText },
    { label: 'Profile', path: '/profile', icon: User },
  ],
};

export function getNavItems(roleId) {
  return NAV_ITEMS[roleId] || [];
}
