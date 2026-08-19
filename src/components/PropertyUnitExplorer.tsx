"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Property, Unit } from "@/lib/types";
import { formatDate } from "@/lib/format";

type PropertyUnitExplorerProps = {
  property: Property;
};

function getUnitTenant(property: Property, unit: Unit) {
  return property.tenants.find((tenant) => tenant.unitId === unit.id);
}

type UnitDraft = Pick<Unit, "number" | "status" | "notes">;
type TenantDraft = {
  name: string;
  phone: string;
  email: string;
  leaseStart: string;
  leaseEnd: string;
  leaseFileName: string;
};

export function PropertyUnitExplorer({ property }: PropertyUnitExplorerProps) {
  const supabase = createClient();
  const [units, setUnits] = useState(property.units);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [tenantView, setTenantView] = useState<"summary" | "contact" | "lease">("summary");
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({});
  const [tenantDrafts, setTenantDrafts] = useState<Record<string, TenantDraft>>({});
  const [unitSaving, setUnitSaving] = useState(false);
  const [unitError, setUnitError] = useState<string | null>(null);
  const [tenantSaving, setTenantSaving] = useState(false);
  const [tenantError, setTenantError] = useState<string | null>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedUnit(null);
      }
    }

    if (selectedUnit) {
      window.addEventListener("keydown", onKeyDown);
      setTenantView("summary");
      setDrafts((current) => ({
        ...current,
        [selectedUnit.id]: current[selectedUnit.id] ?? {
          number: selectedUnit.number,
          status: selectedUnit.status,
          notes: selectedUnit.notes
          }
        }));
      const selectedTenant = getUnitTenant(property, selectedUnit);

      setTenantDrafts((current) => ({
        ...current,
        [selectedUnit.id]:
          current[selectedUnit.id] ??
          (selectedTenant
            ? {
                name: selectedTenant.name,
                phone: selectedTenant.phone,
                email: selectedTenant.email,
                leaseStart: selectedTenant.leaseStart,
                leaseEnd: selectedTenant.leaseEnd,
                leaseFileName: selectedTenant.leaseFileName
              }
            : {
                name: "",
                phone: "",
                email: "",
                leaseStart: "",
                leaseEnd: "",
                leaseFileName: ""
              })
      }));
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUnit]);

  const activeDraft = selectedUnit ? drafts[selectedUnit.id] ?? null : null;
  const activeUnit = selectedUnit && activeDraft ? { ...selectedUnit, ...activeDraft } : selectedUnit;
  const tenant = activeUnit ? getUnitTenant(property, activeUnit) : null;
  const activeTenantDraft = selectedUnit ? tenantDrafts[selectedUnit.id] ?? null : null;

  function toDatabaseUnitStatus(status: Unit["status"]) {
    if (status === "Occupied") {
      return "occupied";
    }

    if (status === "Maintenance") {
      return "maintenance";
    }

    return "vacant";
  }

  function updateDraft(field: keyof UnitDraft, value: string) {
    if (!selectedUnit) {
      return;
    }

    setDrafts((current) => ({
      ...current,
      [selectedUnit.id]: {
        number: field === "number" ? value : current[selectedUnit.id]?.number ?? selectedUnit.number,
        status:
          field === "status"
            ? (value as UnitDraft["status"])
            : current[selectedUnit.id]?.status ?? selectedUnit.status,
        notes: field === "notes" ? value : current[selectedUnit.id]?.notes ?? selectedUnit.notes
      }
      }));
  }

  function updateTenantDraft(field: keyof TenantDraft, value: string) {
    if (!selectedUnit) {
      return;
    }

    setTenantDrafts((current) => ({
      ...current,
      [selectedUnit.id]: {
        name: field === "name" ? value : current[selectedUnit.id]?.name ?? tenant?.name ?? "",
        phone: field === "phone" ? value : current[selectedUnit.id]?.phone ?? tenant?.phone ?? "",
        email: field === "email" ? value : current[selectedUnit.id]?.email ?? tenant?.email ?? "",
        leaseStart:
          field === "leaseStart" ? value : current[selectedUnit.id]?.leaseStart ?? tenant?.leaseStart ?? "",
        leaseEnd: field === "leaseEnd" ? value : current[selectedUnit.id]?.leaseEnd ?? tenant?.leaseEnd ?? "",
        leaseFileName:
          field === "leaseFileName" ? value : current[selectedUnit.id]?.leaseFileName ?? tenant?.leaseFileName ?? ""
      }
    }));
  }

  async function saveUnitChanges() {
    if (!selectedUnit || !activeDraft) {
      return;
    }

    setUnitSaving(true);
    setUnitError(null);

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
        address: property.address,
        status: toDatabaseUnitStatus(activeDraft.status),
        notes: activeDraft.notes
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

    window.location.reload();
  }

  async function saveTenantChanges() {
    if (!selectedUnit || !activeTenantDraft) {
      return;
    }

    setTenantSaving(true);
    setTenantError(null);

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setTenantError("You need to be signed in to save tenant details.");
      setTenantSaving(false);
      return;
    }

    const { error: saveError } = await supabase.from("tenants").upsert(
      {
        unit_id: selectedUnit.id,
        property_slug: property.id,
        owner_id: user.id,
        name: activeTenantDraft.name,
        phone: activeTenantDraft.phone || null,
        email: activeTenantDraft.email || null,
        lease_start: activeTenantDraft.leaseStart || null,
        lease_end: activeTenantDraft.leaseEnd || null,
        lease_file_name: activeTenantDraft.leaseFileName || null
      },
      {
        onConflict: "unit_id"
      }
    );

    setTenantSaving(false);

    if (saveError) {
      setTenantError(saveError.message);
      return;
    }

    window.location.reload();
  }

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Units</p>
        <h3>Tap a unit to view details</h3>
        <div className="unit-grid">
          {units.map((unit) => (
            <button key={unit.id} type="button" className="unit-card" onClick={() => setSelectedUnit(unit)}>
              {(() => {
                const unitTenant = getUnitTenant(property, unit);

                return (
                  <>
              <div className="unit-card-top">
                <strong>Unit {unit.number}</strong>
                <span className={`status-pill status-${unit.status.toLowerCase()}`}>{unit.status}</span>
              </div>
              <p className="unit-card-note">{unitTenant ? unitTenant.name : "Vacant"}</p>
                  </>
                );
              })()}
            </button>
          ))}
        </div>
      </section>

      {selectedUnit ? (
        <div className="modal-backdrop" onClick={() => setSelectedUnit(null)} role="presentation">
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="unit-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="eyebrow">Unit details</p>
                <h3 id="unit-modal-title">Unit {activeUnit?.number ?? selectedUnit.number}</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setSelectedUnit(null)} aria-label="Close unit details">
                <X size={18} />
              </button>
            </div>

            <div className="detail-list">
              <div className="detail-row">
                <strong>Status</strong>
                <span>{activeUnit?.status}</span>
              </div>
              <div className="detail-row">
                <strong>Property</strong>
                <span>{property.name}</span>
              </div>
              <div className="detail-row">
                <strong>Location</strong>
                <span>
                  {property.address}, {property.city}, {property.region}
                </span>
              </div>
              <div className="detail-row">
                <strong>Tenant</strong>
                <span>{tenant?.name ?? "Vacant"}</span>
              </div>
            </div>

            <div className="modal-section">
              <p className="eyebrow">Edit unit info</p>
              <div className="form-grid">
                <label>
                  <span>Unit number</span>
                  <input value={activeUnit?.number ?? ""} onChange={(event) => updateDraft("number", event.target.value)} />
                </label>
                <label>
                  <span>Status</span>
                  <select value={activeUnit?.status ?? "Vacant"} onChange={(event) => updateDraft("status", event.target.value)}>
                    <option>Occupied</option>
                    <option>Vacant</option>
                    <option>Maintenance</option>
                  </select>
                </label>
                <label className="full">
                  <span>Notes</span>
                  <textarea
                    rows={4}
                    value={activeUnit?.notes ?? ""}
                    onChange={(event) => updateDraft("notes", event.target.value)}
                  />
                </label>
              </div>
              {unitError ? <p className="form-message">{unitError}</p> : null}
              <div className="modal-actions">
                <button type="button" className="primary-button" onClick={saveUnitChanges} disabled={unitSaving}>
                  {unitSaving ? "Saving..." : "Save unit"}
                </button>
              </div>
            </div>

            <div className="modal-section">
              <div className="modal-section-header">
                <p className="eyebrow">Tenant info</p>
                <label className="select-field modal-select">
                  <span>View</span>
                  <select value={tenantView} onChange={(event) => setTenantView(event.target.value as typeof tenantView)}>
                    <option value="summary">Summary</option>
                    <option value="contact">Contact</option>
                    <option value="lease">Lease</option>
                  </select>
                </label>
              </div>

              {tenant ? (
                <div className="detail-list">
                  {tenantView === "summary" ? (
                    <>
                      <div className="detail-row">
                        <strong>Name</strong>
                        <span>{tenant.name}</span>
                      </div>
                      <div className="detail-row">
                        <strong>Unit</strong>
                        <span>Unit {activeUnit?.number}</span>
                      </div>
                    </>
                  ) : null}

                  {tenantView === "contact" ? (
                    <>
                      <div className="detail-row">
                        <strong>Phone</strong>
                        <span>{tenant.phone}</span>
                      </div>
                      <div className="detail-row">
                        <strong>Email</strong>
                        <span>{tenant.email}</span>
                      </div>
                    </>
                  ) : null}

                  {tenantView === "lease" ? (
                    <>
                      <div className="detail-row">
                        <strong>Lease</strong>
                        <span>
                          {formatDate(tenant.leaseStart)} to {formatDate(tenant.leaseEnd)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <strong>Lease file</strong>
                        <span>{tenant.leaseFileName}</span>
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                <p className="page-description">No tenant assigned to this unit yet.</p>
              )}

              <div className="modal-section">
                <p className="eyebrow">{tenant ? "Edit tenant info" : "Add tenant info"}</p>
                <div className="form-grid">
                  <label className="full">
                    <span>Name</span>
                    <input
                      value={activeTenantDraft?.name ?? ""}
                      onChange={(event) => updateTenantDraft("name", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input
                      value={activeTenantDraft?.phone ?? ""}
                      onChange={(event) => updateTenantDraft("phone", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Email</span>
                    <input
                      value={activeTenantDraft?.email ?? ""}
                      onChange={(event) => updateTenantDraft("email", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Lease start</span>
                    <input
                      type="date"
                      value={activeTenantDraft?.leaseStart ?? ""}
                      onChange={(event) => updateTenantDraft("leaseStart", event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Lease end</span>
                    <input
                      type="date"
                      value={activeTenantDraft?.leaseEnd ?? ""}
                      onChange={(event) => updateTenantDraft("leaseEnd", event.target.value)}
                    />
                  </label>
                  <label className="full">
                    <span>Lease file name</span>
                    <input
                      value={activeTenantDraft?.leaseFileName ?? ""}
                      onChange={(event) => updateTenantDraft("leaseFileName", event.target.value)}
                    />
                  </label>
                </div>

                {tenantError ? <p className="form-message">{tenantError}</p> : null}

                <div className="modal-actions">
                  <button type="button" className="primary-button" onClick={saveTenantChanges} disabled={tenantSaving}>
                    {tenantSaving ? "Saving..." : "Save tenant info"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
