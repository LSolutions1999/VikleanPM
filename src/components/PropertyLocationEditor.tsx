"use client";

import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types";

type PropertyLocationEditorProps = {
  property: Property;
  propertySlug: string;
};

type PropertyDraft = Pick<Property, "name" | "address" | "city" | "region" | "notes">;

export function PropertyLocationEditor({ property, propertySlug }: PropertyLocationEditorProps) {
  const supabase = createClient();
  const [draft, setDraft] = useState<PropertyDraft>({
    name: property.name,
    address: property.address,
    city: property.city,
    region: property.region,
    notes: property.notes
  });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft({
      name: property.name,
      address: property.address,
      city: property.city,
      region: property.region,
      notes: property.notes
    });
    setSavedAt(null);
  }, [property]);

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

    const { error: saveError } = await supabase.from("properties").upsert(
      {
        slug: propertySlug,
        owner_id: user.id,
        ...draft
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

    setSavedAt(new Date().toLocaleString());
    setEditing(false);
    window.location.reload();
  }

  return (
    <article className="detail-card" style={{ gridColumn: "1 / -1" }}>
      <div className="modal-section-header">
        <div>
          <p className="eyebrow">Location</p>
          <h3>Site information</h3>
        </div>
        <div className="property-location-actions">
          {savedAt ? <p className="form-message">Saved {savedAt}</p> : null}
          {editing ? <button type="button" className="ghost-button" onClick={() => { setDraft({ name: property.name, address: property.address, city: property.city, region: property.region, notes: property.notes }); setEditing(false); }}>Cancel</button> : <button type="button" className="ghost-button" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</button>}
        </div>
      </div>

      {editing ? (
      <div className="modal-section">
        <div className="form-grid">
          <label className="full">
            <span>Property name</span>
            <input value={draft.name} onChange={(event) => updateField("name", event.target.value)} />
          </label>
          <label className="full">
            <span>Address</span>
            <input value={draft.address} onChange={(event) => updateField("address", event.target.value)} />
          </label>
          <label>
            <span>City</span>
            <input value={draft.city} onChange={(event) => updateField("city", event.target.value)} />
          </label>
          <label>
            <span>Region</span>
            <input value={draft.region} onChange={(event) => updateField("region", event.target.value)} />
          </label>
          <label className="full">
            <span>Notes</span>
            <textarea rows={4} value={draft.notes} onChange={(event) => updateField("notes", event.target.value)} />
          </label>
        </div>

        {error ? <p className="form-message">{error}</p> : null}

        <div className="modal-actions">
          <button type="button" className="primary-button" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save location details"}
          </button>
        </div>
      </div>
      ) : null}
    </article>
  );
}
