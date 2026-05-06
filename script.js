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

function actualizarWidgetTemperatura(data) {
  const tempValue = document.getElementById('tempValue');
  const tempLabel = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');
  const tempIcon = document.getElementById('tempIcon');
  const tempWidget = document.getElementById('tempWidget');

  if (tempValue) tempValue.textContent = `${data.temperatura || 0}°C`;
  if (tempLabel) tempLabel.textContent = data.estado || 'Sin estado';
  if (tempRecommendation) tempRecommendation.textContent = data.mensaje || '';

  const iconos = {
    'ÓPTIMO': '🟣',
    'CÁLIDO': '🟠',
    'EXTREMO CALOR': '🔴',
    'FRESCO': '🔵',
    'HELADA': '❄️'
  };
  if (tempIcon) tempIcon.textContent = iconos[data.estado] || '🌡️';

  if (tempWidget) {
    tempWidget.className = 'temp-widget reveal visible';
    if (data.estado) {
      tempWidget.classList.add(`temp-${data.estado.toLowerCase().replace(/ /g, '-')}`);
    }
  }
}

function mostrarTemperaturaFallback() {
  const tempValue = document.getElementById('tempValue');
  const tempLabel = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');

  if (tempValue) tempValue.textContent = '--°C';
  if (tempLabel) tempLabel.textContent = 'Sin conexión';
  if (tempRecommendation) tempRecommendation.textContent = '⚠️ Sin conexión con el servidor de la base de datos.';
}

async function obtenerEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/temperatura/estadisticas?dias=30`);
    const data = await response.json();
    
    const avgTemp = document.getElementById('avgTemp');
    const maxTemp = document.getElementById('maxTemp');
    const optimalDaysCounter = document.querySelector('#optimalDays .counter');

    if (avgTemp) avgTemp.textContent = `${data.promedio || 0}°C`;
    if (maxTemp) maxTemp.textContent = `${data.maxima || 0}°C`;
    if (optimalDaysCounter) {
      optimalDaysCounter.dataset.target = data.diasOptimos || 0;
      animateCounter(optimalDaysCounter, data.diasOptimos || 0);
    }
    
    return data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
  }
}

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
        <strong>Sin datos</strong>
        <span>Sin información disponible</span>
      `;
    }
  }
}

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
        <strong>Sin datos</strong>
        <span>Sin información disponible</span>
      `;
    }
  }
}

async function obtenerHistorialTemperatura(dias = 7) {
  try {
    const response = await fetch(`${API_URL}/temperatura/historial?dias=${dias}`);
    const data = await response.json();
    
    if (data && data.length > 0) {
      crearGraficoTemperatura(data);
    } else {
      crearGraficoTemperaturaFallback();
    }
    return data;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    crearGraficoTemperaturaFallback();
  }
}

function crearGraficoTemperatura(datos) {
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;

  if (tempChart) {
    tempChart.destroy();
  }

  const labels = datos.map(d => {
    const fecha = new Date(d.fecha);
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  });
  
  const temperaturas = datos.map(d => d.temperatura);

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
      }
    }
  });
}

function crearGraficoTemperaturaFallback() {
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;

  if (tempChart) {
    tempChart.destroy();
  }

  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Sin datos'],
      datasets: [{
        label: 'No hay datos registrados en la base de datos',
        data: [0],
        borderColor: '#9B88C6',
        backgroundColor: 'rgba(155, 136, 198, 0.1)',
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          min: 0,
          max: 40,
          ticks: {
            color: '#7B68A6'
          }
        },
        x: {
          ticks: {
            color: '#7B68A6'
          }
        }
      }
    }
  });
}

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
    statusText.textContent = 'API desconectada (Sin conexión a servidor)';
  }
}

async function enviarContacto() {
  const nombre = document.getElementById('contactName').value;
  const email = document.getElementById('contactEmail').value;
  const tipo = document.getElementById('contactType').value;

  if (!nombre || !email) {
    alert('Por favor completa todos los campos');
    return;
  }

  console.log('Enviando contacto:', { nombre, email, tipo });
  alert(`¡Gracias ${nombre}! Te contactaremos pronto a ${email}`);

  document.getElementById('contactName').value = '';
  document.getElementById('contactEmail').value = '';
  document.getElementById('contactType').selectedIndex = 0;
}

// ===== INICIALIZACIÓN =====
async function inicializarDatos() {
  console.log(' Iniciando aplicación del Huerto Escolar...');
  
  await obtenerTemperaturaActual();
  await obtenerEstadisticas();
  await obtenerRecomendacionesRiego();
  await obtenerEstadoFloracion();
  await obtenerHistorialTemperatura(7);
  
  console.log('✅ Datos cargados correctamente');
}

setInterval(async () => {
  console.log('🔄 Actualizando datos...');
  await obtenerTemperaturaActual();
  await obtenerEstadisticas();
}, 30000);

window.addEventListener('DOMContentLoaded', () => {
  inicializarDatos();
});

window.enviarContacto = enviarContacto;
