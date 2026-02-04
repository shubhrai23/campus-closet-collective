import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/clothes/CategoryCard';
import { Layout } from '@/components/layout/Layout';
import { CATEGORIES } from '@/lib/constants';
import { ArrowRight, Shirt, Users, Shield, Sparkles } from 'lucide-react';

const features = [
  {
    icon: Shirt,
    title: 'Rent Trendy Clothes',
    description: 'Access a wide variety of clothes from your fellow students for any occasion.',
  },
  {
    icon: Users,
    title: 'Campus Community',
    description: 'Rent exclusively within your campus. Same hostel, same vibe.',
  },
  {
    icon: Shield,
    title: 'Admin Coordinated',
    description: 'All exchanges are managed by admins. Safe, secure, hassle-free.',
  },
  {
    icon: Sparkles,
    title: 'Save Money',
    description: 'Why buy when you can rent? Look great without breaking the bank.',
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent px-4 py-2 rounded-full text-sm font-medium text-accent-foreground mb-6">
              <Sparkles className="h-4 w-4" />
              Exclusively for DTU Students
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6">
              Rent Clothes from
              <span className="text-gradient block mt-2">Your Campus</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Why buy when you can borrow? Get access to trendy outfits from students in your hostel for parties, fests, and special occasions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 shadow-glow" asChild>
                <Link to="/browse">
                  Start Browsing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link to="/auth?mode=signup">List Your Clothes</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Campus Closet makes renting clothes from fellow students simple and secure.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-card rounded-xl p-6 border border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="h-12 w-12 rounded-lg bg-gradient-hero flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Browse by Category</h2>
              <p className="text-muted-foreground">Find the perfect outfit for your next event</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/browse">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.slice(0, 6).map((category, index) => (
              <div
                key={category.value}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CategoryCard {...category} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Share Your Wardrobe?
          </h2>
          <p className="text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            List your clothes and earn money while helping fellow students look great.
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <Link to="/auth?mode=signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
