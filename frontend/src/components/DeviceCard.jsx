import React from 'react';

export default function DeviceCard({ device, onEdit, onDelete }) {
  // Select type icon
  const getIcon = (type) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('server') || t.includes('servidor')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="device-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 3h13.5m-13.5-6h13.5m-13.5-3h13.5m-13.5-3h13.5m-16.5 15h19.5a.75.75 0 0 0 .75-.75V3.75a.75.75 0 0 0-.75-.75H3.75a.75.75 0 0 0-.75.75v16.5a.75.75 0 0 0 .75.75Z" />
        </svg>
      );
    }
    if (t.includes('router') || t.includes('modem') || t.includes('enrutador')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="device-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.284 16.284A3 3 0 0 0 12 21a3 3 0 0 0 3.716-4.716l-3.716-3.716-3.716 3.716Zm-3.72-3.72L12 5.064l7.436 7.5m-12.72-2.28 5.284-5.284M12 3v2.25M12 21V11.25" />
        </svg>
      );
    }
    if (t.includes('switch') || t.includes('conmutador')) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="device-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25h9m-9-4.5h9M11.25 3v18M3 7.5h18M3 16.5h18" />
        </svg>
      );
    }
    // Default/Ping/Desktop icon
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="device-icon">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
      </svg>
    );
  };

  const statusClass = device.status?.toLowerCase() || 'unknown';

  return (
    <div className={`glass device-card border-${statusClass}`}>
      <div className="device-card-header">
        <div className="device-type-badge">
          {getIcon(device.type)}
          <span>{device.type || 'Ping'}</span>
        </div>
        <div className="status-indicator">
          <span className={`pulse-dot ${statusClass}`}></span>
          <span className={`status-text text-${statusClass}`}>{device.status}</span>
        </div>
      </div>

      <div className="device-card-body">
        <h3 className="device-name">{device.name}</h3>
        <div className="device-ip-wrapper">
          <span className="ip-label">IP:</span>
          <code className="device-ip">{device.ip}</code>
        </div>
      </div>

      <div className="device-card-footer">
        <button className="btn btn-secondary" onClick={() => onEdit(device)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
          </svg>
          Editar
        </button>
        <button className="btn btn-danger-outline" onClick={() => onDelete(device.id)}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="btn-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Eliminar
        </button>
      </div>
    </div>
  );
}
