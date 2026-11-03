import React, { useState } from 'react';
import DraftLogForm from './components/DraftLogForm';
import DraftLogList from './components/DraftLogList';

export default function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreated = () => {
    // Al crearse un log, actualizamos el trigger para que DraftLogList se refresque
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.appTitle}>SoloFlow</h1>
        <p style={styles.subtitle}>
          Captura y gestión de micro-tareas y actividad técnica
        </p>
      </header>

      <main style={styles.mainGrid}>
        <section style={styles.column}>
          <DraftLogForm onCreated={handleCreated} />
        </section>

        <section style={styles.column}>
          <DraftLogList refreshTrigger={refreshTrigger} />
        </section>
      </main>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
    color: '#2d3748',
    backgroundColor: '#f7fafc',
    minHeight: '100vh',
    boxSizing: 'border-box'
  },
  header: {
    marginBottom: '32px',
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '16px'
  },
  appTitle: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c'
  },
  subtitle: {
    margin: '6px 0 0 0',
    fontSize: '15px',
    color: '#718096'
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
    alignItems: 'start'
  },
  column: {
    display: 'flex',
    flexDirection: 'column'
  }
};
