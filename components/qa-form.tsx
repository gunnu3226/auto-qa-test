"use client";

import { useState } from "react";

export default function QaForm({ onSubmit }: { onSubmit: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      if (res.ok) {
        setTitle("");
        setDescription("");
        onSubmit();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="qa-form" onSubmit={handleSubmit}>
      <h2>QA 요청 등록</h2>
      <div className="form-field">
        <label htmlFor="title">제목</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 버튼 색상을 파란색으로 변경해주세요"
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="description">상세 설명</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="어떤 부분을 어떻게 수정해야 하는지 구체적으로 설명해주세요."
          rows={4}
          required
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "등록 중..." : "QA 요청 등록"}
      </button>
    </form>
  );
}
