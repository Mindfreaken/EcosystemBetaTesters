import { Id } from "../../../_generated/dataModel";

export interface User {
  _id: Id<"users">;
  _creationTime: number;
  clerkUserId: string;
  username: string;
  displayName: string;
  email: string;
  dateOfBirth: string;
  role: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio?: string;
  customStatus?: string;
  joinNumber?: number;
  createdAt: string;
  updatedAt: string;
}
