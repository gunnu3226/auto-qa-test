import { NextRequest, NextResponse } from "next/server";
import { createIssue, getIssues } from "@/lib/github";

export async function GET() {
  try {
    const issues = await getIssues("all");
    const data = issues.map((issue) => {
      const labels = issue.labels.map((l) => l.name);
      let status: string = "pending";
      if (labels.includes("in-progress")) status = "in_progress";
      else if (issue.state === "closed" && labels.includes("done")) status = "done";
      else if (issue.state === "closed" && labels.includes("failed")) status = "failed";
      else if (issue.state === "closed") status = "done";

      return {
        id: String(issue.number),
        title: issue.title,
        description: issue.body ?? "",
        status,
        createdAt: issue.created_at,
        updatedAt: issue.updated_at,
      };
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { title, description } = body;

  if (!title || !description) {
    return NextResponse.json(
      { success: false, error: "title과 description은 필수입니다." },
      { status: 400 },
    );
  }

  try {
    const issue = await createIssue(title, description);
    return NextResponse.json(
      {
        success: true,
        data: {
          id: String(issue.number),
          title: issue.title,
          description: issue.body,
          status: "pending",
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 },
    );
  }
}
