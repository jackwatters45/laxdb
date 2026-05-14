export const formatCents = (c: number) =>
  `$${(c / 100).toFixed(2).replace(/\.00$/u, "")}`;

export const formatDate = (d: Date | string | number) =>
  new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status}: ${msg}`);
  }
  return res.json();
};

export type Me = {
  userId: string;
  userName: string;
  userEmail: string;
  activeOrganizationId: string | null;
  memberRole: "owner" | "admin" | "member" | null;
};

export type Member = {
  id: string;
  userId: string;
  role: string;
  name: string;
  email: string;
};

export type FineTemplate = {
  id: string;
  organizationId: string;
  label: string;
  amountCents: number;
  createdAt: string | number;
};

export type Fine = {
  id: string;
  organizationId: string;
  memberId: string;
  templateId: string | null;
  reason: string;
  originalAmountCents: number;
  amountCents: number;
  status: "unpaid" | "paid" | "forgiven";
  issuedAt: string | number;
  dueAt: string | number;
  paidAt: string | number | null;
  issuedByUserId: string | null;
};

export type FineEvent = {
  id: string;
  fineId: string;
  kind: "issued" | "paid" | "doubled" | "forgiven" | "adjusted";
  amountCents: number;
  deltaCents: number;
  actorUserId: string | null;
  note: string | null;
  at: string | number;
};

export type AuditEntry = { event: FineEvent; fine: Fine };

export const api = {
  listMembers: () => request<Member[]>("/api/members"),

  listTemplates: () => request<FineTemplate[]>("/api/fine-templates"),
  createTemplate: (input: { label: string; amountCents: number }) =>
    request<FineTemplate>("/api/fine-templates", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateTemplate: (
    id: string,
    patch: { label?: string; amountCents?: number },
  ) =>
    request<{ ok: true }>(`/api/fine-templates/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteTemplate: (id: string) =>
    request<{ ok: true }>(`/api/fine-templates/${id}`, { method: "DELETE" }),

  listFines: () => request<Fine[]>("/api/fines"),
  listMemberFines: (memberId: string) =>
    request<Fine[]>(`/api/members/${memberId}/fines`),
  issueFine: (input: {
    memberId: string;
    templateId?: string | null;
    reason?: string | null;
    amountCents?: number;
  }) =>
    request<Fine>("/api/fines", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  payFine: (id: string) =>
    request<Fine>(`/api/fines/${id}/pay`, { method: "POST", body: "{}" }),
  forgiveFine: (id: string, note?: string | null) =>
    request<Fine>(`/api/fines/${id}/forgive`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  adjustFine: (id: string, amountCents: number, note?: string | null) =>
    request<Fine>(`/api/fines/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify({ amountCents, note }),
    }),
  listFineEvents: (id: string) =>
    request<FineEvent[]>(`/api/fines/${id}/events`),

  listAudit: (limit = 100) =>
    request<AuditEntry[]>(`/api/audit?limit=${limit}`),
};
