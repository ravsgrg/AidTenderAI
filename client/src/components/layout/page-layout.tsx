import { ReactNode, useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

interface PageLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export function PageLayout({ 
  children, 
  pageTitle = "", 
  pageDescription = "" 
}: PageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden md:flex" />
      
      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-gray-900 text-white">
          <Sidebar />
        </SheetContent>
      </Sheet>
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMobileMenuToggle={toggleMobileMenu} />
        
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {/* Page Title */}
          {(pageTitle || pageDescription) && (
            <div className="mb-6">
              {pageTitle && <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>}
              {pageDescription && <p className="text-gray-600">{pageDescription}</p>}
            </div>
          )}
          
          {/* Page Content */}
          {children}
        </main>
      </div>
    </div>
  );
}
