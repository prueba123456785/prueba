
// ===== CONFIGURACIÓN DE API =====
const API_URL = 'http://localhost:3000/api';
let tempChart = null;
 
// ===== CURSOR =====
const cursor = document.getElementById('cursor');
const trail  = document.getElementById('cursorTrail');
let mx = 0, my = 0, tx = 0, ty = 0;
 
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
 
function animateTrail() {
  tx += (mx - tx) * 0.14;
  ty += (my - ty) * 0.14;
  trail.style.left = tx + 'px';
  trail.style.top  = ty + 'px';
  requestAnimationFrame(animateTrail);
}
animateTrail();
 
document.querySelectorAll('a, button, input, select').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(2)';
    trail.style.opacity = '0.2';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    trail.style.opacity = '0.5';
  });
});
 
// ===== NAVBAR SCROLL =====
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});
 
// ===== PARTICLES =====
const pContainer = document.getElementById('particles');
const colors = ['#E8E4F3','#D0C8E6','#B5A8D6','#9B88C6','#7B68A6'];
for (let i = 0; i < 28; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  const size = Math.random() * 10 + 4;
  p.style.cssText = `
    width:${size}px; height:${size}px;
    left:${Math.random()*100}%;
    background:${colors[Math.floor(Math.random()*colors.length)]};
    animation-duration:${Math.random()*15+10}s;
    animation-delay:-${Math.random()*15}s;
  `;
  pContainer.appendChild(p);
}
 
// ===== REVEAL ON SCROLL =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(r => observer.observe(r));
 
// ===== COUNTER ANIMATION =====
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const step = (ts) => {
    if (!start) start = ts;
    const progress = Math.min((ts - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(ease * target).toLocaleString('es-MX');
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target.toLocaleString('es-MX');
  };
  requestAnimationFrame(step);
}
 
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.done) {
      e.target.dataset.done = '1';
      animateCounter(e.target, parseInt(e.target.dataset.target));
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.stat-num, .counter').forEach(el => counterObs.observe(el));
 
// ===== HAMBURGER =====
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');
hamburger.addEventListener('click', () => {
  const open = navLinks.style.display === 'flex';
  navLinks.style.cssText = open ? 'display:none' : `
    display:flex; position:absolute; top:70px; right:1.5rem;
    flex-direction:column; background:#f8f4ef; padding:1.5rem;
    border-radius:16px; box-shadow:0 8px 30px rgba(107,104,166,0.15);
    gap:1rem; z-index:999;
  `;
});
 
// ===== ACTIVE NAV SECTION =====
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
  navItems.forEach(a => {
    a.style.color = a.getAttribute('href') === '#' + current ? '#7B68A6' : '';
  });
});
 
// ===== CARD 3D TILT =====
document.querySelectorAll('.card, .team-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width  - 0.5;
    const y = (e.clientY - r.top)  / r.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${-y*8}deg) rotateY(${x*8}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});
 
// ========== API FUNCTIONS ==========
 
// Función para obtener temperatura actual
async function obtenerTemperaturaActual() {
  try {
    const response = await fetch(`${API_URL}/temperatura/actual`);
    const data = await response.json();
    
    actualizarWidgetTemperatura(data);
    actualizarEstadoAPI(true);
    return data;
  } catch (error) {
    console.error('Error al obtener temperatura:', error);
    actualizarEstadoAPI(false);
    mostrarTemperaturaFallback();
  }
}
 
