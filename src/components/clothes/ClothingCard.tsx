import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, STATUS_CONFIG, CONDITIONS } from '@/lib/constants';

interface ClothingCardProps {
  id: string;
  title: string;
  category: string;
  size: string;
  condition: string;
  rentPerDay: number;
  status: 'available' | 'reserved' | 'rented' | 'returned';
  images: string[];
  ownerName?: string;
}

export function ClothingCard({
  id,
  title,
  category,
  size,
  condition,
  rentPerDay,
  status,
  images,
  ownerName,
}: ClothingCardProps) {
  const categoryInfo = CATEGORIES.find((c) => c.value === category);
  const statusInfo = STATUS_CONFIG[status];
  const conditionInfo = CONDITIONS.find((c) => c.value === condition);

  return (
    <Link to={`/clothes/${id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
        <div className="aspect-[4/5] relative overflow-hidden bg-muted">
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {categoryInfo?.icon || '👕'}
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
              {size}
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Badge
              className={`${statusInfo.color} text-primary-foreground`}
            >
              {statusInfo.label}
            </Badge>
          </div>
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-primary-foreground font-bold text-lg">
              ₹{rentPerDay}/day
            </p>
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm">{categoryInfo?.icon}</span>
            <span className="text-sm text-muted-foreground">{categoryInfo?.label}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{conditionInfo?.label}</span>
          </div>
          {ownerName && (
            <p className="text-sm text-muted-foreground mt-2">by {ownerName}</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
