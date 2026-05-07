export type UserStatus = "active" | "archived";

export type UserRecord = {
  id: string;
  userId: string;
  status: UserStatus;
  permission: string;
  name: string;
  email: string;
  createdAt: string;
};
