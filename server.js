const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const multer = require("multer");

const app = express();

app.use(express.static(__dirname));
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));


const mongoURI = 'mongodb+srv://yael24571_db_user:y12345@cluster0.86hmorz.mongodb.net/ClimasHuerto?appName=Cluster0';

mongoose.connect(mongoURI)
.then(() => {
    console.log("✅ Conectado a MongoDB Atlas (ClimasHuerto)");
})
.catch(err => {
    console.log("❌ Error MongoDB:", err);
});


const climaSchema = new mongoose.Schema({
    fecha: String,
    temperatura: Number
}, {
    collection: 'Climas'
});

const Clima = mongoose.model('Clima', climaSchema);

const fotoSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    titulo: {
        type: String
    },
    descripcion: {
        type: String
    }
}, {
    collection: 'Images'
});

const Foto = mongoose.model('Foto', fotoSchema);

// --- ESQUEMA PARA LOS DOCUMENTOS (PDF, EXCEL, ETC) ---
const documentoSchema = new mongoose.Schema({
    titulo: {
        type: String
    },
    nombreArchivo: {
        type: String
    },
    tipoArchivo: {
        type: String
    },
    datosBase64: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        default: Date.now
    }
}, {
    collection: 'Documentos'
});

const Documento = mongoose.model('Documento', documentoSchema);
// -----------------------------------------------------------


const storage = multer.memoryStorage();

const upload = multer({
    storage: storage
});


const obtenerFechaString = (diasAtras = 0) => {
    const d = new Date();
    d.setDate(d.getDate() - diasAtras);
    return d.toISOString().split('T')[0];
};


