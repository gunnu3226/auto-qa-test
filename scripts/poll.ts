import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const PROJECT_ROOT = path.resolve(__dirname, "..");

// .env.local 수동 로드
const envPath = path.join(PROJECT_ROOT, ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex);
    const value = trimmed.slice(eqIndex + 1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const POLL_INTERVAL = 10000; // 10초

// 환경변수
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO; // "owner/repo"

if (!GITHUB_TOKEN || !GITHUB_REPO) {
  console.error("GITHUB_TOKEN과 GITHUB_REPO 환경변수를 설정해주세요.");
  console.error("예: GITHUB_TOKEN=ghp_xxx GITHUB_REPO=owner/repo npm run poll");
  process.exit(1);
}

const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}`;
const headers = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
};

// 처리 중이거나 처리 완료한 이슈 번호를 로컬에서 추적
const processedIssues = new Set<number>();

function log(message: string) {
  const time = new Date().toLocaleTimeString("ko-KR");
  console.log(`[${time}] ${message}`);
}

function run(cmd: string): string {
  log(`> ${cmd}`);
  return execSync(cmd, { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 300000 });
}

function gitSync() {
  try {
    run("git stash --include-untracked");
  } catch {
    // stash할 게 없으면 무시
  }
  try {
    run("git checkout main");
    run("git pull origin main --rebase");
  } catch {
    log("git sync 실패 - 계속 진행합니다.");
  }
}

function githubApi(
  endpoint: string,
  method: string = "GET",
  body?: object,
): any {
  const url = `${API_BASE}${endpoint}`;
  const args = [
    "curl", "-s", "-X", method,
    "-H", `Authorization: Bearer ${GITHUB_TOKEN}`,
    "-H", "Accept: application/vnd.github+json",
    "-H", "Content-Type: application/json",
  ];
  if (body) {
    args.push("-d", JSON.stringify(body));
  }
  args.push(url);

  const result = execSync(args.map((a) => `'${a.replace(/'/g, "'\\''")}'`).join(" "), {
    encoding: "utf-8",
    timeout: 30000,
  });

  if (method === "DELETE") return null;
  try {
    const parsed = JSON.parse(result);
    if (parsed.message) {
      throw new Error(`GitHub API 에러: ${parsed.message}`);
    }
    return parsed;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`GitHub API 응답 파싱 실패: ${result.slice(0, 200)}`);
    }
    throw e;
  }
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  labels: { name: string }[];
}

function getPendingIssues(): GitHubIssue[] {
  const issues = githubApi("/issues?labels=qa&state=open&sort=created&direction=asc&per_page=10");
  return issues.filter(
    (issue: GitHubIssue) =>
      !issue.labels.some((l) => l.name === "in-progress" || l.name === "done" || l.name === "failed") &&
      !processedIssues.has(issue.number),
  );
}

function addLabel(issueNumber: number, label: string) {
  try {
    githubApi(`/issues/${issueNumber}/labels`, "POST", { labels: [label] });
  } catch (e) {
    log(`라벨 추가 실패 (${label}): ${e}`);
  }
}

function removeLabel(issueNumber: number, label: string) {
  try {
    githubApi(`/issues/${issueNumber}/labels/${label}`, "DELETE");
  } catch {
    // 라벨이 없으면 무시
  }
}

function addComment(issueNumber: number, comment: string) {
  try {
    githubApi(`/issues/${issueNumber}/comments`, "POST", { body: comment });
  } catch (e) {
    log(`코멘트 추가 실패: ${e}`);
  }
}

function createPullRequest(
  branchName: string,
  title: string,
  body: string,
): { html_url: string; number: number } {
  log(`PR 생성 중... head: ${branchName}, base: main`);
  const result = githubApi("/pulls", "POST", {
    title,
    body,
    head: branchName,
    base: "main",
  });
  log(`PR 생성 완료: ${result.html_url}`);
  return result;
}

