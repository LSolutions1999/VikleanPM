export type UserRole = "admin" | "manager" | "maintenance";

export type PropertyStatus = "Active" | "Needs review" | "Vacant";
export type UnitStatus = "Occupied" | "Vacant" | "Maintenance";
export type DocumentCategory = "Inspections" | "Repairs" | "Maintenance";
export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Cancelled";
export type TaskProgressStatus = "To Do" | "In Progress" | "On Hold";
export type PaymentStatus = "Paid" | "Unpaid" | "Partial";

export type StaffProfile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Property = {
  id: string;
  name: string;
  address: string;
  city: string;
  region: string;
  status: PropertyStatus;
  propertyOwner?: string;
  units: Unit[];
  documents: DocumentRecord[];
  tenants: Tenant[];
  notes: string;
};

export type Unit = {
  id: string;
  propertyId: string;
  number: string;
  status: UnitStatus;
  notes: string;
  tenantId?: string;
};

export type Tenant = {
  id: string;
  propertyId: string;
  unitId: string;
  name: string;
  phone: string;
  email: string;
  leaseStart: string;
  leaseEnd: string;
  leaseFileName: string;
};

export type DocumentRecord = {
  id: string;
  propertyId: string;
  unitId?: string;
  category: DocumentCategory;
  fileName: string;
  uploadedAt: string;
  notes?: string;
  fileType: "pdf" | "image";
};

export type TaskUpdate = {
  id: string;
  note: string;
  createdAt: string;
};

export type TaskAttachment = {
  id: string;
  fileName: string;
  fileType: "pdf" | "image";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: TaskStatus;
  assignedTo: string;
  createdAt: string;
  notes: TaskUpdate[];
  attachments: TaskAttachment[];
  createdBy?: string;
  progressStatus?: TaskProgressStatus;
  statusLog?: { user: string; status: TaskProgressStatus; timestamp: string }[];
  seenBy?: string[];
  completionDate?: string;
  cancellationDetails?: { reason: string; cancelledBy: string; timestamp: string };
};

export type SessionContext = {
  name: string;
  email: string;
  role: UserRole;
};
