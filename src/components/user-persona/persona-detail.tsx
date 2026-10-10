"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { deletePersona, updatePersona } from "@/actions/user-persona";
import type { PersonaData } from "@/lib/personas/types";

import { PersonaDetailEdit } from "./persona-detail-edit";
import { PersonaDetailView } from "./persona-detail-view";
import { ActionError } from "@/components/action-error";

export function PersonaDetail({ persona, initialEditing = false }: { persona: PersonaData; initialEditing?: boolean }) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [formData, setFormData] = useState<PersonaData | null>(() => initialEditing ? persona : null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async () => {
    const nextData = formData ?? persona;

    setIsSaving(true);
    try {
      const result = await updatePersona(persona.slug, nextData, persona.updated);
      if (result.success) {
        setActionError(null);
        setIsEditing(false);
        router.replace(`/ux-planner/user-personas/${persona.slug}`);
        router.refresh();
      } else {
        setActionError(result.error);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The persona could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const result = await deletePersona(persona.slug);
      if (result.success) {
        setActionError(null);
        setShowDeleteConfirm(false);
        router.push("/ux-planner/user-personas");
        router.refresh();
      } else {
        setActionError(result.error);
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The persona could not be deleted.");
    }
  };

  const handleCancel = () => {
    setFormData(null);
    setIsEditing(false);
    router.replace(`/ux-planner/user-personas/${persona.slug}`);
  };

  const handleInputChange = (field: keyof PersonaData, value: PersonaData[keyof PersonaData]) => {
    setFormData((prev) => ({ ...(prev ?? persona), [field]: value }));
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(",").reduce<string[]>((items, tag) => {
      const trimmedTag = tag.trim();
      if (trimmedTag) items.push(trimmedTag);
      return items;
    }, []);
    setFormData((prev) => ({ ...(prev ?? persona), tags }));
  };

  if (isEditing) {
    const editFormData = formData ?? persona;

    return <div className="flex h-full min-h-0 flex-col gap-4"><ActionError message={actionError} /><PersonaDetailEdit
      formData={editFormData}
      isSaving={isSaving}
      onSave={handleSave}
      onCancel={handleCancel}
      onInputChange={handleInputChange}
      onTagsChange={handleTagsChange}
    /></div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ActionError message={actionError} />
      <PersonaDetailView
      persona={persona}
      showDeleteConfirm={showDeleteConfirm}
      onEdit={() => {
        setFormData(persona);
        setIsEditing(true);
      }}
      onDeleteClick={handleDeleteClick}
      onDeleteOpenChange={setShowDeleteConfirm}
      onDeleteConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
