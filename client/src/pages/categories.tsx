
import PageLayout from "@/components/layout/page-layout";
import CategoryManagement from "@/components/inventory/CategoryManagement";
import { useTitle } from "@/hooks/use-title";

export default function CategoriesPage() {
  useTitle("Categories");
  
  return (
    <PageLayout>
      <div className="container mx-auto py-6">
        <CategoryManagement />
      </div>
    </PageLayout>
  );
}
