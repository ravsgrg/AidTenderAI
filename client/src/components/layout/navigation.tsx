import { Package, Folder, FileText, Users, DollarSign, Gavel } from "lucide-react";

export const navigationItems = [
  {
    title: "Inventory",
    href: "/inventory",
    icon: <Package className="h-4 w-4" />,
  },
  {
    title: "Categories",
    href: "/categories",
    icon: <Folder className="h-4 w-4" />,
  },
  {
    title: "Tenders",
    href: "/tenders",
    icon: <Gavel className="h-4 w-4" />,
  },
  {
    title: "Bids",
    href: "/bids",
    icon: <DollarSign className="h-4 w-4" />,
  },
]; 