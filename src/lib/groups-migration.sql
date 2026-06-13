-- ============================================================
-- GROUPS FEATURE — MIGRATION (v1.0)
-- Run this in the Supabase SQL Editor to enable Private Leagues
-- ============================================================

-- 1. GROUPS TABLE
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  description TEXT
);

-- 2. GROUP MEMBERS TABLE (max 20 members enforced in application logic)
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES — GROUPS
-- Anyone authenticated can read groups (needed to look up by invite_code)
CREATE POLICY "Authenticated users can read groups"
  ON public.groups FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the group creator can delete their group
CREATE POLICY "Creator can delete group"
  ON public.groups FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

-- Creator can update group name/description
CREATE POLICY "Creator can update group"
  ON public.groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- 5. RLS POLICIES — GROUP MEMBERS
-- Members can read group memberships (simplified to avoid infinite recursion)
CREATE POLICY "Members can read group memberships"
  ON public.group_members FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can join groups (insert their own membership row)
CREATE POLICY "Authenticated users can join groups"
  ON public.group_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only remove their own membership (leave group)
-- Creator removing the group cascades and handles everything else
CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 6. INDEXES for fast lookups
CREATE INDEX IF NOT EXISTS idx_groups_invite_code ON public.groups(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- ============================================================
-- PHASE 2: GROUP-SPECIFIC SCORING COLUMNS
-- Run this block if you already ran the initial migration above.
-- Safe to run the whole file from scratch too (IF NOT EXISTS guards).
-- ============================================================

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS matches_predicted INTEGER DEFAULT 0 NOT NULL;

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS accuracy FLOAT DEFAULT 0 NOT NULL;

-- ============================================================
-- PHASE 3: MEMBER ROLES
-- Adds creator/admin/member roles to group_members.
-- ============================================================

ALTER TABLE public.group_members
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' NOT NULL
  CHECK (role IN ('creator', 'admin', 'member'));

-- Admins and creators can update group members' roles
-- (enforced in application logic; RLS allows members to update their own row for leaving)
CREATE POLICY IF NOT EXISTS "Admins can update member roles"
  ON public.group_members FOR UPDATE
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id = auth.uid() AND role IN ('creator', 'admin')
    )
  );
