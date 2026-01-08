# Configuración de Base de Datos Supabase

Por favor, ejecuta el siguiente SQL en el **SQL Editor** de tu proyecto Supabase:

## 1. Ve a tu proyecto en Supabase
- Abre https://supabase.com/dashboard
- Selecciona tu proyecto
- Ve a **SQL Editor** en el menú lateral

## 2. Copia y pega este SQL:

```sql
-- Crear tabla de organizaciones
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Crear tabla de miembros de organizaciones
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- Crear tabla de eventos
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Políticas para organizations
CREATE POLICY "Users can view their organizations" 
  ON organizations FOR SELECT 
  USING (
    id IN (
      SELECT org_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations" 
  ON organizations FOR INSERT 
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update organizations" 
  ON organizations FOR UPDATE 
  USING (
    id IN (
      SELECT org_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Políticas para organization_members
CREATE POLICY "Users can view members of their organizations" 
  ON organization_members FOR SELECT 
  USING (
    org_id IN (
      SELECT org_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert members" 
  ON organization_members FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Owners can manage members" 
  ON organization_members FOR ALL 
  USING (
    org_id IN (
      SELECT org_id FROM organization_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- Políticas para events
CREATE POLICY "Anyone can view events by slug" 
  ON events FOR SELECT 
  USING (true);

CREATE POLICY "Members can view organization events" 
  ON events FOR SELECT 
  USING (
    org_id IN (
      SELECT org_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can create events" 
  ON events FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Members can update events" 
  ON events FOR UPDATE 
  USING (
    org_id IN (
      SELECT org_id FROM organization_members 
      WHERE user_id = auth.uid()
    )
  );

-- Crear índices para mejorar performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organization_members_user ON organization_members(user_id);
CREATE INDEX idx_organization_members_org ON organization_members(org_id);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_org ON events(org_id);
CREATE INDEX idx_events_date ON events(event_date);

-- Trigger para actualizar updated_at en events
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_events_timestamp ON events;
CREATE TRIGGER update_events_timestamp
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_events_updated_at();
```

## 3. Ejecutar
- Haz clic en el botón **Run** o presiona `Ctrl+Enter`
- Espera a que se complete la ejecución
- Deberías ver el mensaje "Success. No rows returned"

## 4. Verificar
- Ve a **Table Editor** en el menú lateral
- Deberías ver las tablas:
  - organizations
  - organization_members
  - events

¡Listo! Tu base de datos está configurada y lista para usar.
