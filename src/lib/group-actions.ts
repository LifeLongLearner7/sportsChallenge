"use server";

import { createClient } from "./auth-actions";
import { revalidatePath } from "next/cache";
import { Group, GroupMemberWithProfile } from "@/types";

const MAX_GROUP_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Generates a random 6-character alphanumeric invite code (uppercase). */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars (I, O, 0, 1)
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/** Gets the current authenticated user or throws. */
async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: You must be logged in.");
  return { supabase, user };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * CREATE GROUP
 * Creates a new group with the current user as creator and first member.
 */
export async function createGroup(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!name || name.length < 2)
    return { error: "Group name must be at least 2 characters." };
  if (name.length > 50)
    return { error: "Group name cannot exceed 50 characters." };

  const { supabase, user } = await requireAuth();

  // Generate a unique invite code (retry up to 3 times on collision)
  let invite_code = generateInviteCode();
  for (let i = 0; i < 3; i++) {
    const { data: existing } = await supabase
      .from("groups")
      .select("id")
      .eq("invite_code", invite_code)
      .maybeSingle();
    if (!existing) break;
    invite_code = generateInviteCode();
  }

  // Insert the group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({
      name,
      description: description || null,
      created_by: user.id,
      invite_code,
    })
    .select()
    .single();

  if (groupError || !group) {
    console.error("Group create error:", groupError);
    return { error: "Failed to create group. Please try again." };
  }

  // Auto-add creator as first member with 'creator' role
  const { error: memberError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
    role: "creator",
  });

  if (memberError) {
    console.error("Member insert error:", memberError);
    return { error: "Group created but failed to add you as a member." };
  }

  revalidatePath("/groups");
  return { success: true, groupId: group.id, inviteCode: group.invite_code };
}

/**
 * JOIN GROUP BY INVITE CODE
 * Finds a group by its invite code and adds the current user as a member.
 */
export async function joinGroupByCode(inviteCode: string) {
  const code = inviteCode?.trim().toUpperCase();
  if (!code || code.length !== 6)
    return { error: "Invalid invite code. Codes are 6 characters." };

  const { supabase, user } = await requireAuth();

  // Find the group
  const { data: group, error: findError } = await supabase
    .from("groups")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();

  if (findError || !group) {
    return { error: "No group found with that invite code." };
  }

  // Check if already a member
  const { data: existing, error: existError } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existError) {
    return { error: "Failed to verify membership status." };
  }

  if (existing) {
    return { error: "You are already a member of this group.", groupId: group.id };
  }

  // Check group size limit
  const { count } = await supabase
    .from("group_members")
    .select("*", { count: "exact", head: true })
    .eq("group_id", group.id);

  if ((count ?? 0) >= MAX_GROUP_SIZE) {
    return {
      error: `This group is full (max ${MAX_GROUP_SIZE} members).`,
    };
  }

  // Join
  const { error: joinError } = await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
  });

  if (joinError) {
    console.error("Join error:", joinError);
    return { error: "Failed to join group. Please try again." };
  }

  revalidatePath("/groups");
  return { success: true, groupId: group.id, groupName: group.name };
}

/**
 * GET MY GROUPS
 * Returns all groups that the current user is a member of, with member counts.
 */
