import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { apiFetch } from "@/lib/home-helpers";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="fixed bottom-4 left-1/2 z-[90] -translate-x-1/2 rounded-2xl border bg-white/95 px-5 py-3 shadow-xl backdrop-blur" data-testid="admin-floating-bar">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
          <span className="text-sm font-semibold text-yellow-700" data-testid="text-editmode-label">Tryb edycji aktywny</span>
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
