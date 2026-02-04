import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CATEGORIES, STATUS_CONFIG } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Calendar, Package } from 'lucide-react';
import { format } from 'date-fns';

interface Rental {
  id: string;
  cloth_id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: 'available' | 'reserved' | 'rented' | 'returned';
  created_at: string;
  clothes?: {
    id: string;
    title: string;
    category: string;
    images: string[];
  };
  profiles?: {
    full_name: string;
  };
}

export default function MyRentals() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchRentals();
    }
  }, [user]);

  const fetchRentals = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('rentals')
      .select(`
        *,
        clothes (
          id,
          title,
          category,
          images
        ),
        profiles:owner_id (
          full_name
        )
      `)
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching rentals:', error);
    } else {
      setRentals((data as unknown as Rental[]) || []);
    }

    setLoading(false);
  };

  const activeRentals = rentals.filter((r) => ['reserved', 'rented'].includes(r.status));
  const pastRentals = rentals.filter((r) => ['returned'].includes(r.status));

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  const RentalCard = ({ rental }: { rental: Rental }) => {
    const categoryInfo = CATEGORIES.find((c) => c.value === rental.clothes?.category);
    const statusInfo = STATUS_CONFIG[rental.status];

    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-32 h-32 bg-muted flex-shrink-0">
              {rental.clothes?.images?.[0] ? (
                <img
                  src={rental.clothes.images[0]}
                  alt={rental.clothes.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl">
                  {categoryInfo?.icon || '👕'}
                </div>
              )}
            </div>
            <div className="flex-1 p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/clothes/${rental.clothes?.id}`}
                    className="font-semibold text-lg hover:text-primary transition-colors"
                  >
                    {rental.clothes?.title}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    From {rental.profiles?.full_name}
                  </p>
                </div>
                <Badge className={`${statusInfo.color} text-primary-foreground w-fit`}>
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(rental.start_date), 'MMM d')} -{' '}
                    {format(new Date(rental.end_date), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="font-semibold text-primary">₹{rental.total_amount}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">My Rentals</h1>
          <p className="text-muted-foreground">Track your rental requests and history</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-lg" />
            ))}
          </div>
        ) : rentals.length > 0 ? (
          <Tabs defaultValue="active">
            <TabsList className="mb-6">
              <TabsTrigger value="active">
                Active ({activeRentals.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastRentals.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="space-y-4">
              {activeRentals.length > 0 ? (
                activeRentals.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active rentals</p>
                </div>
              )}
            </TabsContent>
            <TabsContent value="past" className="space-y-4">
              {pastRentals.length > 0 ? (
                pastRentals.map((rental) => (
                  <RentalCard key={rental.id} rental={rental} />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No past rentals</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No rentals yet</h3>
            <p className="text-muted-foreground mb-4">
              Browse clothes and start renting!
            </p>
            <Button asChild>
              <Link to="/browse">Browse Clothes</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
