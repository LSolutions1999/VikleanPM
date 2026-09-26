import { PageHeader } from "@/components/PageHeader";
import { PropertyDirectory } from "@/components/PropertyDirectory";
import { requireSession } from "@/lib/session";
import { getVisiblePropertiesForDisplay } from "@/lib/supabase/properties";

export default async function PropertiesPage() {
  const session = await requireSession();
  const properties = await getVisiblePropertiesForDisplay(session.role);

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Portfolio"
        title="Properties"
        description="Browse your properties, units, tenants, and documents."
      />

      <PropertyDirectory properties={properties} role={session.role} />
    </div>
  );
}
