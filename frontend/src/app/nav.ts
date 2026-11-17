import { FileCheck2, Inbox, Settings, Sparkles, Users, Zap, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Step number in the weekly flow, if part of it. */
  step?: number;
  /** Shown in the mobile bottom bar (others go to the "Más" menu). */
  primary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/capture', label: 'Captura', icon: Zap, step: 1, primary: true },
  { to: '/triage', label: 'Triaje', icon: Inbox, step: 2, primary: true },
  { to: '/composer', label: 'Redactor', icon: Sparkles, step: 3, primary: true },
  { to: '/reports', label: 'Reportes', icon: FileCheck2, step: 4, primary: true },
  { to: '/clients', label: 'Clientes', icon: Users, primary: false },
  { to: '/settings', label: 'Ajustes', icon: Settings, primary: false },
];
