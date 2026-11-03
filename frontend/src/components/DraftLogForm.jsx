import React, { useState, useEffect } from 'react';
import draftLogService from '../services/draft-log.service';
import clientService from '../services/client.service';

export default function DraftLogForm({ onCreated }) {
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [status, setStatus] = useState('pending');
  const [tags, setTags] = useState('');

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Carga inicial de clientes disponibles para el select
  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      setClientsError(null);
      try {
        const res = await clientService.getAll();
        const clientList = res?.data || [];
        setClients(clientList);
      } catch (err) {
        const msg = err.response?.data?.data?.message || err.response?.data?.message || 'Error al cargar clientes';
        setClientsError(msg);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validación básica de cliente
    if (!clientId) {
      setError('Por favor seleccioná un cliente.');
      return;
    }

    // Validación de duración
    const parsedDuration = Number(durationMinutes);
    if (!parsedDuration || parsedDuration <= 0) {
      setError('La duración debe ser un número entero mayor a 0.');
      return;
    }

    // Parseo de tags (separados por coma)
    const formattedTags = tags
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    setSubmitting(true);
    try {
      const payload = {
        client_id: clientId,
        description: description.trim(),
        duration_minutes: parsedDuration,
        status,
        tags: formattedTags
      };

      const res = await draftLogService.create(payload);

      // Limpieza del formulario
      setDescription('');
      setDurationMinutes('');
      setStatus('pending');
      setTags('');
      setSuccessMessage('Registro borrador creado con éxito');

      // Notificar al componente padre para refrescar la lista
      if (typeof onCreated === 'function') {
        onCreated(res.data);
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.data?.message ||
        err.response?.data?.message ||
        'Error inesperado al crear el registro';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Nuevo Draft Log</h2>

      {error && (
        <div style={styles.errorBox}>
          <strong>Error: </strong>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={styles.successBox}>
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Selector de Cliente */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Cliente *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            disabled={loadingClients}
            style={styles.select}
          >
            <option value="">
              {loadingClients ? 'Cargando clientes...' : '-- Seleccionar Cliente --'}
            </option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          {clientsError && (
            <span style={styles.fieldError}>({clientsError})</span>
          )}
        </div>

        {/* Descripción */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Descripción *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            placeholder="Ej: Implementación de autenticación JWT y tests unitarios"
            style={styles.textarea}
          />
        </div>

        {/* Duración en minutos */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Duración (minutos) *</label>
          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
            placeholder="Ej: 45"
            style={styles.input}
          />
        </div>

        {/* Estado */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={styles.select}
          >
            <option value="pending">pending (Pendiente)</option>
            <option value="grouped">grouped (Agrupado)</option>
            <option value="discarded">discarded (Descartado)</option>
          </select>
        </div>

        {/* Tags */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Tags (separados por coma)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="#Backend, #Bug, #Auth"
            style={styles.input}
          />
        </div>

        {/* Botón de envío */}
        <button
          type="submit"
          disabled={submitting || loadingClients}
          style={{
            ...styles.button,
            opacity: submitting || loadingClients ? 0.7 : 1,
            cursor: submitting || loadingClients ? 'not-allowed' : 'pointer'
          }}
        >
          {submitting ? 'Guardando...' : 'Crear Registro'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px'
  },
  title: {
    marginTop: 0,
    marginBottom: '20px',
    fontSize: '20px',
    color: '#1a202c',
    borderBottom: '1px solid #edf2f7',
    paddingBottom: '12px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2d3748'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%'
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    outline: 'none',
    resize: 'vertical',
    boxSizing: 'border-box',
    width: '100%',
    fontFamily: 'inherit'
  },
  select: {
    padding: '10px 12px',
    fontSize: '14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    outline: 'none',
    backgroundColor: '#fff',
    boxSizing: 'border-box',
    width: '100%'
  },
  button: {
    marginTop: '8px',
    padding: '12px 20px',
    backgroundColor: '#3182ce',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px',
    transition: 'background-color 0.2s ease'
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
  successBox: {
    padding: '12px 16px',
    marginBottom: '16px',
    backgroundColor: '#f0fff4',
    color: '#276749',
    border: '1px solid #9ae6b4',
    borderRadius: '6px',
    fontSize: '14px'
  },
  fieldError: {
    fontSize: '12px',
    color: '#e53e3e',
    marginTop: '4px'
  }
};

