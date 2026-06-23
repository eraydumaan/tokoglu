const { resolve } = require("node:path");

module.exports = {
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                mutfakDolabi: resolve(__dirname, "mutfak-dolabi/index.html"),
                banyoDolabi: resolve(__dirname, "banyo-dolabi/index.html"),
                tvUnitesi: resolve(__dirname, "tv-unitesi/index.html"),
                gardiroop: resolve(__dirname, "gardiroop/index.html"),
                ofisMobilya: resolve(__dirname, "ofis-mobilya/index.html")
            }
        }
    }
};
