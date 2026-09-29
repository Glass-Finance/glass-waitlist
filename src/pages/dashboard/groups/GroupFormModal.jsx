import { useState } from "react";
import ModalShell from "../../../components/dashboard/ModalShell";

// State is seeded from props in the useState initialiser, not synced by an
// effect. The caller passes a `key` that changes with the group being edited, so
// switching rows (or to "new") remounts this and reseeds cleanly -- no
// cascading render, and no stale name carried over from the previous group.
export default function GroupFormModal({ group, onClose, onSave, saving }) {
  const isEdit = Boolean(group);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [touched, setTouched] = useState(false);

  // `name` is the only required field server-side
  // (CreateCommunityMemberGroupRequest), so that is the only thing validated
  // here. Whitespace-only would pass a truthy check and create a nameless
  // group, hence the trim.
  const nameError = touched && !name.trim() ? "Give this group a name." : "";

  function submit(e) {
    e.preventDefault();
    setTouched(true);
    if (!name.trim()) return;
    onSave({ name: name.trim(), description: description.trim() || undefined });
  }

  return (
    <ModalShell
      title={isEdit ? "Edit group" : "New group"}
      subtitle={isEdit ? group.name : "Group a set of members together."}
      onClose={onClose}
    >
      <form onSubmit={submit} className="px-5 py-4 flex flex-col gap-4">
        <div>
          <label htmlFor="group-name" className="block text-xs font-bold text-gray-700 mb-1.5">
            Name
          </label>
          <input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Choir, Second floor, Staff"
            autoFocus
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          />
          {nameError ? <p className="text-xs text-red-500 mt-1">{nameError}</p> : null}
        </div>

        <div>
          <label
            htmlFor="group-description"
            className="block text-xs font-bold text-gray-700 mb-1.5"
          >
            Description <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="group-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="What this group is for"
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-gray-500 bg-transparent border-none cursor-pointer px-3 py-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="text-xs font-bold text-white bg-brand border-none cursor-pointer px-4 py-2 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create group"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}
