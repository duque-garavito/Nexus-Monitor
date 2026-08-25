import { useState } from "react";
import { login } from "../services/authService";

function Login({ onLogin }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await login(username, password);
            localStorage.setItem("nexus_token", response.token);
            localStorage.setItem("nexus_user", JSON.stringify(response.user));
            onLogin(response.user);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Error de autenticación. Verifica tus credenciales."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <div className="login-card anim-pulse-border">
                <div className="login-header">
                    <div className="logo-icon-large">Z</div>
                    <h1>NEXUS<span>ZBX</span></h1>
                    <p className="login-subtitle">Sistema de Monitoreo Proactivo de Red</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label className="form-label">Usuario</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Ingrese su usuario..."
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Ingrese su contraseña..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="form-error">
                            <span>🔴</span> {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="zbx-btn zbx-btn-orange login-btn"
                        disabled={loading}
                    >
                        {loading ? "INGRESANDO..." : "INGRESAR AL SISTEMA"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
