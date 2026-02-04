import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClothingCard } from '@/components/clothes/ClothingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CATEGORIES, SIZES } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { Search, SlidersHorizontal, X } from 'lucide-react';

interface ClothingItem {
  id: string;
  title: string;
  category: string;
  size: string;
  condition: string;
  rent_per_day: number;
  status: 'available' | 'reserved' | 'rented' | 'returned';
  images: string[];
  owner_id: string;
  profiles?: {
    full_name: string;
  };
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'all');
  const [size, setSize] = useState(searchParams.get('size') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  useEffect(() => {
    fetchClothes();
  }, [category, size, sortBy]);

  const fetchClothes = async () => {
    setLoading(true);

    let query = supabase
      .from('clothes')
      .select(`
        *,
        profiles:owner_id (
          full_name
        )
      `)
      .eq('status', 'available');

    if (category && category !== 'all') {
      query = query.eq('category', category as any);
    }

    if (size && size !== 'all') {
      query = query.eq('size', size as any);
    }

    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'price-low') {
      query = query.order('rent_per_day', { ascending: true });
    } else if (sortBy === 'price-high') {
      query = query.order('rent_per_day', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching clothes:', error);
    } else {
      setClothes((data as unknown as ClothingItem[]) || []);
    }

    setLoading(false);
  };

  const filteredClothes = clothes.filter((item) =>
    search ? item.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('all');
    setSize('all');
    setSortBy('newest');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = search || (category && category !== 'all') || (size && size !== 'all');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Browse Clothes</h1>
          <p className="text-muted-foreground">Find the perfect outfit for your next event</p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clothes..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <div className="hidden md:flex gap-2">
              <Select value={category} onValueChange={(v) => { setCategory(v); updateFilters('category', v); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={size} onValueChange={(v) => { setSize(v); updateFilters('size', v); }}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); updateFilters('sort', v); }}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="md:hidden bg-card border border-border rounded-lg p-4 mb-6 space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => { setCategory(v); updateFilters('category', v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={size} onValueChange={(v) => { setSize(v); updateFilters('size', v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sizes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sizes</SelectItem>
                  {SIZES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort By</Label>
              <Select value={sortBy} onValueChange={(v) => { setSortBy(v); updateFilters('sort', v); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Newest First" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[4/5] rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredClothes.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {filteredClothes.length} item{filteredClothes.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {filteredClothes.map((item, index) => (
                <div
                  key={item.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ClothingCard
                    id={item.id}
                    title={item.title}
                    category={item.category}
                    size={item.size}
                    condition={item.condition}
                    rentPerDay={item.rent_per_day}
                    status={item.status}
                    images={item.images}
                    ownerName={item.profiles?.full_name}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👕</div>
            <h3 className="text-xl font-semibold mb-2">No clothes found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your filters or check back later
            </p>
            <Button onClick={clearFilters}>Clear Filters</Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
