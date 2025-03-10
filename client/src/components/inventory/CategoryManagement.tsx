
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, PlusCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

interface Category {
  id: number;
  name: string;
  description: string | null;
  code?: string;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryCategories, setInventoryCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    code: ''
  });
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tender' | 'inventory'>('tender');

  useEffect(() => {
    fetchCategories();
    fetchInventoryCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInventoryCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/inventory-categories');
      if (response.ok) {
        const data = await response.json();
        setInventoryCategories(data);
      } else {
        console.error('Failed to fetch inventory categories:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching inventory categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    try {
      const apiUrl = activeTab === 'tender' ? '/api/categories' : '/api/inventory-categories';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      if (response.ok) {
        if (activeTab === 'tender') {
          await fetchCategories();
        } else {
          await fetchInventoryCategories();
        }
        setNewCategory({ name: '', description: '', code: '' });
        setCategoryModalOpen(false);
      } else {
        console.error('Failed to create category:', response.statusText);
      }
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editCategory) return;
    
    try {
      const apiUrl = activeTab === 'tender' 
        ? `/api/categories/${editCategory.id}` 
        : `/api/inventory-categories/${editCategory.id}`;
      
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editCategory.name,
          description: editCategory.description,
          code: editCategory.code
        }),
      });

      if (response.ok) {
        if (activeTab === 'tender') {
          await fetchCategories();
        } else {
          await fetchInventoryCategories();
        }
        setEditCategory(null);
        setCategoryModalOpen(false);
      } else {
        console.error('Failed to update category:', response.statusText);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const apiUrl = activeTab === 'tender' 
        ? `/api/categories/${id}` 
        : `/api/inventory-categories/${id}`;
      
      const response = await fetch(apiUrl, {
        method: 'DELETE',
      });

      if (response.ok) {
        if (activeTab === 'tender') {
          await fetchCategories();
        } else {
          await fetchInventoryCategories();
        }
      } else {
        console.error('Failed to delete category:', response.statusText);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const openCreateModal = () => {
    setEditCategory(null);
    setNewCategory({ name: '', description: '', code: '' });
    setCategoryModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditCategory(category);
    setCategoryModalOpen(true);
  };

  const currentCategories = activeTab === 'tender' ? categories : inventoryCategories;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Categories Management</h2>
        <Button onClick={openCreateModal} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant={activeTab === 'tender' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('tender')}
              >
                Tender Categories
              </Button>
              <Button 
                variant={activeTab === 'inventory' ? 'default' : 'outline'} 
                onClick={() => setActiveTab('inventory')}
              >
                Inventory Categories
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Loading categories...</div>
          ) : currentCategories.length === 0 ? (
            <div className="text-center py-4">No categories found. Create one to get started.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  {activeTab === 'inventory' && <TableHead>Code</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.description || '-'}</TableCell>
                    {activeTab === 'inventory' && <TableCell>{category.code || '-'}</TableCell>}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(category)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCategoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={editCategory ? editCategory.name : newCategory.name}
                onChange={(e) => {
                  if (editCategory) {
                    setEditCategory({...editCategory, name: e.target.value});
                  } else {
                    setNewCategory({...newCategory, name: e.target.value});
                  }
                }}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editCategory ? editCategory.description || '' : newCategory.description}
                onChange={(e) => {
                  if (editCategory) {
                    setEditCategory({...editCategory, description: e.target.value});
                  } else {
                    setNewCategory({...newCategory, description: e.target.value});
                  }
                }}
                className="col-span-3"
              />
            </div>
            {activeTab === 'inventory' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input
                  id="code"
                  value={editCategory ? editCategory.code || '' : newCategory.code}
                  onChange={(e) => {
                    if (editCategory) {
                      setEditCategory({...editCategory, code: e.target.value});
                    } else {
                      setNewCategory({...newCategory, code: e.target.value});
                    }
                  }}
                  className="col-span-3"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={editCategory ? handleUpdateCategory : handleCreateCategory}>
              {editCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
