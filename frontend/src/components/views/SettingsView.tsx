import { useWorkspace } from '../../state/WorkspaceContext'

export function SettingsView() {
  const { theme, toggleTheme } = useWorkspace()

  return (
    <section className="page">
      <header className="page__head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>Workspace</h1>
        </div>
      </header>
      <div className="settings">
        <article>
          <h3>Profile</h3>
          <p>Aarav Sharma</p>
          <p className="muted">Student Plan</p>
        </article>
        <article>
          <h3>Appearance</h3>
          <button className="ghost-btn" type="button" onClick={toggleTheme}>
            Theme: {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </article>
        <article>
          <h3>Retrieval defaults</h3>
          <p className="muted">Collection, source count, and model stay in the composer.</p>
        </article>
      </div>
    </section>
  )
}
