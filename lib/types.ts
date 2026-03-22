export type QaStatus = "pending" | "in_progress" | "done" | "failed";

export interface QaRequest {
  id: string;
  title: string;
  description: string;
  status: QaStatus;
  createdAt: string;
  updatedAt: string;
  result?: string;
  commitHash?: string;
}
