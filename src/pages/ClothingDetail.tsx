import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CATEGORIES, CONDITIONS, STATUS_CONFIG } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Calendar as CalendarIcon, Info } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface ClothingItem {
  id: string;
  title: string;
  description: string | null;
  category: string;
  size: string;
  condition: string;
  rent_per_day: number;
  status: 'available' | 'reserved' | 'rented' | 'returned';
  images: string[];
  owner_id: string;
  created_at: string;
}

export default function ClothingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clothing, setClothing] = useState<ClothingItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isRenting, setIsRenting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // CONFIG: 10% Service Fee added ON TOP of rent
  const COMMISSION_RATE = 0.10; 

  useEffect(() => {
    fetchClothing();
  }, [id]);

  const fetchClothing = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching clothing:', error);
      toast.error('Failed to load clothing details');
    } else {
      setClothing(data as unknown as ClothingItem);
    }
    setLoading(false);
  };

  // Helper to calculate costs
  const getCostBreakdown = () => {
    if (!dateRange?.from || !dateRange?.to || !clothing) return null;
    
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    const baseRent = days * clothing.rent_per_day; // This goes to Owner
    const serviceFee = Math.ceil(baseRent * COMMISSION_RATE); // This goes to You
    const totalAmount = baseRent + serviceFee; // Renter pays this

    return { days, baseRent, serviceFee, totalAmount };
  };

  const handleRent = async () => {
    if (!user) {
      toast.error('Please sign in to rent clothes');
      navigate('/auth');
      return;
    }

    const costs = getCostBreakdown();
    if (!costs || !clothing || !dateRange?.from || !dateRange?.to) {
      toast.error('Please select rental dates');
      return;
    }

    if (clothing.owner_id === user.id) {
      toast.error("You can't rent your own clothes");
      return;
    }

    setIsRenting(true);

    const { error } = await supabase.from('rentals').insert({
      cloth_id: clothing.id,
      renter_id: user.id,
      owner_id: clothing.owner_id,
      start_date: format(dateRange.from, 'yyyy-MM-dd'),
      end_date: format(dateRange.to, 'yyyy-MM-dd'),
      total_amount: costs.totalAmount, // Renter pays the inflated price
      platform_fee: costs.serviceFee,  // We record your profit separately
      status: 'reserved',
    });

    if (error) {
      console.error('Error creating rental:', error);
      toast.error('Failed to create rental request');
    } else {
      await supabase
        .from('clothes')
        .update({ status: 'reserved' })
        .eq('id', clothing.id);

      toast.success('Rental request submitted! Admin will coordinate the exchange.');
      setDialogOpen(false);
      navigate('/my-rentals');
    }

    setIsRenting(false);
  };

  const categoryInfo = CATEGORIES.find((c) => c.value === clothing?.category);
  const conditionInfo = CONDITIONS.find((c) => c.value === clothing?.condition);
  const statusInfo = clothing ? STATUS_CONFIG[clothing.status] : null;

  // Use the helper for rendering
  const costs = getCostBreakdown();

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-[3/4] rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!clothing) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Clothing not found</h2>
          <Button onClick={() => navigate('/browse')}>Back to Browse</Button>
        </div>
      </Layout>
    );
  }

  const isOwner = user?.id === clothing.owner_id;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] rounded-xl overflow-hidden bg-black relative flex items-center justify-center border border-border/10 shadow-lg">
              {clothing.images.length > 0 ? (
                <img
                  src={clothing.images[selectedImage]}
                  alt={clothing.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-muted-foreground/20">
                  {categoryInfo?.icon || '👕'}
                </div>
              )}
            </div>
            {clothing.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {clothing.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      idx === selectedImage ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 font-sans">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`${statusInfo?.color} text-primary-foreground`}>
                  {statusInfo?.label}
                </Badge>
                <Badge variant="secondary">{clothing.size}</Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{clothing.title}</h1>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{categoryInfo?.icon}</span>
                <span>{categoryInfo?.label}</span>
                <span>•</span>
                <span>{conditionInfo?.label}</span>
              </div>
            </div>

            <div className="text-3xl font-bold text-primary">
              ₹{clothing.rent_per_day}
              <span className="text-lg font-normal text-muted-foreground">/day</span>
            </div>

            {clothing.description && (
              <p className="text-muted-foreground leading-relaxed">{clothing.description}</p>
            )}

            {/* Rent Button */}
            {!isOwner && clothing.status === 'available' && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full text-lg shadow-glow py-6">
                    <CalendarIcon className="h-5 w-5 mr-2" />
                    Rent This Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Select Rental Dates</DialogTitle>
                    <DialogDescription>
                      Choose when you want to rent "{clothing.title}"
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center py-4">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={setDateRange}
                      disabled={(date) => date < new Date()}
                      numberOfMonths={1}
                    />
                  </div>
                  
                  {/* Cost Breakdown Section */}
                  {costs && (
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Duration</span>
                        <span>{costs.days} days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Base Rent (₹{clothing.rent_per_day} x {costs.days})</span>
                        <span>₹{costs.baseRent}</span>
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Platform Fee (10%)</span>
                        <span>+₹{costs.serviceFee}</span>
                      </div>
                      
                      <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                        <span>Total to Pay</span>
                        <span>₹{costs.totalAmount}</span>
                      </div>
                      
                      <div className="text-xs text-muted-foreground bg-background/50 p-2 rounded flex gap-2">
                        <Info className="w-4 h-4 flex-shrink-0" />
                        <span>Includes service fee for platform maintenance and coordination.</span>
                      </div>
                    </div>
                  )}

                  <DialogFooter>
                    <Button
                      onClick={handleRent}
                      disabled={!dateRange?.from || !dateRange?.to || isRenting}
                      className="w-full"
                    >
                      {isRenting ? 'Submitting...' : `Confirm & Pay ₹${costs ? costs.totalAmount : ''}`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {isOwner && (
              <div className="bg-muted/50 border border-border rounded-lg p-4 text-center text-muted-foreground">
                This is your listing. You can manage it from "My Listings".
              </div>
            )}

            {clothing.status !== 'available' && !isOwner && (
              <div className="bg-muted/50 border border-border rounded-lg p-4 text-center text-muted-foreground">
                This item is currently {clothing.status}. Check back later!
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
