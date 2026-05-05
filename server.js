
Copiar

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
 
const app = express();
const PORT = process.env.PORT || 3000;
 
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
 
// Conexión a MongoDB
// IMPORTANTE: Reemplaza esta URL con tu string de conexión de MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/huerto_escolar';
 
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error de conexión a MongoDB:', err));
 
// Schema de Temperatura
const temperaturaSchema = new mongoose.Schema({
  temperatura: {
    type: Number,
    required: true
  },
  humedad: {
    type: Number,
    default: null
  },
  ubicacion: {
    type: String,
    default: 'Huerto Principal'
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});
 
const Temperatura = mongoose.model('Temperatura', temperaturaSchema);
 
// Schema de Plantas
const plantaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  tipo: {
    type: String,
    required: true
  },
  fechaPlantacion: {
    type: Date,
    default: Date.now
  },
  tempOptima: {
    min: Number,
    max: Number
  },
  estado: {
    type: String,
    enum: ['semilla', 'germinando', 'crecimiento', 'floracion', 'cosecha'],
    default: 'semilla'
  }
});
 
const Planta = mongoose.model('Planta', plantaSchema);
 
// ========== RUTAS DE API ==========
 
// GET - Obtener temperatura actual
app.get('/api/temperatura/actual', async (req, res) => {
  try {
    const tempActual = await Temperatura.findOne().sort({ fecha: -1 });
    
    if (!tempActual) {
      return res.json({
        temperatura: 22,
        humedad: 65,
        ubicacion: 'Huerto Principal',
        fecha: new Date(),
        estado: 'ÓPTIMO',
        mensaje: 'Condiciones ideales para lavanda'
      });
    }
 
    // Calcular estado según temperatura
    let estado = 'ÓPTIMO';
    let mensaje = 'Condiciones ideales para el cultivo';
    let color = 'purple';
 
    if (tempActual.temperatura >= 15 && tempActual.temperatura <= 25) {
      estado = 'ÓPTIMO';
      mensaje = '🟣 Temperatura perfecta para la lavanda';
      color = 'purple';
    } else if (tempActual.temperatura > 25 && tempActual.temperatura <= 30) {
      estado = 'CÁLIDO';
      mensaje = '🟠 Revisa el riego, hace calor';
      color = 'orange';
    } else if (tempActual.temperatura > 30) {
      estado = 'EXTREMO CALOR';
      mensaje = '🔴 Protege las plantas del calor excesivo';
      color = 'red';
    } else if (tempActual.temperatura < 15 && tempActual.temperatura >= 5) {
      estado = 'FRESCO';
      mensaje = '🔵 Temperatura baja, normal en invierno';
      color = 'blue';
    } else {
      estado = 'HELADA';
      mensaje = '❄️ Riesgo de helada, protege las plantas';
      color = 'cyan';
    }
 
    res.json({
      ...tempActual.toObject(),
      estado,
      mensaje,
      color
    });
 
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener temperatura', details: error.message });
  }
});
 
// GET - Historial de temperaturas
app.get('/api/temperatura/historial', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 7;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
 
    const historial = await Temperatura.find({
      fecha: { $gte: fechaLimite }
    }).sort({ fecha: 1 });
 
    res.json(historial);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
});
 
// POST - Registrar nueva temperatura
app.post('/api/temperatura', async (req, res) => {
  try {
    const { temperatura, humedad, ubicacion } = req.body;
 
    if (!temperatura) {
      return res.status(400).json({ error: 'La temperatura es requerida' });
    }
 
    const nuevaTemp = new Temperatura({
      temperatura,
      humedad: humedad || null,
      ubicacion: ubicacion || 'Huerto Principal'
    });
 
    await nuevaTemp.save();
    res.status(201).json(nuevaTemp);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar temperatura', details: error.message });
  }
});
 
