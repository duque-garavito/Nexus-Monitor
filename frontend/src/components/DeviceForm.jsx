import React, { useState, useEffect } from 'react';

export default function DeviceForm({ onSubmit, initialData, onCancel }) {
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [type, setType] = useState('Ping');
  const [status, setStatus] = useState('unknown');
  const [activeTab, setActiveTab] = useState('Host');
  const [error, setError] = useState('');

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setIp(initialData.ip || '');
      setType(initialData.type || 'Ping');
      setStatus(initialData.status || 'unknown');
    } else {
      setName('');
      setIp('');
      setType('Ping');
      setStatus('unknown');
    }
    setActiveTab('Host');
    setError('');
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre del host (Host name) es obligatorio.');
      return;
    }
    if (!ip.trim()) {
      setError('La dirección IP del host es obligatoria.');
      return;
    }

    onSubmit({ name, ip, type, status });
  };

  return (
    <div className="zbx-modal-overlay">
      <div className="zbx-modal">
        <div className="modal-header">
          <h3>{isEditing ? 'Configuración de Host (Editar)' : 'Crear nuevo Host'}</h3>
          <button className="modal-close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="form-error">{error}</div>}

            {/* Zabbix-style tabs */}
            <div className="zbx-tabs">
              <div 
                className={`zbx-tab ${activeTab === 'Host' ? 'active' : ''}`}
                onClick={() => setActiveTab('Host')}
              >
                Host
              </div>
              <div 
                className={`zbx-tab ${activeTab === 'Interfaces' ? 'active' : ''}`}
                onClick={() => setActiveTab('Interfaces')}
              >
                Interfaces
              </div>
              <div 
                className={`zbx-tab ${activeTab === 'Tags' ? 'active' : ''}`}
                onClick={() => setActiveTab('Tags')}
              >
                Etiquetas
              </div>
            </div>

            {/* Tab content: Host */}
            {activeTab === 'Host' && (
              <div className="tab-content">
                <div className="zbx-form-row">
                  <div className="zbx-form-label">Nombre del Host</div>
                  <div className="zbx-form-input">
                    <input
                      type="text"
                      placeholder="Ej: Router-Core-01"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="zbx-form-row">
                  <div className="zbx-form-label">Tipo de Monitoreo</div>
                  <div className="zbx-form-input">
                    <select value={type} onChange={(e) => setType(e.target.value)}>
                      <option value="Ping">Ping (ICMP)</option>
                      <option value="Router">Gateway / Router</option>
                      <option value="Server">Linux Server (ZBX)</option>
                      <option value="Switch">Switch (SNMP)</option>
                      <option value="Database">Database MySQL</option>
                    </select>
                  </div>
                </div>

                <div className="zbx-form-row">
                  <div className="zbx-form-label">Estado Inicial</div>
                  <div className="zbx-form-input">
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="unknown">Desconocido (unknown)</option>
                      <option value="online">Monitoreo Habilitado (online)</option>
                      <option value="offline">Monitoreo Deshabilitado (offline)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content: Interfaces */}
            {activeTab === 'Interfaces' && (
              <div className="tab-content">
                <div className="zbx-form-row">
                  <div className="zbx-form-label">IP del Agente</div>
                  <div className="zbx-form-input">
                    <input
                      type="text"
                      placeholder="Ej: 192.168.1.1"
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="zbx-form-row">
                  <div className="zbx-form-label">Puerto</div>
                  <div className="zbx-form-input">
                    <input
                      type="text"
                      disabled
                      value={type === 'Database' ? '3306' : type === 'Switch' ? '161' : '10050'}
                    />
                  </div>
                </div>

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
                  El puerto se asigna automáticamente de acuerdo con el tipo de monitoreo seleccionado.
                </p>
              </div>
            )}

            {/* Tab content: Tags */}
            {activeTab === 'Tags' && (
              <div className="tab-content" style={{ padding: '10px 0', textAlign: 'center' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', fontSize: '11px', paddingBottom: '8px' }}>Nombre</th>
                      <th style={{ textAlign: 'left', fontSize: '11px', paddingBottom: '8px' }}>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><input type="text" disabled value="environment" style={{ width: '90%', padding: '4px', background: '#25343d', border: '1px solid #384b55', color: '#fff' }} /></td>
                      <td><input type="text" disabled value="production" style={{ width: '90%', padding: '4px', background: '#25343d', border: '1px solid #384b55', color: '#fff' }} /></td>
                    </tr>
                    <tr>
                      <td><input type="text" disabled value="project" style={{ width: '90%', padding: '4px', background: '#25343d', border: '1px solid #384b55', color: '#fff' }} /></td>
                      <td><input type="text" disabled value="nexus-monitor" style={{ width: '90%', padding: '4px', background: '#25343d', border: '1px solid #384b55', color: '#fff' }} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="zbx-btn" onClick={onCancel}>
              Cancelar
            </button>
            <button type="submit" className="zbx-btn zbx-btn-orange">
              {isEditing ? 'Actualizar' : 'Agregar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
