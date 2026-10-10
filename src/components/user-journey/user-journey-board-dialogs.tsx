"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { AddColumnDialog, AddItemDialog, AddRowDialog } from "./edit-dialogs";
import { ImportFromPersonaDialog } from "./import-from-persona-dialog";
import { ItemContextMenu } from "./item-context-menu";
import type { UserJourneyBoardState } from "./use-user-journey-board-state";

export function UserJourneyBoardDialogs({ state }: { state: UserJourneyBoardState }) {
  return (
    <>
      <AddItemDialog
        open={!!state.activeCell}
        onOpenChange={(open) => !open && state.setActiveCell(null)}
        onSubmit={state.handleAddItem}
      />

      <AddItemDialog
        open={!!state.editingItem}
        onOpenChange={(open) => !open && state.setEditingItem(null)}
        onSubmit={state.handleUpdateItem}
        mode="edit"
        initialValues={state.editingItem?.initialValues}
        onDelete={state.handleDeleteItem}
        onDuplicate={state.handleDuplicateItem}
      />

      <ItemContextMenu
        position={state.contextMenu?.position || null}
        onClose={() => state.setContextMenu(null)}
        onEdit={state.handleContextMenuEdit}
        onDuplicate={state.handleContextMenuDuplicate}
        onDelete={state.handleContextMenuDelete}
      />

      <ImportFromPersonaDialog
        open={state.isImportFromPersonaOpen}
        onOpenChange={state.setIsImportFromPersonaOpen}
        availablePersonas={state.otherPersonas}
        currentPersonaName={state.primaryJourney.meta.persona}
        onImport={state.handleImportFromPersona}
      />

      <AddRowDialog
        open={state.isAddRowOpen}
        onOpenChange={state.setIsAddRowOpen}
        onSubmit={state.handleAddRow}
      />
      <AddRowDialog
        open={!!state.editingRow}
        onOpenChange={(open) => !open && state.setEditingRow(null)}
        onSubmit={state.handleUpdateRow}
        mode="edit"
        initialValues={state.editingRow || undefined}
        onDelete={state.handleDeleteRow}
      />
      <AddColumnDialog
        open={state.isAddColumnOpen}
        onOpenChange={state.setIsAddColumnOpen}
        onSubmit={state.handleAddColumn}
      />
      <AddColumnDialog
        open={!!state.editingColumn}
        onOpenChange={(open) => !open && state.setEditingColumn(null)}
        onSubmit={state.handleUpdateColumn}
        showApplyToAll={false}
        mode="edit"
        initialValues={state.editingColumn || undefined}
        onDelete={state.handleDeleteColumn}
      />

      <ConfirmationDialog
        open={state.confirmationState?.type === "contextMenuDelete"}
        onOpenChange={(open) => {
          if (!open) {
            state.handleContextMenuDeleteCancel();
          }
        }}
        onConfirm={state.handleContextMenuDeleteConfirm}
        title="Delete item"
        description="Delete this item?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
      <ConfirmationDialog
        open={state.confirmationState?.type === "columnDelete"}
        onOpenChange={(open) => !open && state.handleDeleteColumnCancel()}
        onConfirm={state.handleDeleteColumnConfirm}
        title="Delete column"
        description={`Delete the "${state.pendingColumnDelete?.label || ""}" column? It contains ${state.pendingColumnDelete?.itemCount || 0} items.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
      <ConfirmationDialog
        open={state.confirmationState?.type === "rowDelete"}
        onOpenChange={(open) => !open && state.handleDeleteRowCancel()}
        onConfirm={state.handleDeleteRowConfirm}
        title="Delete row"
        description={`Delete the "${state.pendingRowDelete?.label || ""}" row? The row and all its items are deleted for every persona in this journey.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
      <ConfirmationDialog
        open={state.confirmationState?.type === "trashDrop"}
        onOpenChange={(open) => {
          if (!open) {
            state.setConfirmationState(null);
            state.handleTrashDropCancel();
          }
        }}
        onConfirm={async () => {
          if (await state.handleTrashDropConfirm()) {
            state.setConfirmationState(null);
          }
        }}
        title="Delete item"
        description="Delete this item?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
      />
      <ConfirmationDialog
        open={state.confirmationState?.type === "csvImport"}
        onOpenChange={(open) => !open && state.setConfirmationState(null)}
        onConfirm={state.handleImportConfirm}
        title="Import CSV"
        description="Importing replaces all existing content on this board. Continue?"
        confirmLabel="Import"
        cancelLabel="Cancel"
        variant="default"
        contentClassName="sm:max-w-[40rem]"
      />
    </>
  );
}
