import { Link, useRoute } from 'wouter';
import { Tags, FolderTree, Settings, List, Grid } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  path: string;
  label: string;
  icon: JSX.Element;
}

export function CategoriesNavigation() {
  const categoryItems: NavigationItem[] = [
    {
      path: '/categories/all',
      label: 'All Categories',
      icon: <Tags className="mr-3 h-5 w-5" />,
    },
    {
      path: '/categories/hierarchy',
      label: 'Category Hierarchy',
      icon: <FolderTree className="mr-3 h-5 w-5" />,
    },
    {
      path: '/categories/settings',
      label: 'Category Settings',
      icon: <Settings className="mr-3 h-5 w-5" />,
    },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex-shrink-0">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-lg font-semibold flex items-center">
          <Tags className="mr-2 h-5 w-5" />
          Categories
        </h2>
      </div>
      
      <nav className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase text-gray-500 font-semibold">View</span>
            <div className="flex space-x-1">
              <button className="p-1 rounded hover:bg-gray-800" title="List view">
                <List className="h-4 w-4 text-gray-400" />
              </button>
              <button className="p-1 rounded hover:bg-gray-800" title="Grid view">
                <Grid className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <ul className="space-y-1">
            {categoryItems.map((item) => {
              const [isActive] = useRoute(item.path);
              return (
                <li key={item.path}>
                  <Link href={item.path}>
                    <a className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm",
                      "hover:bg-gray-800 transition-colors duration-150",
                      isActive && "bg-primary-700 hover:bg-primary-600"
                    )}>
                      {item.icon}
                      <span>{item.label}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
} 