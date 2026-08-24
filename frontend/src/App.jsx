import React, { useState, useEffect } from 'react';
import StatsSummary from './components/StatsSummary';
import DeviceForm from './components/DeviceForm';
import Problems from './components/Problems';
import { 
  obtenerDispositivos, 
  crearDispositivo, 
  actualizarDispositivo, 
  eliminarDispositivo 
} from './services/deviceService';
import { obtenerProblemas } from './services/problemService';
import './App.css';

export default function App() {
  const [devices, setDevices] = useState([]);
  const [problems, setProblems] = useState([]);
  const [editingDevice, setEditingDevice] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(true);
  
  // Tab State: 'dashboard', 'hosts', 'problems'
  const [currentTab, setCurrentTab] = useState('hosts');

  // Fetch all devices and active problems from backend using Axios services
  const fetchData = async () => {
    try {
      const hostData = await obtenerDispositivos();
      if (hostData.success) {
        setDevices(hostData.data);
      }

      const problemData = await obtenerProblemas();
      if (problemData.success) {
        setProblems(problemData.data);
      }
    } catch (err) {
      showNotification('Error de conexión con el backend de NEXUS.', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Create or Update host
  const handleFormSubmit = async (formData) => {
    try {
      if (editingDevice) {
        // UPDATE using Axios service
        const data = await actualizarDispositivo(editingDevice.id, formData);
        if (data.success) {
          showNotification('Host actualizado correctamente.', 'success');
          setEditingDevice(null);
          fetchData();
        } else {
          showNotification(data.message, 'error');
        }
      } else {
        // CREATE using Axios service
        const data = await crearDispositivo(formData);
        if (data.success) {
          showNotification('Host creado correctamente.', 'success');
          setShowAddForm(false);
          fetchData();
        } else {
          showNotification(data.message, 'error');
        }
      }
    } catch (err) {
      showNotification('Error al guardar el host.', 'error');
      console.error(err);
    }
  };

  // Delete host
  const handleDeleteDevice = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este host?')) return;

    try {
      // DELETE using Axios service
      const data = await eliminarDispositivo(id);
      if (data.success) {
        showNotification('Host eliminado correctamente.', 'success');
        if (editingDevice?.id === id) setEditingDevice(null);
        fetchData();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (err) {
      showNotification('Error al eliminar the host.', 'error');
      console.error(err);
    }
  };

  const handleEditClick = (device) => {
    setEditingDevice(device);
  };

  const handleCancelEdit = () => {
    setEditingDevice(null);
    setShowAddForm(false);
  };

  // Filter & Search logic for Hosts tab
  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          device.ip.includes(searchTerm);
    const matchesType = filterType === 'All' || device.type === filterType;
    const matchesStatus = filterStatus === 'All' || device.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // Filter logic for Problems tab (only offline devices)
  const problemDevices = devices.filter(device => device.status?.toLowerCase() === 'offline');

  const getPort = (type) => {
    switch (type) {
      case 'Database': return '3306';
      case 'Switch': return '161';
      default: return '10050';
    }
  };

  const getAvailBadge = (type, currentType, status) => {
    const t = type.toLowerCase();
    const ct = currentType.toLowerCase();
    const isActive = t === ct;
    const statusVal = status.toLowerCase();

    let className = 'zbx-avail-badge';
    if (isActive) {
      if (statusVal === 'online') {
        className += ` active ${t === 'ping' ? 'ping' : t === 'database' ? 'http' : 'active'}`;
      } else if (statusVal === 'offline') {
        className += ' failed';
      }
    }
    return <span className={className}>{type.toUpperCase()}</span>;
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification.show && (
        <div className={`zbx-alert ${notification.type}`}>
          <span className="notification-icon">
            {notification.type === 'error' ? '❌' : '✓'}
          </span>
          <p>{notification.message}</p>
        </div>
      )}

      {/* Left Sidebar */}
      <aside className="zbx-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">Z</div>
          <h1>NEXUS<span>ZBX</span></h1>
        </div>

        <ul className="sidebar-menu">
          <li className="menu-category">Navegación</li>
          <li className={currentTab === 'dashboard' ? 'active' : ''}>
            <a href="#dashboard" onClick={() => setCurrentTab('dashboard')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="menu-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25h9m-9-4.5h9M11.25 3v18M3 7.5h18M3 16.5h18" />
              </svg>
              Tablero General
            </a>
          </li>
          <li className={currentTab === 'hosts' ? 'active' : ''}>
            <a href="#hosts" onClick={() => setCurrentTab('hosts')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="menu-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 3h13.5m-13.5-6h13.5m-13.5-3h13.5m-16.5 15h19.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v16.5a.75.75 0 0 0 .75.75Z" />
              </svg>
              Hosts Monitoreados
            </a>
          </li>
          <li className={currentTab === 'problems' ? 'active' : ''}>
            <a href="#problems" onClick={() => setCurrentTab('problems')}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="menu-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Últimos Problemas
              {problems.length > 0 && (
                <span style={{
                  backgroundColor: 'var(--zbx-problem)',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  marginLeft: 'auto',
                  boxShadow: '0 0 5px var(--zbx-problem)'
                }}>
                  {problems.length}
                </span>
              )}
            </a>
          </li>

          <li className="menu-category">Configuración</li>
          <li>
            <a href="#templates" onClick={(e) => e.preventDefault()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="menu-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M7.5 12l-3 3m3-3-3-3m16.5 3H3" />
              </svg>
              Plantillas
            </a>
          </li>
          <li>
            <a href="#actions" onClick={(e) => e.preventDefault()}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="menu-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.63 7.17a6 6 0 1 1 5.96 7.2m1.64-2.08a6.002 6.002 0 0 1-3.27 4.47m3.27-4.47a5.998 5.998 0 0 0-3.27-4.47m3.27 4.47 5.96-5.96M16.5 16.5l3 3m-3-3-3-3m1.5-1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
              </svg>
              Acciones de Alerta
            </a>
          </li>
        </ul>
      </aside>

      {/* Main Panel */}
      <main className="zbx-main">
        {/* Topbar */}
        <div className="zbx-topbar">
          <div className="breadcrumbs">
            Configuración <span>/</span> 
            <strong>
              {currentTab === 'dashboard' ? 'Tablero' : currentTab === 'problems' ? 'Problemas' : 'Hosts'}
            </strong>
          </div>
          <div className="server-status">
            <span className="status-dot"></span>
            <span>NEXUS Engine Conectado</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="zbx-content">
          
          {/* TAB 1: TABLERO GENERAL */}
          {currentTab === 'dashboard' && (
            <>
              <div className="zbx-header-section">
                <h2>Tablero General</h2>
              </div>
              <StatsSummary devices={devices} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '10px' }}>
                {/* System Info Widget */}
                <div className="zbx-filter" style={{ padding: '20px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>Información del Sistema</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Versión de NEXUS ZBX:</span>
                      <strong>v1.0.0 (simplificada)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Motor de Monitoreo:</span>
                      <strong style={{ color: 'var(--zbx-ok)' }}>Activo (ICMP Ping / Concurrente)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Frecuencia de Check:</span>
                      <strong>Cada 20 segundos</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Base de datos:</span>
                      <strong>MySQL (XAMPP local)</strong>
                    </div>
                  </div>
                </div>

                {/* Alarm Severity Summary Widget */}
                <div className="zbx-filter" style={{ padding: '20px' }}>
                  <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '15px' }}>Problemas Activos por Severidad</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    <div style={{ padding: '12px', textAlign: 'center', background: problems.filter(p => p.severity === 'critical' || p.severity === 'high').length > 0 ? 'rgba(228, 89, 89, 0.2)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🔴 High / Critical</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: problems.filter(p => p.severity === 'critical' || p.severity === 'high').length > 0 ? 'var(--zbx-problem)' : 'var(--text-muted)', marginTop: '4px' }}>
                        {problems.filter(p => p.severity === 'critical' || p.severity === 'high').length}
                      </div>
                    </div>
                    <div style={{ padding: '12px', textAlign: 'center', background: problems.filter(p => p.severity === 'average' || p.severity === 'warning').length > 0 ? 'rgba(238, 144, 44, 0.15)' : 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>🟠 Warning / Avg</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: problems.filter(p => p.severity === 'average' || p.severity === 'warning').length > 0 ? '#ee902c' : 'var(--text-muted)', marginTop: '4px' }}>
                        {problems.filter(p => p.severity === 'average' || p.severity === 'warning').length}
                      </div>
                    </div>
                    <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>ℹ️ Information</div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: '#3c96ff', marginTop: '4px' }}>
                        {problems.filter(p => p.severity === 'information').length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: HOSTS MONITOREADOS */}
          {currentTab === 'hosts' && (
            <>
              <div className="zbx-header-section">
                <h2>Hosts Monitoreados</h2>
                <button className="zbx-btn zbx-btn-orange" onClick={() => setShowAddForm(true)}>
                  + Crear Host
                </button>
              </div>

              <StatsSummary devices={devices} />

              {/* Collapsible Filter Panel */}
              <div className="zbx-filter">
                <div 
                  className="filter-header"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                >
                  <span>Filtros de Búsqueda</span>
                  <span>{isFilterExpanded ? '▲' : '▼'}</span>
                </div>

                {isFilterExpanded && (
                  <div className="filter-body">
                    <div className="filter-field">
                      <label>Nombre del Host / IP</label>
                      <input 
                        type="text" 
                        placeholder="Filtrar por nombre o IP..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="filter-field">
                      <label>Tipo de Monitoreo</label>
                      <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="All">Cualquiera</option>
                        <option value="Ping">Ping (ICMP)</option>
                        <option value="Router">Gateway / Router</option>
                        <option value="Server">Linux Server (ZBX)</option>
                        <option value="Switch">Switch (SNMP)</option>
                        <option value="Database">Database MySQL</option>
                      </select>
                    </div>

                    <div className="filter-field">
                      <label>Estado del Host</label>
                      <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="All">Cualquiera</option>
                        <option value="online">Habilitado (online)</option>
                        <option value="offline">Deshabilitado (offline)</option>
                        <option value="unknown">Desconocido (unknown)</option>
                      </select>
                    </div>

                    <div className="filter-actions">
                      <button 
                        className="zbx-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterType('All');
                          setFilterStatus('All');
                        }}
                      >
                        Restablecer
                      </button>
                      <button className="zbx-btn zbx-btn-orange" onClick={fetchData}>
                        Aplicar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Table of Hosts */}
              <div className="zbx-table-container">
                <table className="zbx-table">
                  <thead>
                    <tr>
                      <th style={{ width: '30px', textAlign: 'center' }}><input type="checkbox" readOnly /></th>
                      <th>Host</th>
                      <th>Interfaces</th>
                      <th>Disponibilidad</th>
                      <th>Estado</th>
                      <th>Fecha de Check</th>
                      <th style={{ width: '150px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="table-empty-row">
                          <div className="zbx-spinner"></div>
                          Cargando hosts de red...
                        </td>
                      </tr>
                    ) : filteredDevices.length > 0 ? (
                      filteredDevices.map(device => {
                        const statusClass = device.status?.toLowerCase() || 'unknown';
                        const activeType = device.type || 'Ping';
                        
                        return (
                          <tr key={device.id}>
                            <td style={{ textAlign: 'center' }}><input type="checkbox" readOnly /></td>
                            <td>
                              <span 
                                className="host-name-link" 
                                onClick={() => handleEditClick(device)}
                              >
                                {device.name}
                              </span>
                            </td>
                            <td>
                              <span className="zbx-interface-code">
                                {device.ip}:{getPort(device.type)}
                              </span>
                            </td>
                            <td>
                              <div className="zbx-availability-row">
                                {getAvailBadge('server', activeType, device.status)}
                                {getAvailBadge('ping', activeType, device.status)}
                                {getAvailBadge('switch', activeType, device.status)}
                                {getAvailBadge('database', activeType, device.status)}
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${statusClass === 'online' ? 'enabled' : statusClass === 'offline' ? 'disabled' : 'unknown'}`}>
                                {statusClass === 'online' ? 'Enabled' : statusClass === 'offline' ? 'Disabled' : 'Unknown'}
                              </span>
                            </td>
                            <td style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                              {device.created_at ? new Date(device.created_at).toLocaleString() : 'N/A'}
                            </td>
                            <td>
                              <button className="zbx-btn-link" onClick={() => handleEditClick(device)}>
                                Configurar
                              </button>
                              <button className="zbx-btn-link danger" onClick={() => handleDeleteDevice(device.id)}>
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="table-empty-row">
                          No se encontraron hosts en la base de datos de Zabbix.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TAB 3: ULTIMOS PROBLEMAS */}
          {currentTab === 'problems' && (
            <Problems />
          )}

        </div>
      </main>

      {/* Host Modal Form (Create/Edit) */}
      {(showAddForm || editingDevice) && (
        <DeviceForm
          onSubmit={handleFormSubmit}
          initialData={editingDevice}
          onCancel={handleCancelEdit}
        />
      )}
    </div>
  );
}
