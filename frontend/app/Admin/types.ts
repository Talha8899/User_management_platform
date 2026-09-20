// Shared data contracts used by the admin shell and its individual views.
export type UserRecord = {
  emp_id: number;
  name: string;
  address: string;
  email: string;
  role: string;
  is_active: boolean;
  last_seen_at: string | null;
};

export type UserActivity = {
  event_type: "login" | "logout";
  occurred_at: string;
};

// The three panels available from the admin sidebar.
export type AdminView = "dashboard" | "users" | "settings";
