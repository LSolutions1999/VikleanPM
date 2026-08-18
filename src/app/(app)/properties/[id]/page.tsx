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
  params
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const property = (await getPropertyForDisplay(id)) ?? getPropertyById(id);

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
        <PropertyLocationEditor property={property} propertySlug={id} />
      </div>

      <PropertyUnitExplorer property={property} />
    </div>
  );
}
