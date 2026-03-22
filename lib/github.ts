const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_REPO = process.env.GITHUB_REPO!; // "owner/repo" 형식

const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;

function headers() {
  return {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  };
}

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: { name: string }[];
  created_at: string;
  updated_at: string;
}

export async function createIssue(
  title: string,
  description: string,
): Promise<GitHubIssue> {
  const res = await fetch(`${API_BASE}/issues`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      title,
      body: description,
      labels: ["qa"],
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`GitHub Issue 생성 실패: ${res.status} ${error}`);
  }

  return res.json();
}

export async function getIssues(
  state: "open" | "closed" | "all" = "all",
): Promise<GitHubIssue[]> {
  const res = await fetch(
    `${API_BASE}/issues?labels=qa&state=${state}&sort=created&direction=desc&per_page=50`,
    { headers: headers(), next: { revalidate: 0 } },
  );

  if (!res.ok) {
    throw new Error(`GitHub Issue 조회 실패: ${res.status}`);
  }

  return res.json();
}

export async function closeIssue(
  issueNumber: number,
  comment?: string,
): Promise<void> {
  if (comment) {
    await fetch(`${API_BASE}/issues/${issueNumber}/comments`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ body: comment }),
    });
  }

  await fetch(`${API_BASE}/issues/${issueNumber}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ state: "closed" }),
  });
}

export async function addLabel(
  issueNumber: number,
  label: string,
): Promise<void> {
  await fetch(`${API_BASE}/issues/${issueNumber}/labels`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ labels: [label] }),
  });
}

export async function removeLabel(
  issueNumber: number,
  label: string,
): Promise<void> {
  await fetch(`${API_BASE}/issues/${issueNumber}/labels/${label}`, {
    method: "DELETE",
    headers: headers(),
  });
}
