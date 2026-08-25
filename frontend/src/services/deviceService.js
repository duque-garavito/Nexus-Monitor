import api from "./api";

export const obtenerDispositivos = async () => {
    const response = await api.get("/hosts");
    return response.data;
};

export const crearDispositivo = async (dispositivo) => {
    const response = await api.post("/hosts", dispositivo);
    return response.data;
};

export const actualizarDispositivo = async (id, dispositivo) => {
    const response = await api.put(
        `/hosts/${id}`,
        dispositivo
    );
    return response.data;
};

export const eliminarDispositivo = async (id) => {
    const response = await api.delete(
        `/hosts/${id}`
    );
    return response.data;
};
