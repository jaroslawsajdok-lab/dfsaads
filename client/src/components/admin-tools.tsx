import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { cx, apiFetch, SECTION_LABELS, DEFAULT_SECTION_ORDER } from "@/lib/home-helpers";
import type { SiteTexts } from "@/lib/home-helpers";
import { Pencil, Save, X, Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function useSectionOrder() {
  const { data } = useQuery<{ value: string | null }>({
    queryKey: ["admin-setting", "section_order"],
    queryFn: () => apiFetch("/api/admin/settings/section_order"),
  });
  try {
    if (data?.value) return JSON.parse(data.value) as string[];
  } catch {}
  return DEFAULT_SECTION_ORDER;
}

export function useNavItems() {
  const order = useSectionOrder();
  return order.map(id => ({ id, label: SECTION_LABELS[id] || id }));
}

export function SectionReorderControls({ sectionId }: { sectionId: string }) {
  const { isEditMode } = useAuth();
  const order = useSectionOrder();
  const qc = useQueryClient();

  if (!isEditMode) return null;
  const idx = order.indexOf(sectionId);

  const move = async (dir: -1 | 1) => {
    const newOrder = [...order];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[newIdx]] = [newOrder[newIdx], newOrder[idx]];
    await apiRequest("PUT", "/api/admin/settings/section_order", { value: JSON.stringify(newOrder) });
    qc.invalidateQueries({ queryKey: ["admin-setting", "section_order"] });
  };

  return (
    <div className="absolute -top-2 right-2 z-10 flex flex-col gap-0.5 rounded-xl bg-yellow-400/90 px-1.5 py-1 shadow-sm" data-testid={`reorder-${sectionId}`}>
      <button
        onClick={() => move(-1)}
        disabled={idx === 0}
        className="text-yellow-900 disabled:opacity-30 hover:scale-110 transition"
        data-testid={`button-reorder-up-${sectionId}`}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <span className="text-[10px] font-bold text-yellow-900 leading-4 text-center">{SECTION_LABELS[sectionId]}</span>
      <button
        onClick={() => move(1)}
        disabled={idx === order.length - 1}
        className="text-yellow-900 disabled:opacity-30 hover:scale-110 transition"
        data-testid={`button-reorder-down-${sectionId}`}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  );
}