function processIssue(issue: GitHubIssue) {
  const branchName = `qa/issue-${issue.number}`;
  log(`=== QA 처리 시작: #${issue.number} ${issue.title} ===`);

  // 즉시 로컬 추적에 추가 (중복 처리 방지)
  processedIssues.add(issue.number);

  // 1. in-progress 라벨 추가
  addLabel(issue.number, "in-progress");

  // 2. main에서 새 브랜치 생성
  run("git checkout main");
  try {
    run(`git branch -D ${branchName}`);
  } catch {
    // 브랜치가 없으면 무시
  }
  try {
    run(`git push origin --delete ${branchName}`);
  } catch {
    // 원격 브랜치가 없으면 무시
  }
  run(`git checkout -b ${branchName}`);

  // 3. Claude Code CLI 실행
  const prompt = `다음 QA 요청을 처리해주세요. 이 프로젝트의 CLAUDE.md를 먼저 읽고 수정 가능한 파일만 수정하세요.

## QA 요청
제목: ${issue.title}
상세: ${issue.body ?? "없음"}

수정 후 빌드가 깨지지 않는지 확인해주세요.

작업이 끝나면 마지막에 반드시 아래 형식으로 요약을 출력해주세요:
---SUMMARY---
## 분석
(QA 요청을 어떻게 이해했는지)

## 수정 계획
(어떤 파일을 왜 수정했는지)

## 변경 내용
(구체적으로 무엇을 바꿨는지)
---END---`;

  try {
    const claudeOutput = run(
      `claude -p ${JSON.stringify(prompt)} --allowedTools Edit,Write,Read,Bash,Glob,Grep`,
    );
    log("Claude Code 실행 완료");

    // Claude 응답에서 요약 추출
    let summary = "";
    const summaryMatch = claudeOutput.match(/---SUMMARY---([\s\S]*?)---END---/);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else {
      summary = "Claude가 코드를 수정했습니다. (상세 요약 없음)";
    }

    // 4. 빌드 검증
    try {
      run("npm run build");
      log("빌드 성공");
    } catch {
      log("빌드 실패 - 변경 롤백");
      run("git checkout -- .");
      run("git checkout main");
      removeLabel(issue.number, "in-progress");
      addLabel(issue.number, "failed");
      addComment(issue.number, "빌드 실패로 변경사항이 롤백되었습니다.");
      return;
    }

    // 5. commit & push (브랜치로)
    run("git add -A");
    try {
      run(`git commit -m "fix: QA #${issue.number} ${issue.title}"`);
    } catch {
      log("변경사항 없음");
      run("git checkout main");
      removeLabel(issue.number, "in-progress");
      addComment(issue.number, "Claude가 분석했지만 코드 변경이 필요하지 않았습니다.");
      return;
    }

    run(`git push origin ${branchName}`);
    log("브랜치 push 완료");

    // 6. PR 생성
    const pr = createPullRequest(
      branchName,
      `fix: QA #${issue.number} ${issue.title}`,
      [
        `## QA 요청 (Issue #${issue.number})`,
        ``,
        `**제목**: ${issue.title}`,
        `**상세**: ${issue.body ?? "없음"}`,
        ``,
        `---`,
        ``,
        summary,
        ``,
        `---`,
        ``,
        `Claude Code가 자동으로 생성한 PR입니다.`,
        `close #${issue.number}`,
      ].join("\n"),
    );

    removeLabel(issue.number, "in-progress");
    addComment(
      issue.number,
      [
        `PR이 생성되었습니다: ${pr.html_url}`,
        ``,
        summary,
        ``,
        `review 후 merge하면 자동 배포됩니다.`,
      ].join("\n"),
    );

    // main으로 복귀
    run("git checkout main");

    log(`=== QA 처리 완료: #${issue.number} → PR ${pr.html_url} ===`);
  } catch (error) {
    log(`처리 실패: ${error}`);
    // 실패시 main으로 복귀
    try {
      run("git checkout -- .");
      run("git checkout main");
    } catch {
      // 무시
    }
    removeLabel(issue.number, "in-progress");
    addLabel(issue.number, "failed");
    addComment(
      issue.number,
      `처리 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

function sleep(ms: number) {
  execSync(`sleep ${ms / 1000}`);
}

function poll() {
  log("Polling 시작... (Ctrl+C로 종료)");
  log(`대상 repo: ${GITHUB_REPO}`);

  while (true) {
    try {
      gitSync();

      const pending = getPendingIssues();

      if (pending.length > 0) {
        log(`대기 중인 QA 요청 ${pending.length}건 발견`);
        processIssue(pending[0]);
      }
    } catch (error) {
      log(`Polling 에러: ${error}`);
    }

    sleep(POLL_INTERVAL);
  }
}

poll();
