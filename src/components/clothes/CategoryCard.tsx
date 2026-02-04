import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

interface CategoryCardProps {
  value: string;
  label: string;
  icon: string;
  count?: number;
}

export function CategoryCard({ value, label, icon, count }: CategoryCardProps) {
  return (
    <Link to={`/browse?category=${value}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 cursor-pointer">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="text-5xl transform transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
              {label}
            </h3>
            {typeof count === 'number' && (
              <p className="text-sm text-muted-foreground">{count} items</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
