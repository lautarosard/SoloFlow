import React, { useState, useEffect } from 'react';
import draftLogService from '../services/draft-log.service';

export default function DraftLogList({ refreshTrigger }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await draftLogService.getAll();
      // El backend envuelve la respuesta en { status: 'success', data: [...] }
      setLogs(response?.data || []);
    } catch (err) {
      const errorMsg =
        err.response?.data?.data?.message ||
        err.response?.data?.message ||
        'Error al cargar los registros borrador';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'grouped':
        return { backgroundColor: '#e6fffa', color: '#234e52', borderColor: '#b2f5ea' };
      case 'discarded':
        return { backgroundColor: '#fff5f5', color: '#742a2a', borderColor: '#fed7d7' };
      case 'pending':
      default:
        return { backgroundColor: '#fefcbf', color: '#744210', borderColor: '#faf089' };
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Registros Borrador (Draft Logs)</h2>
        <button onClick={fetchLogs} style={styles.refreshButton} title="Recargar lista">
          ↻ Actualizar
        </button>
      </div>

      {loading && (
        <div style={styles.infoMessage}>
          <span>Cargando registros...</span>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div style={styles.emptyState}>
          <p style={{ margin: 0 }}>No hay registros de borrador disponibles.</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div style={styles.list}>
          {logs.map((log) => {
            const badgeStyle = getStatusBadgeStyle(log.status);
            const tagList = Array.isArray(log.tags) ? log.tags : [];

            return (
              <div key={log.id} style={styles.item}>
                <div style={styles.itemHeader}>
                  <span style={styles.description}>{log.description}</span>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor: badgeStyle.backgroundColor,
                      color: badgeStyle.color,
                      borderColor: badgeStyle.borderColor
                    }}
                  >
                    {log.status}
                  </span>
                </div>

                <div style={styles.itemMeta}>
                  <span style={styles.duration}>
                    ⏱ {log.duration_minutes} min
                  </span>

                  {log.client_id && (
                    <span style={styles.clientTag}>
                      Cliente: {log.client_id}
                    </span>
                  )}
                </div>

                {tagList.length > 0 && (
                  <div style={styles.tagsContainer}>
                    {tagList.map((tag, idx) => (
                      <span key={idx} style={styles.tagBadge}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '12px'
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#1a202c'
  },
  refreshButton: {
    padding: '6px 12px',
    fontSize: '13px',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: '1px solid #cbd5e0',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  infoMessage: {
    padding: '20px',
    textAlign: 'center',
    color: '#718096',
    fontSize: '14px'
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#a0aec0',
    backgroundColor: '#f7fafc',
    borderRadius: '6px',
    border: '1px dashed #cbd5e0'
  },
  errorBox: {
    padding: '12px 16px',
    marginBottom: '16px',
    backgroundColor: '#fff5f5',
    color: '#c53030',
    border: '1px solid #feb2b2',
    borderRadius: '6px',
    fontSize: '14px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  item: {
    padding: '16px',
    borderRadius: '6px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px'
  },
  description: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#2d3748',
    lineHeight: '1.4'
  },
  badge: {
    fontSize: '12px',
    fontWeight: '600',
    padding: '3px 8px',
    borderRadius: '12px',
    border: '1px solid transparent',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  itemMeta: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    fontSize: '13px',
    color: '#718096'
  },
  duration: {
    fontWeight: '500',
    color: '#4a5568'
  },
  clientTag: {
    backgroundColor: '#edf2f7',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#4a5568'
  },
  tagsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '2px'
  },
  tagBadge: {
    fontSize: '12px',
    backgroundColor: '#ebf8ff',
    color: '#2b6cb0',
    padding: '2px 8px',
    borderRadius: '4px',
    border: '1px solid #bee3f8'
  }
};

