const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// ==========================================
// CONEXIÓN A MONGODB ATLAS (REGRESAMOS A ClimasHuerto)
// ==========================================
const mongoURI = 'mongodb+srv://yael24571_db_user:y12345@cluster0.86hmorz.mongodb.net/ClimasHuerto?appName=Cluster0';

mongoose.connect(mongoURI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas (ClimasHuerto)"))
  .catch(err => console.log("❌ Error:", err));

// ==========================================
// MODELOS DE DATOS (SCHEMAS)
// ==========================================

// 1. Schema para el clima (Apuntando a 'Climas' con C mayúscula, donde están tus 7 datos)
const climaSchema = new mongoose.Schema({
    fecha: String, 
    temperatura: Number
}, { 
    collection: 'Climas' 
});
const Clima = mongoose.model('Clima', climaSchema);

// 2. Schema para las imágenes del Carrusel (Apuntando a la nueva 'Images' que creaste)
const fotoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  titulo: { type: String },
  descripcion: { type: String }
}, {
  collection: 'Images' 
});
const Foto = mongoose.model('Foto', fotoSchema);


// Función auxiliar para obtener la fecha
const obtenerFechaString = (diasAtras = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
};

// ==========================================
// RUTAS DE LA API
// ==========================================

// Obtener temperatura actual
app.get('/api/temperatura/actual', async (req, res) => {
  try {
    const ultimoRegistro = await Clima.findOne().sort({ fecha: -1 });
    
    if (!ultimoRegistro) {
      return res.json({ temperatura: 22, fecha: obtenerFechaString(), estado: 'S/D', mensaje: 'Sin datos en Atlas' });
    }

    let estado = 'ÓPTIMO';
    let mensaje = '🟣 Temperatura ideal';
    if (ultimoRegistro.temperatura > 25) { estado = 'CÁLIDO'; mensaje = '🟠 Hace calor'; }
    if (ultimoRegistro.temperatura < 15) { estado = 'FRESCO'; mensaje = '🔵 Temperatura baja'; }

    res.json({
      temperatura: ultimoRegistro.temperatura,
      fecha: ultimoRegistro.fecha,
      estado,
      mensaje
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial
app.get('/api/temperatura/historial', async (req, res) => {
  try {
    // Al ordenar por fecha, la gráfica se dibujará en el orden correcto
    const historial = await Clima.find({}).sort({ fecha: 1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Estadísticas
app.get('/api/temperatura/estadisticas', async (req, res) => {
  try {
    const datos = await Clima.find({});
    if (datos.length === 0) return res.json({ promedio: 0, maxima: 0, minima: 0, diasOptimos: 0 });

    const temps = datos.map(d => d.temperatura);
    const promedio = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
    const maxima = Math.max(...temps);
    const minima = Math.min(...temps);
    const diasOptimos = datos.filter(d => d.temperatura >= 15 && d.temperatura <= 25).length;

    res.json({ promedio, maxima, minima, diasOptimos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Recomendaciones
app.get('/api/recomendaciones/riego', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });
    const temp = ultimo ? ultimo.temperatura : 22;

    let riego = { recomendacion: 'Riego moderado', frecuencia: 'Cada 7 días', cantidad: 'Normal' };
    if (temp > 25) riego = { recomendacion: 'Riego frecuente', frecuencia: 'Cada 2-3 días', cantidad: 'Abundante' };
    if (temp < 15) riego = { recomendacion: 'Riego escaso', frecuencia: 'Cada 12 días', cantidad: 'Mínima' };

    res.json(riego);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Floración
app.get('/api/estado/floracion', async (req, res) => {
  try {
    const ultimo = await Clima.findOne().sort({ fecha: -1 });
    const temp = ultimo ? ultimo.temperatura : 22;

    let flor = { estado: 'CRECIMIENTO', mensaje: 'Desarrollo de hojas activo' };
    if (temp >= 20 && temp <= 25) flor = { estado: 'FLORACIÓN', mensaje: '¡Momento ideal para las flores!' };

    res.json(flor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener las imágenes para tu Carrusel
app.get('/api/fotos', async (req, res) => {
  try {
    const fotos = await Foto.find();
    res.json(fotos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Servir la web
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
