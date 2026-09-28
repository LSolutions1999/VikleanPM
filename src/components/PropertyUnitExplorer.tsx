"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Pencil, Plus, Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { LeaseTerm, Property, Tenant, Unit } from "@/lib/types";

type PropertyUnitExplorerProps = {
  property: Property;
};

type UnitDraft = Pick<Unit, "number" | "status" | "notes"> & {
  type: string;
  leaseTerm: LeaseTerm;
  leaseStart: string;
  leaseEnd: string;
  rentAmount: string;
  rentDueDay: string;
  utilities: string[];
};
type TenantDraft = {
  name: string;
  phone: string;
  email: string;
  leaseStart: string;
  leaseEnd: string;
  leaseFileName: string;
};

type NewUnitDraft = {
  number: string;
  status: Unit["status"];
  notes: string;
  type: string;
};

function unitToDraft(unit: Unit): UnitDraft {
  return {
    number: unit.number,
    status: unit.status,
    notes: unit.notes,
    type: unit.type ?? "",
    leaseTerm: unit.leaseTerm ?? "Standard",
    leaseStart: unit.leaseStart ?? "",
    leaseEnd: unit.leaseEnd ?? "",
    rentAmount: unit.rentAmount?.toString() ?? "",
    rentDueDay: unit.rentDueDay?.toString() ?? "",
    utilities: unit.utilities ?? ["Water"]
  };
}

const blankTenantDraft: TenantDraft = { name: "", phone: "", email: "", leaseStart: "", leaseEnd: "", leaseFileName: "" };

