"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Property, Unit } from "@/lib/types";
import { formatDate } from "@/lib/format";

type PropertyUnitExplorerProps = {
  property: Property;
};

function getUnitTenant(property: Property, unit: Unit) {
  return property.tenants.find((tenant) => tenant.unitId === unit.id);
}

type UnitDraft = Pick<Unit, "number" | "status" | "notes">;

export function PropertyUnitExplorer({ property }: PropertyUnitExplorerProps) {
  const [units, setUnits] = useState(property.units);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [tenantView, setTenantView] = useState<"summary" | "contact" | "lease">("summary");
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({});

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
    }

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedUnit]);

  const activeDraft = selectedUnit ? drafts[selectedUnit.id] ?? null : null;
  const activeUnit = selectedUnit && activeDraft ? { ...selectedUnit, ...activeDraft } : selectedUnit;
  const tenant = activeUnit ? getUnitTenant(property, activeUnit) : null;

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

  function saveUnitChanges() {
    if (!selectedUnit || !activeDraft) {
      return;
    }

    setUnits((current) =>
      current.map((unit) => (unit.id === selectedUnit.id ? { ...unit, ...activeDraft } : unit))
    );
    setSelectedUnit((current) => (current ? { ...current, ...activeDraft } : current));
  }

  return (
    <>
      <section className="panel">
        <p className="eyebrow">Units</p>
        <h3>Tap a unit to view details</h3>
        <div className="unit-grid">
          {units.map((unit) => (
            <button key={unit.id} type="button" className="unit-card" onClick={() => setSelectedUnit(unit)}>
              <div className="unit-card-top">
                <strong>Unit {unit.number}</strong>
                <span className={`status-pill status-${unit.status.toLowerCase()}`}>{unit.status}</span>
              </div>
              <p className="unit-card-note">{unit.notes}</p>
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
                <strong>Notes</strong>
                <span>{activeUnit?.notes}</span>
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
              <div className="modal-actions">
                <button type="button" className="primary-button" onClick={saveUnitChanges}>
                  Save unit
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
                <p className="page-description">No tenant assigned to this unit.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
