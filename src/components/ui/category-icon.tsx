import {
  Award,
  Bath,
  BriefcaseBusiness,
  BusFront,
  CarFront,
  CircleDollarSign,
  Clapperboard,
  Gift,
  GraduationCap,
  HandCoins,
  HeartPulse,
  Laptop,
  ReceiptText,
  Shapes,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Store,
  Target,
  UtensilsCrossed,
} from "lucide-react";

interface CategoryIconProps {
  name: string;
  className?: string;
}

/** Static icon lookup keeps bundles small and avoids dynamic component creation. */
export function CategoryIcon({ name, className }: CategoryIconProps) {
  switch (name) {
    case "Award":
      return <Award className={className} aria-hidden="true" />;
    case "Bath":
      return <Bath className={className} aria-hidden="true" />;
    case "BriefcaseBusiness":
      return <BriefcaseBusiness className={className} aria-hidden="true" />;
    case "BusFront":
      return <BusFront className={className} aria-hidden="true" />;
    case "CarFront":
      return <CarFront className={className} aria-hidden="true" />;
    case "CircleDollarSign":
      return <CircleDollarSign className={className} aria-hidden="true" />;
    case "Clapperboard":
      return <Clapperboard className={className} aria-hidden="true" />;
    case "Gift":
      return <Gift className={className} aria-hidden="true" />;
    case "GraduationCap":
      return <GraduationCap className={className} aria-hidden="true" />;
    case "HandCoins":
      return <HandCoins className={className} aria-hidden="true" />;
    case "HeartPulse":
      return <HeartPulse className={className} aria-hidden="true" />;
    case "Laptop":
      return <Laptop className={className} aria-hidden="true" />;
    case "ReceiptText":
      return <ReceiptText className={className} aria-hidden="true" />;
    case "ShieldCheck":
      return <ShieldCheck className={className} aria-hidden="true" />;
    case "ShoppingBag":
      return <ShoppingBag className={className} aria-hidden="true" />;
    case "ShoppingBasket":
      return <ShoppingBasket className={className} aria-hidden="true" />;
    case "Sparkles":
      return <Sparkles className={className} aria-hidden="true" />;
    case "Store":
      return <Store className={className} aria-hidden="true" />;
    case "Target":
      return <Target className={className} aria-hidden="true" />;
    case "UtensilsCrossed":
      return <UtensilsCrossed className={className} aria-hidden="true" />;
    default:
      return <Shapes className={className} aria-hidden="true" />;
  }
}
