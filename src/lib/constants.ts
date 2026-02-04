export const CATEGORIES = [
  { value: 'tshirt', label: 'T-Shirts', icon: '👕', color: 'bg-category-tshirt' },
  { value: 'shirt', label: 'Shirts', icon: '👔', color: 'bg-category-shirt' },
  { value: 'jacket', label: 'Jackets', icon: '🧥', color: 'bg-category-jacket' },
  { value: 'hoodie', label: 'Hoodies', icon: '🧤', color: 'bg-category-hoodie' },
  { value: 'kurta', label: 'Kurtas', icon: '👘', color: 'bg-category-kurta' },
  { value: 'dress', label: 'Dresses', icon: '👗', color: 'bg-category-dress' },
  { value: 'jeans', label: 'Jeans', icon: '👖', color: 'bg-primary' },
  { value: 'trousers', label: 'Trousers', icon: '🩳', color: 'bg-muted-foreground' },
  { value: 'shorts', label: 'Shorts', icon: '🩳', color: 'bg-status-available' },
  { value: 'ethnic', label: 'Ethnic Wear', icon: '🥻', color: 'bg-status-reserved' },
  { value: 'other', label: 'Other', icon: '✨', color: 'bg-accent-foreground' },
] as const;

export const SIZES = [
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' },
  { value: 'XXL', label: 'XXL' },
] as const;

export const CONDITIONS = [
  { value: 'new', label: 'New', description: 'Never worn, tags attached' },
  { value: 'like_new', label: 'Like New', description: 'Worn once or twice, excellent condition' },
  { value: 'good', label: 'Good', description: 'Gently used, minor signs of wear' },
  { value: 'fair', label: 'Fair', description: 'Visible wear but still functional' },
] as const;

export const STATUS_CONFIG = {
  available: { label: 'Available', color: 'bg-status-available', textColor: 'text-status-available' },
  reserved: { label: 'Reserved', color: 'bg-status-reserved', textColor: 'text-status-reserved' },
  rented: { label: 'Rented', color: 'bg-status-rented', textColor: 'text-status-rented' },
  returned: { label: 'Returned', color: 'bg-muted-foreground', textColor: 'text-muted-foreground' },
} as const;

export const COLLEGE_EMAIL_DOMAIN = '@dtu.ac.in';