// Actualizar widget de temperatura en hero
function actualizarWidgetTemperatura(data) {
  const tempValue = document.getElementById('tempValue');
  const tempLabel = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');
  const tempIcon = document.getElementById('tempIcon');
  const tempWidget = document.getElementById('tempWidget');
 
  if (tempValue) tempValue.textContent = `${data.temperatura}°C`;
  if (tempLabel) tempLabel.textContent = data.estado;
  if (tempRecommendation) tempRecommendation.textContent = data.mensaje;
 
  // Cambiar icono según temperatura
  const iconos = {
    'ÓPTIMO': '🟣',
    'CÁLIDO': '🟠',
    'EXTREMO CALOR': '🔴',
    'FRESCO': '🔵',
    'HELADA': '❄️'
  };
  if (tempIcon) tempIcon.textContent = iconos[data.estado] || '🌡️';
 
  // Cambiar color del widget
  if (tempWidget) {
    tempWidget.className = 'temp-widget reveal visible';
    tempWidget.classList.add(`temp-${data.estado.toLowerCase().replace(/ /g, '-')}`);
  }
}
 
// Mostrar datos de respaldo si falla la API
function mostrarTemperaturaFallback() {
  const tempValue = document.getElementById('tempValue');
  const tempLabel = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');
 
  if (tempValue) tempValue.textContent = '22°C';
  if (tempLabel) tempLabel.textContent = 'SIMULADO';
  if (tempRecommendation) tempRecommendation.textContent = '⚠️ Datos de ejemplo (API no disponible)';
}
 
