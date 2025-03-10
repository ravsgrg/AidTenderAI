import React from 'react';
import PageLayout from "@/components/layout/page-layout"; // Assumed to be a named export, not default
import CategoryManagement from "@/components/inventory/CategoryManagement";
import { useTitle } from "@/hooks/use-title";

function CategoriesPageContent() {
  useTitle("Categories");
  // Removed: const { toast } = useToast();  // useToast is undefined in the provided code.
  // Removed: const [categories, setCategories] = useState<Category[]>([]); // Category and useState are undefined in the provided code.

  return (
    <div className="container mx-auto py-6">
      <CategoryManagement />
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <PageLayout>
      <CategoriesPageContent />
    </PageLayout>
  );
}