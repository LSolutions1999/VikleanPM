import type {
  DocumentRecord,
  Property,
  StaffProfile,
  Task,
  TaskPriority,
  TaskStatus,
  Unit,
  Tenant
} from "@/lib/types";

export const staff: StaffProfile[] = [
  { id: "u1", name: "Admin", email: "tyranpro557@gmail.com", role: "admin" },
  { id: "u2", name: "Marta Singh", email: "manager@vikleanpm.local", role: "manager" },
  { id: "u3", name: "Noah Bennett", email: "maintenance@vikleanpm.local", role: "maintenance" }
];

const tenants: Tenant[] = [
  {
    id: "t1",
    propertyId: "p1",
    unitId: "p1-u10",
    name: "Jordan Lee",
    phone: "(555) 010-1200",
    email: "jordan.lee@example.com",
    leaseStart: "2025-05-01",
    leaseEnd: "2026-04-30",
    leaseFileName: "lease-jordan-lee.pdf"
  },
  {
    id: "t2",
    propertyId: "p1",
    unitId: "p1-u12",
    name: "Priya Patel",
    phone: "(555) 010-1274",
    email: "priya.patel@example.com",
    leaseStart: "2025-08-15",
    leaseEnd: "2026-08-14",
    leaseFileName: "lease-priya-patel.pdf"
  },
  {
    id: "t3",
    propertyId: "p2",
    unitId: "p2-u2",
    name: "Asha Morgan",
    phone: "(555) 010-1307",
    email: "asha.morgan@example.com",
    leaseStart: "2025-09-01",
    leaseEnd: "2026-08-31",
    leaseFileName: "lease-asha-morgan.pdf"
  }
];

const documents: DocumentRecord[] = [
  {
    id: "d1",
    propertyId: "p1",
    category: "Inspections",
    fileName: "inspection-2026-q1.pdf",
    uploadedAt: "2026-02-18T09:00:00Z",
    notes: "Quarterly inspection - all common areas clean.",
    fileType: "pdf"
  },
  {
    id: "d2",
    propertyId: "p1",
    unitId: "p1-u1",
    category: "Repairs",
    fileName: "kitchen-faucet-repair.jpg",
    uploadedAt: "2026-06-02T14:10:00Z",
    notes: "Before/after photo of repaired leak.",
    fileType: "image"
  },
  {
    id: "d3",
    propertyId: "p2",
    category: "Maintenance",
    fileName: "boiler-service-report.pdf",
    uploadedAt: "2026-05-20T16:20:00Z",
    notes: "Annual boiler maintenance completed.",
    fileType: "pdf"
  }
];

const tasks: Task[] = [
  {
    id: "task-1",
    title: "Replace hallway light fixture",
    description: "Hallway on 2nd floor is flickering in the north stairwell.",
    dueDate: "2026-07-08",
    priority: 2,
    status: "Pending",
    propertyId: "p1",
    unitId: undefined,
    assignedTo: "Noah Bennett",
    createdAt: "2026-07-04T10:00:00Z",
    notes: [{ id: "n1", note: "Quoted parts from supplier.", createdAt: "2026-07-04T16:00:00Z" }],
    attachments: [{ id: "a1", fileName: "hallway-light.jpg", fileType: "image" }]
  },
  {
    id: "task-2",
    title: "Inspect Unit 3A for move-out",
    description: "Walk-through required before end of lease.",
    dueDate: "2026-07-10",
    priority: 3,
    status: "In Progress",
    propertyId: "p2",
    unitId: "p2-u3",
    assignedTo: "Marta Singh",
    createdAt: "2026-07-02T15:45:00Z",
    notes: [{ id: "n2", note: "Tenant confirmed access window.", createdAt: "2026-07-05T12:00:00Z" }],
    attachments: []
  },
  {
    id: "task-3",
    title: "Archive roof inspection notes",
    description: "Upload signed report and mark complete once filed.",
    dueDate: "2026-07-03",
    priority: 4,
    status: "Completed",
    propertyId: "p3",
    assignedTo: "Avery Cole",
    createdAt: "2026-06-29T13:30:00Z",
    notes: [{ id: "n3", note: "Signed copy stored in documents.", createdAt: "2026-07-03T11:15:00Z" }],
    attachments: [{ id: "a2", fileName: "roof-inspection-signed.pdf", fileType: "pdf" }]
  }
];

type PropertySeed = {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  status: Property["status"];
  notes: string;
  units: Unit[];
};

