import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { Button } from '@/components/ui/button';
import { CategoryCard } from '@/components/clothes/CategoryCard';
import { Layout } from '@/components/layout/Layout';
import { CATEGORIES } from '@/lib/constants';
import { ArrowRight, Shirt, Users, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth'; // 1. IMPORT THIS

// ... (keep your 'features' array exactly as it is) ...

export default function Index() {
  const { session } = useAuth(); // 2. GET SESSION
  const navigate = useNavigate(); // 3. GET NAVIGATE

  const handleListClick = () => {
    if (session) {
      // If logged in, go to My Listings
      navigate('/my-listings');
    } else {
      // If NOT logged in, go to Sign Up
      navigate('/auth?mode=signup');
    }
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* ... (keep your background divs) ... */}
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            {/* ... (keep your badge, h1, and p tags) ... */}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 shadow-glow" asChild>
                <Link to="/browse">
                  Start Browsing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              {/* 4. UPDATED BUTTON LOGIC */}
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8" 
                onClick={handleListClick} // Uses our smart function
              >
                List Your Clothes
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ... (keep the rest of your file exactly the same) ... */}
