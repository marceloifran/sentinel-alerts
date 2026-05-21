-- Create enum for obligation status
CREATE TYPE public.obligation_status AS ENUM ('al_dia', 'por_vencer', 'vencida');

-- Create enum for obligation category
CREATE TYPE public.obligation_category AS ENUM ('legal', 'fiscal', 'seguridad', 'operativa');

-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'responsable');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'responsable',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create obligations table
CREATE TABLE public.obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category obligation_category NOT NULL,
  due_date DATE NOT NULL,
  responsible_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status obligation_status NOT NULL DEFAULT 'al_dia',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create obligation_history table
CREATE TABLE public.obligation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  previous_status obligation_status,
  new_status obligation_status NOT NULL,
  changed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create obligation_files table (references storage)
CREATE TABLE public.obligation_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id UUID NOT NULL REFERENCES public.obligations(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create storage bucket for obligation files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('obligation-files', 'obligation-files', false);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.obligation_files ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
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

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE POLICY "Only admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Obligations policies
CREATE POLICY "Admins can view all obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Responsables can view assigned obligations"
  ON public.obligations FOR SELECT
  TO authenticated
  USING (responsible_id = auth.uid());

CREATE POLICY "Admins can create obligations"
  ON public.obligations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Responsables can update assigned obligations"
  ON public.obligations FOR UPDATE
  TO authenticated
  USING (responsible_id = auth.uid());

CREATE POLICY "Admins can delete obligations"
  ON public.obligations FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Obligation history policies
CREATE POLICY "Users can view history of accessible obligations"
  ON public.obligation_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obligations o 
      WHERE o.id = obligation_id 
      AND (o.responsible_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Authenticated users can insert history"
  ON public.obligation_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());

-- Obligation files policies
CREATE POLICY "Users can view files of accessible obligations"
  ON public.obligation_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.obligations o 
      WHERE o.id = obligation_id 
      AND (o.responsible_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can upload files to accessible obligations"
  ON public.obligation_files FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.obligations o 
      WHERE o.id = obligation_id 
      AND (o.responsible_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Users can delete own files"
  ON public.obligation_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid() OR public.is_admin(auth.uid()));

-- Storage policies for obligation-files bucket
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'obligation-files');

CREATE POLICY "Authenticated users can view files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'obligation-files');

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'obligation-files');

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  
  -- First user becomes admin, others are responsable
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'responsable');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_obligations_updated_at
  BEFORE UPDATE ON public.obligations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();