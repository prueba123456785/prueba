'use strict';

const API_URL = '/api';
let tempChart = null;

function initParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  const colors = ['#E8E4F3', '#D0C8E6', '#B5A8D6', '#9B88C6', '#7B68A6'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 10 + 4;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      background:${colors[Math.floor(Math.random() * colors.length)]};
      animation-duration:${Math.random() * 15 + 10}s;
      animation-delay:-${Math.random() * 15}s;
    `;
    container.appendChild(p);
  }
}

function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.querySelector('.nav-links');
  const sections  = document.querySelectorAll('section[id]');
  const navItems  = document.querySelectorAll('.nav-links a');

  if (!navbar) return;

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    let current = '';
    sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
    navItems.forEach(a => {
      a.style.color = a.getAttribute('href') === '#' + current ? '#7B68A6' : '';
    });
  });

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav-open');
      if (isOpen) {
        navLinks.style.cssText = `
          display:flex; position:absolute; top:70px; right:1.5rem;
          flex-direction:column; background:#f8f4ef; padding:1.5rem;
          border-radius:16px; box-shadow:0 8px 30px rgba(107,104,166,0.15);
          gap:1rem; z-index:999;
        `;
      } else {
        navLinks.style.display = 'none';
      }
    });
  }
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(r => observer.observe(r));
}

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

function initCounters() {
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting && !e.target.dataset.done) {
        e.target.dataset.done = '1';
        animateCounter(e.target, parseInt(e.target.dataset.target));
      }
    });
  }, { threshold: 0.3 });
  document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));
}

function initCardTilt() {
  document.querySelectorAll('.card, .team-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

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
  const tempValue          = document.getElementById('tempValue');
  const tempLabel          = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');
  const tempIcon           = document.getElementById('tempIcon');
  const tempWidget         = document.getElementById('tempWidget');

  if (tempValue) tempValue.textContent = `${data.temperatura || 0}°C`;
  if (tempLabel) tempLabel.textContent = data.estado || 'Sin estado';
  if (tempRecommendation) tempRecommendation.textContent = data.mensaje || '';

  const iconos = {
    'OPTIMO':       '&#128994;',
    'CALIDO':       '&#128992;',
    'EXTREMO CALOR':'&#128308;',
    'FRESCO':       '&#128309;',
    'HELADA':       '&#10052;'
  };
  if (tempIcon) tempIcon.innerHTML = iconos[data.estado] || '&#127777;';

  if (tempWidget) {
    tempWidget.className = 'temp-widget reveal visible';
    if (data.estado) {
      tempWidget.classList.add(`temp-${data.estado.toLowerCase().replace(/ /g, '-')}`);
    }
  }
}

function mostrarTemperaturaFallback() {
  const tempValue          = document.getElementById('tempValue');
  const tempLabel          = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');
  if (tempValue) tempValue.textContent = '--°C';
  if (tempLabel) tempLabel.textContent = 'Sin conexion';
  if (tempRecommendation) tempRecommendation.textContent = 'Sin conexion con el servidor.';
}

async function obtenerEstadisticas() {
  try {
    const response = await fetch(`${API_URL}/temperatura/estadisticas?dias=30`);
    const data = await response.json();
    const avgTemp  = document.getElementById('avgTemp');
    const maxTemp  = document.getElementById('maxTemp');
    const optimalDaysCounter = document.querySelector('#optimalDays .counter');
    if (avgTemp) avgTemp.textContent = `${data.promedio || 0}°C`;
    if (maxTemp) maxTemp.textContent = `${data.maxima  || 0}°C`;
    if (optimalDaysCounter) {
      optimalDaysCounter.dataset.target = data.diasOptimos || 0;
      animateCounter(optimalDaysCounter, data.diasOptimos || 0);
    }
    return data;
  } catch (error) {
    console.error('Error al obtener estadisticas:', error);
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
    if (riegoInfo) riegoInfo.innerHTML = '<strong>Sin datos</strong><span>Sin informacion disponible</span>';
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
    console.error('Error al obtener floracion:', error);
    const floracionInfo = document.getElementById('floracionInfo');
    if (floracionInfo) floracionInfo.innerHTML = '<strong>Sin datos</strong><span>Sin informacion disponible</span>';
  }
}

async function obtenerHistorialTemperatura(dias = 7) {
  try {
    const response = await fetch(`${API_URL}/temperatura/historial?dias=${dias}`);
    const data = await response.json();
    if (data && data.length > 0) crearGraficoTemperatura(data);
    else crearGraficoTemperaturaFallback();
    return data;
  } catch (error) {
    console.error('Error al obtener historial:', error);
    crearGraficoTemperaturaFallback();
  }
}

function crearGraficoTemperatura(datos) {
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;
  if (tempChart) { tempChart.destroy(); tempChart = null; }

  const labels = datos.map(d => {
    const fecha = new Date(d.fecha);
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  });

  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Temperatura (°C)',
        data: datos.map(d => d.temperatura),
        borderColor: '#9B88C6',
        backgroundColor: 'rgba(155,136,198,0.1)',
        borderWidth: 3, fill: true, tension: 0.4,
        pointBackgroundColor: '#7B68A6', pointBorderColor: '#fff',
        pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(123,104,166,0.9)', titleColor: '#fff',
          bodyColor: '#fff', padding: 12, cornerRadius: 8, displayColors: false,
          callbacks: { label: ctx => `${ctx.parsed.y}°C` }
        }
      },
      scales: {
        y: {
          beginAtZero: false, min: 0, max: 40,
          grid: { color: 'rgba(155,136,198,0.1)', drawBorder: false },
          ticks: { color: '#7B68A6', callback: v => v + '°C' }
        },
        x: { grid: { display: false }, ticks: { color: '#7B68A6' } }
      }
    }
  });
}

function crearGraficoTemperaturaFallback() {
  const ctx = document.getElementById('tempChart');
  if (!ctx) return;
  if (tempChart) { tempChart.destroy(); tempChart = null; }
  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Sin datos'],
      datasets: [{
        label: 'No hay datos registrados',
        data: [0],
        borderColor: '#9B88C6',
        backgroundColor: 'rgba(155,136,198,0.1)'
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { min: 0, max: 40, ticks: { color: '#7B68A6' } },
        x: { ticks: { color: '#7B68A6' } }
      }
    }
  });
}

async function inicializarCarrusel() {
  try {
    const response = await fetch(`${API_URL}/fotos`);
    const fotos = await response.json();
    const track = document.getElementById('carouselTrack');
    if (!track) return;

    if (fotos && fotos.length > 0) {
      track.innerHTML = '';
      fotos.forEach(foto => {
        const li = document.createElement('li');
        li.className = 'carousel-slide';
        li.innerHTML = `
          <img src="${foto.url || 'https://via.placeholder.com/800x450'}" alt="${foto.titulo || 'Foto'}" class="carousel-image">
          <div class="slide-caption">
            <h4>${foto.titulo || 'Sin titulo'}</h4>
            <p>${foto.descripcion || ''}</p>
          </div>
        `;
        track.appendChild(li);
      });
      iniciarLogicaCarrusel('carouselTrack', 'carouselPrev', 'carouselNext', fotos.length);
    } else {
      track.innerHTML = '<li class="carousel-slide"><div class="slide-placeholder">No hay fotos en la galeria todavia.</div></li>';
    }
  } catch (error) {
    console.error('Error al cargar carrusel:', error);
    const track = document.getElementById('carouselTrack');
    if (track) track.innerHTML = '<li class="carousel-slide"><div class="slide-placeholder">Error de conexion con la galeria.</div></li>';
  }
}

function iniciarLogicaCarrusel(trackId, prevId, nextId, totalSlides) {
  const track   = document.getElementById(trackId);
  const btnPrev = document.getElementById(prevId);
  const btnNext = document.getElementById(nextId);
  if (!track || totalSlides <= 1) return;

  let currentIdx = 0;

  const moverA = (index) => {
    currentIdx = ((index % totalSlides) + totalSlides) % totalSlides;
    track.style.transform = `translateX(${-(currentIdx * 100)}%)`;
  };

  let timer = setInterval(() => moverA(currentIdx + 1), 5000);

  if (btnPrev) btnPrev.addEventListener('click', () => {
    clearInterval(timer);
    moverA(currentIdx - 1);
    timer = setInterval(() => moverA(currentIdx + 1), 5000);
  });
  if (btnNext) btnNext.addEventListener('click', () => {
    clearInterval(timer);
    moverA(currentIdx + 1);
    timer = setInterval(() => moverA(currentIdx + 1), 5000);
  });
}

async function inicializarCarruselProcedimiento() {
  try {
    const response = await fetch(`${API_URL}/procedimiento`);
    const fotos = await response.json();
    const track = document.getElementById('procCarouselTrack');
    const thumbsContainer = document.getElementById('procThumbnails');
    if (!track) return;

    if (fotos && fotos.length > 0) {
      track.innerHTML = '';
      if (thumbsContainer) thumbsContainer.innerHTML = '';

      fotos.forEach((foto, i) => {
        const li = document.createElement('li');
        li.className = 'carousel-slide';
        li.innerHTML = `
          <img src="${foto.url || 'https://via.placeholder.com/800x480'}" alt="${foto.titulo || 'Paso ' + (i+1)}" class="carousel-image">
          <div class="slide-caption">
            <span class="proc-step-badge">Paso ${i + 1}</span>
            <h4>${foto.titulo || 'Sin titulo'}</h4>
            <p>${foto.descripcion || ''}</p>
          </div>
        `;
        track.appendChild(li);

        if (thumbsContainer) {
          const thumb = document.createElement('div');
          thumb.className = 'proc-thumb';
          thumb.dataset.index = i;
          thumb.innerHTML = `
            <img src="${foto.url}" alt="${foto.titulo || 'Paso ' + (i+1)}">
            <span>Paso ${i + 1}</span>
          `;
          thumb.addEventListener('click', () => {
            irAPasoProc(i, fotos.length);
            document.querySelectorAll('.proc-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
          });
          if (i === 0) thumb.classList.add('active');
          thumbsContainer.appendChild(thumb);
        }
      });

      iniciarLogicaCarrusel('procCarouselTrack', 'procCarouselPrev', 'procCarouselNext', fotos.length);
    } else {
      track.innerHTML = `
        <li class="carousel-slide">
          <div class="slide-placeholder">Aun no hay imagenes del procedimiento. Agregalas desde el panel de administracion.</div>
        </li>
      `;
      if (thumbsContainer) thumbsContainer.innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar procedimiento:', error);
    const track = document.getElementById('procCarouselTrack');
    if (track) track.innerHTML = '<li class="carousel-slide"><div class="slide-placeholder">Error de conexion.</div></li>';
  }
}

function irAPasoProc(index, total) {
  const track = document.getElementById('procCarouselTrack');
  if (!track) return;
  const idx = ((index % total) + total) % total;
  track.style.transform = `translateX(${-(idx * 100)}%)`;
}

const flowData = {
  inicio: {
    icon: '&#127807;',
    title: 'Inicio del proyecto',
    desc: 'El proyecto Huerto Escolar La Lavanda comenzo con la idea de combinar educacion ambiental, agricultura sostenible en un espacio escolar.',
    items: ['Planeacion del proyecto por el equipo', 'Seleccion del cultivo: lavanda', 'Gestion de recursos y materiales', 'Formacion de equipos de trabajo']
  },
  suelo: {
    icon: '&#9878;',
    title: 'Analisis del area',
    desc: 'Antes de plantar, analizamos las propiedades del suelo para garantizar condiciones optimas de crecimiento para la lavanda.',
    items: ['Medicion de pH (optimo: 6.5 - 7.5)', 'Evaluacion de drenaje y textura', 'Si pH bajo: se agrega cal agricola', 'Si pH optimo: se procede directamente']
  },
  preparacion: {
    icon: '&#128247;',
    title: 'Preparacion',
    desc: 'Con los resultados del analisis preparamos el terreno con compost organico y ajustamos las condiciones para maximizar el desarrollo de la lavanda.',
    items: ['Mezcla con compost organico (30%)', 'Aireacion y volteo del suelo', 'Nivelacion de las camas de cultivo', 'Instalacion del sistema de riego por goteo']
  },
  sensores: {
    icon: '&#128268;',
    title: 'Instalacion del sistema de riego',
    desc: 'Colocamos un sistema de riego automatico',
    items: ['Perforación de la tapa o base para regular la salida de agua.', 'Fijación de la botella en la tierra junto a la planta.', 'Llenado de agua y ajuste del goteo constante.', 'Recolección y limpieza de botellas de plástico reutilizables.']
  },
  plantacion: {
    icon: '&#127807;',
    title: 'Plantacion de lavanda',
    desc: 'Cada equipo de estudiantes planta y adopta su seccion del huerto, registrando el progreso semanal con fotografias y datos.',
    items: ['Variedad: Lavandula angustifolia', 'Espaciado: 40 cm entre plantas', '67 plantas en total', 'Registro fotografico semanal']
  },
  monitoreo: {
    icon: '&#128200;',
    title: 'Monitoreo semanal',
    desc: 'Revisamos los datos semanalmente. Si las condiciones no son optimas, ajustamos el riego y los cuidados.',
    items: ['Temperatura optima: 15 - 25 C', 'Si condiciones incorrectas: ajuste de riego', 'Si condiciones OK: se continua normalmente', 'Registro en bitacora escolar']
  },
  cosecha: {
    icon: '&#9986;',
    title: 'Cosecha',
    desc: 'Cuando la lavanda alcanza su punto de floracion, realizamos la cosecha con tecnicas manuales aprendidas durante el proceso.',
    items: ['Cosecha a inicio de floracion', 'Tecnica de corte correcto', 'Secado natural en espacios ventilados', 'Clasificacion por calidad']
  },
  productos: {
    icon: '&#127801;',
    title: 'Productos y analisis final',
    desc: 'Con la lavanda cosechada elaboramos productos artesanales para la comunidad escolar y realizamos el analisis final del proyecto.',
    items: ['Jarabe artesanal de lavanda para cafe', 'Sachets aromaticos', 'Aceites esenciales', 'Informe final y presentacion de resultados']
  }
};

function initFlowchart() {
  const panel      = document.getElementById('flowDetailPanel');
  const panelTitle = document.getElementById('flowDetailTitle');
  const panelDesc  = document.getElementById('flowDetailDesc');
  const panelList  = document.getElementById('flowDetailList');
  const panelIcon  = document.getElementById('flowDetailIcon');
  const closeBtn   = document.getElementById('flowDetailClose');

  if (!panel) return;

  document.querySelectorAll('.flow-node[data-step]').forEach(node => {
    node.addEventListener('click', () => {
      const step = node.dataset.step;
      const data = flowData[step];
      if (!data) return;

      document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('flow-active'));
      node.classList.add('flow-active');

      panelIcon.innerHTML  = data.icon;
      panelTitle.textContent = data.title;
      panelDesc.textContent  = data.desc;
      panelList.innerHTML    = data.items.map(item => `<li>${item}</li>`).join('');
      panel.classList.remove('hidden');

      if (window.innerWidth < 700) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.add('hidden');
      document.querySelectorAll('.flow-node').forEach(n => n.classList.remove('flow-active'));
    });
  }
}

// =====================================================
// DOCUMENTOS PUBLICOS
// =====================================================
async function cargarDocumentosPublicos() {
  const contenedor = document.getElementById('listaDocumentosPublicos');
  if (!contenedor) return;
  try {
    const respuesta = await fetch('/api/documentos');
    if (!respuesta.ok) throw new Error('Error al obtener documentos');
    const docs = await respuesta.json();

    if (docs.length === 0) {
      contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay documentos disponibles aun.</p>';
      return;
    }
    contenedor.innerHTML = '';
    docs.forEach(doc => {
      const a = document.createElement('a');
      a.className = 'doc-card';
      a.href   = `/ver-documento/${doc._id}`;
      a.target = '_blank';
      a.rel    = 'noopener noreferrer';

      let icon  = 'fa-file-alt';
      let label = 'Abrir archivo';
      const mime = (doc.tipoArchivo || '').toLowerCase();
      const name = (doc.nombreArchivo || '').toLowerCase();

      if (mime === 'application/pdf' || name.endsWith('.pdf')) {
        icon = 'fa-file-pdf'; label = 'Abrir PDF';
      } else if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
        icon = 'fa-file-excel'; label = 'Descargar Excel';
      } else if (mime.includes('word') || mime.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) {
        icon = 'fa-file-word'; label = 'Descargar Word';
      }

      a.innerHTML = `
        <i class="fas ${icon} doc-icon"></i>
        <div class="doc-info">
          <h4>${doc.titulo || 'Documento sin titulo'}</h4>
          <span>${label}</span>
        </div>
      `;
      contenedor.appendChild(a);
    });
  } catch (error) {
    contenedor.innerHTML = '<p style="color:#6b7280;">Aun no hay conexion con la base de datos.</p>';
  }
}

// =====================================================
// API STATUS
// =====================================================
function actualizarEstadoAPI(conectado) {
  const apiStatus = document.getElementById('apiStatus');
  if (!apiStatus) return;
  const dot  = apiStatus.querySelector('.status-dot');
  const text = apiStatus.querySelector('.status-text');
  if (conectado) {
    dot.style.background  = '#52b788';
    text.textContent = 'API conectada';
  } else {
    dot.style.background  = '#ff6b6b';
    text.textContent = 'API desconectada';
  }
}

// =====================================================
// NOTIFICACION VISUAL
// =====================================================
function mostrarNotificacion(texto, tipo = 'success') {
  const existente = document.getElementById('toastNotif');
  if (existente) existente.remove();

  const toast = document.createElement('div');
  toast.id = 'toastNotif';
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%);
    background: ${tipo === 'success' ? '#5a4a7a' : '#ef4444'};
    color: #fff; padding: 1rem 2rem; border-radius: 50px;
    font-family: 'DM Sans', sans-serif; font-size: 0.95rem;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2); z-index: 99999;
    animation: toastIn 0.4s ease; max-width: 90vw; text-align: center;
  `;
  toast.textContent = texto;

  const style = document.createElement('style');
  style.textContent = `@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(20px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`;
  document.head.appendChild(style);

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.4s';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// =====================================================
// FORMULARIO OPINION
// FIX 2: stopPropagation en inputs para que el juego
// no consuma Espacio cuando el usuario escribe
// =====================================================
function initOpinionForm() {
  let ratingSelected = 5;

  const stars = document.querySelectorAll('.rating-star');
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val);
      stars.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.val) <= val);
      });
    });
    star.addEventListener('mouseleave', () => {
      stars.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.val) <= ratingSelected);
      });
    });
    star.addEventListener('click', () => {
      ratingSelected = parseInt(star.dataset.val);
      stars.forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.val) <= ratingSelected);
      });
    });
  });

  // Marcar todas activas por defecto
  stars.forEach(s => s.classList.add('active'));

  // Evitar que el juego consuma teclas cuando el usuario escribe en los inputs
  ['opinionNombre', 'opinionRol', 'opinionTexto'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => e.stopPropagation());
  });

  const btnEnviar = document.getElementById('btnEnviarOpinion');
  if (!btnEnviar) return;

  btnEnviar.addEventListener('click', async () => {
    const nombre = document.getElementById('opinionNombre')?.value.trim() || '';
    const rol    = document.getElementById('opinionRol')?.value.trim() || 'Usuario';
    const texto  = document.getElementById('opinionTexto')?.value.trim() || '';

    if (!nombre) { mostrarNotificacion('Escribe tu nombre para publicar.', 'error'); return; }
    if (!texto)  { mostrarNotificacion('Escribe tu opinion antes de publicar.', 'error'); return; }

    const groseriasPatron = /\b(puta|mierda|joder|cabron|puto|pendejo|chinga|verga|culo|idiota|estupido|imbecil|pinche)\b/gi;
    if (groseriasPatron.test(texto) || groseriasPatron.test(nombre)) {
      mostrarNotificacion('Tu opinion contiene lenguaje inapropiado. Por favor reescribela.', 'error');
      return;
    }

    btnEnviar.disabled = true;
    btnEnviar.textContent = 'Publicando...';

    try {
      const res = await fetch('/api/opiniones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rol, texto, estrellas: ratingSelected })
      });
      const data = await res.json();

      if (data.ok) {
        mostrarNotificacion(`Gracias ${nombre}! Tu opinion fue publicada.`, 'success');
        document.getElementById('opinionNombre').value = '';
        document.getElementById('opinionRol').value = '';
        document.getElementById('opinionTexto').value = '';
        ratingSelected = 5;
        stars.forEach(s => s.classList.add('active'));
        cargarOpiniones();
      } else {
        mostrarNotificacion('Error al publicar: ' + (data.error || 'Intenta de nuevo.'), 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarNotificacion('Error de conexion con el servidor.', 'error');
    } finally {
      btnEnviar.disabled = false;
      btnEnviar.textContent = 'Publicar opinion';
    }
  });
}

