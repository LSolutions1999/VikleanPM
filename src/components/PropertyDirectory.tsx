"use client";

import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Property } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
type PropertyDirectoryProps = {
  properties: Property[];
};

export function PropertyDirectory({ properties }: PropertyDirectoryProps) {
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState({ name: "", propertyOwner: "", address: "", city: "", region: "", notes: "" });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return properties.filter((property) => {
      const matchesSearch =
        !query ||
        [property.name, property.address, property.city, property.region, property.tenants.map((tenant) => tenant.name).join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesSearch;
    });
  }, [properties, search]);

  async function addLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be signed in to add a location.");
      setSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from("properties").insert({
      slug: `location-${crypto.randomUUID()}`,
      owner_id: user.id,
      name: draft.name.trim(),
      property_owner: draft.propertyOwner.trim() || null,
      address: draft.address.trim() || null,
      city: draft.city.trim() || null,
      region: draft.region.trim() || null,
      status: "Active",
      notes: draft.notes.trim() || null
    });

    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }

    window.location.reload();
  }

  return (
    <section className="stack-lg">
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        titleAction={<button type="button" className="header-edit-button" aria-label={editMode ? "Done editing properties" : "Edit properties"} title={editMode ? "Done editing properties" : "Edit properties"} aria-pressed={editMode} onClick={() => { setEditMode((current) => !current); setAddingLocation(false); }}><Pencil size={17} /></button>}
        description="Browse your properties, units, tenants, and documents."
      />
      <div className="property-directory-toolbar">
        <label className="search-field">
          <span>Search properties, units, or tenants</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try Maple Court or Jordan Lee" />
        </label>
        {editMode ? <button type="button" className="primary-button" onClick={() => { setAddingLocation((current) => !current); setError(null); }}>
          <Plus size={17} /> {addingLocation ? "Close form" : "Add location"}
        </button> : null}
      </div>

      {addingLocation ? (
        <form className="panel property-create-form" onSubmit={addLocation}>
          <div>
            <p className="eyebrow">New location</p>
            <h3>Location details</h3>
          </div>
          <div className="form-grid">
            <label className="full"><span>Location name</span><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Building or site name" /></label>
            <label className="full"><span>Property owner</span><input value={draft.propertyOwner} onChange={(event) => setDraft({ ...draft, propertyOwner: event.target.value })} placeholder="Owner name" /></label>
            <label className="full"><span>Address</span><input value={draft.address} onChange={(event) => setDraft({ ...draft, address: event.target.value })} placeholder="Street address" /></label>
            <label><span>City</span><input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} /></label>
            <label><span>Region</span><input value={draft.region} onChange={(event) => setDraft({ ...draft, region: event.target.value })} /></label>
            <label className="full"><span>Notes</span><textarea rows={3} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
          </div>
          {error ? <p className="form-message">{error}</p> : null}
          <div className="modal-actions"><button className="primary-button" type="submit" disabled={saving}>{saving ? "Adding..." : "Create location"}</button></div>
        </form>
      ) : null}

      <div className="property-grid">
        {filtered.map((property) => {
          const occupiedUnits = property.units.filter((unit) => unit.status === "Occupied").length;
          const vacantUnits = property.units.filter((unit) => unit.status === "Vacant").length;

          return (
            <article key={property.id} className="property-card">
              <Link href={`/properties/${property.id}`} className="property-card-link">
                <div className="property-card-top">
                  <div>
                    <h3>{property.name}</h3>
                    <p className="muted">
                      {property.address}, {property.city}, {property.region}
                    </p>
                  </div>
                </div>

                <div className="property-metrics">
                  <div>
                    <strong>{property.units.length}</strong>
                    <span>Units</span>
                  </div>
                  <div>
                    <strong>{occupiedUnits}</strong>
                    <span>Occupied</span>
                  </div>
                  <div>
                    <strong>{vacantUnits}</strong>
                    <span>Vacant</span>
                  </div>
                </div>

                <p className="card-note">{property.notes}</p>
              </Link>
              {editMode ? <Link className="ghost-button property-card-edit" href={`/properties/${property.id}?edit=true`}><Pencil size={15} /> Edit property</Link> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
