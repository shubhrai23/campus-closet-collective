import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ClothingCard } from '@/components/clothes/ClothingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { CATEGORIES, SIZES, CONDITIONS } from '@/lib/constants';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Upload, X, Trash2 } from 'lucide-react';

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
}

export default function MyListings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    size: '',
    condition: '',
    rentPerDay: '',
  });
  const [images, setImages] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchClothes();
    }
  }, [user]);

  const fetchClothes = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('clothes')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clothes:', error);
    } else {
      setClothes((data as unknown as ClothingItem[]) || []);
    }

    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;

    setUploadingImages(true);
    const newImages: string[] = [];

    for (const file of Array.from(e.target.files)) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('clothes-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        toast.error('Failed to upload image');
      } else {
        const { data: { publicUrl } } = supabase.storage
          .from('clothes-images')
          .getPublicUrl(fileName);
        newImages.push(publicUrl);
      }
    }

    setImages([...images, ...newImages]);
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!form.title || !form.category || !form.size || !form.condition || !form.rentPerDay) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);

    const { error } = await supabase.from('clothes').insert({
      owner_id: user.id,
      title: form.title,
      description: form.description || null,
      category: form.category as any,
      size: form.size as any,
      condition: form.condition as any,
      rent_per_day: parseInt(form.rentPerDay),
      images: images,
      status: 'available' as const,
    });

    if (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to create listing');
    } else {
      toast.success('Listing created successfully!');
      setDialogOpen(false);
      setForm({ title: '', description: '', category: '', size: '', condition: '', rentPerDay: '' });
      setImages([]);
      fetchClothes();
    }

    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    const { error } = await supabase.from('clothes').delete().eq('id', id);

    if (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
    } else {
      toast.success('Listing deleted');
      fetchClothes();
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
            ))}
          </div>
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
            <h1 className="text-3xl md:text-4xl font-bold mb-2">My Listings</h1>
            <p className="text-muted-foreground">Manage your clothing listings</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Listing</DialogTitle>
                  <DialogDescription>
                    List a new item for rent. Fill in the details below.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Images */}
                  <div className="space-y-2">
                    <Label>Images</Label>
                    <div className="flex flex-wrap gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-5 w-5 text-white" />
                          </button>
                        </div>
                      ))}
                      <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={uploadingImages}
                        />
                        {uploadingImages ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
                        ) : (
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Navy Blue Blazer"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Add any details about the item..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    />
                  </div>

                  {/* Category & Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={form.category}
                        onValueChange={(v) => setForm({ ...form, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.icon} {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Size *</Label>
                      <Select
                        value={form.size}
                        onValueChange={(v) => setForm({ ...form, size: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {SIZES.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Condition & Price */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Condition *</Label>
                      <Select
                        value={form.condition}
                        onValueChange={(v) => setForm({ ...form, condition: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITIONS.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Rent/Day (₹) *</Label>
                      <Input
                        id="price"
                        type="number"
                        min="1"
                        placeholder="50"
                        value={form.rentPerDay}
                        onChange={(e) => setForm({ ...form, rentPerDay: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Listing'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/5] rounded-lg" />
            ))}
          </div>
        ) : clothes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {clothes.map((item) => (
              <div key={item.id} className="relative group">
                <ClothingCard
                  id={item.id}
                  title={item.title}
                  category={item.category}
                  size={item.size}
                  condition={item.condition}
                  rentPerDay={item.rent_per_day}
                  status={item.status}
                  images={item.images}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(item.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">👕</div>
            <h3 className="text-xl font-semibold mb-2">No listings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start listing your clothes and earn money!
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Listing
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
