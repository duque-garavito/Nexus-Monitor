const ping = require("ping");

const comprobarHost = async (ip) => {
    try {
        const resultado = await ping.promise.probe(ip, {
            timeout: 3,
            extra: ["-n", "1"]
        });

        return {
            online: resultado.alive,
            latency: resultado.alive
                ? Number(resultado.time)
                : null
        };
    } catch (error) {
        console.error(`Error haciendo ping a ${ip}:`, error);
        return {
            online: false,
            latency: null
        };
    }
};

module.exports = {
    comprobarHost
};
