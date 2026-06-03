'use strict';

const API_URL = '/api';
let tempChart = null;

// =====================================================
// PARTÍCULAS
// =====================================================
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

// =====================================================
// NAVBAR
// =====================================================
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

// =====================================================
// REVEAL / COUNTERS / TILT
// =====================================================
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

// =====================================================
// TEMPERATURA
// =====================================================
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
    'ÓPTIMO': '🟣', 'CÁLIDO': '🟠',
    'EXTREMO CALOR': '🔴', 'FRESCO': '🔵', 'HELADA': '❄️'
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
  const tempValue          = document.getElementById('tempValue');
  const tempLabel          = document.getElementById('tempLabel');
  const tempRecommendation = document.getElementById('tempRecommendation');
  if (tempValue) tempValue.textContent = '--°C';
  if (tempLabel) tempLabel.textContent = 'Sin conexión';
  if (tempRecommendation) tempRecommendation.textContent = 'Sin conexión con el servidor.';
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
    if (riegoInfo) riegoInfo.innerHTML = '<strong>Sin datos</strong><span>Sin información disponible</span>';
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
    console.error('Error al obtener floración:', error);
    const floracionInfo = document.getElementById('floracionInfo');
    if (floracionInfo) floracionInfo.innerHTML = '<strong>Sin datos</strong><span>Sin información disponible</span>';
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

// =====================================================
// CARRUSEL GALERÍA
// =====================================================
let currentSlideIndex = 0;
let carouselTimer = null;

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
            <h4>${foto.titulo || 'Sin título'}</h4>
            <p>${foto.descripcion || ''}</p>
          </div>
        `;
        track.appendChild(li);
      });
      iniciarLogicaCarrusel('carouselTrack', 'carouselPrev', 'carouselNext', fotos.length);
    } else {
      track.innerHTML = '<li class="carousel-slide"><div class="slide-placeholder">No hay fotos en la galería todavía.</div></li>';
    }
  } catch (error) {
    console.error('Error al cargar carrusel:', error);
    const track = document.getElementById('carouselTrack');
    if (track) track.innerHTML = '<li class="carousel-slide"><div class="slide-placeholder">⚠️ Error de conexión con la galería.</div></li>';
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

// =====================================================
// CARRUSEL PROCEDIMIENTO
// =====================================================
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
        // Slide principal
        const li = document.createElement('li');
        li.className = 'carousel-slide';
        li.innerHTML = `
          <img src="${foto.url || 'https://via.placeholder.com/800x450'}" alt="${foto.titulo || 'Paso ' + (i+1)}" class="carousel-image">
          <div class="slide-caption">
            <span class="proc-step-badge">Paso ${i + 1}</span>
            <h4>${foto.titulo || 'Sin título'}</h4>
            <p>${foto.descripcion || ''}</p>
          </div>
        `;
        track.appendChild(li);

        // Miniatura
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
          <div class="slide-placeholder">📷 Aún no hay imágenes del procedimiento. Agrégalas desde el panel de administración.</div>
        </li>
      `;
      if (thumbsContainer) thumbsContainer.innerHTML = '';
    }
  } catch (error) {
    console.error('Error al cargar procedimiento:', error);
    const track = document.getElementById('procCarouselTrack');
    if (track) track.innerHTML = '<li class="carousel-slide"><div class="slide-placeholder">⚠️ Error de conexión.</div></li>';
  }
}

function irAPasoProc(index, total) {
  const track = document.getElementById('procCarouselTrack');
  if (!track) return;
  const idx = ((index % total) + total) % total;
  track.style.transform = `translateX(${-(idx * 100)}%)`;
}