function buildUnits(
  propertyId: string,
  unitNumbers: number[],
  options?: {
    occupied?: number[];
    maintenance?: number[];
    tenantNotes?: Record<number, string>;
  }
) {
  const occupied = new Set(options?.occupied ?? []);
  const maintenance = new Set(options?.maintenance ?? []);
  const tenantNotes = options?.tenantNotes ?? {};

  return unitNumbers.map((number) => {
    const isOccupied = occupied.has(number);
    const isMaintenance = maintenance.has(number);
    const status: Unit["status"] = isMaintenance ? "Maintenance" : isOccupied ? "Occupied" : "Vacant";

    return {
      id: `${propertyId}-u${number}`,
      propertyId,
      number: String(number),
      status,
      notes:
        tenantNotes[number] ??
        (status === "Occupied"
          ? "Occupied unit."
          : status === "Maintenance"
            ? "Scheduled for maintenance review."
            : "Available for lease.")
    } as Unit;
  });
}

const propertiesBase: PropertySeed[] = [
  {
    id: "p1",
    name: "118 1st Ave / 122 1st Ave",
    address: "118 1st Ave / 122 1st Ave",
    city: "Regina",
    region: "SK",
    status: "Active",
    notes: "Mixed complex spanning two street addresses.",
    units: buildUnits(
      "p1",
      [10, 11, 12, 13, 14, 15, 16, 17, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 36, 37, 38],
      {
        occupied: [10, 12],
        maintenance: [24],
        tenantNotes: {
          10: "Occupied by Jordan Lee.",
          12: "Occupied by Priya Patel.",
          24: "Inspection scheduled."
        }
      }
    )
  },
  {
    id: "p2",
    name: "23 Bison St",
    address: "23 Bison St",
    city: "Regina",
    region: "SK",
    status: "Needs review",
    notes: "Building under review after recent maintenance activity.",
    units: buildUnits(
      "p2",
      [1, 2, 3, 4, 5, 6, 7, 8, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34, 35, 36, 37, 38],
      {
        occupied: [2],
        maintenance: [3],
        tenantNotes: {
          2: "Occupied by Asha Morgan.",
          3: "Repairs in progress."
        }
      }
    )
  },
  {
    id: "p3",
    name: "23 Bison St",
    address: "23 Bison St",
    city: "Regina",
    region: "SK",
    status: "Active",
    notes: "Secondary Bison Street building.",
    units: buildUnits("p3", [1, 2, 3, 4, 5, 6, 7, 8], {
      occupied: [1, 2],
      tenantNotes: {
        1: "Occupied unit.",
        2: "Occupied unit."
      }
    })
  },
  {
    id: "p4",
    name: "465 1st Ave",
    address: "465 1st Ave",
    city: "Regina",
    region: "SK",
    status: "Active",
    notes: "Mid-size building with a straightforward unit layout.",
    units: buildUnits("p4", [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18])
  },
  {
    id: "p5",
    name: "475 1st Ave",
    address: "475 1st Ave",
    city: "Regina",
    region: "SK",
    status: "Needs review",
    notes: "Larger building with numbered upper-floor units.",
    units: buildUnits("p5", [101, 102, 103, 104, 105, 106, 107, 108, 209, 210, 211, 212, 213, 214, 215, 216])
  },
  {
    id: "p6",
    name: "485 1st Ave",
    address: "485 1st Ave",
    city: "Regina",
    region: "SK",
    status: "Vacant",
    notes: "Large footprint with mostly open availability.",
    units: buildUnits("p6", Array.from({ length: 36 }, (_, index) => index + 1))
  }
];

export const properties: Property[] = propertiesBase.map((property) => {
  const propertyTenants = tenants.filter((tenant) => tenant.propertyId === property.id);
  const propertyDocuments = documents.filter((document) => document.propertyId === property.id);

  return {
    ...property,
    units: property.units,
    tenants: propertyTenants,
    documents: propertyDocuments
  };
});

export const taskStatuses: TaskStatus[] = ["Pending", "In Progress", "Completed"];
export const taskPriorities: TaskPriority[] = [1, 2, 3, 4, 5];
export const documentCategories = ["Inspections", "Repairs", "Maintenance"] as const;

export function getPropertyById(id: string) {
  return properties.find((property) => property.id === id);
}

export function getTaskById(id: string) {
  return tasks.find((task) => task.id === id);
}

export function getVisibleProperties(role: string) {
  if (role === "admin") {
    return properties;
  }

  if (role === "maintenance") {
    return properties.filter((property) =>
      tasks.some((task) => task.propertyId === property.id && task.assignedTo === "Noah Bennett")
    );
  }

  return properties;
}

export function getVisibleTasks(role: string) {
  if (role === "admin") {
    return tasks;
  }

  if (role === "maintenance") {
    return tasks.filter((task) => task.assignedTo === "Noah Bennett");
  }

  return tasks;
}