export async function getMyGroups(): Promise<Group[]> {
  const { supabase, user } = await requireAuth();

  // Get group IDs the user belongs to
  const { data: memberships, error: memError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (memError || !memberships?.length) return [];

  const groupIds = memberships.map((m: any) => m.group_id);

  // Fetch group details
  const { data: groups, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .in("id", groupIds)
    .order("created_at", { ascending: false });

  if (groupError || !groups) return [];

  // Attach member counts
  const groupsWithCounts = await Promise.all(
    groups.map(async (g: any) => {
      const { count } = await supabase
        .from("group_members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", g.id);
      return { ...g, member_count: count ?? 0 } as Group;
    })
  );

  return groupsWithCounts;
}

/**
 * GET GROUP LEADERBOARD
 * Returns group metadata + members ranked by their GROUP-LOCAL points.
 * Points here are independent of global profile points — they start at 0
 * when a user joins and only accumulate from predictions made after joining.
 */
export async function getGroupLeaderboard(
  groupId: string
): Promise<{ group: Group | null; members: GroupMemberWithProfile[]; currentUserId: string | null }> {
  const { supabase, user } = await requireAuth();

  // Verify group exists
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (groupError || !group) return { group: null, members: [], currentUserId: user.id };

  // Check that the current user is actually a member
  const { data: membership } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { group: null, members: [], currentUserId: user.id };

  // Fetch all group_members rows with group-local scoring stats
  const { data: groupRows, error: memError } = await supabase
    .from("group_members")
    .select("user_id, joined_at, points, matches_predicted, accuracy, role")
    .eq("group_id", groupId)
    .order("points", { ascending: false });

  if (memError || !groupRows?.length) return { group, members: [], currentUserId: user.id };

  const userIds = groupRows.map((m: any) => m.user_id);

  // Fetch profile metadata (screen_name, avatar_url, is_ai) for all members
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, screen_name, avatar_url, is_ai")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles || []).map((p: any) => [p.id, p])
  );

  // Merge group-local stats with profile metadata
  const members: GroupMemberWithProfile[] = groupRows.map((row: any) => {
    const profile = profileMap.get(row.user_id) || {};
    return {
      user_id: row.user_id,
      group_id: groupId,
      joined_at: row.joined_at,
      points: row.points ?? 0,
      matches_predicted: row.matches_predicted ?? 0,
      accuracy: row.accuracy ?? 0,
      role: (row.role ?? "member") as "creator" | "admin" | "member",
      screen_name: (profile as any).screen_name,
      avatar_url: (profile as any).avatar_url,
      is_ai: (profile as any).is_ai,
    };
  });

  // Attach member count to group
  const groupWithCount: Group = { ...group, member_count: groupRows.length };

  return { group: groupWithCount, members, currentUserId: user.id };
}

/**
 * LEAVE GROUP
 * Removes the current user from a group. Creator cannot leave (must delete).
 */
export async function leaveGroup(groupId: string) {
  const { supabase, user } = await requireAuth();

  // Check if user is the creator (creators must delete, not leave)
  const { data: group } = await supabase
    .from("groups")
    .select("created_by, name")
    .eq("id", groupId)
    .maybeSingle();

  if (group?.created_by === user.id) {
    return {
      error:
        "You are the group creator. Use 'Delete Group' to remove the group entirely.",
    };
  }

  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to leave group." };
  }

  revalidatePath("/groups");
  return { success: true };
}

/**
 * DELETE GROUP (Creator or Admin)
 * Deletes the group. Cascades to remove all group_members rows.
 */
export async function deleteGroup(groupId: string) {
  const { supabase, user } = await requireAuth();

  // Check caller is creator or admin
  const { data: membership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) return { error: "Group not found or you are not a member." };
  if (!(["creator", "admin"] as string[]).includes(membership.role))
    return { error: "Only the group creator or an admin can delete this group." };

  const { error } = await supabase.from("groups").delete().eq("id", groupId);

  if (error) return { error: "Failed to delete group." };

  revalidatePath("/groups");
  return { success: true };
}

/**
 * PROMOTE TO ADMIN (Creator only)
 * Grants admin role to a group member.
 */
export async function promoteToAdmin(groupId: string, targetUserId: string) {
  const { supabase, user } = await requireAuth();

  // Only the creator can promote
  const { data: callerMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerMembership?.role !== "creator")
    return { error: "Only the group creator can promote members to admin." };

  if (targetUserId === user.id)
    return { error: "You are already the creator." };

  const { error } = await supabase
    .from("group_members")
    .update({ role: "admin" })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .eq("role", "member"); // only promote regular members

  if (error) return { error: "Failed to promote member." };

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}

/**
 * REVOKE ADMIN (Creator only)
 * Demotes an admin back to regular member.
 */
export async function revokeAdmin(groupId: string, targetUserId: string) {
  const { supabase, user } = await requireAuth();

  // Only the creator can revoke
  const { data: callerMembership } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (callerMembership?.role !== "creator")
    return { error: "Only the group creator can revoke admin rights." };

  const { error } = await supabase
    .from("group_members")
    .update({ role: "member" })
    .eq("group_id", groupId)
    .eq("user_id", targetUserId)
    .eq("role", "admin"); // only demote existing admins

  if (error) return { error: "Failed to revoke admin role." };

  revalidatePath(`/groups/${groupId}`);
  return { success: true };
}
