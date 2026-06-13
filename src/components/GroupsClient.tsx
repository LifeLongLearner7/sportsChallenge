"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Hash,
  Copy,
  Check,
  ChevronRight,
  Crown,
  X,
  Loader2,
  Trophy,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createGroup, joinGroupByCode } from "@/lib/group-actions";
import { Group, Profile } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupsClientProps {
  groups: Group[];
  currentUserId: string;
  profile: Profile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADIENT_PALETTES = [
  "from-cyan-500/20 to-blue-600/20 border-cyan-500/25",
  "from-purple-500/20 to-pink-600/20 border-purple-500/25",
  "from-emerald-500/20 to-teal-600/20 border-emerald-500/25",
  "from-orange-500/20 to-red-600/20 border-orange-500/25",
  "from-yellow-500/20 to-amber-600/20 border-yellow-500/25",
  "from-blue-500/20 to-indigo-600/20 border-blue-500/25",
];

const ICON_COLORS = [
  "text-cyan-400",
  "text-purple-400",
  "text-emerald-400",
  "text-orange-400",
  "text-yellow-400",
  "text-blue-400",
];

function getGroupStyle(index: number) {
  const i = index % GRADIENT_PALETTES.length;
  return { gradient: GRADIENT_PALETTES[i], iconColor: ICON_COLORS[i] };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/5 hover:bg-primary/15 border border-white/10 hover:border-primary/40 text-slate-400 hover:text-primary transition-all"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? "Copied!" : label}
    </button>
  );
}

