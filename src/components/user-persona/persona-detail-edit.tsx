"use client";

import type { ChangeEvent } from "react";
import { Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { personaInitials } from "@/lib/personas/initials";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PersonaData } from "@/lib/personas/types";

interface PersonaDetailEditProps {
  formData: PersonaData;
  isSaving: boolean;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onInputChange: (field: keyof PersonaData, value: PersonaData[keyof PersonaData]) => void;
  onTagsChange: (value: string) => void;
}

export function PersonaDetailEdit({
  formData,
  isSaving,
  onSave,
  onCancel,
  onInputChange,
  onTagsChange,
}: PersonaDetailEditProps) {
  return (
    <div className="grid h-full min-h-0 flex-1 overflow-y-auto overscroll-contain xl:grid-cols-[var(--container-ux-profile)_minmax(0,1fr)]">
      <aside className="border-ux-border grid content-start gap-5 border-b p-6 xl:border-r xl:border-b-0">
          <div className="grid gap-2">
            <div className="bg-ux-primary/10 text-ux-primary flex size-16 items-center justify-center rounded-full text-xl font-bold">
              {personaInitials(formData.name)}
            </div>
            <PersonaTextField
              id="name"
              label="Name"
              value={formData.name}
              onChange={(value) => onInputChange("name", value)}
            />
            <PersonaTextField
              id="role"
              label="Role"
              value={formData.role || ""}
              onChange={(value) => onInputChange("role", value)}
            />
          </div>

          <div className="grid gap-2 border-t pt-4">
            <PersonaSelectField
              id="age"
              label="Age"
              value={formData.ageRange}
              placeholder="Select…"
              options={["18-24", "25-34", "35-44", "45-54", "55+"]}
              onChange={(value) => onInputChange("ageRange", value)}
              tile
            />
            <PersonaTextField
              id="location"
              label="Location"
              value={formData.location || ""}
              onChange={(value) => onInputChange("location", value)}
              tile
            />
            <PersonaSelectField
              id="tech"
              label="Tech Savvy"
              value={formData.techSavvy}
              placeholder="Select…"
              options={["Low", "Medium", "High"]}
              onChange={(value) => onInputChange("techSavvy", value)}
              tile
            />
            <div className="bg-ux-soft/70 grid min-h-16 content-center gap-1 rounded-xl px-3 py-2">
              <Label htmlFor="priority" className="text-ux-muted text-xs">MVP priority</Label>
              <Switch
                id="priority"
                checked={formData.mvpPriority}
                onCheckedChange={(value) => onInputChange("mvpPriority", value)}
              />
            </div>
            <PersonaTextField
              id="mvp"
              label="MVP Practice"
              value={formData.mvpPractice || ""}
              onChange={(value) => onInputChange("mvpPractice", value)}
              tile
              className=""
            />
          </div>

          <div>
            <PersonaTextField
              id="tags"
              label="Tags (comma separated)"
              value={formData.tags?.join(", ") || ""}
              onChange={onTagsChange}
            />
          </div>

          <div className="border-ux-border bg-ux-surface sticky bottom-0 z-(--z-ux-raised) flex gap-2 border-t py-3">
            <Button onClick={onSave} disabled={isSaving} variant="inverse" size={null} shape={null} className="h-11 w-full rounded-ux-button">
              <Save className="size-4" />
              {isSaving ? "Saving…" : "Save Changes"}
            </Button>
            <Button onClick={onCancel} variant="outline" size={null} shape={null} className="size-11 shrink-0 rounded-ux-button">
              <X className="size-4" />
              <span className="sr-only">Discard changes</span>
            </Button>
          </div>
      </aside>

      <div className="grid content-start gap-4 p-6">
        <div className="border-ux-border grid gap-4 rounded-2xl border bg-ux-surface p-6 shadow-none">
          <div className="grid gap-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              className="min-h-[100px] text-lg"
              value={formData.summary || ""}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onInputChange("summary", e.target.value)
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <p className="text-ux-muted text-xs">
              Use <code>## Heading</code> to start a new collapsible section.
            </p>
            <Textarea
              id="content"
              className="min-h-[500px] font-mono text-sm leading-relaxed"
              value={formData.content}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                onInputChange("content", e.target.value)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function PersonaTextField({
  id,
  label,
  value,
  onChange,
  tile = false,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  tile?: boolean;
  className?: string;
}) {
  return (
    <div className={tile ? `bg-ux-soft/70 focus-within:ring-ux-primary grid min-h-16 content-center gap-1 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-inset ${className ?? ""}` : "grid gap-2"}>
      <Label htmlFor={id} className={tile ? "text-ux-muted text-xs" : undefined}>{label}</Label>
      <Input className={tile ? "h-7 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0" : undefined} id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function PersonaSelectField({
  id,
  label,
  value,
  placeholder,
  options,
  onChange,
  tile = false,
}: {
  id: string;
  label: string;
  value?: string;
  placeholder: string;
  options: string[];
  onChange: (value: string) => void;
  tile?: boolean;
}) {
  const values = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <div className={tile ? "bg-ux-soft/70 focus-within:ring-ux-primary grid min-h-16 content-center gap-1 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-inset" : "grid gap-2"}>
      <Label htmlFor={id} className={tile ? "text-ux-muted text-xs" : undefined}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className={tile ? "h-7 border-0 bg-transparent p-0 shadow-none focus:ring-0" : undefined}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {values.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
