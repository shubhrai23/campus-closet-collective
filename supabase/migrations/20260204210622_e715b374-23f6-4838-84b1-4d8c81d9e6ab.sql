-- Create enum for clothing categories
CREATE TYPE public.clothing_category AS ENUM (
  'tshirt', 'shirt', 'jacket', 'hoodie', 'kurta', 'dress', 'jeans', 'trousers', 'shorts', 'ethnic', 'other'
);

-- Create enum for clothing sizes
CREATE TYPE public.clothing_size AS ENUM (
  'XS', 'S', 'M', 'L', 'XL', 'XXL'
);

-- Create enum for clothing condition
CREATE TYPE public.clothing_condition AS ENUM (
  'new', 'like_new', 'good', 'fair'
);

-- Create enum for rental status
CREATE TYPE public.rental_status AS ENUM (
  'available', 'reserved', 'rented', 'returned'
);

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  hostel TEXT,
  room_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);

-- Create clothes table
CREATE TABLE public.clothes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category clothing_category NOT NULL,
  size clothing_size NOT NULL,
  condition clothing_condition NOT NULL,
  rent_per_day INTEGER NOT NULL CHECK (rent_per_day > 0),
  status rental_status NOT NULL DEFAULT 'available',
  images TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rentals table
CREATE TABLE public.rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloth_id UUID REFERENCES public.clothes(id) ON DELETE CASCADE NOT NULL,
  renter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_amount INTEGER NOT NULL,
  status rental_status NOT NULL DEFAULT 'reserved',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clothes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Clothes policies
CREATE POLICY "Anyone can view available clothes"
ON public.clothes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert their own clothes"
ON public.clothes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own clothes"
ON public.clothes FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own clothes"
ON public.clothes FOR DELETE
TO authenticated
USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

-- Rentals policies
CREATE POLICY "Users can view their own rentals"
ON public.rentals FOR SELECT
TO authenticated
USING (auth.uid() = renter_id OR auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create rentals"
ON public.rentals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Admins can update rentals"
ON public.rentals FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR auth.uid() = renter_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clothes_updated_at
BEFORE UPDATE ON public.clothes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rentals_updated_at
BEFORE UPDATE ON public.rentals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Also create default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for clothing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothes-images', 'clothes-images', true);

-- Storage policies for clothes images
CREATE POLICY "Anyone can view clothes images"
ON storage.objects FOR SELECT
USING (bucket_id = 'clothes-images');

CREATE POLICY "Authenticated users can upload clothes images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clothes-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own clothes images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'clothes-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clothes images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clothes-images' AND auth.uid()::text = (storage.foldername(name))[1]);