// ─── Create Group Modal ────────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (groupId: string, inviteCode: string, name: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    startTransition(async () => {
      const result = await createGroup(formData);
      if (result.error) {
        setError(result.error);
      } else if (result.success && result.groupId && result.inviteCode) {
        onCreated(result.groupId, result.inviteCode, name);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-1">New League</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Create Group</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Group Name */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              Group Name <span className="text-primary">*</span>
            </label>
            <input
              name="name"
              id="group-name"
              maxLength={50}
              required
              placeholder="e.g. The Prediction Wizards"
              className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-primary/5 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-bold outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              name="description"
              id="group-description"
              maxLength={200}
              rows={2}
              placeholder="What's this group about?"
              className="w-full bg-white/5 border border-white/10 focus:border-primary/50 focus:bg-primary/5 rounded-xl px-4 py-3 text-white placeholder-slate-600 text-sm font-bold outline-none transition-all resize-none"
            />
          </div>

          {/* Info */}
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
            <Users size={14} className="text-primary shrink-0" />
            <span className="text-[11px] text-slate-400 font-bold">
              An invite code will be auto-generated. Max <span className="text-white">20 members</span>.
            </span>
          </div>

          {error && (
            <div className="text-[11px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            id="create-group-submit"
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-primary text-slate-950 font-black uppercase text-sm tracking-widest py-4 rounded-xl hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Plus size={16} /> Create League
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Join Group Modal ──────────────────────────────────────────────────────────

function JoinGroupModal({ onClose, onJoined }: { onClose: () => void; onJoined: (groupId: string, name: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinGroupByCode(code);
      if (result.error && !result.groupId) {
        setError(result.error);
      } else if (result.groupId) {
        onJoined(result.groupId, result.groupName || "Group");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary mb-1">Enter Code</div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-white italic">Join Group</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
              Invite Code <span className="text-secondary">*</span>
            </label>
            <input
              id="join-invite-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))}
              maxLength={6}
              required
              placeholder="ABC123"
              className="w-full bg-white/5 border border-white/10 focus:border-secondary/50 focus:bg-secondary/5 rounded-xl px-4 py-4 text-white placeholder-slate-600 text-2xl font-black text-center uppercase tracking-[0.5em] outline-none transition-all"
            />
            <div className="text-[10px] text-slate-600 font-bold text-center">Ask your group creator for a 6-character code</div>
          </div>

          {error && (
            <div className="text-[11px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            id="join-group-submit"
            type="submit"
            disabled={isPending || code.length !== 6}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white font-black uppercase text-sm tracking-widest py-4 rounded-xl hover:bg-secondary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,107,152,0.3)]"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Joining...
              </>
            ) : (
              <>
                <UserPlus size={16} /> Join League
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Success Modal ─────────────────────────────────────────────────────────────

function SuccessModal({
  type,
  groupId,
  groupName,
  inviteCode,
  onClose,
}: {
  type: "created" | "joined";
  groupId: string;
  groupName?: string;
  inviteCode?: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl shadow-black/60 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy size={28} className="text-primary" />
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
          {type === "created" ? "League Activated" : "League Joined"}
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic mb-2">
          {groupName || "Your Group"}
        </h3>

        {type === "created" && inviteCode && (
          <div className="my-6 bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 mb-2">Your Invite Code</div>
            <div className="text-4xl font-black tracking-[0.4em] text-primary italic mb-3">{inviteCode}</div>
            <CopyButton text={inviteCode} label="Copy Code" />
          </div>
        )}

        {type === "joined" && (
          <p className="text-slate-400 text-sm font-bold mb-6">You're now competing in this private league!</p>
        )}

        <div className="flex gap-3 mt-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm font-black uppercase tracking-widest transition-all"
          >
            Stay Here
          </button>
          <Link
            href={`/groups/${groupId}`}
            className="flex-1 py-3 rounded-xl bg-primary text-slate-950 font-black uppercase text-sm tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
          >
            View League <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyState({ onCreateClick, onJoinClick }: { onCreateClick: () => void; onJoinClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="relative w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center">
          <Users size={36} className="text-slate-500" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">No Leagues Yet</h3>
        <p className="text-slate-500 font-bold text-sm max-w-sm">
          Create a private league and invite friends, or join an existing one with an invite code.
        </p>
      </div>
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          id="empty-create-group"
          onClick={onCreateClick}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-slate-950 font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]"
        >
          <Plus size={16} /> Create League
        </button>
        <button
          id="empty-join-group"
          onClick={onJoinClick}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white font-black uppercase text-sm tracking-widest rounded-xl hover:bg-white/10 transition-all"
        >
          <Hash size={16} /> Join League
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function GroupsClient({ groups: initialGroups, currentUserId, profile }: GroupsClientProps) {
  const [groups, setGroups] = useState<Group[]>(initialGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [successModal, setSuccessModal] = useState<{
    type: "created" | "joined";
    groupId: string;
    groupName?: string;
    inviteCode?: string;
  } | null>(null);

  const handleCreated = (groupId: string, inviteCode: string, name: string) => {
    const newGroup: Group = {
      id: groupId,
      name,
      invite_code: inviteCode,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      member_count: 1,
    };
    setGroups((prev) => [newGroup, ...prev]);
    setShowCreate(false);
    setSuccessModal({ type: "created", groupId, inviteCode, groupName: name });
  };

  const handleJoined = (groupId: string, name: string) => {
    setShowJoin(false);
    setSuccessModal({ type: "joined", groupId, groupName: name });
  };

  return (
    <main className="min-h-screen pt-32 pb-20 bg-background relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/4 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-screen-xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="flex flex-col gap-3">
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">Private Leagues</div>
            <h1 className="font-headline text-5xl md:text-7xl font-black uppercase tracking-tighter italic text-white leading-none">
              MY <span className="text-primary">GROUPS</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm max-w-md">
              Compete with friends in private prediction leagues. Create a group, share your code, dominate the board.
            </p>
          </div>

          {groups.length > 0 && (
            <div className="flex gap-3">
              <button
                id="header-join-group"
                onClick={() => setShowJoin(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-black uppercase text-sm tracking-widest rounded-xl transition-all"
              >
                <Hash size={15} /> Join
              </button>
              <button
                id="header-create-group"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-3 bg-primary text-slate-950 font-black uppercase text-sm tracking-widest rounded-xl hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              >
                <Plus size={15} /> Create
              </button>
            </div>
          )}
        </div>

        {/* Stats bar */}
        {groups.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {[
              { label: "Active Leagues", value: groups.length.toString() },
              { label: "Total Members", value: groups.reduce((a, g) => a + (g.member_count ?? 0), 0).toString() },
              { label: "Max Members", value: "20 / League" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/3 border border-white/5 rounded-2xl px-5 py-4 flex flex-col gap-1">
                <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">{stat.label}</div>
                <div className="text-2xl font-headline font-black italic text-white tracking-tight">{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreate(true)} onJoinClick={() => setShowJoin(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => {
              const { gradient, iconColor } = getGroupStyle(idx);
              const isCreator = group.created_by === currentUserId;
              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className={cn(
                    "group relative bg-gradient-to-br border rounded-3xl p-6 flex flex-col gap-4 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden",
                    gradient
                  )}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn("p-3 bg-white/10 rounded-2xl border border-white/10", )}>
                      <Users size={22} className={iconColor} />
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {isCreator && (
                        <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-yellow-400 bg-yellow-400/10 border border-yellow-400/25 px-2 py-0.5 rounded-full">
                          <Crown size={9} /> Creator
                        </span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {group.member_count ?? 0} / 20 members
                      </span>
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <h3 className="font-black text-white uppercase tracking-tight text-xl italic leading-tight mb-1 group-hover:text-primary transition-colors">
                      {group.name}
                    </h3>
                    {group.description && (
                      <p className="text-slate-500 text-xs font-bold line-clamp-2">{group.description}</p>
                    )}
                  </div>

                  {/* Invite code */}
                  <div className="flex items-center gap-2 bg-black/30 border border-white/5 rounded-xl px-3 py-2">
                    <Hash size={11} className="text-slate-600 shrink-0" />
                    <span className="text-slate-400 font-black tracking-[0.3em] text-xs flex-1">{group.invite_code}</span>
                    <div onClick={(e) => e.preventDefault()}>
                      <CopyButton text={group.invite_code} />
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex items-center justify-end">
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-primary transition-colors">
                      View Leaderboard <ChevronRight size={13} />
                    </div>
                  </div>

                  {/* Shimmer on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-white/3 to-transparent transition-opacity duration-500 pointer-events-none rounded-3xl" />
                </Link>
              );
            })}

            {/* Create new group card */}
            <button
              id="grid-create-group"
              onClick={() => setShowCreate(true)}
              className="group relative bg-white/2 border border-dashed border-white/10 hover:border-primary/40 hover:bg-primary/5 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 min-h-[200px]"
            >
              <div className="w-12 h-12 bg-white/5 group-hover:bg-primary/10 border border-white/10 group-hover:border-primary/30 rounded-2xl flex items-center justify-center transition-all">
                <Plus size={22} className="text-slate-600 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <div className="text-sm font-black uppercase tracking-wider text-slate-600 group-hover:text-primary transition-colors">
                  New League
                </div>
                <div className="text-[10px] text-slate-700 font-bold mt-1">Create another group</div>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={(groupId, inviteCode, name) => handleCreated(groupId, inviteCode, name)}
        />
      )}
      {showJoin && (
        <JoinGroupModal
          onClose={() => setShowJoin(false)}
          onJoined={handleJoined}
        />
      )}
      {successModal && (
        <SuccessModal
          type={successModal.type}
          groupId={successModal.groupId}
          groupName={successModal.groupName}
          inviteCode={successModal.inviteCode}
          onClose={() => setSuccessModal(null)}
        />
      )}
    </main>
  );
}
