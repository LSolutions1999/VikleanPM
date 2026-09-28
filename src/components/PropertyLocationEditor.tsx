"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types";

type PropertyLocationEditorProps = {
  property: Property;
  propertySlug: string;
  initialEditing?: boolean;
};

type PropertyDraft = Pick<Property, "name" | "address" | "city" | "region" | "notes"> & { propertyOwner: string };

export function PropertyLocationEditor({ property, propertySlug, initialEditing = false }: PropertyLocationEditorProps) {
  const supabase = createClient();
  const [draft, setDraft] = useState<PropertyDraft>({
    name: property.name,
    address: property.address,
    city: property.city,
    region: property.region,
    propertyOwner: property.propertyOwner ?? "",
    notes: property.notes
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [editing, setEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      name: property.name,
      address: property.address,
      city: property.city,
      region: property.region,
      propertyOwner: property.propertyOwner ?? "",
      notes: property.notes
    });
    setEditing(initialEditing);
    const savedTime = window.sessionStorage.getItem(`property-save:${propertySlug}`);
    if (savedTime) {
      setSavedAt(savedTime);
      window.sessionStorage.removeItem(`property-save:${propertySlug}`);
    }
  }, [property, propertySlug, initialEditing]);

  useEffect(() => {
    if (!savedAt) return;
    const timeout = window.setTimeout(() => setSavedAt(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [savedAt]);

  function updateField<K extends keyof PropertyDraft>(field: K, value: PropertyDraft[K]) {
    setDraft((current) => ({
      ...current,
      [field]: value
    }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to be signed in to save property details.");
      setSaving(false);
      return;
    }

    const { propertyOwner, ...locationFields } = draft;
    const { error: saveError } = await supabase.from("properties").upsert(
      {
        slug: propertySlug,
        owner_id: user.id,
        ...locationFields,
        property_owner: propertyOwner.trim() || null
      },
      {
        onConflict: "slug"
      }
    );

    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    window.sessionStorage.setItem(`property-save:${propertySlug}`, new Date().toLocaleTimeString());
    setEditing(false);
    window.history.replaceState(null, "", window.location.pathname);
    window.location.reload();
  }

  return (
    <>
      <button type="button" className="ghost-button" onClick={() => setEditing(true)}><Pencil size={16} /> Edit property</button>
      {savedAt ? <div className="save-confirmation-card" role="status"><CheckCircle2 size={19} /><span>Property details saved successfully. <small>{savedAt}</small></span></div> : null}
      {editing ? <div className="modal-backdrop" onClick={() => setEditing(false)} role="presentation">
        <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="property-edit-title" onClick={(event) => event.stopPropagation()}>
          <div className="modal-header">
            <div><p className="eyebrow">Property</p><h3 id="property-edit-title">Edit property details</h3></div>
            <button type="button" className="icon-button" onClick={() => setEditing(false)} aria-label="Close property editor">×</button>
          </div>
          <div className="form-grid">
            <label className="full"><span>Property name</span><input value={draft.name} onChange={(event) => updateField("name", event.target.value)} /></label>
            <label className="full"><span>Property owner</span><input value={draft.propertyOwner} onChange={(event) => updateField("propertyOwner", event.target.value)} placeholder="Owner name" /></label>
            <label className="full"><span>Street address</span><input value={draft.address} onChange={(event) => updateField("address", event.target.value)} /></label>
            <label><span>City</span><input value={draft.city} onChange={(event) => updateField("city", event.target.value)} /></label>
            <label><span>Region</span><input value={draft.region} onChange={(event) => updateField("region", event.target.value)} /></label>
            <label className="full"><span>Notes</span><textarea rows={4} value={draft.notes} onChange={(event) => updateField("notes", event.target.value)} /></label>
          </div>
          {error ? <p className="form-message" role="alert">{error}</p> : null}
          <div className="modal-actions"><button type="button" className="ghost-button" onClick={() => { setDraft({ name: property.name, address: property.address, city: property.city, region: property.region, propertyOwner: property.propertyOwner ?? "", notes: property.notes }); setEditing(false); }}>Cancel</button><button type="button" className="primary-button" onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save property details"}</button></div>
        </div>
      </div> : null}
    </>
  );
}
