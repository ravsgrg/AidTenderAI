
import React from 'react';
import { Link, useRoute } from 'wouter';
import { 
  LayoutDashboard, 
  ListTodo, 
  BarChart, 
  Building, 
  Package, 
  Tags, 
  FileText, 
  Settings,
  Bot,
  Brain,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const sidebarItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: '/tenders', label: 'Tenders', icon: <ListTodo className="mr-3 h-5 w-5" /> },
    { path: '/bids', label: 'Bid Analysis', icon: <BarChart className="mr-3 h-5 w-5" /> },
    { path: '/bidders', label: 'Bidders', icon: <Building className="mr-3 h-5 w-5" /> },
    { path: '/inventory', label: 'Inventory', icon: <Package className="mr-3 h-5 w-5" /> },
    { path: '/categories', label: 'Categories', icon: <Tags className="mr-3 h-5 w-5" /> },
    { path: '/contracts', label: 'Contracts', icon: <FileText className="mr-3 h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="mr-3 h-5 w-5" /> },
  ];

  const aiItems = [
    { path: '/ai/predictions', label: 'Bid Predictions', icon: <Bot className="mr-2 h-4 w-4 text-primary-400" /> },
    { path: '/ai/market-analysis', label: 'Market Analysis', icon: <Brain className="mr-2 h-4 w-4 text-primary-400" /> },
    { path: '/ai/recommendations', label: 'Recommendations', icon: <Lightbulb className="mr-2 h-4 w-4 text-warning-500" /> },
  ];

  return (
    <aside className={cn("bg-gray-900 text-white w-64 flex-shrink-0 hidden md:flex flex-col h-screen", className)}>
      <div className="p-4 flex items-center border-b border-gray-800">
        <div className="p-1 bg-primary-700 rounded-sm mr-3">
          <LayoutDashboard className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-xl font-semibold">TenderAI</h1>
      </div>

      <nav className="mt-5 flex-1">
        <ul>
          {sidebarItems.map((item) => {
            const [isActive] = useRoute(item.path === "/" ? item.path : `${item.path}*`);
            return (
              <li key={item.path}>
                <Link href={item.path} className={cn(
                  "px-4 py-3 flex items-center hover:bg-gray-800 cursor-pointer",
                  isActive && "bg-primary-700 hover:bg-primary-600"
                )}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 px-4">
          <h2 className="text-xs uppercase text-gray-500 font-semibold mb-2">AI Tools</h2>
          <ul>
            {aiItems.map((item) => {
              const [isActive] = useRoute(item.path === "/" ? item.path : `${item.path}*`);
              return (
                <li key={item.path}>
                  <Link href={item.path} className={cn(
                    "px-4 py-2 flex items-center text-sm hover:bg-gray-800 rounded-md",
                    isActive && "bg-gray-800"
                  )}>
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary-700 flex items-center justify-center">
            <span className="text-sm font-semibold">AU</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-gray-400">admin@tenderai.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