export function EditableText({
  value, field, entityType, entityId, queryKey, multiline = false
}: {
  value: string; field: string; entityType: string; entityId: number; queryKey: string; multiline?: boolean;
}) {
  const { isEditMode } = useAuth();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(value);
  const qc = useQueryClient();

  useEffect(() => { setText(value); }, [value]);

  const mutation = useMutation({
    mutationFn: async (newVal: string) => {
      await apiRequest("PUT", `/api/${entityType}/${entityId}`, { [field]: newVal });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setEditing(false);
    },
  });

  if (!isEditMode) return <>{value}</>;

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1" data-testid={`editable-${entityType}-${field}-${entityId}`}>
        {multiline ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px] text-sm"
            autoFocus
            data-testid={`input-edit-${entityType}-${field}-${entityId}`}
          />
        ) : (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            data-testid={`input-edit-${entityType}-${field}-${entityId}`}
          />
        )}
        <button
          type="button"
          onClick={() => mutation.mutate(text)}
          className="rounded p-1 text-green-600 hover:bg-green-50"
          data-testid={`button-save-${entityType}-${field}-${entityId}`}
        >
          <Save className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => { setText(value); setEditing(false); }}
          className="rounded p-1 text-red-500 hover:bg-red-50"
          data-testid={`button-cancel-${entityType}-${field}-${entityId}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span
      className="group/edit inline cursor-pointer border-b border-dashed border-transparent hover:border-yellow-400"
      onClick={() => setEditing(true)}
      data-testid={`editable-trigger-${entityType}-${field}-${entityId}`}
    >
      {value}
      <Pencil className="ml-1 inline h-3 w-3 text-yellow-500 opacity-0 group-hover/edit:opacity-100 transition" />
    </span>
  );
}

const FONT_SIZE_OPTIONS = [
  { label: "XS", value: "text-xs" },
  { label: "S", value: "text-sm" },
  { label: "M", value: "text-base" },
  { label: "L", value: "text-lg" },
  { label: "XL", value: "text-xl" },
  { label: "2XL", value: "text-2xl" },
  { label: "3XL", value: "text-3xl" },
];

export function EditableStaticText({
  textKey, defaultValue, multiline = false, className = ""
}: {
  textKey: string; defaultValue: string; multiline?: boolean; className?: string;
}) {
  const { isEditMode } = useAuth();
  const { data: siteTexts = {} } = useQuery<SiteTexts>({
    queryKey: ["site-texts"],
    queryFn: () => apiFetch("/api/site-texts"),
  });
  const displayValue = siteTexts[textKey] || defaultValue;
  const fontSizeKey = `${textKey}__fontSize`;
  const savedFontSize = siteTexts[fontSizeKey] || "";

  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(displayValue);
  const [fontSize, setFontSize] = useState(savedFontSize);
  const qc = useQueryClient();

  useEffect(() => { setText(siteTexts[textKey] || defaultValue); }, [siteTexts, textKey, defaultValue]);
  useEffect(() => { setFontSize(siteTexts[fontSizeKey] || ""); }, [siteTexts, fontSizeKey]);

  const mutation = useMutation({
    mutationFn: async ({ newVal, newSize }: { newVal: string; newSize: string }) => {
      await apiRequest("PUT", `/api/site-texts/${textKey}`, { value: newVal });
      if (newSize !== savedFontSize) {
        await apiRequest("PUT", `/api/site-texts/${fontSizeKey}`, { value: newSize });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-texts"] });
      setEditing(false);
    },
  });

  const appliedClass = cx(className, savedFontSize);

  if (!isEditMode) return <span className={appliedClass}>{displayValue}</span>;

  if (editing) {
    return (
      <span className={cx("inline-flex flex-wrap items-center gap-1", className)} data-testid={`editable-static-${textKey}`}>
        {multiline ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[60px] text-sm w-full"
            autoFocus
            data-testid={`input-static-${textKey}`}
          />
        ) : (
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            data-testid={`input-static-${textKey}`}
          />
        )}
        <div className="flex items-center gap-0.5 rounded-md border border-gray-200 bg-gray-50 px-1 py-0.5" data-testid={`font-size-picker-${textKey}`}>
          {FONT_SIZE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFontSize(fontSize === opt.value ? "" : opt.value)}
              className={cx(
                "rounded px-1.5 py-0.5 text-[10px] font-bold transition",
                fontSize === opt.value ? "bg-yellow-400 text-yellow-900" : "text-gray-400 hover:text-gray-700 hover:bg-gray-200"
              )}
              title={`Rozmiar: ${opt.label}`}
              data-testid={`button-fontsize-${opt.label}-${textKey}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => mutation.mutate({ newVal: text, newSize: fontSize })} className="rounded p-1 text-green-600 hover:bg-green-50" data-testid={`button-save-static-${textKey}`}>
          <Save className="h-3.5 w-3.5" />
        </button>
        <button type="button" onClick={() => { setText(displayValue); setFontSize(savedFontSize); setEditing(false); }} className="rounded p-1 text-red-500 hover:bg-red-50" data-testid={`button-cancel-static-${textKey}`}>
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <span
      className={cx("group/edit inline cursor-pointer border-b border-dashed border-transparent hover:border-yellow-400", appliedClass)}
      onClick={() => setEditing(true)}
      data-testid={`editable-static-trigger-${textKey}`}
    >
      {displayValue}
      <Pencil className="ml-1 inline h-3 w-3 text-yellow-500 opacity-0 group-hover/edit:opacity-100 transition" />
    </span>
  );
}

export function AdminItemActions({ entityType, entityId, queryKey }: { entityType: string; entityId: number; queryKey: string }) {
  const { isEditMode } = useAuth();
  const qc = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/${entityType}/${entityId}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  if (!isEditMode) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (window.confirm("Czy na pewno chcesz usunąć ten element?")) {
          deleteMutation.mutate();
        }
      }}
      className="rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
      data-testid={`button-delete-${entityType}-${entityId}`}
      aria-label="Usuń"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

export function AdminAddButton({ entityType, queryKey, defaultValues, fields }: {
  entityType: string; queryKey: string; defaultValues: Record<string, string>; fields: { key: string; label: string; multiline?: boolean }[];
}) {
  const { isEditMode } = useAuth();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(defaultValues);
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      await apiRequest("POST", `/api/${entityType}`, data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [queryKey] });
      setOpen(false);
      setFormData(defaultValues);
    },
  });

  if (!isEditMode) return null;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-xl border-dashed border-yellow-400 text-yellow-600 hover:bg-yellow-50"
        onClick={() => setOpen(true)}
        data-testid={`button-add-${entityType}`}
      >
        <Plus className="mr-1 h-4 w-4" />
        Dodaj
      </Button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setOpen(false)} data-testid={`dialog-add-${entityType}-backdrop`}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()} data-testid={`dialog-add-${entityType}`}>
            <h3 className="font-display text-lg" data-testid={`text-add-${entityType}-title`}>Dodaj nowy element</h3>
            <form
              onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }}
              className="mt-4 space-y-3"
            >
              {fields.map((f) => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  {f.multiline ? (
                    <Textarea
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="mt-1"
                      data-testid={`input-add-${entityType}-${f.key}`}
                    />
                  ) : (
                    <Input
                      value={formData[f.key] || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      className="mt-1"
                      data-testid={`input-add-${entityType}-${f.key}`}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1 rounded-xl" data-testid={`button-submit-add-${entityType}`}>
                  <Save className="mr-2 h-4 w-4" />
                  Zapisz
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(false)} data-testid={`button-cancel-add-${entityType}`}>
                  Anuluj
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
