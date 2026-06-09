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
  .then(() => console.log('Conectado a MongoDB Atlas (ClimasHuerto)'))
  .catch(err => console.error('Error MongoDB:', err));

// =====================================================
// SCHEMAS / MODELS
// =====================================================
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

const procedimientoSchema = new mongoose.Schema({
  url:         { type: String, required: true },
  titulo:      { type: String, default: 'Sin titulo' },
  descripcion: { type: String, default: '' },
  fecha:       { type: Date, default: Date.now }
}, { collection: 'Procedimiento' });

const ImagenProcedimiento = mongoose.model('ImagenProcedimiento', procedimientoSchema);

const documentoSchema = new mongoose.Schema({
  titulo:        String,
  nombreArchivo: String,
  tipoArchivo:   String,
  datosBase64:   { type: String, required: true },
  fecha:         { type: Date, default: Date.now }
}, { collection: 'Documentos' });

const Documento = mongoose.model('Documento', documentoSchema);

const comentarioSchema = new mongoose.Schema({
  nombre:  { type: String, required: true },
  email:   { type: String, required: true },
  tipo:    { type: String, default: 'General' },
  mensaje: { type: String, default: '' },
  fecha:   { type: Date, default: Date.now }
}, { collection: 'Comentarios' });

const Comentario = mongoose.model('Comentario', comentarioSchema);

// =====================================================
// NUEVO: SCHEMA DE OPINIONES
// =====================================================
const opinionSchema = new mongoose.Schema({
  nombre:   { type: String, required: true },
  rol:      { type: String, default: 'Usuario' },
  texto:    { type: String, required: true },
  estrellas:{ type: Number, default: 5, min: 1, max: 5 },
  fecha:    { type: Date, default: Date.now }
}, { collection: 'Opiniones' });

const Opinion = mongoose.model('Opinion', opinionSchema);

// Multer — limite 50 MB para permitir PDFs
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// =====================================================
// HELPERS
// =====================================================
const obtenerFechaString = (diasAtras = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
};