// Obtener estadísticas de temperatura
async function obtenerEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/temperatura/estadisticas?dias=30`);
    const data = await response.json();
    
    const avgTemp = document.getElementById('avgTemp');
    const maxTemp = document.getElementById('maxTemp');
    const optimalDaysCounter = document.querySelector('#optimalDays .counter');
 
    if (avgTemp) avgTemp.textContent = `${data.promedio}°C`;
    if (maxTemp) maxTemp.textContent = `${data.maxima}°C`;
    if (optimalDaysCounter) {
      optimalDaysCounter.dataset.target = data.diasOptimos;
      animateCounter(optimalDaysCounter, data.diasOptimos);
    }
 
    return data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
}
 
// Obtener recomendaciones de riego
async function obtenerRecomendacionesRiego() {
  try {
    const response = await fetch(`${API_URL}/recomendaciones/riego`);
    const data = await response.json();
    
    const riegoInfo = document.getElementById('riegoInfo');
    if (riegoInfo) {
      riegoInfo.innerHTML = `
        <strong>${data.recomendacion}</strong>
        <span>${data.frecuencia} — ${data.cantidad}</span>
      `;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener recomendaciones:', error);
    const riegoInfo = document.getElementById('riegoInfo');
    if (riegoInfo) {
      riegoInfo.innerHTML = `
        <strong>Riego moderado</strong>
        <span>Cada 7-10 días (datos de ejemplo)</span>
      `;
    }
  }
}
 
// Obtener estado de floración
async function obtenerEstadoFloracion() {
  try {
    const response = await fetch(`${API_URL}/estado/floracion`);
    const data = await response.json();
    
    const floracionInfo = document.getElementById('floracionInfo');
    if (floracionInfo) {
      floracionInfo.innerHTML = `
        <strong>${data.estado}</strong>
        <span>${data.mensaje}</span>
      `;
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener estado de floración:', error);
    const floracionInfo = document.getElementById('floracionInfo');
    if (floracionInfo) {
      floracionInfo.innerHTML = `
        <strong>CRECIMIENTO</strong>
        <span>Fase de desarrollo activo (datos de ejemplo)</span>
      `;
    }
  }
}
 
// Obtener historial de temperaturas para gráfico
async function obtenerHistorialTemperatura(dias = 7) {
  try {
    const response = await fetch(`${API_URL}/temperatura/historial?dias=${dias}`);
    const data = await response.json();
    
    crearGraficoTemperatura(data);
    return data;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    crearGraficoTemperaturaFallback();
  }
}
 
// Crear gráfico de temperatura con Chart.js
function crearGraficoTemperatura(datos) {
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;
 
  // Destruir gráfico anterior si existe
  if (tempChart) {
    tempChart.destroy();
  }
 
  // Preparar datos
  const labels = datos.map(d => {
    const fecha = new Date(d.fecha);
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  });
  
  const temperaturas = datos.map(d => d.temperatura);
 
  // Crear gráfico
  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperatura (°C)',
        data: temperaturas,
        borderColor: '#9B88C6',
        backgroundColor: 'rgba(155, 136, 198, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7B68A6',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(123, 104, 166, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `${context.parsed.y}°C`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          min: 0,
          max: 40,
          grid: {
            color: 'rgba(155, 136, 198, 0.1)',
            drawBorder: false
          },
          ticks: {
            color: '#7B68A6',
            callback: function(value) {
              return value + '°C';
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#7B68A6'
          }
        }
      },
      annotation: {
        annotations: [{
          type: 'box',
          yMin: 15,
          yMax: 25,
          backgroundColor: 'rgba(155, 136, 198, 0.1)',
          borderWidth: 0,
          label: {
            content: 'Zona óptima',
            enabled: true
          }
        }]
      }
    }
  });
}
 
// Crear gráfico de respaldo con datos de ejemplo
function crearGraficoTemperaturaFallback() {
  const datosEjemplo = [
    { fecha: new Date(Date.now() - 6*24*60*60*1000), temperatura: 18 },
    { fecha: new Date(Date.now() - 5*24*60*60*1000), temperatura: 21 },
    { fecha: new Date(Date.now() - 4*24*60*60*1000), temperatura: 23 },
    { fecha: new Date(Date.now() - 3*24*60*60*1000), temperatura: 22 },
    { fecha: new Date(Date.now() - 2*24*60*60*1000), temperatura: 20 },
    { fecha: new Date(Date.now() - 1*24*60*60*1000), temperatura: 24 },
    { fecha: new Date(), temperatura: 22 }
  ];
  
  crearGraficoTemperatura(datosEjemplo);
}
 
// Actualizar estado de conexión con API
function actualizarEstadoAPI(conectado) {
  const apiStatus = document.getElementById('apiStatus');
  if (!apiStatus) return;
 
  const statusDot = apiStatus.querySelector('.status-dot');
  const statusText = apiStatus.querySelector('.status-text');
 
  if (conectado) {
    statusDot.style.background = '#52b788';
    statusText.textContent = 'API conectada';
  } else {
    statusDot.style.background = '#ff6b6b';
    statusText.textContent = 'API desconectada (datos de ejemplo)';
  }
}
 
// Función para enviar formulario de contacto
async function enviarContacto() {
  const nombre = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const tipo = document.getElementById('contactType').value;
 
  if (!nombre || !email) {
    alert('Por favor completa todos los campos');
    return;
  }
 
  // Aquí podrías hacer un POST a tu API para guardar el contacto
  console.log('Enviando contacto:', { nombre, email, tipo });
  
  alert(`¡Gracias ${nombre}! Te contactaremos pronto a ${email}`);
  
  // Limpiar formulario
  document.getElementById('contactName').value = '';
  document.getElementById('contactEmail').value = '';
  document.getElementById('contactType').selectedIndex = 0;
}
 
// ===== INICIALIZACIÓN =====
async function inicializarDatos() {
  console.log('🌿 Iniciando aplicación del Huerto Escolar...');
  
  // Cargar todos los datos de la API
  await obtenerTemperaturaActual();
  await obtenerEstadisticas();
  await obtenerRecomendacionesRiego();
  await obtenerEstadoFloracion();
  await obtenerHistorialTemperatura(7);
  
  console.log('✅ Datos cargados correctamente');
}
 
// Actualizar datos cada 30 segundos
setInterval(async () => {
  console.log('🔄 Actualizando datos...');
  await obtenerTemperaturaActual();
  await obtenerEstadisticas();
}, 30000);
 
// Iniciar cuando la página cargue
window.addEventListener('DOMContentLoaded', () => {
  inicializarDatos();
});
 
// Exponer función de contacto globalmente
window.enviarContacto = enviarContacto;