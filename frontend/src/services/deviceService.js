import axios from "axios";

const API_URL = "http://localhost:3000/api/hosts";

export const obtenerDispositivos = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const crearDispositivo = async (dispositivo) => {
    const response = await axios.post(API_URL, dispositivo);
    return response.data;
};

export const actualizarDispositivo = async (id, dispositivo) => {
    const response = await axios.put(
        `${API_URL}/${id}`,
        dispositivo
    );
    return response.data;
};

export const eliminarDispositivo = async (id) => {
    const response = await axios.delete(
        `${API_URL}/${id}`
    );
    return response.data;
};
