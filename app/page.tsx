import Link from "next/link";
import DemoSection from "@/components/demo-section";

export default function Home() {
  return (
    <main className="main">
      <h1>Auto QA Test</h1>
      <p className="subtitle">
        QA 요청을 등록하면 Claude Code가 자동으로 코드를 수정하고 배포합니다.
      </p>
      <nav className="nav-links">
        <Link href="/qa">QA 요청 페이지로 이동 →</Link>
      </nav>
      <DemoSection />
    </main>
  );
}
