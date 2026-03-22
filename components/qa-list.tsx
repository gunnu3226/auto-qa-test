"use client";

import { QaRequest } from "@/lib/types";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "대기중", className: "status-pending" },
  in_progress: { label: "처리중", className: "status-progress" },
  done: { label: "완료", className: "status-done" },
  failed: { label: "실패", className: "status-failed" },
};

export default function QaList({ requests }: { requests: QaRequest[] }) {
  if (requests.length === 0) {
    return <p className="empty-message">등록된 QA 요청이 없습니다.</p>;
  }

  return (
    <div className="qa-list">
      <h2>QA 요청 목록</h2>
      {requests
        .slice()
        .map((req) => {
          const status = STATUS_LABELS[req.status] ?? STATUS_LABELS.pending;
          return (
            <div key={req.id} className="qa-item">
              <div className="qa-item-header">
                <h3>#{req.id} {req.title}</h3>
                <span className={`status-badge ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="qa-item-desc">{req.description}</p>
              <div className="qa-item-meta">
                <span>{new Date(req.createdAt).toLocaleString("ko-KR")}</span>
              </div>
            </div>
          );
        })}
    </div>
  );
}
