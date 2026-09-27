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
        <PropertyLocationEditor property={property} propertySlug={id} initialEditing={query.edit === "true"} />
      </div>

      <PropertyUnitExplorer property={property} />
    </div>
  );
}
