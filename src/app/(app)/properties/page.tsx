import { PropertyDirectory } from "@/components/PropertyDirectory";
import { requireSession } from "@/lib/session";
import { getVisiblePropertiesForDisplay } from "@/lib/supabase/properties";

export default async function PropertiesPage() {
  const session = await requireSession();
  const properties = await getVisiblePropertiesForDisplay(session.role);

  return (
    <div className="content-stack">
      <PropertyDirectory properties={properties} />
    </div>
  );
}