// GET - Estadísticas de temperatura
app.get('/api/temperatura/estadisticas', async (req, res) => {
  try {
    const dias = parseInt(req.query.dias) || 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
 
    const temperaturas = await Temperatura.find({
      fecha: { $gte: fechaLimite }
    });
 
    if (temperaturas.length === 0) {
      return res.json({
        promedio: 22,
        maxima: 28,
        minima: 16,
        diasOptimos: 0,
        totalRegistros: 0
      });
    }
 
    const temps = temperaturas.map(t => t.temperatura);
    const promedio = temps.reduce((a, b) => a + b, 0) / temps.length;
    const maxima = Math.max(...temps);
    const minima = Math.min(...temps);
    const diasOptimos = temperaturas.filter(t => t.temperatura >= 15 && t.temperatura <= 25).length;
 
    res.json({
      promedio: promedio.toFixed(1),
      maxima,
      minima,
      diasOptimos,
      totalRegistros: temperaturas.length,
      periodo: `${dias} días`
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al calcular estadísticas', details: error.message });
  }
});
 
// GET - Recomendaciones de riego
app.get('/api/recomendaciones/riego', async (req, res) => {
  try {
    const tempActual = await Temperatura.findOne().sort({ fecha: -1 });
    const temp = tempActual ? tempActual.temperatura : 22;
 
    let recomendacion = '';
    let frecuencia = '';
    let cantidad = '';
 
    if (temp < 15) {
      recomendacion = 'Riego mínimo';
      frecuencia = 'Cada 10-14 días';
      cantidad = 'Muy poca agua, solo si el suelo está completamente seco';
    } else if (temp >= 15 && temp <= 25) {
      recomendacion = 'Riego moderado';
      frecuencia = 'Cada 7-10 días';
      cantidad = 'Riego ligero cuando los primeros 5cm de suelo estén secos';
    } else if (temp > 25 && temp <= 30) {
      recomendacion = 'Riego regular';
      frecuencia = 'Cada 5-7 días';
      cantidad = 'Revisa diariamente la humedad del suelo';
    } else {
      recomendacion = 'Riego cuidadoso';
      frecuencia = 'Cada 3-5 días';
      cantidad = 'Riega temprano en la mañana o al atardecer para evitar evaporación';
    }
 
    res.json({
      temperatura: temp,
      recomendacion,
      frecuencia,
      cantidad,
      consejo: 'La lavanda prefiere suelos secos. Es mejor regar poco que demasiado.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al generar recomendaciones', details: error.message });
  }
});
 
// GET - Estado de floración
app.get('/api/estado/floracion', async (req, res) => {
  try {
    const dias = 14; // Últimas 2 semanas
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - dias);
 
    const temperaturas = await Temperatura.find({
      fecha: { $gte: fechaLimite }
    });
 
    const tempPromedio = temperaturas.length > 0
      ? temperaturas.reduce((sum, t) => sum + t.temperatura, 0) / temperaturas.length
      : 20;
 
    let estado = '';
    let mensaje = '';
    let etapa = '';
 
    if (tempPromedio < 10) {
      estado = 'LATENCIA';
      etapa = 'invierno';
      mensaje = 'Las plantas están en periodo de descanso invernal';
    } else if (tempPromedio >= 10 && tempPromedio < 15) {
      estado = 'DESPERTAR';
      etapa = 'pre-primavera';
      mensaje = 'Las plantas comienzan a despertar, prepárate para la temporada';
    } else if (tempPromedio >= 15 && tempPromedio < 20) {
      estado = 'CRECIMIENTO';
      etapa = 'primavera';
      mensaje = 'Fase de crecimiento activo, las plantas desarrollan nuevo follaje';
    } else if (tempPromedio >= 20 && tempPromedio <= 25) {
      estado = 'FLORACIÓN ÓPTIMA';
      etapa = 'verano temprano';
      mensaje = '¡Temperatura perfecta para floración! Las flores liberan sus mejores aromas';
    } else {
      estado = 'POST-FLORACIÓN';
      etapa = 'verano tardío';
      mensaje = 'Fase de maduración de semillas y preparación para otoño';
    }
 
    res.json({
      temperaturaPromedio: tempPromedio.toFixed(1),
      estado,
      etapa,
      mensaje,
      diasAnalizado: dias
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al determinar estado de floración', details: error.message });
  }
});
 
// GET - Plantas registradas
app.get('/api/plantas', async (req, res) => {
  try {
    const plantas = await Planta.find().sort({ fechaPlantacion: -1 });
    res.json(plantas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener plantas', details: error.message });
  }
});
 
// POST - Registrar nueva planta
app.post('/api/plantas', async (req, res) => {
  try {
    const nuevaPlanta = new Planta(req.body);
    await nuevaPlanta.save();
    res.status(201).json(nuevaPlanta);
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar planta', details: error.message });
  }
});
 
// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
 
// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🌿 Servidor del Huerto Escolar corriendo en http://localhost:${PORT}`);
  console.log(`📡 API disponible en http://localhost:${PORT}/api`);
});
 
// Manejo de errores
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
});