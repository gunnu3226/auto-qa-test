"use client";

import { useCallback, useEffect, useState } from "react";
import QaForm from "@/components/qa-form";
import QaList from "@/components/qa-list";
import { QaRequest } from "@/lib/types";

export default function QaPage() {
  const [requests, setRequests] = useState<QaRequest[]>([]);

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/qa");
    const json = await res.json();
    if (json.success) setRequests(json.data);
  }, []);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  return (
    <div className="qa-page">
      <h1>QA 관리</h1>
      <QaForm onSubmit={fetchRequests} />
      <QaList requests={requests} />
    </div>
  );
}
