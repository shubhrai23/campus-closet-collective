import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { STATUS_CONFIG } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Shirt, ShoppingBag, Shield, Search, Trash2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  hostel: string | null;
  created_at: string;
}

interface Clothing {
  id: string;
  title: string;
  category: string;
  size: string;
  status: 'available' | 'reserved' | 'rented' | 'returned';
  rent_per_day: number;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

interface Rental {
  id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'available' | 'reserved' | 'rented' | 'returned';
  created_at: string;
  clothes?: {
    title: string;
  };
  renter?: {
    full_name: string;
  };
  owner?: {
    full_name: string;
  };
}

export default function Admin() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [clothes, setClothes] = useState<Clothing[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchClothes, setSearchClothes] = useState('');
  
  // Admin dialog
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!isAdmin) {
        navigate('/');
        toast.error('Admin access required');
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch users
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers((usersData as User[]) || []);

    // Fetch clothes
    const { data: clothesData } = await supabase
      .from('clothes')
      .select(`
        *,
        profiles:owner_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false });
    setClothes((clothesData as unknown as Clothing[]) || []);

    // Fetch rentals
    const { data: rentalsData } = await supabase
      .from('rentals')
      .select(`
        *,
        clothes (
          title
        ),
        renter:renter_id (
          full_name
        ),
        owner:owner_id (
          full_name
        )
      `)
      .order('created_at', { ascending: false });
    setRentals((rentalsData as unknown as Rental[]) || []);

    setLoading(false);
  };

  const updateRentalStatus = async (rentalId: string, newStatus: 'available' | 'reserved' | 'rented' | 'returned', clothId?: string) => {
    const { error } = await supabase
      .from('rentals')
      .update({ status: newStatus })
      .eq('id', rentalId);

    if (error) {
      toast.error('Failed to update rental status');
    } else {
      // Also update clothing status
      if (clothId) {
        const clothStatus = newStatus === 'returned' ? 'available' : newStatus;
        await supabase
          .from('clothes')
          .update({ status: clothStatus })
          .eq('id', clothId);
      }
      toast.success('Status updated');
      fetchData();
    }
  };

  const deleteClothing = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const { error } = await supabase.from('clothes').delete().eq('id', id);

    if (error) {
      toast.error('Failed to delete listing');
    } else {
      toast.success('Listing deleted');
      fetchData();
    }
  };

  const createAdmin = async () => {
    if (!adminEmail) {
      toast.error('Please enter an email');
      return;
    }

    setCreatingAdmin(true);

    // Find user by email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', adminEmail)
      .single();

    if (!userProfile) {
      toast.error('User not found');
      setCreatingAdmin(false);
      return;
    }

    // Add admin role
    const { error } = await supabase.from('user_roles').insert({
      user_id: userProfile.user_id,
      role: 'admin',
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('User is already an admin');
      } else {
        toast.error('Failed to create admin');
      }
    } else {
      toast.success('Admin created successfully');
      setAdminDialogOpen(false);
      setAdminEmail('');
    }

    setCreatingAdmin(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase())
  );

  const filteredClothes = clothes.filter((c) =>
    c.title.toLowerCase().includes(searchClothes.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, listings, and rentals</p>
          </div>
          <Dialog open={adminDialogOpen} onOpenChange={setAdminDialogOpen}>
            <Button onClick={() => setAdminDialogOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Admin</DialogTitle>
                <DialogDescription>
                  Enter the email of the user you want to make an admin.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="user@dtu.ac.in"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button onClick={createAdmin} disabled={creatingAdmin}>
                  {creatingAdmin ? 'Creating...' : 'Create Admin'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{users.length}</p>
                <p className="text-sm text-muted-foreground">Users</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-status-available/10 flex items-center justify-center">
                <Shirt className="h-6 w-6 text-status-available" />
              </div>
              <div>
                <p className="text-2xl font-bold">{clothes.length}</p>
                <p className="text-sm text-muted-foreground">Listings</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-status-reserved/10 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-status-reserved" />
              </div>
              <div>
                <p className="text-2xl font-bold">{rentals.length}</p>
                <p className="text-sm text-muted-foreground">Rentals</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">Active</p>
                <p className="text-sm text-muted-foreground">Admin</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rentals">
          <TabsList className="mb-6">
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
          </TabsList>

          {/* Rentals Tab */}
          <TabsContent value="rentals">
            <Card>
              <CardHeader>
                <CardTitle>Rental Requests</CardTitle>
                <CardDescription>Manage and coordinate rental exchanges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Renter</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentals.map((rental) => (
                        <TableRow key={rental.id}>
                          <TableCell className="font-medium">
                            {rental.clothes?.title}
                          </TableCell>
                          <TableCell>{rental.renter?.full_name}</TableCell>
                          <TableCell>{rental.owner?.full_name}</TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(rental.start_date), 'MMM d')} -{' '}
                            {format(new Date(rental.end_date), 'MMM d')}
                          </TableCell>
                          <TableCell>₹{rental.total_amount}</TableCell>
                          <TableCell>
                            <Badge className={`${STATUS_CONFIG[rental.status].color} text-primary-foreground`}>
                              {STATUS_CONFIG[rental.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={rental.status}
                              onValueChange={(v) => updateRentalStatus(rental.id, v as 'available' | 'reserved' | 'rented' | 'returned')}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reserved">Reserved</SelectItem>
                                <SelectItem value="rented">Rented</SelectItem>
                                <SelectItem value="returned">Returned</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {rentals.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No rentals yet
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10"
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Hostel</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.hostel || '-'}</TableCell>
                          <TableCell>
                            {format(new Date(u.created_at), 'MMM d, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle>All Listings</CardTitle>
                <CardDescription>View and moderate clothing listings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search listings..."
                      className="pl-10"
                      value={searchClothes}
                      onChange={(e) => setSearchClothes(e.target.value)}
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClothes.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.title}</TableCell>
                          <TableCell>{c.profiles?.full_name}</TableCell>
                          <TableCell className="capitalize">{c.category}</TableCell>
                          <TableCell>{c.size}</TableCell>
                          <TableCell>₹{c.rent_per_day}/day</TableCell>
                          <TableCell>
                            <Badge className={`${STATUS_CONFIG[c.status].color} text-primary-foreground`}>
                              {STATUS_CONFIG[c.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => deleteClothing(c.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredClothes.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No listings found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
