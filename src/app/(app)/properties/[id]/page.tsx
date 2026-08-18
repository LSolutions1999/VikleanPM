import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getPropertyById } from "@/lib/mock-data";
import { requireSession } from "@/lib/session";
import { PropertyUnitExplorer } from "@/components/PropertyUnitExplorer";

export default async function PropertyDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const property = getPropertyById(id);

  if (!property) {
    notFound();
  }

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Property"
        title={property.name}
        action={
          <Link className="ghost-button" href="/properties">
            <ArrowLeft size={16} />
            Back to properties
          </Link>
        }
      />

      <div className="detail-grid">
        <article className="detail-card" style={{ gridColumn: "1 / -1" }}>
          <p className="eyebrow">Location</p>
          <h3>Site information</h3>
          <div className="detail-list">
            <div className="detail-row">
              <strong>Address</strong>
              <span>{property.address}</span>
            </div>
            <div className="detail-row">
              <strong>Total units</strong>
              <span>{property.units.length}</span>
            </div>
            <div className="detail-row">
              <strong>City / Region</strong>
              <span>
                {property.city}, {property.region}
              </span>
            </div>
            <div className="detail-row">
              <strong>Status</strong>
              <span>{property.status}</span>
            </div>
          </div>
        </article>
      </div>

      <PropertyUnitExplorer property={property} />
    </div>
  );
}
