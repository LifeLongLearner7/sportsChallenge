"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Trophy,
  Copy,
  Check,
  Hash,
  Crown,
  ArrowLeft,
  Loader2,
  LogOut,
  Trash2,
  TrendingUp,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { leaveGroup, deleteGroup, promoteToAdmin, revokeAdmin } from "@/lib/group-actions";
import { Group, GroupMemberWithProfile } from "@/types";
import { ALL_IDENTITIES, MR_PREDICTO_AVATAR } from "@/lib/constants";
import { calculateTier, getTierColor } from "@/lib/strategist-logic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupDetailClientProps {
  group: Group;
  members: GroupMemberWithProfile[];
  currentUserId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvatar(id: string | null | undefined, isAi?: boolean) {
  if (isAi || id === "mr_predicto") return MR_PREDICTO_AVATAR;
  return ALL_IDENTITIES.find((a) => id && a.id === id) || ALL_IDENTITIES[0];
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-slate-400 hover:text-primary transition-all"
    >
      {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  confirmClass,
  onConfirm,
  onCancel,
  isPending,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-xl font-black uppercase tracking-tighter text-white italic mb-3">{title}</h3>
        <p className="text-slate-400 text-sm font-bold mb-8 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-black uppercase tracking-widest transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "flex-1 py-3 rounded-xl text-white font-black uppercase text-sm tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-60",
              confirmClass
            )}
          >
            {isPending ? <Loader2 size={15} className="animate-spin" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Podium Card ──────────────────────────────────────────────────────────────

function PodiumCard({
  member,
  rank,
  currentUserId,
  isCreator,
}: {
  member: GroupMemberWithProfile;
  rank: number;
  currentUserId: string;
  isCreator: boolean;
}) {
  const avatar = getAvatar(member.avatar_url, member.is_ai);
  const isMe = member.user_id === currentUserId;

  const rankColors = {
    1: { border: "border-tertiary", glow: "shadow-[0_0_30px_rgba(255,231,146,0.3)]", rank: "bg-tertiary text-slate-950", pts: "text-tertiary" },
    2: { border: "border-slate-400", glow: "shadow-[0_0_20px_rgba(148,163,184,0.2)]", rank: "bg-slate-400 text-slate-950", pts: "text-slate-300" },
    3: { border: "border-orange-400", glow: "shadow-[0_0_20px_rgba(251,146,60,0.2)]", rank: "bg-orange-400 text-slate-950", pts: "text-orange-400" },
  }[rank] || { border: "border-white/10", glow: "", rank: "bg-white/10 text-white", pts: "text-primary" };

  return (
    <div className={cn("flex flex-col items-center gap-3 group", rank === 1 && "mb-8")}>
      <div className="relative">
        {rank === 1 && <Trophy className="absolute -top-8 left-1/2 -translate-x-1/2 text-tertiary drop-shadow-[0_0_10px_rgba(255,231,146,0.8)]" size={28} />}
        <div
          className={cn(
            "hex-clip bg-white/5 border-2 p-1 overflow-hidden flex items-center justify-center relative",
            rank === 1 ? "w-28 h-28" : "w-20 h-20",
            rankColors.border,
            rankColors.glow
          )}
        >
          {avatar.path ? (
            <Image src={avatar.path} fill sizes="112px" className="object-cover" alt="Avatar" />
          ) : avatar.icon ? (
            (() => { const Icon = avatar.icon; return <Icon size={rank === 1 ? 36 : 26} className="text-slate-400" />; })()
          ) : null}
        </div>
        <div className={cn("absolute -bottom-3 left-1/2 -translate-x-1/2 font-black px-2 py-0.5 text-xs hex-clip", rankColors.rank)}>
          {rank.toString().padStart(2, "0")}
        </div>
        {isCreator && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
            <Crown size={10} className="text-slate-950" />
          </div>
        )}
        {isMe && (
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(0,229,255,0.5)]">
            <Shield size={10} className="text-slate-950" />
          </div>
        )}
      </div>
      <div className="text-center mt-2">
        {isMe && <div className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">YOU</div>}
        <div className="font-black text-white uppercase tracking-tight text-sm italic">
          {member.screen_name || "STRATEGIST_" + member.user_id.slice(0, 4)}
        </div>
        <div className={cn("font-bold text-sm", rankColors.pts)}>{(member.points || 0).toLocaleString()} pts</div>
        <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{member.matches_predicted} predictions</div>
      </div>
    </div>
  );
}

// ─── Role Button ──────────────────────────────────────────────────────────────

