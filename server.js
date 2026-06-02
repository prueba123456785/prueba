'use strict';

const dns      = require('dns');
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

const MONGO_URI = 'mongodb+srv://yael24571_db_user:y12345@cluster0.86hmorz.mongodb.net/ClimasHuerto?appName=Cluster0';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas (ClimasHuerto)'))
  .catch(err => console.error('❌ Error MongoDB:', err));

const climaSchema = new mongoose.Schema({
  fecha:       String,
  temperatura: Number
}, { collection: 'Climas' });

const Clima = mongoose.model('Clima', climaSchema);

const fotoSchema = new mongoose.Schema({
  url:         { type: String, required: true },
  titulo:      String,
  descripcion: String
}, { collection: 'Images' });

const Foto = mongoose.model('Foto', fotoSchema);

const documentoSchema = new mongoose.Schema({
  titulo:       String,
  nombreArchivo: String,
  tipoArchivo:  String,
  datosBase64:  { type: String, required: true },
  fecha:        { type: Date, default: Date.now }
}, { collection: 'Documentos' });

const Documento = mongoose.model('Documento', documentoSchema);

const upload = multer({ storage: multer.memoryStorage() });

const obtenerFechaString = (diasAtras = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
};

app.get('/api/temperatura/actual', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });

    if (!ultimo) {
      return res.json({
        temperatura: 22,
        fecha: obtenerFechaString(),
        estado: 'S/D',
        mensaje: 'Sin datos en Atlas'
      });
    }

    let estado  = 'ÓPTIMO';
    let mensaje = '🟣 Temperatura ideal';

    if (ultimo.temperatura > 25) { estado = 'CÁLIDO';  mensaje = '🟠 Hace calor'; }
    if (ultimo.temperatura < 15) { estado = 'FRESCO';  mensaje = '🔵 Temperatura baja'; }
    if (ultimo.temperatura > 35) { estado = 'EXTREMO CALOR'; mensaje = '🔴 Temperatura peligrosa'; }
    if (ultimo.temperatura < 5)  { estado = 'HELADA';  mensaje = '❄️ Riesgo de helada'; }

    res.json({ temperatura: ultimo.temperatura, fecha: ultimo.fecha, estado, mensaje });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/temperatura/historial', async (req, res) => {
  try {
    const historial = await Clima.find({}).sort({ fecha: 1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/temperatura/estadisticas', async (req, res) => {
  try {
    const datos = await Clima.find({});

    if (datos.length === 0) {
      return res.json({ promedio: 0, maxima: 0, minima: 0, diasOptimos: 0 });
    }

    const temps      = datos.map(d => d.temperatura);
    const promedio   = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const maxima     = Math.max(...temps);
    const minima     = Math.min(...temps);
    const diasOptimos = datos.filter(d => d.temperatura >= 15 && d.temperatura <= 25).length;

    res.json({ promedio, maxima, minima, diasOptimos });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/recomendaciones/riego', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });
    const temp   = ultimo ? ultimo.temperatura : 22;

    let riego = { recomendacion: 'Riego moderado', frecuencia: 'Cada 7 días', cantidad: 'Normal' };

    if (temp > 25) riego = { recomendacion: 'Riego frecuente', frecuencia: 'Cada 2-3 días', cantidad: 'Abundante' };
    if (temp < 15) riego = { recomendacion: 'Riego escaso',    frecuencia: 'Cada 12 días',  cantidad: 'Mínima' };

    res.json(riego);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/estado/floracion', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });
    const temp   = ultimo ? ultimo.temperatura : 22;

    let flor = { estado: 'CRECIMIENTO', mensaje: 'Desarrollo de hojas activo' };

    if (temp >= 20 && temp <= 25) {
      flor = { estado: 'FLORACIÓN', mensaje: '¡Momento ideal para las flores!' };
    }

    res.json(flor);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/fotos', async (req, res) => {
  try {
    const fotos = await Foto.find().sort({ _id: -1 });
    res.json(fotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/subir-imagen', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No se recibió imagen' });
    }

    const base64    = req.file.buffer.toString('base64');
    const nuevaFoto = new Foto({
      titulo: req.body.titulo || 'Sin título',
      url:    `data:${req.file.mimetype};base64,${base64}`
    });

    await nuevaFoto.save();
    console.log('✅ Imagen guardada');
    res.json({ ok: true, mensaje: 'Imagen subida correctamente' });

  } catch (err) {
    console.error('❌ Error al subir imagen:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/fotos/:id', async (req, res) => {
  try {
    const fotoBorrada = await Foto.findByIdAndDelete(req.params.id);

    if (!fotoBorrada) {
      return res.status(404).json({ ok: false, error: 'No se encontró la imagen' });
    }

    console.log(`🗑️ Imagen eliminada: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Imagen eliminada correctamente' });

  } catch (error) {
    console.error('❌ Error al borrar imagen:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/documentos', async (req, res) => {
  try {
    const documentos = await Documento.find().sort({ fecha: -1 });

    const mapeados = documentos.map(doc => ({
      _id:           doc._id,
      titulo:        doc.titulo,
      nombreArchivo: doc.nombreArchivo,
      tipoArchivo:   doc.tipoArchivo,
      url:           doc.datosBase64,
      fecha:         doc.fecha
    }));

    res.json(mapeados);

  } catch (error) {
    console.error('❌ Error al obtener documentos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/subir-documento', upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No se recibió ningún documento' });
    }

    const base64         = req.file.buffer.toString('base64');
    const nuevoDocumento = new Documento({
      titulo:        req.body.titulo || 'Sin título',
      nombreArchivo: req.file.originalname,
      tipoArchivo:   req.file.mimetype,
      datosBase64:   `data:${req.file.mimetype};base64,${base64}`
    });

    await nuevoDocumento.save();
    console.log('✅ Documento guardado correctamente');
    res.json({ ok: true, mensaje: 'Documento subido correctamente' });

  } catch (err) {
    console.error('❌ Error al subir documento:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const docBorrado = await Documento.findByIdAndDelete(req.params.id);

    if (!docBorrado) {
      return res.status(404).json({ ok: false, error: 'No se encontró el documento' });
    }

    console.log(`🗑️ Documento eliminado: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Documento eliminado correctamente' });

  } catch (error) {
    console.error('❌ Error al borrar documento:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
