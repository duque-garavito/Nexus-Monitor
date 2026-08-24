import { useEffect, useState } from "react";
import { obtenerProblemas } from "../services/problemService";

function Problems() {
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);

    const cargarProblemas = async () => {
        try {
            const response = await obtenerProblemas();
            setProblems(response.data);
        } catch (error) {
            console.error("Error cargando problemas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarProblemas();
        const interval = setInterval(cargarProblemas, 10000);
        return () => clearInterval(interval);
    }, []);

    const obtenerSeveridad = (severity) => {
        switch (severity?.toLowerCase()) {
            case "information":
                return { label: "ℹ️ INFORMATION", className: "severity-info" };
            case "warning":
                return { label: "🟡 WARNING", className: "severity-warning" };
            case "average":
                return { label: "🟠 AVERAGE", className: "severity-average" };
            case "high":
                return { label: "🔴 HIGH", className: "severity-high" };
            case "critical":
                return { label: "⛔ CRITICAL", className: "severity-critical" };
            default:
                return { label: severity, className: "severity-unknown" };
        }
    };

    if (loading) {
        return <div className="table-empty-row"><div className="zbx-spinner"></div> Cargando problemas...</div>;
    }

    return (
        <div className="problems-dashboard-tab">
            <h2 className="tab-title">Problemas Activos</h2>
            <div className="zbx-table-container">
                <table className="zbx-table">
                    <thead>
                        <tr>
                            <th>Host</th>
                            <th>IP</th>
                            <th>Problema</th>
                            <th>Severidad</th>
                            <th>Inicio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {problems.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="table-empty-row">No existen problemas activos.</td>
                            </tr>
                        ) : (
                            problems.map((problem) => {
                                const sevInfo = obtenerSeveridad(problem.severity);
                                return (
                                    <tr key={problem.id} className="problem-row-alert anim-pulse-border">
                                        <td><strong>{problem.host_name}</strong></td>
                                        <td><span className="zbx-interface-code">{problem.ip}</span></td>
                                        <td><span style={{ color: '#ffffff', fontWeight: 'bold' }}>{problem.message}</span></td>
                                        <td>
                                            <span className={`severity-badge ${sevInfo.className}`}>
                                                {sevInfo.label}
                                            </span>
                                        </td>
                                        <td>{new Date(problem.started_at).toLocaleString()}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Problems;