// =====================================================
// DOCUMENTOS PÚBLICOS
// =====================================================
async function cargarDocumentosPublicos() {
  const contenedor = document.getElementById('listaDocumentosPublicos');
  if (!contenedor) return;
  try {
    const respuesta = await fetch('/api/documentos');
    if (!respuesta.ok) throw new Error('Error al obtener documentos');
    const docs = await respuesta.json();

    if (docs.length === 0) {
      contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay documentos disponibles aún.</p>';
      return;
    }
    contenedor.innerHTML = '';
    docs.forEach(doc => {
      const a = document.createElement('a');
      a.className = 'doc-card';
      a.href = doc.url;
      a.target = '_blank';

      let icon = 'fa-file-alt';
      const ext = (doc.url || '').toLowerCase();
      if (ext.includes('.pdf'))  icon = 'fa-file-pdf';
      else if (ext.includes('.xls') || ext.includes('.xlsx')) icon = 'fa-file-excel';
      else if (ext.includes('.doc') || ext.includes('.docx')) icon = 'fa-file-word';

      a.innerHTML = `
        <i class="fas ${icon} doc-icon"></i>
        <div class="doc-info">
          <h4>${doc.titulo || 'Documento sin título'}</h4>
          <span>Descargar archivo</span>
        </div>
      `;
      contenedor.appendChild(a);
    });
  } catch (error) {
    contenedor.innerHTML = '<p style="color:#6b7280;">Aún no hay conexión con la base de datos.</p>';
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
// CONTACTO
// =====================================================
function initContacto() {
  const btn = document.getElementById('btnEnviarContacto');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const nombre = document.getElementById('contactName').value.trim();
    const email  = document.getElementById('contactEmail').value.trim();
    const tipo   = document.getElementById('contactType').value;
    if (!nombre || !email) {
      alert('Por favor completa todos los campos');
      return;
    }
    console.log('Enviando contacto:', { nombre, email, tipo });
    alert(`¡Gracias ${nombre}! Te contactaremos pronto a ${email}`);
    document.getElementById('contactName').value = '';
    document.getElementById('contactEmail').value = '';
    document.getElementById('contactType').selectedIndex = 0;
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
    btnVerif.addEventListener('click', () => {
      if (passInput.value === 'LAVANDA2026') {
        modal.classList.remove('active');
        passInput.value = '';
        panel.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Cargar tab activo por defecto (galería)
        cargarFotosAdmin();
        cargarDocsAdmin();
      } else {
        alert('Contraseña incorrecta. Acceso denegado.');
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

  // ===== TABS del panel admin =====
  document.querySelectorAll('.adm-menu').forEach(menu => {
    menu.addEventListener('click', () => {
      const tab = menu.dataset.tab;

      // Activar menú
      document.querySelectorAll('.adm-menu').forEach(m => m.classList.remove('active'));
      menu.classList.add('active');

      // Mostrar tab correspondiente
      document.querySelectorAll('.adm-tab-content').forEach(t => t.style.display = 'none');
      const tabEl = document.getElementById('tab-' + tab);
      if (tabEl) tabEl.style.display = 'contents';

      // Cargar datos del tab si aplica
      if (tab === 'galeria')       cargarFotosAdmin();
      if (tab === 'procedimiento') cargarProcAdmin();
      if (tab === 'cronogramas')   cargarDocsAdmin();
    });
  });

  // Botones de subida
  const btnSubirImg = document.getElementById('btnSubirImagen');
  if (btnSubirImg) btnSubirImg.addEventListener('click', subirImagen);

  const btnSubirProc = document.getElementById('btnSubirProc');
  if (btnSubirProc) btnSubirProc.addEventListener('click', subirImagenProcedimiento);

  const btnSubirDoc = document.getElementById('btnSubirDocumento');
  if (btnSubirDoc) btnSubirDoc.addEventListener('click', subirCronogramaArchivo);

  const btnGuardarInfo = document.getElementById('btnGuardarInfo');
  if (btnGuardarInfo) btnGuardarInfo.addEventListener('click', () => alert('Función de información próximamente.'));
}

// =====================================================
// ADMIN: GALERÍA
// =====================================================
async function cargarFotosAdmin() {
  const contenedor = document.getElementById('listaFotosAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>Cargando imágenes...</p>';
  try {
    const res   = await fetch('/api/fotos');
    const fotos = await res.json();
    if (fotos.length === 0) { contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay imágenes subidas aún.</p>'; return; }
    contenedor.innerHTML = '';
    fotos.forEach(foto => {
      const div = document.createElement('div');
      div.className = 'admin-gallery-item';
      div.innerHTML = `
        <img src="${foto.url}" alt="${foto.titulo || 'Foto'}">
        <p>${foto.titulo || 'Sin título'}</p>
        <button class="btn-delete-img" data-id="${foto._id}" title="Eliminar foto"><i class="fas fa-trash"></i></button>
      `;
      div.querySelector('.btn-delete-img').addEventListener('click', () => borrarImagen(foto._id));
      contenedor.appendChild(div);
    });
  } catch (error) {
    contenedor.innerHTML = '<p style="color:#ef4444;">Error al cargar las imágenes.</p>';
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
    alert('Error de conexión con el servidor.');
  }
}

async function borrarImagen(id) {
  if (!confirm('¿Eliminar esta imagen permanentemente?')) return;
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
    alert('Error de conexión.');
  }
}

// =====================================================
// ADMIN: PROCEDIMIENTO
// =====================================================
async function cargarProcAdmin() {
  const contenedor = document.getElementById('listaProcAdmin');
  if (!contenedor) return;
  contenedor.innerHTML = '<p>Cargando imágenes del procedimiento...</p>';
  try {
    const res   = await fetch('/api/procedimiento');
    const fotos = await res.json();
    if (fotos.length === 0) {
      contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay imágenes del procedimiento aún. Sube la primera.</p>';
      return;
    }
    contenedor.innerHTML = '';
    fotos.forEach((foto, i) => {
      const div = document.createElement('div');
      div.className = 'admin-gallery-item';
      div.innerHTML = `
        <img src="${foto.url}" alt="${foto.titulo || 'Paso ' + (i+1)}">
        <p><strong>Paso ${i + 1}:</strong> ${foto.titulo || 'Sin título'}</p>
        <button class="btn-delete-img" data-id="${foto._id}" title="Eliminar imagen"><i class="fas fa-trash"></i></button>
      `;
      div.querySelector('.btn-delete-img').addEventListener('click', () => borrarImagenProcedimiento(foto._id));
      contenedor.appendChild(div);
    });
  } catch (error) {
    contenedor.innerHTML = '<p style="color:#ef4444;">Error al cargar las imágenes del procedimiento.</p>';
  }
}

async function subirImagenProcedimiento() {
  const titulo      = document.getElementById('tituloProc').value.trim();
  const descripcion = document.getElementById('descripcionProc').value.trim();
  const archivo     = document.getElementById('archivoProc').files[0];

  if (!titulo) { alert('Escribe el título/nombre del paso primero.'); return; }
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
    alert('Error de conexión con el servidor.');
  }
}

async function borrarImagenProcedimiento(id) {
  if (!confirm('¿Eliminar esta imagen del procedimiento permanentemente?')) return;
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
    alert('Error de conexión.');
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
    if (docs.length === 0) { contenedor.innerHTML = '<p style="color:#6b7280;font-style:italic;">No hay documentos subidos aún.</p>'; return; }
    contenedor.innerHTML = '';
    docs.forEach(doc => {
      const div = document.createElement('div');
      div.className = 'doc-card';
      let icon = 'fa-file-alt';
      const ext = (doc.url || '').toLowerCase();
      if (ext.includes('.pdf'))  icon = 'fa-file-pdf';
      else if (ext.includes('.xls') || ext.includes('.xlsx')) icon = 'fa-file-excel';
      else if (ext.includes('.doc') || ext.includes('.docx')) icon = 'fa-file-word';
      div.innerHTML = `
        <i class="fas ${icon} doc-icon"></i>
        <div class="doc-info" style="flex:1;">
          <h4>${doc.titulo || 'Sin título'}</h4>
          <a href="${doc.url}" target="_blank" style="font-size:0.85rem;color:#7B68A6;text-decoration:underline;">Ver archivo</a>
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
  const titulo        = document.getElementById('tituloCronograma').value;
  const archivoInput  = document.getElementById('archivoCronograma');
  if (!titulo || archivoInput.files.length === 0) { alert('Ingresa un título y selecciona un archivo.'); return; }
  const formData = new FormData();
  formData.append('titulo', titulo);
  formData.append('documento', archivoInput.files[0]);
  try {
    const res = await fetch('/subir-documento', { method: 'POST', body: formData });
    if (res.ok) {
      alert('Documento subido con éxito.');
      document.getElementById('tituloCronograma').value = '';
      archivoInput.value = '';
      cargarDocumentosPublicos();
      cargarDocsAdmin();
    } else {
      alert('Error al subir el archivo.');
    }
  } catch {
    alert('Error de conexión.');
  }
}

async function borrarDocumento(id) {
  if (!confirm('¿Eliminar este documento permanentemente?')) return;
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
    alert('Error de conexión.');
  }
}

// =====================================================
// INICIALIZACIÓN
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
  inicializarDatos();
});