// =====================================================
// RUTAS: TEMPERATURA
// =====================================================
app.get('/api/temperatura/actual', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });
    if (!ultimo) {
      return res.json({ temperatura: 22, fecha: obtenerFechaString(), estado: 'S/D', mensaje: 'Sin datos en Atlas' });
    }
    let estado  = 'OPTIMO';
    let mensaje = 'Temperatura ideal';
    if (ultimo.temperatura > 25) { estado = 'CALIDO';        mensaje = 'Hace calor'; }
    if (ultimo.temperatura < 15) { estado = 'FRESCO';        mensaje = 'Temperatura baja'; }
    if (ultimo.temperatura > 35) { estado = 'EXTREMO CALOR'; mensaje = 'Temperatura peligrosa'; }
    if (ultimo.temperatura < 5)  { estado = 'HELADA';        mensaje = 'Riesgo de helada'; }
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
    if (datos.length === 0) return res.json({ promedio: 0, maxima: 0, minima: 0, diasOptimos: 0 });
    const temps       = datos.map(d => d.temperatura);
    const promedio    = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const maxima      = Math.max(...temps);
    const minima      = Math.min(...temps);
    const diasOptimos = datos.filter(d => d.temperatura >= 15 && d.temperatura <= 25).length;
    res.json({ promedio, maxima, minima, diasOptimos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// RUTAS: RECOMENDACIONES
// =====================================================
app.get('/api/recomendaciones/riego', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });
    const temp   = ultimo ? ultimo.temperatura : 22;
    let riego = { recomendacion: 'Riego moderado', frecuencia: 'Cada 7 dias', cantidad: 'Normal' };
    if (temp > 25) riego = { recomendacion: 'Riego frecuente', frecuencia: 'Cada 2-3 dias', cantidad: 'Abundante' };
    if (temp < 15) riego = { recomendacion: 'Riego escaso',    frecuencia: 'Cada 12 dias',  cantidad: 'Minima' };
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
    if (temp >= 20 && temp <= 25) flor = { estado: 'FLORACION', mensaje: 'Momento ideal para las flores!' };
    res.json(flor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =====================================================
// RUTAS: GALERIA
// =====================================================
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
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibio imagen' });
    const base64    = req.file.buffer.toString('base64');
    const nuevaFoto = new Foto({
      titulo: req.body.titulo || 'Sin titulo',
      url:    `data:${req.file.mimetype};base64,${base64}`
    });
    await nuevaFoto.save();
    console.log('Imagen guardada en galeria');
    res.json({ ok: true, mensaje: 'Imagen subida correctamente' });
  } catch (err) {
    console.error('Error al subir imagen:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/fotos/:id', async (req, res) => {
  try {
    const fotoBorrada = await Foto.findByIdAndDelete(req.params.id);
    if (!fotoBorrada) return res.status(404).json({ ok: false, error: 'No se encontro la imagen' });
    console.log(`Imagen de galeria eliminada: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Imagen eliminada correctamente' });
  } catch (error) {
    console.error('Error al borrar imagen:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// =====================================================
// RUTAS: PROCEDIMIENTO
// =====================================================
app.get('/api/procedimiento', async (req, res) => {
  try {
    const fotos = await ImagenProcedimiento.find().sort({ fecha: 1 });
    res.json(fotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/subir-procedimiento', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibio imagen' });
    const base64   = req.file.buffer.toString('base64');
    const nuevaImg = new ImagenProcedimiento({
      titulo:      req.body.titulo      || 'Sin titulo',
      descripcion: req.body.descripcion || '',
      url:         `data:${req.file.mimetype};base64,${base64}`
    });
    await nuevaImg.save();
    console.log('Imagen de procedimiento guardada');
    res.json({ ok: true, mensaje: 'Imagen de procedimiento subida correctamente' });
  } catch (err) {
    console.error('Error al subir imagen de procedimiento:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/procedimiento/:id', async (req, res) => {
  try {
    const borrada = await ImagenProcedimiento.findByIdAndDelete(req.params.id);
    if (!borrada) return res.status(404).json({ ok: false, error: 'No se encontro la imagen del procedimiento' });
    console.log(`Imagen de procedimiento eliminada: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Imagen de procedimiento eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// =====================================================
// RUTAS: DOCUMENTOS
// =====================================================
app.get('/api/documentos', async (req, res) => {
  try {
    const documentos = await Documento.find().sort({ fecha: -1 });
    const mapeados = documentos.map(doc => ({
      _id:           doc._id,
      titulo:        doc.titulo,
      nombreArchivo: doc.nombreArchivo,
      tipoArchivo:   doc.tipoArchivo,
      fecha:         doc.fecha
    }));
    res.json(mapeados);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/ver-documento/:id', async (req, res) => {
  try {
    const doc = await Documento.findById(req.params.id);
    if (!doc) return res.status(404).send('Documento no encontrado');
    const dataUri  = doc.datosBase64;
    const matches  = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return res.status(500).send('Formato de archivo invalido');
    const mimeType = matches[1];
    const buffer   = Buffer.from(matches[2], 'base64');
    const disposition = mimeType === 'application/pdf'
      ? `inline; filename="${encodeURIComponent(doc.nombreArchivo || 'documento.pdf')}"`
      : `attachment; filename="${encodeURIComponent(doc.nombreArchivo || 'documento')}"`;
    res.set('Content-Type', mimeType);
    res.set('Content-Disposition', disposition);
    res.set('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error) {
    console.error('Error al servir documento:', error);
    res.status(500).send('Error al abrir el documento');
  }
});

app.post('/subir-documento', upload.single('documento'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, error: 'No se recibio ningun documento' });
    const base64         = req.file.buffer.toString('base64');
    const nuevoDocumento = new Documento({
      titulo:        req.body.titulo || 'Sin titulo',
      nombreArchivo: req.file.originalname,
      tipoArchivo:   req.file.mimetype,
      datosBase64:   `data:${req.file.mimetype};base64,${base64}`
    });
    await nuevoDocumento.save();
    console.log('Documento guardado:', req.file.originalname, '—', req.file.mimetype);
    res.json({ ok: true, mensaje: 'Documento subido correctamente' });
  } catch (err) {
    console.error('Error al subir documento:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const docBorrado = await Documento.findByIdAndDelete(req.params.id);
    if (!docBorrado) return res.status(404).json({ ok: false, error: 'No se encontro el documento' });
    console.log(`Documento eliminado: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('Error al borrar documento:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// =====================================================
// RUTAS: COMENTARIOS / CONTACTO
// =====================================================
app.post('/api/comentarios', async (req, res) => {
  try {
    const { nombre, email, tipo, mensaje } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ ok: false, error: 'Nombre y correo son obligatorios.' });
    }
    const nuevo = new Comentario({ nombre, email, tipo: tipo || 'General', mensaje: mensaje || '' });
    await nuevo.save();
    console.log(`Comentario guardado de: ${nombre} <${email}>`);
    res.json({ ok: true, mensaje: 'Gracias por tu mensaje! Lo revisaremos pronto.' });
  } catch (err) {
    console.error('Error al guardar comentario:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.get('/api/comentarios', async (req, res) => {
  try {
    const comentarios = await Comentario.find().sort({ fecha: -1 });
    res.json(comentarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/comentarios/:id', async (req, res) => {
  try {
    const borrado = await Comentario.findByIdAndDelete(req.params.id);
    if (!borrado) return res.status(404).json({ ok: false, error: 'Comentario no encontrado' });
    console.log(`Comentario eliminado: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Comentario eliminado correctamente' });
  } catch (error) {
    console.error('Error al borrar comentario:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// =====================================================
// RUTAS: OPINIONES (jarabe de lavanda)
// =====================================================

// GET — listar todas las opiniones
app.get('/api/opiniones', async (req, res) => {
  try {
    const opiniones = await Opinion.find().sort({ fecha: -1 });
    res.json(opiniones);
  } catch (error) {
    console.error('Error al obtener opiniones:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST — guardar nueva opinion
app.post('/api/opiniones', async (req, res) => {
  try {
    const { nombre, rol, texto, estrellas } = req.body;
    if (!nombre || !texto) {
      return res.status(400).json({ ok: false, error: 'Nombre y texto son obligatorios.' });
    }
    const nueva = new Opinion({
      nombre,
      rol:      rol      || 'Usuario',
      texto,
      estrellas: estrellas || 5
    });
    await nueva.save();
    console.log(`Opinion guardada de: ${nombre}`);
    res.json({ ok: true, mensaje: 'Opinion publicada correctamente.' });
  } catch (err) {
    console.error('Error al guardar opinion:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// DELETE — eliminar opinion por id (admin)
app.delete('/api/opiniones/:id', async (req, res) => {
  try {
    const borrada = await Opinion.findByIdAndDelete(req.params.id);
    if (!borrada) return res.status(404).json({ ok: false, error: 'Opinion no encontrada' });
    console.log(`Opinion eliminada: ${req.params.id}`);
    res.json({ ok: true, mensaje: 'Opinion eliminada correctamente' });
  } catch (error) {
    console.error('Error al borrar opinion:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// =====================================================
// RUTA PRINCIPAL
// =====================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
