import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { Facebook, Link2, MessageCircle, Save, X, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

function SocialLinksEditor() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: fbData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "facebook_url"],
    queryFn: () => apiFetch("/api/admin/settings/facebook_url"),
  });
  const { data: ytData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "youtube_url"],
    queryFn: () => apiFetch("/api/admin/settings/youtube_url"),
  });
  const [fbVal, setFbVal] = useState("");
  const [ytVal, setYtVal] = useState("");
  const [inited, setInited] = useState(false);

  if (!inited && fbData !== undefined && ytData !== undefined) {
    setFbVal(fbData?.value || "");
    setYtVal(ytData?.value || "");
    setInited(true);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (fbVal.trim()) await apiRequest("PUT", "/api/admin/settings/facebook_url", { value: fbVal.trim() });
      if (ytVal.trim()) await apiRequest("PUT", "/api/admin/settings/youtube_url", { value: ytVal.trim() });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-setting", "facebook_url"] });
      qc.invalidateQueries({ queryKey: ["admin-setting", "youtube_url"] });
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setOpen(true)} data-testid="button-edit-social">
        <Link2 className="mr-1 h-4 w-4" />
        Linki
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2" data-testid="form-social-links">
      <div className="flex items-center gap-1">
        <Facebook className="h-3.5 w-3.5 text-blue-600" />
        <Input value={fbVal} onChange={(e) => setFbVal(e.target.value)} placeholder="URL Facebooka" className="h-7 w-40 text-xs" data-testid="input-facebook-url" />
      </div>
      <div className="flex items-center gap-1">
        <Youtube className="h-3.5 w-3.5 text-red-600" />
        <Input value={ytVal} onChange={(e) => setYtVal(e.target.value)} placeholder="URL YouTube" className="h-7 w-40 text-xs" data-testid="input-youtube-url" />
      </div>
      <button type="button" onClick={() => saveMutation.mutate()} className="rounded p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-400/10" data-testid="button-save-social">
        <Save className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => setOpen(false)} className="rounded p-1 text-muted-foreground hover:bg-muted" data-testid="button-cancel-social">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AdminFloatingBar() {
  const { isAdmin, isEditMode, setEditMode } = useAuth();
  const queryClient = useQueryClient();
  const { data: chatWidgetData } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "chat_widget_enabled"],
    queryFn: () => apiFetch("/api/admin/settings/chat_widget_enabled"),
    enabled: isAdmin && isEditMode,
  });
  const chatWidgetEnabled = chatWidgetData?.value !== "false";

  const toggleChatWidget = useMutation({
    mutationFn: async () => {
      const newVal = chatWidgetEnabled ? "false" : "true";
      await apiRequest("PUT", "/api/admin/settings/chat_widget_enabled", { value: newVal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-setting", "chat_widget_enabled"] });
    },
  });

  if (!isAdmin || !isEditMode) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border border-border bg-card/95 px-5 py-3 shadow-xl backdrop-blur" data-testid="admin-floating-bar">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400" data-testid="text-editmode-label">Tryb edycji aktywny</span>
        </div>
        <Separator orientation="vertical" className="h-5" />
        <Button
          variant={chatWidgetEnabled ? "default" : "outline"}
          size="sm"
          className="rounded-xl"
          onClick={() => toggleChatWidget.mutate()}
          data-testid="button-toggle-chat-widget"
        >
          <MessageCircle className="mr-1 h-4 w-4" />
          Czat: {chatWidgetEnabled ? "WŁ" : "WYŁ"}
        </Button>
        <Separator orientation="vertical" className="h-5" />
        <SocialLinksEditor />
        <Separator orientation="vertical" className="h-5" />
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={() => setEditMode(false)}
          data-testid="button-exit-editmode"
        >
          <X className="mr-1 h-4 w-4" />
          Zakończ edycję
        </Button>
      </div>
    </div>
  );
}
