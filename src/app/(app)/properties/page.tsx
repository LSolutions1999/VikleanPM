import Link from "next/link";
import { Sparkles } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PropertyDirectory } from "@/components/PropertyDirectory";
import { StatGrid } from "@/components/StatGrid";
import { getVisibleProperties } from "@/lib/mock-data";
import { requireSession } from "@/lib/session";

export default async function PropertiesPage() {
  const session = await requireSession();
  const properties = getVisibleProperties(session.role);
  const totalUnits = properties.reduce((sum, property) => sum + property.units.length, 0);
  const occupiedUnits = properties.reduce(
    (sum, property) => sum + property.units.filter((unit) => unit.status === "Occupied").length,
    0
  );
  const maintenanceUnits = properties.reduce(
    (sum, property) => sum + property.units.filter((unit) => unit.status === "Maintenance").length,
    0
  );

  return (
    <div className="content-stack">
      <PageHeader
        eyebrow="Dashboard"
        title="Properties"
        description="Track every asset, unit, tenant, and document from a single dashboard."
        action={
          <Link className="primary-button" href="/tasks">
            <Sparkles size={16} />
            Open tasks
          </Link>
        }
      />

      <StatGrid
        items={[
          { label: "Properties", value: String(properties.length), hint: "Active buildings in your portfolio" },
          { label: "Units", value: String(totalUnits), hint: "Residential and mixed-use spaces" },
          { label: "Occupied", value: String(occupiedUnits), hint: "Units currently leased" },
          { label: "Maintenance", value: String(maintenanceUnits), hint: "Units under repair or inspection" }
        ]}
      />

      <PropertyDirectory properties={properties} role={session.role} />
    </div>
  );
}
