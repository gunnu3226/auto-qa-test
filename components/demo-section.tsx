export default function DemoSection() {
  return (
    <section className="demo-section">
      <h2>Welcome to Auto QA Demo</h2>
      <p className="demo-description">
        이 섹션은 QA 요청에 따라 Claude Code가 자동으로 수정하는 영역입니다.
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>기능 (가)</h3>
          <p>첫 번째 기능에 대한 설명입니다.</p>
        </div>
        <div className="card">
          <h3>기능 두번째</h3>
          <p>두 번째 기능에 대한 설명입니다.</p>
        </div>
        <div className="card">
          <h3>완성</h3>
          <p>세 번째 기능에 대한 설명입니다.</p>
        </div>
      </div>

      <button className="demo-button">데모 버튼</button>
    </section>
  );
}
