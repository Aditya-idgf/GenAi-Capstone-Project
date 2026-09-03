export function KnowledgeOverview() {
  return (
    <section className="overview">
      <h2>Knowledge Overview</h2>
      <dl>
        <div>
          <dt>Documents</dt>
          <dd>48</dd>
        </div>
        <div>
          <dt>Pages</dt>
          <dd>12,842</dd>
        </div>
        <div>
          <dt>Chunks</dt>
          <dd>183,901</dd>
        </div>
        <div className="overview__storage">
          <dt>Storage Used</dt>
          <dd>
            <span>6.2 GB / 20 GB</span>
            <strong>31%</strong>
          </dd>
        </div>
      </dl>
      <div className="overview__bar" aria-hidden="true">
        <span style={{ width: '31%' }} />
      </div>
    </section>
  )
}
