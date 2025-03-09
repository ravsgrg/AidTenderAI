
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface InventoryItem {
  id: number;
  name: string;
  description: string | null;
  categoryId: number;
  sku: string;
  quantity: number;
  minQuantity: number;
  location: string | null;
  lastUpdated: string;
}

interface InventoryCategory {
  id: number;
  name: string;
  description: string | null;
  code: string;
}

export default function InventoryManagement() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id' | 'lastUpdated'>>({
    name: '',
    description: '',
    categoryId: 0,
    sku: '',
    quantity: 0,
    minQuantity: 0,
    location: '',
  });
  const [isAddingItem, setIsAddingItem] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsResponse, categoriesResponse] = await Promise.all([
          axios.get('/api/inventory-items'),
          axios.get('/api/inventory-categories')
        ]);
        setItems(itemsResponse.data);
        setCategories(categoriesResponse.data);
        setError(null);
      } catch (err) {
        setError('Failed to load inventory data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem(prev => ({
      ...prev,
      [name]: name === 'categoryId' || name === 'quantity' || name === 'minQuantity' 
        ? parseInt(value, 10) 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/inventory-items', newItem);
      setItems(prev => [...prev, response.data]);
      setNewItem({
        name: '',
        description: '',
        categoryId: 0,
        sku: '',
        quantity: 0,
        minQuantity: 0,
        location: '',
      });
      setIsAddingItem(false);
    } catch (err) {
      setError('Failed to add inventory item');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`/api/inventory-items/${id}`);
        setItems(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        setError('Failed to delete inventory item');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-4">Loading inventory data...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <button 
          onClick={() => setIsAddingItem(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Add New Item
        </button>
      </div>

      {isAddingItem && (
        <div className="bg-white p-4 rounded shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Add New Inventory Item</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newItem.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  value={newItem.sku}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block mb-1">Category</label>
                <select
                  name="categoryId"
                  value={newItem.categoryId}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1">Quantity</label>
                <input
                  type="number"
                  name="quantity"
                  value={newItem.quantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-1">Minimum Quantity</label>
                <input
                  type="number"
                  name="minQuantity"
                  value={newItem.minQuantity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={newItem.location || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1">Description</label>
                <textarea
                  name="description"
                  value={newItem.description || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4 space-x-2">
              <button
                type="button"
                onClick={() => setIsAddingItem(false)}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
              >
                Save Item
              </button>
            </div>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded text-center">
          <p className="text-gray-500">No inventory items found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">SKU</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-right">Quantity</th>
                <th className="px-4 py-2 text-right">Min Quantity</th>
                <th className="px-4 py-2 text-left">Location</th>
                <th className="px-4 py-2 text-left">Last Updated</th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const category = categories.find(c => c.id === item.categoryId);
                const isLowStock = item.quantity < item.minQuantity;
                
                return (
                  <tr key={item.id} className={isLowStock ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-4 py-2 border-t">{item.name}</td>
                    <td className="px-4 py-2 border-t">{item.sku}</td>
                    <td className="px-4 py-2 border-t">{category?.name || 'Unknown'}</td>
                    <td className={`px-4 py-2 border-t text-right ${isLowStock ? 'text-red-600 font-medium' : ''}`}>
                      {item.quantity}
                    </td>
                    <td className="px-4 py-2 border-t text-right">{item.minQuantity}</td>
                    <td className="px-4 py-2 border-t">{item.location || '-'}</td>
                    <td className="px-4 py-2 border-t">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 border-t text-center">
                      <button 
                        onClick={() => navigate(`/inventory/${item.id}`)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