export function PropertyUnitExplorer({ property }: PropertyUnitExplorerProps) {
  const supabase = createClient();
  const [units, setUnits] = useState(property.units);
  const [unitSearch, setUnitSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [unitTenants, setUnitTenants] = useState(property.tenants);
  const [editingUnits, setEditingUnits] = useState(false);
  const [unitEditing, setUnitEditing] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState<string | null>(null);
  const [confirmDeleteTenantId, setConfirmDeleteTenantId] = useState<string | null>(null);
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"unit" | "tenant" | "lease">("unit");
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState(false);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({});
  const [tenantDrafts, setTenantDrafts] = useState<Record<string, TenantDraft>>({});
  const [newUnitDraft, setNewUnitDraft] = useState<NewUnitDraft>({ number: "", status: "Vacant", notes: "", type: "" });
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitSaved, setUnitSaved] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [addUnitSaving, setAddUnitSaving] = useState(false);
  const [addUnitError, setAddUnitError] = useState<string | null>(null);
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantSaved, setTenantSaved] = useState(false);
  const [tenantDeleted, setTenantDeleted] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedUnit(null);
      }
    }

    if (selectedUnit) {
      window.addEventListener("keydown", onKeyDown);
      setUnitEditing(false);
      setEditingTenantId(null);
      setConfirmDeleteUnit(false);
      setUnitSaved(false);
      setTenantSaved(false);
      setTenantDeleted(false);
      setConfirmDeleteTenantId(null);
      setDetailTab("unit");
      setDrafts((current) => ({
        ...current,
        [selectedUnit.id]: current[selectedUnit.id] ?? unitToDraft(selectedUnit)
        }));
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUnit]);

  useEffect(() => {
    if (!unitSaved) return;
    const timeout = window.setTimeout(() => setUnitSaved(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [unitSaved]);

  useEffect(() => {
    if (!tenantSaved) return;
    const timeout = window.setTimeout(() => setTenantSaved(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [tenantSaved]);

  useEffect(() => {
    if (!tenantDeleted) return;
    const timeout = window.setTimeout(() => setTenantDeleted(false), 5000);
    return () => window.clearTimeout(timeout);
  }, [tenantDeleted]);

  const activeDraft = selectedUnit ? drafts[selectedUnit.id] ?? null : null;
  const activeUnit = selectedUnit && activeDraft ? { ...selectedUnit, ...activeDraft } : selectedUnit;
  const tenantsForSelectedUnit = selectedUnit ? unitTenants.filter((tenant) => tenant.unitId === selectedUnit.id) : [];
  const filteredUnits = units.filter((unit) => {
    const query = unitSearch.trim().toLowerCase();
    if (!query) return true;
    return [unit.number, unit.status, unit.notes, ...unitTenants.filter((tenant) => tenant.unitId === unit.id).map((tenant) => tenant.name)]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  function toDatabaseUnitStatus(status: Unit["status"]) {
    if (status === "Occupied") {
      return "occupied";
    }

    if (status === "Maintenance") {
      return "maintenance";
    }

    return "vacant";
  }

  function makeSourceUnitId(propertyId: string, unitNumber: string) {
    return `${propertyId}-${unitNumber.trim()}-${crypto.randomUUID()}`;
  }

  function updateDraft(field: keyof UnitDraft, value: string | string[]) {
    if (!selectedUnit) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [selectedUnit.id]: {
        ...unitToDraft(selectedUnit),
        ...current[selectedUnit.id],
        [field]: value
      } as UnitDraft
    }));
    setUnitSaved(false);
  }

  function updateTenantDraft(field: keyof TenantDraft, value: string) {
    if (!editingTenantId) {
      return;
    }

    setTenantDrafts((current) => ({
      ...current,
      [editingTenantId]: { ...blankTenantDraft, ...current[editingTenantId], [field]: value }
    }));
    setTenantSaved(false);
  }

  async function saveUnitChanges() {
    if (!selectedUnit || !activeDraft) {
      return;
    }

    setUnitSaving(true);
    setUnitError(null);
    setUnitSaved(false);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setUnitError("You need to be signed in to save unit details.");
      setUnitSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from("units").upsert(
      {
        source_unit_id: selectedUnit.id,
        property_id: property.id,
        owner_id: user.id,
        unit_number: activeDraft.number,
        unit_type: activeDraft.type.trim() || null,
        address: property.address,
        status: toDatabaseUnitStatus(activeDraft.status),
        notes: activeDraft.notes,
        lease_term: activeDraft.leaseTerm,
        lease_start: activeDraft.leaseStart || null,
        lease_end: activeDraft.leaseTerm === "Standard" ? activeDraft.leaseEnd || null : null,
        rent_amount: activeDraft.rentAmount ? Number(activeDraft.rentAmount) : null,
        rent_due_day: activeDraft.rentDueDay ? Number(activeDraft.rentDueDay) : null,
        utilities: activeDraft.utilities.includes("Water") ? activeDraft.utilities : [...activeDraft.utilities, "Water"]
      },
      {
        onConflict: "source_unit_id"
      }
    );

    setUnitSaving(false);

    if (saveError) {
      setUnitError(saveError.message);
      return;
    }

    const updatedUnit: Unit = {
      ...selectedUnit,
      number: activeDraft.number,
      status: activeDraft.status,
      notes: activeDraft.notes,
      type: activeDraft.type,
      leaseTerm: activeDraft.leaseTerm,
      leaseStart: activeDraft.leaseStart,
      leaseEnd: activeDraft.leaseTerm === "Standard" ? activeDraft.leaseEnd : "",
      rentAmount: activeDraft.rentAmount ? Number(activeDraft.rentAmount) : null,
      rentDueDay: activeDraft.rentDueDay ? Number(activeDraft.rentDueDay) : null,
      utilities: activeDraft.utilities.includes("Water") ? activeDraft.utilities : [...activeDraft.utilities, "Water"]
    };
    setUnits((current) => current.map((unit) => unit.id === selectedUnit.id ? updatedUnit : unit));
    setSelectedUnit(updatedUnit);
    setUnitSaved(true);
  }

  async function addUnit() {
    const unitNumber = newUnitDraft.number.trim();

    if (!unitNumber) {
      setAddUnitError("Unit number is required.");
      return;
    }

    setAddUnitSaving(true);
    setAddUnitError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setAddUnitError("You need to be signed in to add units.");
      setAddUnitSaving(false);
      return;
    }

    const sourceUnitId = makeSourceUnitId(property.id, unitNumber);

    const { error: saveError } = await supabase.from("units").insert({
      source_unit_id: sourceUnitId,
      property_id: property.id,
      owner_id: user.id,
      unit_number: unitNumber,
      unit_type: newUnitDraft.type.trim() || null,
      address: property.address,
      status: toDatabaseUnitStatus(newUnitDraft.status),
      notes: newUnitDraft.notes,
      lease_term: "Standard",
      lease_start: null,
      lease_end: null,
      rent_amount: null,
      rent_due_day: null,
      utilities: ["Water"]
    });

    setAddUnitSaving(false);

    if (saveError) {
      setAddUnitError(saveError.message);
      return;
    }

    setNewUnitDraft({ number: "", status: "Vacant", notes: "", type: "" });
    window.location.reload();
  }

  async function deleteUnit() {
    if (!selectedUnit) {
      return;
    }

    setUnitSaving(true);
    setUnitError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setUnitError("You need to be signed in to delete units.");
      setUnitSaving(false);
      return;
    }

    const unitNumber = activeDraft?.number ?? selectedUnit.number;
    const { data: savedUnit, error: lookupError } = await supabase
      .from("units")
      .select("source_unit_id, unit_number")
      .eq("property_id", property.id)
      .eq("unit_number", unitNumber)
      .maybeSingle();

    if (lookupError) {
      setUnitError(lookupError.message);
      setUnitSaving(false);
      return;
    }

    const resolvedUnitId = savedUnit?.source_unit_id ?? selectedUnit.id;

    const { error: tenantDeleteError } = await supabase
      .from("tenants")
      .delete()
      .eq("property_slug", property.id)
      .in("unit_id", [selectedUnit.id, resolvedUnitId]);
    if (tenantDeleteError) {
      setUnitError(tenantDeleteError.message);
      setUnitSaving(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("units")
      .delete()
      .eq("property_id", property.id)
      .eq("unit_number", unitNumber);

    setUnitSaving(false);

    if (deleteError) {
      setUnitError(deleteError.message);
      return;
    }

    setSelectedUnit(null);
    window.location.reload();
  }

  async function saveTenantChanges() {
    const activeTenantDraft = editingTenantId ? tenantDrafts[editingTenantId] ?? null : null;
    if (!selectedUnit || !editingTenantId || !activeTenantDraft) {
      return;
    }

    setTenantSaving(true);
    setTenantError(null);
    setTenantSaved(false);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setTenantError("You need to be signed in to save tenant details.");
      setTenantSaving(false);
      return;
    }

    const tenantRecord = {
        unit_id: selectedUnit.id,
        property_slug: property.id,
        owner_id: user.id,
        name: activeTenantDraft.name,
        phone: activeTenantDraft.phone || null,
        email: activeTenantDraft.email || null,
        lease_start: activeTenantDraft.leaseStart || null,
        lease_end: activeTenantDraft.leaseEnd || null,
        lease_file_name: activeTenantDraft.leaseFileName || null
      };
    const currentTenant = tenantsForSelectedUnit.find((tenant) => tenant.id === editingTenantId);
    const isNewTenant = editingTenantId.startsWith("new-") || !currentTenant || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(currentTenant.id);
    const tenantSave = isNewTenant
      ? await supabase.from("tenants").insert(tenantRecord).select("id").single()
      : await supabase.from("tenants").update(tenantRecord).eq("id", editingTenantId).select("id").single();

    setTenantSaving(false);

    if (tenantSave.error || !tenantSave.data) {
      setTenantError(tenantSave.error?.message ?? "Tenant details could not be saved.");
      return;
    }

    const savedTenant: Tenant = { id: String(tenantSave.data.id), propertyId: property.id, unitId: selectedUnit.id, ...activeTenantDraft };
    setUnitTenants((current) => isNewTenant
      ? [...current.filter((row) => row.id !== editingTenantId), savedTenant]
      : current.map((row) => row.id === editingTenantId ? savedTenant : row));
    setTenantDrafts((current) => ({ ...current, [savedTenant.id]: activeTenantDraft }));
    if (isNewTenant) setEditingTenantId(savedTenant.id);
    setTenantSaved(true);
    setTenantDeleted(false);
    setEditingTenantId(null);
  }

  async function deleteTenant(tenant: Tenant) {
    setDeletingTenantId(tenant.id);
    setTenantError(null);
    setTenantSaved(false);

    if (/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(tenant.id)) {
      const { data, error } = await supabase
        .from("tenants")
        .delete()
        .eq("id", tenant.id)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        setTenantError(error?.message ?? "Tenant could not be deleted.");
        setDeletingTenantId(null);
        return;
      }
    }

    setUnitTenants((current) => current.filter((row) => row.id !== tenant.id));
    setTenantDrafts((current) => {
      const next = { ...current };
      delete next[tenant.id];
      return next;
    });
    setConfirmDeleteTenantId(null);
    setTenantDeleted(true);
    setEditingTenantId((current) => current === tenant.id ? null : current);
    setDeletingTenantId(null);
  }

  function cancelTenantEdit(tenantId: string) {
    setEditingTenantId(null);
    setConfirmDeleteTenantId(null);
    setTenantDrafts((current) => {
      const next = { ...current };
      delete next[tenantId];
      return next;
    });
    setTenantError(null);
    setTenantSaved(false);
  }

  function renderTenantEditor(tenantId: string, heading: string) {
    const draft = tenantDrafts[tenantId];
    const existingTenant = tenantsForSelectedUnit.find((tenant) => tenant.id === tenantId);
    if (!draft) return null;

    return (
      <article key={tenantId} className="unit-tenant-card tenant-card-editing">
        <h4>{heading}</h4>
        <div className="form-grid tenant-editor-fields">
          <label><span>Name</span><input value={draft.name} onChange={(event) => updateTenantDraft("name", event.target.value)} /></label>
          <label><span>Phone</span><input value={draft.phone} onChange={(event) => updateTenantDraft("phone", event.target.value)} /></label>
          <label><span>Email</span><input type="email" value={draft.email} onChange={(event) => updateTenantDraft("email", event.target.value)} /></label>
        </div>
        {tenantError ? <p className="form-message" role="alert">{tenantError}</p> : null}
        {existingTenant && confirmDeleteTenantId === tenantId ? <div className="tenant-delete-prompt"><span>Delete this tenant? This cannot be undone.</span><button type="button" className="ghost-button" onClick={() => setConfirmDeleteTenantId(null)} disabled={deletingTenantId === tenantId}>Keep tenant</button><button type="button" className="primary-button danger-action" onClick={() => deleteTenant(existingTenant)} disabled={deletingTenantId === tenantId}>{deletingTenantId === tenantId ? "Deleting..." : "Confirm delete"}</button></div> : null}
        <div className="tenant-edit-actions">
          {existingTenant ? <button type="button" className="primary-button danger-action" onClick={() => { setConfirmDeleteTenantId(tenantId); setTenantError(null); }} disabled={tenantSaving || deletingTenantId !== null}>Delete tenant</button> : null}
          <button type="button" className="ghost-button" onClick={() => cancelTenantEdit(tenantId)} disabled={tenantSaving || deletingTenantId === tenantId}>Cancel</button>
          <button type="button" className="primary-button" onClick={saveTenantChanges} disabled={tenantSaving || deletingTenantId === tenantId}>{tenantSaving ? "Saving..." : "Save tenant"}</button>
        </div>
      </article>
    );
  }

  return (
    <>
      <section className="panel">
        <div className="section-heading-with-edit"><p className="eyebrow">Units</p><button type="button" className="header-edit-button" onClick={() => { setEditingUnits((current) => !current); setIsAddingUnit(false); }} aria-label={editingUnits ? "Done editing units" : "Edit units"} title={editingUnits ? "Done editing units" : "Edit units"} aria-pressed={editingUnits}><Pencil size={17} /></button></div>
        <div className="unit-search-controls">
          <label className="search-field unit-search-field">
            <span>Search units</span>
            <div className="input-with-icon"><Search size={16} /><input value={unitSearch} onChange={(event) => setUnitSearch(event.target.value)} placeholder="Unit number, status, or tenant" /></div>
          </label>
        </div>
        {editingUnits ? <div className="unit-edit-toolbar"><span className="muted">Select a unit to edit its details.</span><button type="button" className="ghost-button" onClick={() => setIsAddingUnit((current) => !current)}>{isAddingUnit ? "Close add form" : "Add unit"}</button></div> : null}
        {isAddingUnit ? (
          <div className="modal-section">
            <p className="eyebrow">Add unit</p>
            <div className="form-grid">
              <label>
                <span>Unit number</span>
                <input value={newUnitDraft.number} onChange={(event) => setNewUnitDraft((current) => ({ ...current, number: event.target.value }))} />
              </label>
              <label>
                <span>Type</span>
                <input value={newUnitDraft.type} onChange={(event) => setNewUnitDraft((current) => ({ ...current, type: event.target.value }))} placeholder="e.g. 1 Bed 1 Bath" />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={newUnitDraft.status}
                  onChange={(event) => setNewUnitDraft((current) => ({ ...current, status: event.target.value as Unit["status"] }))}
                >
                  <option value="Occupied">O</option>
                  <option value="Vacant">V</option>
                  <option value="Maintenance">M</option>
                </select>
              </label>
              <label className="full">
                <span>Notes</span>
                <textarea
                  rows={4}
                  value={newUnitDraft.notes}
                  onChange={(event) => setNewUnitDraft((current) => ({ ...current, notes: event.target.value }))}
                />
              </label>
            </div>
            {addUnitError ? <p className="form-message">{addUnitError}</p> : null}
            <div className="modal-actions">
              <button type="button" className="primary-button" onClick={addUnit} disabled={addUnitSaving}>
                {addUnitSaving ? "Adding..." : "Create unit"}
              </button>
            </div>
          </div>
        ) : null}
        <div className="unit-grid">
          {filteredUnits.map((unit) => (
            <button key={unit.id} type="button" className="unit-card" onClick={() => setSelectedUnit(unit)}>
              {(() => {
                const unitTenantNames = unitTenants.filter((tenant) => tenant.unitId === unit.id).map((tenant) => tenant.name).filter(Boolean);
                const statusCode = unit.status === "Occupied" ? "O" : unit.status === "Vacant" ? "V" : "M";

                return (
                  <>
              <div className="unit-card-top">
                <strong>Unit {unit.number}{editingUnits ? <small className="unit-edit-hint">Edit</small> : null}</strong>
                <span className={`status-pill status-${unit.status.toLowerCase()}`} title={unit.status}>{statusCode}</span>
              </div>
              <p className="unit-card-note">{unitTenantNames.length ? unitTenantNames.join(", ") : "Vacant"}</p>
                  </>
                );
              })()}
            </button>
          ))}
        </div>
        {filteredUnits.length === 0 ? <p className="muted">{units.length ? "No units match your search." : "No units have been added yet."}</p> : null}
      </section>

      {selectedUnit ? (
        <div className="modal-backdrop" onClick={() => setSelectedUnit(null)} role="presentation">
          <div className="modal-panel unit-details-modal" role="dialog" aria-modal="true" aria-labelledby="unit-modal-title" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><div className="unit-modal-heading"><p className="eyebrow">Unit details</p>{!unitEditing ? <button type="button" className="header-edit-button" onClick={() => { setUnitEditing(true); setUnitSaved(false); setConfirmDeleteUnit(false); }} aria-label="Edit unit details" title="Edit unit details"><Pencil size={17} /></button> : null}</div><h3 id="unit-modal-title">Unit {activeUnit?.number ?? selectedUnit.number}</h3></div>
              <button type="button" className="icon-button" onClick={() => setSelectedUnit(null)} aria-label="Close unit details"><X size={18} /></button>
            </div>
            <div className="unit-detail-tabs" role="tablist" aria-label="Unit details pages">
              {([["unit", "Unit"], ["tenant", "Tenant"], ["lease", "Lease"]] as const).map(([tab, label]) => <button key={tab} type="button" role="tab" aria-selected={detailTab === tab} className={detailTab === tab ? "active" : ""} onClick={() => setDetailTab(tab)}>{label}</button>)}
            </div>

            {detailTab === "unit" ? <section className="unit-detail-page">
              <div className="modal-section-header"><h3>Unit</h3></div>
              <div className="detail-list">
                <div className="detail-row"><strong>Unit number</strong>{unitEditing ? <input value={activeDraft?.number ?? ""} onChange={(event) => updateDraft("number", event.target.value)} /> : <span>{activeUnit?.number}</span>}</div>
                <div className="detail-row"><strong>Type</strong>{unitEditing ? <input value={activeDraft?.type ?? ""} onChange={(event) => updateDraft("type", event.target.value)} placeholder="e.g. 1 Bed 1 Bath" /> : <span>{activeUnit?.type || "—"}</span>}</div>
                <div className="detail-row"><strong>Status</strong>{unitEditing ? <select aria-label="Unit status" value={activeDraft?.status ?? "Vacant"} onChange={(event) => updateDraft("status", event.target.value)}><option value="Occupied">O</option><option value="Vacant">V</option><option value="Maintenance">M</option></select> : <span className="unit-status-code" title={activeUnit?.status}>{activeUnit ? (activeUnit.status === "Occupied" ? "O" : activeUnit.status === "Vacant" ? "V" : "M") : "V"}</span>}</div>
                <div className="detail-row"><strong>Property</strong><span>{property.name}</span></div>
                <div className="detail-row"><strong>Location</strong><span>{[property.address, property.city, property.region].filter(Boolean).join(", ") || "—"}</span></div>
                {unitEditing ? <div className="detail-row unit-notes-row"><strong>Notes</strong><textarea rows={3} value={activeDraft?.notes ?? ""} onChange={(event) => updateDraft("notes", event.target.value)} /></div> : activeUnit?.notes ? <div className="detail-row"><strong>Notes</strong><span>{activeUnit.notes}</span></div> : null}
              </div>
              {unitError ? <p className="form-message" role="alert">{unitError}</p> : null}
              {unitSaved ? <div className="save-confirmation-card" role="status"><CheckCircle2 size={19} /><span>Unit details saved successfully.</span></div> : null}
              {unitEditing ? <div className="unit-tab-actions"><button type="button" className="ghost-button" onClick={() => { setDrafts((current) => ({ ...current, [selectedUnit.id]: unitToDraft(selectedUnit) })); setUnitEditing(false); setConfirmDeleteUnit(false); setUnitSaved(false); }}>Cancel</button><div className="unit-save-row"><button type="button" className="primary-button unit-save-button" onClick={saveUnitChanges} disabled={unitSaving}>{unitSaving ? "Saving..." : unitSaved ? "Saved!" : "Save unit"}</button>{confirmDeleteUnit ? <div className="unit-delete-confirm"><p>Delete this unit? This action cannot be undone.</p><div className="modal-actions"><button type="button" className="ghost-button" onClick={() => setConfirmDeleteUnit(false)} disabled={unitSaving}>Keep unit</button><button type="button" className="primary-button danger-action" onClick={deleteUnit} disabled={unitSaving}>{unitSaving ? "Deleting..." : "Confirm delete"}</button></div></div> : <button type="button" className="unit-delete-icon" onClick={() => setConfirmDeleteUnit(true)} disabled={unitSaving} aria-label="Delete unit" title="Delete unit"><X size={19} /></button>}</div></div> : null}
            </section> : null}

            {detailTab === "tenant" ? <section className="unit-detail-page">
              <div className="modal-section-header"><h3>Tenant</h3><button type="button" className="primary-button" disabled={Boolean(editingTenantId)} onClick={() => { const draftId = "new-" + crypto.randomUUID(); setTenantDrafts((current) => ({ ...current, [draftId]: { ...blankTenantDraft } })); setEditingTenantId(draftId); setTenantSaved(false); setTenantDeleted(false); setTenantError(null); }}><Plus size={16} /> Add tenant</button></div>
              {tenantSaved ? <div className="save-confirmation-card" role="status"><CheckCircle2 size={19} /><span>Tenant information saved successfully.</span></div> : null}
              {tenantDeleted ? <div className="save-confirmation-card" role="status"><CheckCircle2 size={19} /><span>Tenant deleted successfully.</span></div> : null}
              {tenantError && !editingTenantId ? <p className="form-message" role="alert">{tenantError}</p> : null}
              {tenantsForSelectedUnit.length || editingTenantId?.startsWith("new-") ? <div className="unit-tenant-list">
                {tenantsForSelectedUnit.map((row) => editingTenantId === row.id ? renderTenantEditor(row.id, row.name || "Edit tenant") : <article key={row.id} className="unit-tenant-card"><div className="tenant-card-fields"><span className="tenant-name-field"><span>{row.name || "Unnamed tenant"}</span><button type="button" className="header-edit-button" disabled={Boolean(editingTenantId)} onClick={() => { setTenantDrafts((current) => ({ ...current, [row.id]: { name: row.name, phone: row.phone, email: row.email, leaseStart: row.leaseStart, leaseEnd: row.leaseEnd, leaseFileName: row.leaseFileName } })); setEditingTenantId(row.id); setTenantSaved(false); setTenantDeleted(false); setTenantError(null); setConfirmDeleteTenantId(null); }} aria-label={`Edit ${row.name || "tenant"}`} title="Edit tenant"><Pencil size={15} /></button></span><span>{row.phone || "—"}</span><span>{row.email || "—"}</span></div></article>)}
                {editingTenantId?.startsWith("new-") ? renderTenantEditor(editingTenantId, "New tenant") : null}
              </div> : <p className="muted">No tenants have been added to this unit.</p>}
            </section> : null}

            {detailTab === "lease" ? <section className="unit-detail-page">
              <div className="modal-section-header"><h3>Lease</h3></div>
              <div className="form-grid">
                <label><span>Term</span>{unitEditing ? <select value={activeDraft?.leaseTerm ?? "Standard"} onChange={(event) => updateDraft("leaseTerm", event.target.value)}><option value="Standard">Standard</option><option value="Monthly">Monthly</option></select> : <input readOnly value={activeUnit?.leaseTerm ?? "Standard"} />}</label>
                <label><span>Start date</span>{unitEditing ? <input type="date" value={activeDraft?.leaseStart ?? ""} onChange={(event) => updateDraft("leaseStart", event.target.value)} /> : <input readOnly value={activeUnit?.leaseStart ?? ""} />}</label>
                {(activeDraft?.leaseTerm ?? activeUnit?.leaseTerm ?? "Standard") === "Standard" ? <label><span>End date</span>{unitEditing ? <input type="date" value={activeDraft?.leaseEnd ?? ""} onChange={(event) => updateDraft("leaseEnd", event.target.value)} /> : <input readOnly value={activeUnit?.leaseEnd ?? ""} />}</label> : null}
                <label><span>Rent amount</span>{unitEditing ? <input type="number" min="0" step="0.01" value={activeDraft?.rentAmount ?? ""} onChange={(event) => updateDraft("rentAmount", event.target.value)} placeholder="0.00" /> : <input readOnly value={activeUnit?.rentAmount == null || activeUnit.rentAmount === "" ? "" : "$" + Number(activeUnit.rentAmount).toFixed(2)} />}</label>
                <label><span>Due date (day of month)</span>{unitEditing ? <input type="number" min="1" max="31" step="1" value={activeDraft?.rentDueDay ?? ""} onChange={(event) => updateDraft("rentDueDay", event.target.value)} placeholder="1–31" /> : <input readOnly value={activeUnit?.rentDueDay ?? ""} />}</label>
                <fieldset className="full unit-utilities"><legend>Utilities</legend>{(["Power", "Internet", "Water"] as const).map((utility) => { const checked = utility === "Water" || (activeDraft?.utilities ?? activeUnit?.utilities ?? ["Water"]).includes(utility); return <label key={utility}><input type="checkbox" checked={checked} disabled={!unitEditing || utility === "Water"} onChange={(event) => { const selected = activeDraft?.utilities ?? activeUnit?.utilities ?? ["Water"]; const next = event.target.checked ? [...selected, utility] : selected.filter((item) => item !== utility); updateDraft("utilities", next.includes("Water") ? next : [...next, "Water"]); }} /><span>{utility}</span></label>; })}</fieldset>
              </div>
              {unitError ? <p className="form-message" role="alert">{unitError}</p> : null}
              {unitSaved ? <div className="save-confirmation-card" role="status"><CheckCircle2 size={19} /><span>Lease details saved successfully.</span></div> : null}
              {unitEditing ? <div className="unit-tab-actions"><button type="button" className="ghost-button" onClick={() => { setDrafts((current) => ({ ...current, [selectedUnit.id]: unitToDraft(selectedUnit) })); setUnitEditing(false); setUnitSaved(false); }}>Cancel</button><button type="button" className="primary-button unit-save-button" onClick={saveUnitChanges} disabled={unitSaving}>{unitSaving ? "Saving..." : unitSaved ? "Saved!" : "Save unit"}</button></div> : null}
            </section> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
