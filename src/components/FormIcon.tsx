import {
  BadgeCheck,
  Building2,
  Contact,
  CreditCard,
  FileText,
  Gavel,
  Heart,
  Home,
  IdCard,
  Landmark,
  Mail,
  RefreshCcw,
  Scale,
  ThumbsUp,
  Users,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  home: Home,
  badge: IdCard,
  id: Contact,
  landmark: Landmark,
  users: Users,
  check: BadgeCheck,
  heart: Heart,
  building: Building2,
  scale: Scale,
  thumbs: ThumbsUp,
  file: FileText,
  card: CreditCard,
  refresh: RefreshCcw,
  gavel: Gavel,
  mail: Mail,
};

export function FormIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? FileText;
  return <Icon className={className} aria-hidden />;
}
