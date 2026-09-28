import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getPropertyById } from "@/lib/mock-data";
import { requireSession } from "@/lib/session";
import { PropertyUnitExplorer } from "@/components/PropertyUnitExplorer";
import { PropertyLocationEditor } from "@/components/PropertyLocationEditor";
import { getPropertyForDisplay } from "@/lib/supabase/properties";

export default async function PropertyDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  await requireSession();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const property = (await getPropertyForDisplay(id)) ?? getPropertyById(id);

  if (!property) {
    notFound();
  }

  const fullAddress = [property.address, property.city, property.region].filter(Boolean).join(", ") || "—";

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow={property.name}
        eyebrowClassName="property-name-eyebrow"
        eyebrowAction={<PropertyLocationEditor property={property} propertySlug={id} initialEditing={query.edit === "true"} />}
        title={<div className="property-page-title"><span><strong>Owner</strong> {property.propertyOwner || "—"}</span><span><strong>Address</strong> {fullAddress}</span></div>}
        action={<Link className="ghost-button" href="/properties"><ArrowLeft size={16} />Back to properties</Link>}
      />

      <PropertyUnitExplorer property={property} />
    </div>
  );
}
