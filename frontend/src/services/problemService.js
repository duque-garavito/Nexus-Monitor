import api from "./api";

export const obtenerProblemas = async () => {
    const response = await api.get("/problems");
    return response.data;
};
