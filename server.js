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
app.use(express.static('./'));

// ==========================================
// CONEXIÓN A MONGODB ATLAS
// ==========================================
const mongoURI = 'mongodb+srv://yael24571_db_user:y12345@cluster0.86hmorz.mongodb.net/ClimasHuerto?appName=Cluster0';
const port = process.env.PORT || 3000;

mongoose.connect(mongoURI)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch(err => console.log("Error:", err));

// ==========================================
// MODELOS DE DATOS (SCHEMAS)
// ==========================================

// Schema para la colección de Climas del huerto
const climaSchema = new mongoose.Schema({
    fecha: String, 
    temperatura: Number
}, { 
    collection: 'Climas' 
});

const Clima = mongoose.model('Clima', climaSchema);

// Schema de Plantas
const plantaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, required: true },
  fechaPlantacion: { type: Date, default: Date.now },
  tempOptima: { min: Number, max: Number },
  estado: {
    type: String,
    enum: ['semilla', 'germinando', 'crecimiento', 'floracion', 'cosecha'],
    default: 'semilla'
  }
});

const Planta = mongoose.model('Planta', plantaSchema);

// Función auxiliar para obtener la fecha en formato "YYYY-MM-DD"
const obtenerFechaString = (diasAtras = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
};

// ==========================================
// RUTAS DE LA API
// ==========================================

// 1. Obtener temperatura actual
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

// 2. Obtener historial para el gráfico (últimos 7 días)
app.get('/api/temperatura/historial', async (req, res) => {
  try {
    const historial = await Clima.find({}).sort({ fecha: 1 });
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Registrar nueva temperatura
app.post('/api/temperatura', async (req, res) => {
  try {
    const { temperatura, fecha } = req.body;
    const nuevoClima = new Clima({
      temperatura,
      fecha: fecha || obtenerFechaString()
    });
    await nuevoClima.save();
    res.status(201).json(nuevoClima);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Estadísticas (Promedio, Max, Min)
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

// 5. Recomendaciones de Riego
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

// 6. Estado de Floración
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

// 7. Rutas de Plantas
app.get('/api/plantas', async (req, res) => {
  const plantas = await Planta.find();
  res.json(plantas);
});

// Servir la página web principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// INICIAR SERVIDOR
// ==========================================
app.listen(PORT, () => {
  console.log(` Servidor corriendo en http://localhost:${PORT}`);
});
