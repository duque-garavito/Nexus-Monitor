import { useEffect, useState } from "react";
import { obtenerDispositivos } from "../services/deviceService";

function DeviceList() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const cargarDispositivos = async () => {
        try {
            setLoading(true);
            const response = await obtenerDispositivos();
            setDevices(response.data);
        } catch (error) {
            console.error(error);
            setError("No se pudieron cargar los dispositivos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDispositivos();
    }, []);

    if (loading) {
        return <div className="table-empty-row"><div className="zbx-spinner"></div> Cargando dispositivos...</div>;
    }

    if (error) {
        return <div className="form-error">{error}</div>;
    }

    return (
        <div className="zbx-table-container">
            <table className="zbx-table">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>IP</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="table-empty-row">No existen dispositivos registrados.</td>
                        </tr>
                    ) : (
                        devices.map((device) => {
                            const statusClass = device.status?.toLowerCase() || 'unknown';
                            return (
                                <tr key={device.id}>
                                    <td><strong style={{ color: '#ff5c00' }}>{device.name}</strong></td>
                                    <td><span className="zbx-interface-code">{device.ip}</span></td>
                                    <td>{device.type}</td>
                                    <td>
                                        <span className={`status-badge ${statusClass === 'online' ? 'enabled' : statusClass === 'offline' ? 'disabled' : 'unknown'}`}>
                                            {device.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default DeviceList;
