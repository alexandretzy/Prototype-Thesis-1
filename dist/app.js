(() => {
  'use strict';

  const SEVERITIES = ['No DR', 'Mild NPDR', 'Moderate NPDR', 'Severe NPDR', 'Proliferative DR'];
  const GRADE_CLASSES = {
    'No DR': 'no-dr',
    'Mild NPDR': 'mild',
    'Moderate NPDR': 'moderate',
    'Severe NPDR': 'severe',
    'Proliferative DR': 'proliferative'
  };
  const DEMO_SCORES = {
    'No DR': { 'No DR': 91, 'Mild NPDR': 5, 'Moderate NPDR': 2, 'Severe NPDR': 1, 'Proliferative DR': 1 },
    'Mild NPDR': { 'No DR': 7, 'Mild NPDR': 78, 'Moderate NPDR': 10, 'Severe NPDR': 3, 'Proliferative DR': 2 },
    'Moderate NPDR': { 'No DR': 3, 'Mild NPDR': 8, 'Moderate NPDR': 82, 'Severe NPDR': 5, 'Proliferative DR': 2 },
    'Severe NPDR': { 'No DR': 2, 'Mild NPDR': 4, 'Moderate NPDR': 12, 'Severe NPDR': 76, 'Proliferative DR': 6 },
    'Proliferative DR': { 'No DR': 1, 'Mild NPDR': 2, 'Moderate NPDR': 7, 'Severe NPDR': 9, 'Proliferative DR': 81 }
  };

  // Domain base class: one screening session, with a replaceable result object.
  class ScreeningCase {
    constructor({ id, reference, eye, imageLabel, date, result, sample = true }) {
      this.id = id;
      this.reference = reference;
      this.eye = eye;
      this.imageLabel = imageLabel;
      this.date = date;
      this.result = result;
      this.sample = sample;
    }
  }

  // Value object: the five class scores and the source of the displayed output.
  class PredictionResult {
    constructor({ severity, confidence, classScores, simulated = true }) {
      this.severity = severity;
      this.confidence = confidence;
      this.classScores = classScores;
      this.simulated = simulated;
    }
  }

  // In-memory repository used by the list, dashboard, and result routes.
  class ScreeningStore {
    constructor(cases = []) {
      this.cases = [...cases];
    }
    all() {
      return [...this.cases];
    }
    get(id) {
      return this.cases.find((item) => item.id === id) || null;
    }
    add(screeningCase) {
      this.cases.unshift(screeningCase);
      return screeningCase;
    }
    search(query) {
      const needle = query.trim().toLowerCase();
      if (!needle) return this.all();
      return this.cases.filter((item) => `${item.reference} ${item.result.severity} ${item.imageLabel}`.toLowerCase().includes(needle));
    }
  }

  // UI adapter for the unconnected model. It returns fixed sample data and never reads image pixels.
  class PrototypeAnalyzer {
    analyze(scenario) {
      const severity = SEVERITIES.includes(scenario) ? scenario : 'Moderate NPDR';
      const scores = DEMO_SCORES[severity];
      return new Promise((resolve) => {
        window.setTimeout(() => resolve(new PredictionResult({
          severity,
          confidence: scores[severity],
          classScores: { ...scores },
          simulated: true
        })), 450);
      });
    }
  }

  const sampleCases = [
    { id: 'demo-2408', reference: 'DEMO-008', eye: 'Right eye', imageLabel: 'Demo image A', date: 'Oct 2, 2026', severity: 'No DR', confidence: 91 },
    { id: 'demo-2407', reference: 'DEMO-007', eye: 'Left eye', imageLabel: 'Demo image B', date: 'Oct 2, 2026', severity: 'Mild NPDR', confidence: 78 },
    { id: 'demo-2406', reference: 'DEMO-006', eye: 'Right eye', imageLabel: 'Demo image C', date: 'Oct 2, 2026', severity: 'Moderate NPDR', confidence: 82 },
    { id: 'demo-2405', reference: 'DEMO-005', eye: 'Left eye', imageLabel: 'Demo image D', date: 'Oct 1, 2026', severity: 'Severe NPDR', confidence: 76 },
    { id: 'demo-2404', reference: 'DEMO-004', eye: 'Right eye', imageLabel: 'Demo image E', date: 'Oct 1, 2026', severity: 'Proliferative DR', confidence: 81 }
  ].map((record) => new ScreeningCase({
    ...record,
    sample: true,
    result: new PredictionResult({
      severity: record.severity,
      confidence: record.confidence,
      classScores: { ...DEMO_SCORES[record.severity] },
      simulated: true
    })
  }));

  const store = new ScreeningStore(sampleCases);
  const analyzer = new PrototypeAnalyzer();
  const byId = (id) => document.getElementById(id);
  const state = { currentRoute: 'dashboard', currentCaseId: null, objectUrl: null, toastTimer: null };
  let nextDemoSequence = 9;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[character]);
  }

  function gradePill(severity) {
    const gradeClass = GRADE_CLASSES[severity] || 'moderate';
    return `<span class="grade-pill"><i class="class-dot ${gradeClass}"></i>${escapeHtml(severity)}</span>`;
  }

  function caseLink(item, recent = false) {
    const initials = item.reference.replace(/[^0-9A-Za-z]/g, '').slice(-2) || 'D';
    const confidenceBar = `<div class="confidence-cell"><span>${item.result.confidence}%</span><span class="mini-track"><i style="width:${item.result.confidence}%"></i></span></div>`;
    const reference = `<button class="case-open" type="button" data-case-id="${escapeHtml(item.id)}"><span class="case-avatar">${escapeHtml(initials)}</span><span class="case-id"><strong>${escapeHtml(item.reference)}</strong><small>${escapeHtml(item.eye)}</small></span></button>`;
    if (recent) {
      return `<tr><td>${reference}</td><td>${gradePill(item.result.severity)}</td><td>${confidenceBar}</td><td><span class="dataset-chip">${escapeHtml(item.imageLabel)}</span></td><td><button class="text-button" type="button" data-case-id="${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(item.reference)}">View <span>→</span></button></td></tr>`;
    }
    return `<tr><td>${reference}</td><td>${gradePill(item.result.severity)}</td><td>${confidenceBar}</td><td><span class="dataset-chip">${escapeHtml(item.imageLabel)}</span></td><td><span class="dataset-chip">${escapeHtml(item.date)}</span></td><td><button class="text-button" type="button" data-case-id="${escapeHtml(item.id)}" aria-label="Open ${escapeHtml(item.reference)}">View <span>→</span></button></td></tr>`;
  }

  function renderCaseTables(items = store.all()) {
    const recent = byId('recentTableBody');
    const full = byId('screeningTableBody');
    const allCases = store.all();
    if (recent) recent.innerHTML = allCases.slice(0, 4).map((item) => caseLink(item, true)).join('');
    if (full) full.innerHTML = items.map((item) => caseLink(item)).join('');
    const count = String(allCases.length).padStart(2, '0');
    byId('dashboardCaseCount').textContent = count;
    byId('navCaseCount').textContent = count;
    byId('listCaseCount').textContent = `${items.length} sample ${items.length === 1 ? 'record' : 'records'}`;
    byId('distributionTotal').textContent = `${allCases.length} example${allCases.length === 1 ? '' : 's'}`;
    const empty = byId('emptySearch');
    if (empty) empty.hidden = items.length !== 0;
  }

  function renderDistribution() {
    const items = store.all();
    const counts = Object.fromEntries(SEVERITIES.map((severity) => [severity, 0]));
    items.forEach((item) => { counts[item.result.severity] = (counts[item.result.severity] || 0) + 1; });
    const maximum = Math.max(1, ...Object.values(counts));
    byId('severityDistribution').innerHTML = SEVERITIES.map((severity) => {
      const count = counts[severity];
      const gradeClass = GRADE_CLASSES[severity];
      return `<div class="dist-row"><span class="dist-name"><i class="class-dot ${gradeClass}"></i>${escapeHtml(severity)}</span><span class="dist-track"><i class="dist-fill" style="width:${(count / maximum) * 100}%"></i></span><span class="dist-count">${count}</span></div>`;
    }).join('');
  }

  function showToast(message) {
    const toast = byId('toast');
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2600);
  }

  function routeTo(route) {
    const accepted = ['dashboard', 'screenings', 'new', 'result', 'model'];
    if (!accepted.includes(route)) return;
    state.currentRoute = route;
    document.querySelectorAll('[data-view]').forEach((view) => {
      const selected = view.dataset.view === route;
      view.classList.toggle('is-visible', selected);
      view.hidden = !selected;
    });
    document.querySelectorAll('.nav-item').forEach((item) => {
      item.classList.toggle('is-active', item.dataset.route === (route === 'new' || route === 'result' ? 'screenings' : route));
    });
    const routeNames = { dashboard: 'Overview', screenings: 'Screenings', new: 'New screening', result: 'Screening result', model: 'Model overview' };
    byId('breadcrumbCurrent').textContent = routeNames[route];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setImagePreview(src, filename, details, badge) {
    byId('analysisImage').src = src;
    byId('analysisImage').alt = badge === 'ILLUSTRATION' ? 'Illustrative fundus image preview' : `Local preview of ${filename}`;
    byId('fileName').textContent = filename;
    byId('fileDetails').textContent = details;
    byId('imagePreviewBadge').textContent = badge;
  }

  function clearLocalImage() {
    if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
    state.objectUrl = null;
    byId('fundusFile').value = '';
  }

  function readLocalImage(file) {
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      showToast('Choose a JPG or PNG fundus image.');
      return;
    }
    clearLocalImage();
    state.objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(file.size < 1024 * 1024 ? 2 : 1);
      setImagePreview(state.objectUrl, file.name, `${image.naturalWidth} × ${image.naturalHeight} px · ${sizeInMb} MB · local preview`, 'LOCAL PREVIEW');
    };
    image.onerror = () => showToast('This image could not be previewed. Try a JPG or PNG file.');
    image.src = state.objectUrl;
    byId('analysisImage').src = state.objectUrl;
  }

  function setHeatmap(enabled) {
    byId('resultFundusFrame').classList.toggle('is-original', !enabled);
    byId('showHeatmap').classList.toggle('is-selected', enabled);
    byId('showOriginal').classList.toggle('is-selected', !enabled);
    byId('showHeatmap').setAttribute('aria-pressed', String(enabled));
    byId('showOriginal').setAttribute('aria-pressed', String(!enabled));
    byId('heatmapCaption').textContent = enabled
      ? 'Illustrative Grad-CAM-style overlay · not generated from this image'
      : 'Original image preview · no model analysis has been performed';
  }

  function renderResult(item) {
    if (!item) return;
    state.currentCaseId = item.id;
    byId('resultTitle').textContent = `Result · ${item.reference}`;
    byId('resultReferenceLine').textContent = `${item.reference} · ${item.eye} · ${item.imageLabel}`;
    byId('severityResultText').textContent = item.result.severity;
    byId('confidenceValue').textContent = `${item.result.confidence}%`;
    byId('confidenceTrack').style.width = `${item.result.confidence}%`;
    byId('severityResultBadge').className = `severity-result severity-${GRADE_CLASSES[item.result.severity]}`;
    byId('resultImage').src = byId('analysisImage').src || 'assets/fundus-demo.svg';
    byId('resultImage').alt = item.imageLabel === 'Illustrative fundus image' ? 'Illustrative fundus image preview' : `Preview of ${item.imageLabel}`;
    setHeatmap(true);
    byId('probabilityList').innerHTML = SEVERITIES.map((severity) => {
      const score = item.result.classScores[severity] || 0;
      const isTop = severity === item.result.severity;
      return `<div class="prob-row ${isTop ? 'is-top' : ''}"><span>${escapeHtml(severity)}</span><span class="prob-track"><i class="prob-fill" style="width:${score}%"></i></span><span class="prob-score">${score}%</span></div>`;
    }).join('');
    routeTo('result');
  }

  async function runSampleAnalysis() {
    const button = byId('runAnalysis');
    button.disabled = true;
    button.innerHTML = '<span class="loading-dot"></span> Preparing sample result…';
    const result = await analyzer.analyze(byId('sampleScenario').value);
    let reference = byId('caseReference').value.trim();
    if (!reference) {
      do { reference = `DEMO-${String(nextDemoSequence++).padStart(3, '0')}`; }
      while (store.all().some((item) => item.reference === reference));
    }
    const file = byId('fundusFile').files[0];
    const imageLabel = file ? file.name : 'Illustrative fundus image';
    const caseItem = new ScreeningCase({
      id: `session-${Date.now().toString(36)}`,
      reference,
      eye: byId('eyeSide').value,
      imageLabel,
      date: 'Oct 2, 2026',
      result,
      sample: true
    });
    store.add(caseItem);
    renderCaseTables();
    renderDistribution();
    renderResult(caseItem);
    button.disabled = false;
    button.innerHTML = '<span>◉</span> Show sample result <span class="button-arrow">→</span>';
  }

  document.addEventListener('click', (event) => {
    const routeControl = event.target.closest('[data-route]');
    if (routeControl) {
      event.preventDefault();
      routeTo(routeControl.dataset.route);
      return;
    }
    const caseControl = event.target.closest('[data-case-id]');
    if (caseControl) {
      const item = store.get(caseControl.dataset.caseId);
      if (item) {
        byId('analysisImage').src = 'assets/fundus-demo.svg';
        renderResult(item);
      }
      return;
    }
  });

  byId('caseSearch').addEventListener('input', (event) => {
    const filtered = store.search(event.target.value);
    renderCaseTables(filtered);
  });
  byId('fundusFile').addEventListener('change', (event) => readLocalImage(event.target.files[0]));
  byId('useDemoImage').addEventListener('click', () => {
    clearLocalImage();
    setImagePreview('assets/fundus-demo.svg', 'Illustrative fundus image', 'SVG preview · not a clinical image', 'ILLUSTRATION');
    showToast('Illustrative demo image selected.');
  });
  byId('dropZone').addEventListener('click', () => byId('fundusFile').click());
  byId('dropZone').addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      byId('fundusFile').click();
    }
  });
  byId('dropZone').addEventListener('dragover', (event) => { event.preventDefault(); byId('dropZone').classList.add('is-dragging'); });
  byId('dropZone').addEventListener('dragleave', () => byId('dropZone').classList.remove('is-dragging'));
  byId('dropZone').addEventListener('drop', (event) => {
    event.preventDefault();
    byId('dropZone').classList.remove('is-dragging');
    readLocalImage(event.dataTransfer.files[0]);
  });
  byId('sampleScenario').addEventListener('change', (event) => {
    byId('scenarioTitle').textContent = `Sample result scenario · ${event.target.value}`;
  });
  byId('runAnalysis').addEventListener('click', runSampleAnalysis);
  byId('showHeatmap').addEventListener('click', () => setHeatmap(true));
  byId('showOriginal').addEventListener('click', () => setHeatmap(false));
  byId('toggleHeatmap').addEventListener('click', () => setHeatmap(byId('resultFundusFrame').classList.contains('is-original')));
  byId('backToCaseList').addEventListener('click', () => routeTo('screenings'));
  byId('startAnother').addEventListener('click', () => {
    byId('caseReference').value = '';
    byId('sampleScenario').value = 'Moderate NPDR';
    byId('scenarioTitle').textContent = 'Sample result scenario';
    routeTo('new');
  });

  renderCaseTables();
  renderDistribution();
})();
