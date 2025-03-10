import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus,
  Search, 
  Filter, 
  RefreshCcw,
  DollarSign
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/layout/page-layout";

interface Bid {
  id: number;
  tenderId: number;
  bidderId: number;
  status: string;
  totalAmount: number;
  submittedAt: Date | null;
  tender?: Tender;
  bidder?: Bidder;
  items: BidItem[];
}

interface BidItem {
  id: number;
  bidId: number;
  tenderItemId: number;
  inventoryId: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  tenderItem?: TenderItem;
}

interface Tender {
  id: number;
  title: string;
  description: string;
  status: string;
  startDate: Date;
  endDate: Date;
  categoryId: number;
  items: TenderItem[];
}

interface TenderItem {
  id: number;
  tenderId: number;
  inventoryId: string;
  categoryId: number;
  quantity: number;
  specifications: string | null;
  inventory?: InventoryItem;
}

interface InventoryItem {
  item_no: string;
  desc: string;
  unit: string;
  unit_cost: number;
}

interface Bidder {
  id: number;
  name: string;
  email: string;
}

export default function BidManagement() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [newBid, setNewBid] = useState<Partial<Bid>>({
    status: 'DRAFT',
    items: [],
  });

  useEffect(() => {
    fetchBids();
    fetchTenders();
  }, []);

  const fetchBids = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/bids');
      if (response.ok) {
        const data = await response.json();
        setBids(data);
      } else {
        console.error('Failed to fetch bids:', response.statusText);
        setError(`Failed to fetch bids: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
      setError('Error fetching bids. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenders = async () => {
    try {
      const response = await fetch('/api/tenders');
      if (response.ok) {
        const data = await response.json();
        setTenders(data);
      } else {
        console.error('Failed to fetch tenders:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching tenders:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge className="bg-gray-500">Draft</Badge>;
      case 'SUBMITTED':
        return <Badge className="bg-green-500">Submitted</Badge>;
      case 'ACCEPTED':
        return <Badge className="bg-blue-500">Accepted</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500">Rejected</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const filteredBids = bids.filter(bid => {
    const matchesStatus = selectedStatus === "all" ? true : bid.status === selectedStatus;
    const matchesSearch = searchQuery 
      ? bid.tender?.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearFilters = () => {
    setSelectedStatus("all");
    setSearchQuery("");
  };

  const handleRefresh = () => {
    fetchBids();
  };

  const handleTenderSelect = async (tenderId: string) => {
    try {
      const response = await fetch(`/api/tenders/${tenderId}`);
      if (response.ok) {
        const tender = await response.json();
        setSelectedTender(tender);
        setNewBid(prev => ({
          ...prev,
          tenderId: parseInt(tenderId),
          items: tender.items.map((item: TenderItem) => ({
            tenderItemId: item.id,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            unitPrice: 0,
            totalPrice: 0
          }))
        }));
      } else {
        setError('Failed to fetch tender details');
      }
    } catch (error) {
      console.error('Error fetching tender details:', error);
      setError('Error fetching tender details');
    }
  };

  const handleItemPriceChange = (index: number, unitPrice: number) => {
    setNewBid(prev => {
      const items = [...(prev.items || [])];
      items[index] = {
        ...items[index],
        unitPrice,
        totalPrice: unitPrice * items[index].quantity
      };
      return {
        ...prev,
        items,
        totalAmount: items.reduce((sum, item) => sum + item.totalPrice, 0)
      };
    });
  };

  const handleSubmitBid = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!newBid.tenderId || !newBid.items?.length) {
        setError("Please select a tender and provide item prices");
        return;
      }

      const response = await fetch('/api/bids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newBid),
      });

      if (response.ok) {
        const data = await response.json();
        setBids(prevBids => [...prevBids, data]);
        setIsAddModalOpen(false);
        setNewBid({
          status: 'DRAFT',
          items: [],
        });
        setSelectedTender(null);
        toast({
          title: "Success",
          description: "Bid created successfully",
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create bid');
      }
    } catch (error) {
      console.error('Error creating bid:', error);
      setError('Error creating bid. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold tracking-tight">Bid Management</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Bid
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle>Bids</CardTitle>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tenders..."
                    className="md:w-[200px]"
                    value={searchQuery}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="md:w-[200px]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SUBMITTED">Submitted</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="icon" onClick={handleClearFilters} title="Clear filters">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="text-center py-4 text-red-500">{error}</div>
            )}
            {isLoading ? (
              <div className="text-center py-4">Loading bids...</div>
            ) : filteredBids.length === 0 ? (
              <div className="text-center py-4">No bids found.</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tender</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell>{bid.tender?.title}</TableCell>
                        <TableCell>${bid.totalAmount.toFixed(2)}</TableCell>
                        <TableCell>
                          {bid.submittedAt 
                            ? new Date(bid.submittedAt).toLocaleDateString() 
                            : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(bid.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Bid Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>Create New Bid</DialogTitle>
            </DialogHeader>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tender" className="text-right">Tender</Label>
                <div className="col-span-3">
                  <Select 
                    onValueChange={handleTenderSelect} 
                    value={newBid.tenderId?.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tender" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenders
                        .filter(tender => tender.status === 'PUBLISHED')
                        .map(tender => (
                          <SelectItem key={tender.id} value={tender.id.toString()}>
                            {tender.title}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTender && (
                <>
                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Tender Details</h3>
                    <p><strong>Description:</strong> {selectedTender.description}</p>
                    <p><strong>Start Date:</strong> {new Date(selectedTender.startDate).toLocaleDateString()}</p>
                    <p><strong>End Date:</strong> {new Date(selectedTender.endDate).toLocaleDateString()}</p>
                  </div>

                  <div className="border rounded-md p-4">
                    <h3 className="font-semibold mb-2">Bid Items</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price ($)</TableHead>
                          <TableHead>Total Price ($)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newBid.items?.map((item, index) => {
                          const tenderItem = selectedTender.items.find(
                            ti => ti.id === item.tenderItemId
                          );
                          return (
                            <TableRow key={item.tenderItemId}>
                              <TableCell>
                                {tenderItem?.inventory?.desc || tenderItem?.inventoryId}
                              </TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => handleItemPriceChange(index, parseFloat(e.target.value) || 0)}
                                  className="w-[100px]"
                                />
                              </TableCell>
                              <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    <div className="mt-4 text-right">
                      <p className="font-semibold">
                        Total Bid Amount: ${newBid.totalAmount?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button 
                onClick={handleSubmitBid} 
                disabled={isSubmitting || !selectedTender}
              >
                {isSubmitting ? 'Creating...' : 'Create Bid'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
} 