async function cargarOpiniones() {
  const grid = document.getElementById('testimoniosGrid');
  if (!grid) return;
  try {
    const res  = await fetch('/api/opiniones');
    const data = await res.json();
    if (!data || data.length === 0) return;

    const staticCards = Array.from(grid.querySelectorAll('.testimonial-card')).slice(0, 3);
    grid.innerHTML = '';
    staticCards.forEach(c => grid.appendChild(c));

    data.forEach(op => {
      const card = document.createElement('div');
      card.className = 'testimonial-card reveal visible';
      const starsHtml = Array.from({length: 5}, (_, i) =>
        `<span style="color:${i < (op.estrellas || 5) ? '#FFB300' : '#d1ccdf'}">&#9733;</span>`
      ).join('');
      const inicial = (op.nombre || '?').charAt(0).toUpperCase();
      card.innerHTML = `
        <div class="testimonial-stars">${starsHtml}</div>
        <p class="testimonial-text">${op.texto || ''}</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">${inicial}</div>
          <div>
            <div class="testimonial-name">${op.nombre || 'Anonimo'}</div>
            <div class="testimonial-role">${op.rol || 'Usuario'}</div>
            <span class="testimonial-badge">Verificado</span>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  } catch (err) {
    console.error('Error al cargar opiniones:', err);
  }
}

// =====================================================
// FORMULARIO CONTACTO
// =====================================================
function initContacto() {
  const btn = document.getElementById('btnEnviarContacto');
  if (!btn) return;

  // Evitar que el juego consuma teclas en los inputs de contacto
  ['contactName', 'contactEmail', 'contactMessage'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('keydown', e => e.stopPropagation());
  });

  btn.addEventListener('click', async () => {
    const nombre  = document.getElementById('contactName').value.trim();
    const email   = document.getElementById('contactEmail').value.trim();
    const tipo    = document.getElementById('contactType').value;
    const mensaje = document.getElementById('contactMessage') ? document.getElementById('contactMessage').value.trim() : '';

    if (!nombre || !email) {
      mostrarNotificacion('Por favor completa nombre y correo.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      mostrarNotificacion('Por favor ingresa un correo valido.', 'error');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const res = await fetch('/api/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, tipo, mensaje })
      });
      const data = await res.json();

      if (data.ok) {
        mostrarNotificacion(`Gracias ${nombre}! Tu mensaje fue enviado correctamente.`, 'success');
        document.getElementById('contactName').value    = '';
        document.getElementById('contactEmail').value   = '';
        document.getElementById('contactType').selectedIndex = 0;
        if (document.getElementById('contactMessage')) document.getElementById('contactMessage').value = '';
      } else {
        mostrarNotificacion('Error al enviar: ' + (data.error || 'Intenta de nuevo.'), 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarNotificacion('Error de conexion con el servidor.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar solicitud';
    }
  });
}

// =====================================================
// ADMIN PANEL
// =====================================================
function initAdmin() {
  const btnFloat    = document.getElementById('btnAdminFloat');
  const modal       = document.getElementById('modalAdmin');
  const btnCerrar   = document.getElementById('btnCerrarModal');
  const passInput   = document.getElementById('passAdmin');
  const btnVerif    = document.getElementById('btnVerificarPass');
  const panel       = document.getElementById('panelAdminCompleto');
  const btnCerrarPn = document.getElementById('btnCerrarPanel');

  if (btnFloat) btnFloat.addEventListener('click', () => modal.classList.add('active'));
  if (btnCerrar) btnCerrar.addEventListener('click', () => { modal.classList.remove('active'); passInput.value = ''; });

  if (modal) {
    modal.addEventListener('click', e => {
      if (e.target === modal) { modal.classList.remove('active'); passInput.value = ''; }
    });
  }

 if (btnVerif) {
  btnVerif.addEventListener('click', async () => {
    const res = await fetch('/api/config');
    const config = await res.json();
    if (passInput.value === config.adminPassword) {
      modal.classList.remove('active');
      passInput.value = '';
      panel.classList.add('active');
      document.body.style.overflow = 'hidden';
      cargarFotosAdmin();
      cargarDocsAdmin();
    } else {
      alert('Contrasena incorrecta. Acceso denegado.');
      passInput.value = '';
      passInput.focus();
    }
  });

  }

  if (passInput) {
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') btnVerif.click(); });
  }

  if (btnCerrarPn) {
    btnCerrarPn.addEventListener('click', () => {
      panel.classList.remove('active');
      document.body.style.overflow = 'auto';
    });
  }

  document.querySelectorAll('.adm-menu').forEach(menu => {
    menu.addEventListener('click', () => {
      const tab = menu.dataset.tab;
      document.querySelectorAll('.adm-menu').forEach(m => m.classList.remove('active'));
      menu.classList.add('active');
      document.querySelectorAll('.adm-tab-content').forEach(t => t.style.display = 'none');
      const tabEl = document.getElementById('tab-' + tab);
      if (tabEl) tabEl.style.display = 'contents';
      if (tab === 'galeria')       cargarFotosAdmin();
      if (tab === 'procedimiento') cargarProcAdmin();
      if (tab === 'cronogramas')   cargarDocsAdmin();
      if (tab === 'comentarios')   cargarComentariosAdmin();
    });
  });

  const btnSubirImg = document.getElementById('btnSubirImagen');
  if (btnSubirImg) btnSubirImg.addEventListener('click', subirImagen);

  const btnSubirProc = document.getElementById('btnSubirProc');
  if (btnSubirProc) btnSubirProc.addEventListener('click', subirImagenProcedimiento);

  const btnSubirDoc = document.getElementById('btnSubirDocumento');
  if (btnSubirDoc) btnSubirDoc.addEventListener('click', subirCronogramaArchivo);

  const btnGuardarInfo = document.getElementById('btnGuardarInfo');
  if (btnGuardarInfo) btnGuardarInfo.addEventListener('click', () => alert('Funcion de informacion proximamente.'));
}

// =====================================================
// ADMIN: GALERIA
// =====================================================
async function cargarFotosAdmin() {
  const contenedor = document.getElementById('listaFotosAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>Cargando imagenes...</p>';
  try {
    const res   = await fetch('/api/fotos');
    const fotos = await res.json();
    if (fotos.length === 0) { contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay imagenes subidas aun.</p>'; return; }
    contenedor.innerHTML = '';
    fotos.forEach(foto => {
      const div = document.createElement('div');
      div.className = 'admin-gallery-item';
      div.innerHTML = `
        <img src="${foto.url}" alt="${foto.titulo || 'Foto'}">
        <p>${foto.titulo || 'Sin titulo'}</p>
        <button class="btn-delete-img" data-id="${foto._id}" title="Eliminar foto"><i class="fas fa-trash"></i></button>
      `;
      div.querySelector('.btn-delete-img').addEventListener('click', () => borrarImagen(foto._id));
      contenedor.appendChild(div);
    });
  } catch (error) {
    contenedor.innerHTML = '<p style="color:#ef4444;">Error al cargar las imagenes.</p>';
  }
}

async function subirImagen() {
  const titulo  = document.getElementById('tituloImagen').value;
  const archivo = document.getElementById('archivoImagen').files[0];
  if (!archivo) { alert('Selecciona una imagen primero.'); return; }
  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('imagen', archivo);
  try {
    const res  = await fetch('/subir-imagen', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.ok) {
      alert('Imagen subida correctamente.');
      document.getElementById('tituloImagen').value = '';
      document.getElementById('archivoImagen').value = '';
      cargarFotosAdmin();
      inicializarCarrusel();
    } else {
      alert('Error al subir: ' + data.error);
    }
  } catch (err) {
    alert('Error de conexion con el servidor.');
  }
}

async function borrarImagen(id) {
  if (!confirm('Eliminar esta imagen permanentemente?')) return;
  try {
    const res = await fetch(`/api/fotos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Imagen eliminada.');
      cargarFotosAdmin();
      inicializarCarrusel();
    } else {
      alert('Error al eliminar la imagen.');
    }
  } catch {
    alert('Error de conexion.');
  }
}

// =====================================================
// ADMIN: PROCEDIMIENTO
// =====================================================
async function cargarProcAdmin() {
  const contenedor = document.getElementById('listaProcAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>Cargando imagenes del procedimiento...</p>';
  try {
    const res   = await fetch('/api/procedimiento');
    const fotos = await res.json();
    if (fotos.length === 0) {
      contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay imagenes del procedimiento aun.</p>';
      return;
    }
    contenedor.innerHTML = '';
    fotos.forEach((foto, i) => {
      const div = document.createElement('div');
      div.className = 'admin-gallery-item';
      div.innerHTML = `
        <img src="${foto.url}" alt="${foto.titulo || 'Paso ' + (i+1)}">
        <p><strong>Paso ${i + 1}:</strong> ${foto.titulo || 'Sin titulo'}</p>
        <button class="btn-delete-img" data-id="${foto._id}" title="Eliminar imagen"><i class="fas fa-trash"></i></button>
      `;
      div.querySelector('.btn-delete-img').addEventListener('click', () => borrarImagenProcedimiento(foto._id));
      contenedor.appendChild(div);
    });
  } catch (error) {
    contenedor.innerHTML = '<p style="color:#ef4444;">Error al cargar las imagenes del procedimiento.</p>';
  }
}

async function subirImagenProcedimiento() {
  const titulo      = document.getElementById('tituloProc').value.trim();
  const descripcion = document.getElementById('descripcionProc').value.trim();
  const archivo     = document.getElementById('archivoProc').files[0];
  if (!titulo) { alert('Escribe el titulo/nombre del paso primero.'); return; }
  if (!archivo) { alert('Selecciona una imagen primero.'); return; }
  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('descripcion', descripcion);
  formData.append('imagen', archivo);
  try {
    const res  = await fetch('/subir-procedimiento', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.ok) {
      alert('Imagen del procedimiento subida correctamente.');
      document.getElementById('tituloProc').value = '';
      document.getElementById('descripcionProc').value = '';
      document.getElementById('archivoProc').value = '';
      cargarProcAdmin();
      inicializarCarruselProcedimiento();
    } else {
      alert('Error al subir: ' + data.error);
    }
  } catch (err) {
    alert('Error de conexion con el servidor.');
  }
}

async function borrarImagenProcedimiento(id) {
  if (!confirm('Eliminar esta imagen del procedimiento permanentemente?')) return;
  try {
    const res = await fetch(`/api/procedimiento/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Imagen eliminada.');
      cargarProcAdmin();
      inicializarCarruselProcedimiento();
    } else {
      alert('Error al eliminar la imagen.');
    }
  } catch {
    alert('Error de conexion.');
  }
}

// =====================================================
// ADMIN: DOCUMENTOS
// =====================================================
async function cargarDocsAdmin() {
  const contenedor = document.getElementById('listaDocsAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>Cargando documentos...</p>';
  try {
    const res  = await fetch('/api/documentos');
    const docs = await res.json();
    if (docs.length === 0) { contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay documentos subidos aun.</p>'; return; }
    contenedor.innerHTML = '';
    docs.forEach(doc => {
      const div = document.createElement('div');
      div.className = 'doc-card';
      let icon  = 'fa-file-alt';
      let label = 'Abrir archivo';
      const mime = (doc.tipoArchivo || '').toLowerCase();
      const name = (doc.nombreArchivo || '').toLowerCase();
      if (mime === 'application/pdf' || name.endsWith('.pdf')) { icon = 'fa-file-pdf'; label = 'Abrir PDF'; }
      else if (mime.includes('excel') || mime.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) { icon = 'fa-file-excel'; label = 'Descargar Excel'; }
      else if (mime.includes('word') || mime.includes('document') || name.endsWith('.doc') || name.endsWith('.docx')) { icon = 'fa-file-word'; label = 'Descargar Word'; }
      const urlVer = `/ver-documento/${doc._id}`;
      div.innerHTML = `
        <i class="fas ${icon} doc-icon"></i>
        <div class="doc-info" style="flex:1;">
          <h4>${doc.titulo || 'Sin titulo'}</h4>
          <p style="font-size:0.78rem;color:#9ca3af;margin:2px 0 4px;">${doc.nombreArchivo || ''}</p>
          <a href="${urlVer}" target="_blank" rel="noopener noreferrer" style="font-size:0.85rem;color:#7B68A6;text-decoration:underline;">${label}</a>
        </div>
        <button class="btn-delete-img" title="Eliminar documento" style="position:static;margin-left:auto;flex-shrink:0;">
          <i class="fas fa-trash"></i>
        </button>
      `;
      div.querySelector('.btn-delete-img').addEventListener('click', () => borrarDocumento(doc._id));
      contenedor.appendChild(div);
    });
  } catch {
    contenedor.innerHTML = '<p style="color:#ef4444;">Error al cargar los documentos.</p>';
  }
}

async function subirCronogramaArchivo() {
  const titulo       = document.getElementById('tituloCronograma').value;
  const archivoInput = document.getElementById('archivoCronograma');
  if (!titulo || archivoInput.files.length === 0) { alert('Ingresa un titulo y selecciona un archivo.'); return; }
  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('documento', archivoInput.files[0]);
  try {
    const res = await fetch('/subir-documento', { method: 'POST', body: formData });
    if (res.ok) {
      alert('Documento subido con exito.');
      document.getElementById('tituloCronograma').value = '';
      archivoInput.value = '';
      cargarDocumentosPublicos();
      cargarDocsAdmin();
    } else {
      alert('Error al subir el archivo.');
    }
  } catch {
    alert('Error de conexion.');
  }
}

async function borrarDocumento(id) {
  if (!confirm('Eliminar este documento permanentemente?')) return;
  try {
    const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
    if (res.ok) {
      alert('Documento eliminado.');
      cargarDocsAdmin();
      cargarDocumentosPublicos();
    } else {
      alert('Error al eliminar el documento.');
    }
  } catch {
    alert('Error de conexion.');
  }
}

// =====================================================
// ADMIN: COMENTARIOS
// =====================================================
async function cargarComentariosAdmin() {
  const contenedor = document.getElementById('listaComentariosAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>Cargando comentarios...</p>';

  try {
    const [resComentarios, resOpiniones] = await Promise.allSettled([
      fetch('/api/comentarios'),
      fetch('/api/opiniones')
    ]);

    const comentarios = resComentarios.status === 'fulfilled' ? await resComentarios.value.json() : [];
    const opiniones   = resOpiniones.status === 'fulfilled'   ? await resOpiniones.value.json()   : [];

    if (comentarios.length === 0 && opiniones.length === 0) {
      contenedor.innerHTML = '<div class="admin-comments-empty">No hay comentarios ni opiniones todavia.</div>';
      return;
    }

    contenedor.innerHTML = '';

    if (opiniones.length > 0) {
      const h = document.createElement('h3');
      h.style.cssText = 'font-family:"Playfair Display",serif; color:#7B68A6; margin-bottom:12px; font-size:1.1rem;';
      h.textContent = 'Opiniones del jarabe (' + opiniones.length + ')';
      contenedor.appendChild(h);

      const listaOp = document.createElement('div');
      listaOp.className = 'admin-comment-list';
      opiniones.forEach(op => {
        const item = buildCommentItem({
          _id:    op._id,
          nombre: op.nombre,
          rol:    op.rol || 'Usuario',
          texto:  op.texto,
          fecha:  op.fecha,
          estrellas: op.estrellas
        }, 'opinion');
        listaOp.appendChild(item);
      });
      contenedor.appendChild(listaOp);
    }

    if (comentarios.length > 0) {
      const h2 = document.createElement('h3');
      h2.style.cssText = 'font-family:"Playfair Display",serif; color:#7B68A6; margin-top:24px; margin-bottom:12px; font-size:1.1rem;';
      h2.textContent = 'Mensajes de contacto (' + comentarios.length + ')';
      contenedor.appendChild(h2);

      const listaCo = document.createElement('div');
      listaCo.className = 'admin-comment-list';
      comentarios.forEach(co => {
        const item = buildCommentItem({
          _id:    co._id,
          nombre: co.nombre,
          rol:    co.tipo || co.email || 'Contacto',
          texto:  co.mensaje || '(sin mensaje)',
          fecha:  co.fecha
        }, 'comentario');
        listaCo.appendChild(item);
      });
      contenedor.appendChild(listaCo);
    }

  } catch (err) {
    console.error(err);
    contenedor.innerHTML = '<p style="color:#ef4444;">Error al cargar los comentarios.</p>';
  }
}

function buildCommentItem(data, tipo) {
  const groseriasPatron = /\b(puta|mierda|joder|cabron|puto|pendejo|chinga|verga|culo|idiota|estupido|imbecil|pinche)\b/gi;
  const esSospechoso = groseriasPatron.test(data.texto || '') || groseriasPatron.test(data.nombre || '');

  const item = document.createElement('div');
  item.className = 'admin-comment-item' + (esSospechoso ? ' admin-comment-flagged' : '');
  const inicial = (data.nombre || '?').charAt(0).toUpperCase();

  let starsHtml = '';
  if (data.estrellas) {
    starsHtml = Array.from({length: 5}, (_, i) =>
      `<span style="color:${i < data.estrellas ? '#FFB300' : '#d1ccdf'};font-size:0.85rem;">&#9733;</span>`
    ).join('');
  }

  const fechaStr = data.fecha ? new Date(data.fecha).toLocaleDateString('es-MX', { day:'numeric', month:'short', year:'numeric' }) : '';

  item.innerHTML = `
    <div class="admin-comment-avatar">${inicial}</div>
    <div class="admin-comment-body">
      <div class="admin-comment-header">
        <span class="admin-comment-name">${data.nombre || 'Anonimo'}</span>
        <span class="admin-comment-role">${data.rol}</span>
        ${starsHtml}
        <span class="admin-comment-date">${fechaStr}</span>
      </div>
      <p class="admin-comment-text">${data.texto || ''}</p>
      ${esSospechoso ? '<p style="font-size:0.75rem;color:#ef4444;margin-top:4px;font-weight:600;">Lenguaje inapropiado detectado</p>' : ''}
    </div>
    <button class="btn-delete-comment" title="Eliminar este comentario">
      <i class="fas fa-trash"></i> Eliminar
    </button>
  `;

  item.querySelector('.btn-delete-comment').addEventListener('click', async () => {
    if (!confirm('Eliminar este comentario permanentemente?')) return;
    const endpoint = tipo === 'opinion' ? `/api/opiniones/${data._id}` : `/api/comentarios/${data._id}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        item.style.opacity = '0';
        item.style.transition = 'opacity 0.3s';
        setTimeout(() => { item.remove(); }, 320);
        mostrarNotificacion('Comentario eliminado.', 'success');
        if (tipo === 'opinion') cargarOpiniones();
      } else {
        alert('Error al eliminar.');
      }
    } catch {
      alert('Error de conexion.');
    }
  });

  return item;
}

// =====================================================
// INICIALIZACION
// =====================================================
async function inicializarDatos() {
  console.log('Iniciando Huerto Escolar La Lavanda...');
  await Promise.allSettled([
    obtenerTemperaturaActual(),
    obtenerEstadisticas(),
    obtenerRecomendacionesRiego(),
    obtenerEstadoFloracion(),
    obtenerHistorialTemperatura(7),
    inicializarCarrusel(),
    inicializarCarruselProcedimiento(),
    cargarDocumentosPublicos(),
    cargarOpiniones(),
  ]);
  console.log('Datos cargados.');
}

setInterval(async () => {
  console.log('Actualizando temperatura...');
  await obtenerTemperaturaActual();
  await obtenerEstadisticas();
}, 30000);

document.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initNavbar();
  initReveal();
  initCounters();
  initCardTilt();
  initContacto();
  initAdmin();
  initFlowchart();
  initOpinionForm();
  inicializarDatos();
});