app.get('/api/temperatura/actual', async (req, res) => {
    try {
        const ultimoRegistro = await Clima.findOne().sort({ fecha: -1 });

        if (!ultimoRegistro) {
            return res.json({
                temperatura: 22,
                fecha: obtenerFechaString(),
                estado: 'S/D',
                mensaje: 'Sin datos en Atlas'
            });
        }

        let estado = 'ÓPTIMO';
        let mensaje = '🟣 Temperatura ideal';

        if (ultimoRegistro.temperatura > 25) {
            estado = 'CÁLIDO';
            mensaje = '🟠 Hace calor';
        }

        if (ultimoRegistro.temperatura < 15) {
            estado = 'FRESCO';
            mensaje = '🔵 Temperatura baja';
        }

        res.json({
            temperatura: ultimoRegistro.temperatura,
            fecha: ultimoRegistro.fecha,
            estado,
            mensaje
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


app.get('/api/temperatura/historial', async (req, res) => {
    try {
        const historial = await Clima.find({}).sort({ fecha: 1 });
        res.json(historial);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


app.get('/api/temperatura/estadisticas', async (req, res) => {
    try {
        const datos = await Clima.find({});

        if (datos.length === 0) {
            return res.json({
                promedio: 0,
                maxima: 0,
                minima: 0,
                diasOptimos: 0
            });
        }

        const temps = datos.map(d => d.temperatura);

        const promedio = (
            temps.reduce((a, b) => a + b, 0)
            / temps.length
        ).toFixed(1);

        const maxima = Math.max(...temps);
        const minima = Math.min(...temps);

        const diasOptimos = datos.filter(
            d => d.temperatura >= 15
            && d.temperatura <= 25
        ).length;

        res.json({
            promedio,
            maxima,
            minima,
            diasOptimos
        });

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


app.get('/api/recomendaciones/riego', async (req, res) => {
    try {
        const ultimo = await Clima.findOne().sort({ fecha: -1 });
        const temp = ultimo ? ultimo.temperatura : 22;

        let riego = {
            recomendacion: 'Riego moderado',
            frecuencia: 'Cada 7 días',
            cantidad: 'Normal'
        };

        if (temp > 25) {
            riego = {
                recomendacion: 'Riego frecuente',
                frecuencia: 'Cada 2-3 días',
                cantidad: 'Abundante'
            };
        }

        if (temp < 15) {
            riego = {
                recomendacion: 'Riego escaso',
                frecuencia: 'Cada 12 días',
                cantidad: 'Mínima'
            };
        }

        res.json(riego);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


app.get('/api/estado/floracion', async (req, res) => {
    try {
        const ultimo = await Clima.findOne().sort({ fecha: -1 });
        const temp = ultimo ? ultimo.temperatura : 22;

        let flor = {
            estado: 'CRECIMIENTO',
            mensaje: 'Desarrollo de hojas activo'
        };

        if (temp >= 20 && temp <= 25) {
            flor = {
                estado: 'FLORACIÓN',
                mensaje: '¡Momento ideal para las flores!'
            };
        }

        res.json(flor);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


app.get('/api/fotos', async (req, res) => {
    try {
        const fotos = await Foto.find().sort({ _id: -1 });
        res.json(fotos);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: error.message
        });
    }
});


app.post(
    "/subir-imagen",
    upload.single("imagen"),
    async (req, res) => {
        try {
            console.log("📤 POST RECIBIDO (Imagen)");

            if (!req.file) {
                return res.status(400).json({
                    ok: false,
                    error: "No se recibió imagen"
                });
            }

            const base64 = req.file.buffer.toString("base64");

            const nuevaFoto = new Foto({
                titulo: req.body.titulo || "Sin título",
                url: `data:${req.file.mimetype};base64,${base64}`
            });

            await nuevaFoto.save();

            console.log("✅ Imagen guardada");

            res.json({
                ok: true,
                mensaje: "Imagen subida correctamente"
            });

        } catch (err) {
            console.log("❌ ERROR:", err);
            res.status(500).json({
                ok: false,
                error: err.message
            });
        }
    }
);

// --- RUTA PARA SUBIR DOCUMENTOS (PDF, EXCEL, ETC) ---
app.post(
    "/subir-documento",
    upload.single("documento"),
    async (req, res) => {
        try {
            console.log("📤 POST RECIBIDO (Documento)");

            if (!req.file) {
                return res.status(400).json({
                    ok: false,
                    error: "No se recibió ningún documento"
                });
            }

            const base64 = req.file.buffer.toString("base64");

            const nuevoDocumento = new Documento({
                titulo: req.body.titulo || "Sin título",
                nombreArchivo: req.file.originalname,
                tipoArchivo: req.file.mimetype,
                datosBase64: `data:${req.file.mimetype};base64,${base64}`
            });

            await nuevoDocumento.save();

            console.log("✅ Documento guardado correctamente en MongoDB");

            res.json({
                ok: true,
                mensaje: "Documento subido correctamente"
            });

        } catch (err) {
            console.log("❌ ERROR AL SUBIR DOCUMENTO:", err);
            res.status(500).json({
                ok: false,
                error: err.message
            });
        }
    }
);

// ===========================================================
// NUEVAS RUTAS AÑADIDAS: OBTENER Y ELIMINAR DOCUMENTOS
// ===========================================================

// 1. Ruta para obtener la lista de documentos (Mapeada para tu index.html)
app.get('/api/documentos', async (req, res) => {
    try {
        const documentos = await Documento.find().sort({ fecha: -1 });
        
        // Mapeamos los campos para que la propiedad 'datosBase64' se mande como 'url' 
        // que es lo que el index.html está buscando de forma nativa.
        const documentosMapeados = documentos.map(doc => ({
            _id: doc._id,
            titulo: doc.titulo,
            nombreArchivo: doc.nombreArchivo,
            tipoArchivo: doc.tipoArchivo,
            url: doc.datosBase64, // Emparejamiento clave
            fecha: doc.fecha
        }));

        res.json(documentosMapeados);
    } catch (error) {
        console.error("❌ ERROR AL OBTENER DOCUMENTOS:", error);
        res.status(500).json({ error: error.message });
    }
});

// 2. Ruta para eliminar un documento por su ID
app.delete('/api/documentos/:id', async (req, res) => {
    try {
        const idDoc = req.params.id;
        const docBorrado = await Documento.findByIdAndDelete(idDoc);

        if (!docBorrado) {
            return res.status(404).json({ 
                ok: false, 
                error: "No se encontró el documento en la base de datos" 
            });
        }

        console.log(`🗑️ Documento eliminado con ID: ${idDoc}`);
        res.json({ 
            ok: true, 
            mensaje: "Documento eliminado correctamente" 
        });
    } catch (error) {
        console.error("❌ ERROR AL BORRAR DOCUMENTO:", error);
        res.status(500).json({ 
            ok: false, 
            error: error.message 
        });
    }
});
// ===========================================================

app.delete('/api/fotos/:id', async (req, res) => {
    try {
        const idFoto = req.params.id;
        
        const fotoBorrada = await Foto.findByIdAndDelete(idFoto);

        if (!fotoBorrada) {
            return res.status(404).json({ 
                ok: false, 
                error: "No se encontró la imagen en la base de datos" 
            });
        }

        console.log(`🗑️ Imagen eliminada con ID: ${idFoto}`);
        
        res.json({ 
            ok: true, 
            mensaje: "Imagen eliminada correctamente" 
        });

    } catch (error) {
        console.log("❌ ERROR AL BORRAR IMAGEN:", error);
        res.status(500).json({ 
            ok: false, 
            error: error.message 
        });
    }
});



app.get('/', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'index.html')
    );
});



app.listen(PORT, () => {
    console.log(
        `🚀 Servidor corriendo en http://localhost:${PORT}`
    );
});