function RoleButton({
  groupId,
  targetUserId,
  currentRole,
}: {
  groupId: string;
  targetUserId: string;
  currentRole: "admin" | "member";
}) {
  const [isPending, startTransition] = useTransition();
  const [optimisticRole, setOptimisticRole] = useState(currentRole);

  const handleClick = () => {
    startTransition(async () => {
      if (optimisticRole === "member") {
        const result = await promoteToAdmin(groupId, targetUserId);
        if (!result.error) setOptimisticRole("admin");
      } else {
        const result = await revokeAdmin(groupId, targetUserId);
        if (!result.error) setOptimisticRole("member");
      }
    });
  };

  const isPromote = optimisticRole === "member";

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title={isPromote ? "Promote to Admin" : "Revoke Admin"}
      className={cn(
        "flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border transition-all disabled:opacity-50 shrink-0",
        isPromote
          ? "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 hover:border-purple-500/40 text-purple-400"
          : "bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 hover:border-orange-500/40 text-orange-400"
      )}
    >
      {isPending ? (
        <Loader2 size={10} className="animate-spin" />
      ) : isPromote ? (
        <><Shield size={10} /> Admin</>
      ) : (
        <><Crown size={10} /> Revoke</>
      )}
    </button>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GroupDetailClient({ group, members, currentUserId }: GroupDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leftGroup, setLeftGroup] = useState(false);

  const isCreator = group.created_by === currentUserId;
  const currentMember = members.find((m) => m.user_id === currentUserId);
  const canManage = currentMember?.role === "creator" || currentMember?.role === "admin";
  const [gold, silver, bronze] = members.slice(0, 3);
  const rest = members.slice(3);

  const handleLeave = () => {
    setError(null);
    startTransition(async () => {
      const result = await leaveGroup(group.id);
      if (result.error) {
        setError(result.error);
      } else {
        setLeftGroup(true);
      }
      setShowLeaveConfirm(false);
    });
  };

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteGroup(group.id);
      if (result.error) {
        setError(result.error);
      } else {
        setLeftGroup(true);
      }
      setShowDeleteConfirm(false);
    });
  };

  if (leftGroup) {
    return (
      <main className="min-h-screen pt-32 pb-20 bg-background flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
            <Users size={32} className="text-slate-500" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic mb-2">
              {isCreator ? "Group Disbanded" : "You've Left"}
            </h2>
            <p className="text-slate-500 text-sm font-bold">Redirecting you back to your leagues...</p>
          </div>
          <Link
            href="/groups"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-950 font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary/90 transition-all"
          >
            <ArrowLeft size={15} /> Back to Groups
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-primary/4 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-6 relative z-10 flex flex-col gap-12">
        
        {/* ── Back link ── */}
        <Link
          href="/groups"
          className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors text-sm font-black uppercase tracking-widest w-fit"
        >
          <ArrowLeft size={15} /> My Groups
        </Link>

        {/* ── Group Header ── */}
        <div className="glass-panel rounded-3xl p-8 border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-primary/10 border border-primary/25 rounded-2xl">
              <Users size={28} className="text-primary" />
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.35em] text-primary mb-1">Private League</div>
              <h1 className="font-headline text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white leading-none">
                {group.name}
              </h1>
              {group.description && (
                <p className="text-slate-500 text-sm font-bold mt-1.5">{group.description}</p>
              )}
              <div className="flex items-center gap-3 mt-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  {group.member_count ?? members.length} / 20 members
                </span>
                {isCreator && (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/25 px-2 py-0.5 rounded-full">
                    <Crown size={9} /> You're the Creator
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Invite code + actions */}
          <div className="flex flex-col gap-4 md:items-end">
            <div className="bg-black/40 border border-white/10 rounded-2xl px-5 py-4 flex flex-col gap-2">
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Invite Code</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Hash size={14} className="text-slate-600" />
                  <span className="font-black text-2xl tracking-[0.4em] text-primary italic">{group.invite_code}</span>
                </div>
                <CopyButton text={group.invite_code} label="Copy" />
              </div>
              <div className="text-[9px] text-slate-600 font-bold">Share this code to invite friends</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {canManage ? (
                <button
                  id="delete-group-btn"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
                >
                  <Trash2 size={13} /> Delete Group
                </button>
              ) : (
                <button
                  id="leave-group-btn"
                  onClick={() => setShowLeaveConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-black uppercase text-xs tracking-widest rounded-xl transition-all"
                >
                  <LogOut size={13} /> Leave Group
                </button>
              )}
            </div>

            {error && (
              <div className="text-[11px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── Leaderboard ── */}
        {members.length === 0 ? (
          <div className="text-center py-20 text-slate-600 font-bold text-sm">No members yet.</div>
        ) : (
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <div className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500 mb-2">Group Standings</div>
              <h2 className="font-headline text-4xl md:text-5xl font-black uppercase tracking-tighter italic text-white">
                LEAGUE <span className="text-primary">BOARD</span>
              </h2>
            </div>

            {/* Podium (top 3) */}
            {members.length >= 1 && (
              <div className="flex justify-center items-end gap-8 md:gap-16 pt-12 pb-6">
                {/* Silver — 2nd */}
                {silver && (
                  <PodiumCard member={silver} rank={2} currentUserId={currentUserId} isCreator={silver.user_id === group.created_by} />
                )}
                {/* Gold — 1st */}
                {gold && (
                  <PodiumCard member={gold} rank={1} currentUserId={currentUserId} isCreator={gold.user_id === group.created_by} />
                )}
                {/* Bronze — 3rd */}
                {bronze && (
                  <PodiumCard member={bronze} rank={3} currentUserId={currentUserId} isCreator={bronze.user_id === group.created_by} />
                )}
              </div>
            )}

            {/* Full ranked table */}
            <div className="glass-panel rounded-[30px] overflow-hidden border-white/5 shadow-2xl">
              {/* Header */}
              <div className="hidden md:grid bg-white/5 grid-cols-12 px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
                <div className="col-span-1">Rnk</div>
                <div className="col-span-5">Strategist</div>
                <div className="col-span-2 text-center">Precision</div>
                <div className="col-span-2 text-center">Predicted</div>
                <div className="col-span-2 text-right">Points</div>
              </div>

              <div className="divide-y divide-white/5">
                {members.map((member, idx) => {
                  const avatar = getAvatar(member.avatar_url, member.is_ai);
                  const isMe = member.user_id === currentUserId;
                  const isGroupCreator = member.user_id === group.created_by;
                  const tier = calculateTier(idx + 1, members.length);
                  const tierColor = getTierColor(tier);

                  return (
                    <div
                      key={member.user_id}
                      className={cn(
                        "flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-0 px-6 md:px-10 py-6 items-center transition-all group relative",
                        isMe
                          ? "bg-primary/5 border-l-4 border-primary/60"
                          : "hover:bg-white/3 border-l-4 border-transparent hover:border-primary/20"
                      )}
                    >
                      {/* Rank */}
                      <div className="absolute top-4 left-6 md:static md:col-span-1 font-headline text-2xl md:text-3xl font-black text-slate-700 group-hover:text-primary transition-colors italic">
                        {(idx + 1).toString().padStart(2, "0")}
                      </div>

                      {/* Avatar + Name */}
                      <div className="md:col-span-5 flex items-center gap-4 mt-4 md:mt-0">
                        <div className="w-12 h-12 relative hex-clip bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          {avatar.path ? (
                            <Image src={avatar.path} fill sizes="48px" className="object-cover" alt="Avatar" />
                          ) : avatar.icon ? (
                            (() => { const Icon = avatar.icon; return <Icon size={20} className="text-slate-500" />; })()
                          ) : (
                            <TrendingUp size={20} className="text-slate-600" />
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("font-black uppercase tracking-tight text-sm transition-colors", isMe ? "text-primary" : "text-white group-hover:text-primary")}>
                              {member.screen_name || "STRATEGIST_" + member.user_id.slice(0, 4)}
                            </span>
                            {isMe && (
                              <span className="text-[8px] bg-primary/20 text-primary border border-primary/40 px-1.5 py-0.5 rounded-full font-black uppercase">YOU</span>
                            )}
                            {member.role === "creator" && (
                              <span className="flex items-center gap-0.5 text-[8px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/25 px-1.5 py-0.5 rounded-full font-black uppercase">
                                <Crown size={8} /> Creator
                              </span>
                            )}
                            {member.role === "admin" && (
                              <span className="flex items-center gap-0.5 text-[8px] bg-purple-400/10 text-purple-400 border border-purple-400/25 px-1.5 py-0.5 rounded-full font-black uppercase">
                                <Shield size={8} /> Admin
                              </span>
                            )}
                          </div>
                          <div className={cn("text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border rounded-full inline-block w-fit", tierColor)}>
                            {tier}
                          </div>
                        </div>
                      </div>

                      {/* Mobile quick stats */}
                      <div className="flex md:hidden w-full bg-black/30 border border-white/5 rounded-xl p-3 justify-between">
                        <div className="flex flex-col gap-0.5 items-center flex-1 border-r border-white/5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Precision</span>
                          <span className="font-black text-white text-sm">{member.accuracy}%</span>
                        </div>
                        <div className="flex flex-col gap-0.5 items-center flex-1 border-r border-white/5">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Predicted</span>
                          <span className="font-black text-white text-sm">{member.matches_predicted}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 items-center flex-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">Points</span>
                          <span className="font-headline font-black text-lg italic text-primary">{(member.points || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Desktop stats + promote/revoke control */}
                      <div className="hidden md:block col-span-2 text-center font-black text-white tracking-widest">{member.accuracy}%</div>
                      <div className="hidden md:block col-span-2 text-center font-black text-slate-400">{member.matches_predicted}</div>
                      <div className="hidden md:flex col-span-2 items-center justify-end gap-2">
                        <span className="font-headline text-2xl font-black text-white italic tracking-tighter">
                          {(member.points || 0).toLocaleString()}
                        </span>
                        {/* Promote / Revoke button — only visible to creator, not for self or other creator */}
                        {isCreator && !isMe && member.role !== "creator" && (
                          <RoleButton
                            groupId={group.id}
                            targetUserId={member.user_id}
                            currentRole={member.role}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialogs */}
      {showLeaveConfirm && (
        <ConfirmDialog
          title="Leave League?"
          message="You will be removed from this group. You can rejoin later using the invite code."
          confirmLabel="Leave"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
          isPending={isPending}
        />
      )}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Disband League?"
          message="This will permanently delete the group and remove all members. This action cannot be undone."
          confirmLabel="Delete Forever"
          confirmClass="bg-red-500 hover:bg-red-600"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isPending={isPending}
        />
      )}
    </main>
  );
}
