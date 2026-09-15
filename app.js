// Application State
let currentPaper = JSON.parse(JSON.stringify(TEMPLATES.commerce));
let currentLayoutMode = '2up'; // '2up' or 'full-a4'
let pageFlowMode = 'auto'; // 'auto' (fill p1 first), 'balance', or manual question number '9','10','11','12'
let baseFontSize = '9pt';
let questionGap = '2px';
let autoSpreadSpace = true; // spreads vertical spacing to avoid bottom gaps
let showCutLine = false;

// Helper: HTML Escaper
function escapeHtml(string) {
  if (string === null || string === undefined) return '';
  return String(string)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load saved data from localStorage
try {
  const saved = localStorage.getItem('exam_paper_data');
  if (saved) currentPaper = JSON.parse(saved);
  const savedMode = localStorage.getItem('exam_layout_mode');
  if (savedMode) currentLayoutMode = savedMode;
  const savedFlow = localStorage.getItem('exam_page_flow');
  if (savedFlow) pageFlowMode = savedFlow;
} catch (e) {}

// Elements
const previewPage1 = document.getElementById('preview-page-1');
const previewPage2 = document.getElementById('preview-page-2');
const zoomRange = document.getElementById('zoom-range');
const zoomValue = document.getElementById('zoom-value');
const page1StatusBadge = document.getElementById('page1-status-badge');
const page2StatusBadge = document.getElementById('page2-status-badge');

// Hidden measuring container
let measureContainer = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  createMeasureContainer();
  setupTabs();
  setupToolbarControls();
  bindFormInputs();
  renderForm();
  updateLayoutModeUI();
  renderPreview();
  setupZoom();
});

function createMeasureContainer() {
  measureContainer = document.createElement('div');
  measureContainer.id = 'measure-container';
  measureContainer.style.cssText = 'position:absolute; left:-9999px; top:-9999px; visibility:hidden; pointer-events:none;';
  document.body.appendChild(measureContainer);
}

// Setup sidebar tab switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.style.display = pane.id === targetId ? 'block' : 'none';
      });
    });
  });
}

// Layout mode switcher (2-Up Landscape vs Full A4 Portrait)
window.setLayoutMode = function(mode) {
  currentLayoutMode = mode;
  try {
    localStorage.setItem('exam_layout_mode', mode);
  } catch (e) {}

  updateLayoutModeUI();
  renderPreview();
};

function updateLayoutModeUI() {
  const btn2up = document.getElementById('btn-mode-2up');
  const btnFull = document.getElementById('btn-mode-full-a4');
  if (btn2up) btn2up.classList.toggle('active', currentLayoutMode === '2up');
  if (btnFull) btnFull.classList.toggle('active', currentLayoutMode === 'full-a4');

  const cutLineWrap = document.getElementById('wrap-cut-line');
  if (cutLineWrap) {
    cutLineWrap.style.display = currentLayoutMode === '2up' ? 'flex' : 'none';
  }

  // Set default font size if changing mode
  if (currentLayoutMode === 'full-a4' && baseFontSize === '9pt') {
    baseFontSize = '10pt';
    const selFontSize = document.getElementById('sel-font-size');
    if (selFontSize) selFontSize.value = '10pt';
    document.documentElement.style.setProperty('--base-paper-font', '10pt');
  } else if (currentLayoutMode === '2up' && baseFontSize === '10pt') {
    baseFontSize = '9pt';
    const selFontSize = document.getElementById('sel-font-size');
    if (selFontSize) selFontSize.value = '9pt';
    document.documentElement.style.setProperty('--base-paper-font', '9pt');
  }
}

// Setup Toolbar Controls
function setupToolbarControls() {
  const selFlow = document.getElementById('sel-page-flow');
  if (selFlow) {
    selFlow.value = pageFlowMode;
    selFlow.addEventListener('change', (e) => {
      pageFlowMode = e.target.value;
      try {
        localStorage.setItem('exam_page_flow', pageFlowMode);
      } catch (e) {}
      renderPreview();
    });
  }

  const chkSpread = document.getElementById('chk-spread-space');
  if (chkSpread) {
    chkSpread.checked = autoSpreadSpace;
    chkSpread.addEventListener('change', (e) => {
      autoSpreadSpace = e.target.checked;
      renderPreview();
    });
  }

  const chkCutLine = document.getElementById('chk-cut-line');
  if (chkCutLine) {
    chkCutLine.checked = showCutLine;
    chkCutLine.addEventListener('change', (e) => {
      showCutLine = e.target.checked;
      previewPage1.classList.toggle('show-cut-line', showCutLine);
      previewPage2.classList.toggle('show-cut-line', showCutLine);
    });
  }

  const selFontSize = document.getElementById('sel-font-size');
  if (selFontSize) {
    selFontSize.value = baseFontSize;
    selFontSize.addEventListener('change', (e) => {
      baseFontSize = e.target.value;
      document.documentElement.style.setProperty('--base-paper-font', baseFontSize);
      renderPreview();
    });
  }

  const selGap = document.getElementById('sel-question-gap');
  if (selGap) {
    selGap.addEventListener('change', (e) => {
      questionGap = e.target.value;
      document.documentElement.style.setProperty('--question-gap', questionGap);
      renderPreview();
    });
  }
}

// Populate form from state
function renderForm() {
  document.getElementById('inp-paper-code').value = currentPaper.paperCode || '';
  document.getElementById('inp-college-name').value = currentPaper.collegeName || '';
  document.getElementById('inp-college-addr').value = currentPaper.collegeAddress || '';
  document.getElementById('inp-exam-details').value = currentPaper.examDetails || '';
  document.getElementById('inp-subject-title').value = currentPaper.subjectTitle || '';
  document.getElementById('inp-stream-details').value = currentPaper.streamDetails || '';
  document.getElementById('inp-time-str').value = currentPaper.timeStr || 'Time:3Hrs';
  document.getElementById('inp-max-marks').value = currentPaper.maxMarksStr || 'Max Marks:60';

  document.getElementById('inp-sec-a-title').value = currentPaper.sectionA.title || 'SECTION - A';
  document.getElementById('inp-sec-a-inst').value = currentPaper.sectionA.instruction || 'I. Answer any Five questions.';
  document.getElementById('inp-sec-a-marks').value = currentPaper.sectionA.marks || '5x4=20';

  const secAContainer = document.getElementById('sec-a-questions');
  secAContainer.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const val = currentPaper.sectionA.questions[i] || '';
    const qDiv = document.createElement('div');
    qDiv.className = 'form-group question-card';
    qDiv.innerHTML = `
      <div class="question-card-header">Question ${i + 1}</div>
      <textarea rows="2" data-type="secA" data-index="${i}">${escapeHtml(val)}</textarea>
    `;
    secAContainer.appendChild(qDiv);
  }

  document.getElementById('inp-sec-b-title').value = currentPaper.sectionB.title || 'SECTION - B';
  document.getElementById('inp-sec-b-inst').value = currentPaper.sectionB.instruction || 'II. Answer ALL the following questions.';
  document.getElementById('inp-sec-b-marks').value = currentPaper.sectionB.marks || '5x8=40';

  const secBContainer = document.getElementById('sec-b-all-questions');
  if (secBContainer) {
    secBContainer.innerHTML = '';
    renderSecBAll(secBContainer);
  }

  bindDynamicInputs();
}

function renderSecBAll(container) {
  currentPaper.sectionB.questions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'question-card';
    qDiv.innerHTML = `
      <div class="question-card-header">
        <span>Question ${q.num} (Compulsory Choice)</span>
        <span style="font-size:10.5px; color:#0284c7; font-weight:normal;" id="q-page-tag-${q.num}"></span>
      </div>
      <div class="form-group" style="margin-bottom:5px;">
        <label>Option (a):</label>
        <textarea rows="3" data-type="secB" data-index="${idx}" data-part="a">${escapeHtml(q.a || '')}</textarea>
      </div>
      <div class="choice-row">
        <label style="margin:0; font-size:11px;">Choice word:</label>
        <input type="text" data-type="secB" data-index="${idx}" data-part="choice" value="${escapeHtml(q.choice || 'Or')}" />
      </div>
      <div class="form-group" style="margin-bottom:2px;">
        <label>Option (b):</label>
        <textarea rows="3" data-type="secB" data-index="${idx}" data-part="b">${escapeHtml(q.b || '')}</textarea>
      </div>
    `;
    container.appendChild(qDiv);
  });
}

function persistState() {
  try {
    localStorage.setItem('exam_paper_data', JSON.stringify(currentPaper));
  } catch (e) {}
}

function bindFormInputs() {
  const map = [
    { id: 'inp-paper-code', key: 'paperCode' },
    { id: 'inp-college-name', key: 'collegeName' },
    { id: 'inp-college-addr', key: 'collegeAddress' },
    { id: 'inp-exam-details', key: 'examDetails' },
    { id: 'inp-subject-title', key: 'subjectTitle' },
    { id: 'inp-stream-details', key: 'streamDetails' },
    { id: 'inp-time-str', key: 'timeStr' },
    { id: 'inp-max-marks', key: 'maxMarksStr' }
  ];

  map.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', (e) => {
        currentPaper[key] = e.target.value;
        persistState();
        renderPreview();
      });
    }
  });

  document.getElementById('inp-sec-a-title').addEventListener('input', (e) => {
    currentPaper.sectionA.title = e.target.value;
    persistState();
    renderPreview();
  });
  document.getElementById('inp-sec-a-inst').addEventListener('input', (e) => {
    currentPaper.sectionA.instruction = e.target.value;
    persistState();
    renderPreview();
  });
  document.getElementById('inp-sec-a-marks').addEventListener('input', (e) => {
    currentPaper.sectionA.marks = e.target.value;
    persistState();
    renderPreview();
  });

  document.getElementById('inp-sec-b-title').addEventListener('input', (e) => {
    currentPaper.sectionB.title = e.target.value;
    persistState();
    renderPreview();
  });
  document.getElementById('inp-sec-b-inst').addEventListener('input', (e) => {
    currentPaper.sectionB.instruction = e.target.value;
    persistState();
    renderPreview();
  });
  document.getElementById('inp-sec-b-marks').addEventListener('input', (e) => {
    currentPaper.sectionB.marks = e.target.value;
    persistState();
    renderPreview();
  });
}

function bindDynamicInputs() {
  document.querySelectorAll('textarea[data-type="secA"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      currentPaper.sectionA.questions[idx] = e.target.value;
      persistState();
      renderPreview();
    });
  });

  document.querySelectorAll('[data-type="secB"]').forEach(el => {
    el.addEventListener('input', (e) => {
      const idx = parseInt(e.target.getAttribute('data-index'), 10);
      const part = e.target.getAttribute('data-part');
      currentPaper.sectionB.questions[idx][part] = e.target.value;
      persistState();
      renderPreview();
    });
  });
}

// -------------------------------------------------------------
// DYNAMIC PAGINATION ENGINE
// Measures actual physical rendered height of each question
// -------------------------------------------------------------
function calculateDynamicPagination() {
  const allSecB = currentPaper.sectionB.questions;

  // If manual break is requested by user:
  if (pageFlowMode === '9' || pageFlowMode === '10' || pageFlowMode === '11' || pageFlowMode === '12') {
    const splitNum = parseInt(pageFlowMode, 10);
    const p1Questions = allSecB.filter(q => q.num < splitNum);
    const p2Questions = allSecB.filter(q => q.num >= splitNum);
    updateEditorTags(allSecB, splitNum);
    return { p1Questions, p2Questions, totalPages: p2Questions.length > 0 ? 2 : 1 };
  }

  // Set up measuring container with active mode width and classes
  const is2Up = currentLayoutMode === '2up';
  // Available height: in 2-Up (210mm total - padding), approx 730px; in Full A4 (297mm - padding), approx 1040px
  const maxPageHeight = is2Up ? 740 : 1045;
  const colWidth = is2Up ? '135mm' : '180mm';

  measureContainer.className = is2Up ? 'exam-page mode-2up' : 'exam-page mode-full-a4';
  measureContainer.innerHTML = `
    <div class="${is2Up ? 'paper-half' : 'paper-full'}" style="width:${colWidth}; height:auto; visibility:hidden; position:absolute;">
      <div id="m-header">${generateHeaderHTML()}</div>
      <div id="m-sec-a">${generateSectionAHTML()}</div>
      <div id="m-sec-b-header">
        <div class="section-header" style="margin-top:2px;">${escapeHtml(currentPaper.sectionB.title || 'SECTION - B')}</div>
        <div class="instruction-row">
          <span>${escapeHtml(currentPaper.sectionB.instruction || '')}</span>
          <span class="instruction-marks">${escapeHtml(currentPaper.sectionB.marks || '')}</span>
        </div>
      </div>
      <div id="m-questions">
        ${allSecB.map(q => `
          <div class="choice-q" id="m-q-${q.num}">
            <div class="choice-part-row">
              <span class="choice-part-num">${q.num}. a)</span>
              <div class="q-text">${formatQuestionContent(q.a || '')}</div>
            </div>
            <div class="choice-label">${q.choice || 'Or'}</div>
            <div class="choice-part-row">
              <span class="choice-sub-num">b)</span>
              <div class="q-text">${formatQuestionContent(q.b || '')}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Measure fixed components
  const mHeader = measureContainer.querySelector('#m-header');
  const mSecA = measureContainer.querySelector('#m-sec-a');
  const mSecBHeader = measureContainer.querySelector('#m-sec-b-header');

  const baseFixedH = (mHeader ? mHeader.offsetHeight : 160) + 
                     (mSecA ? mSecA.offsetHeight : 200) + 
                     (mSecBHeader ? mSecBHeader.offsetHeight : 35) + 
                     30; // padding/margins buffer

  let currentP1Height = baseFixedH;
  const p1Questions = [];
  const p2Questions = [];

  if (pageFlowMode === 'balance') {
    // Balanced mode: distribute questions so both pages have roughly equal height
    let totalSecBH = 0;
    allSecB.forEach(q => {
      const qEl = measureContainer.querySelector(`#m-q-${q.num}`);
      totalSecBH += (qEl ? qEl.offsetHeight : 60);
    });

    // Target half of Sec B questions on P1
    let accumulated = 0;
    allSecB.forEach(q => {
      const qEl = measureContainer.querySelector(`#m-q-${q.num}`);
      const h = (qEl ? qEl.offsetHeight : 60);
      if (accumulated + h <= totalSecBH / 2 && currentP1Height + h <= maxPageHeight) {
        p1Questions.push(q);
        accumulated += h;
        currentP1Height += h;
      } else {
        p2Questions.push(q);
      }
    });
  } else {
    // 'auto' mode: Fill Page 1 first until full, only overflow to Page 2
    allSecB.forEach(q => {
      const qEl = measureContainer.querySelector(`#m-q-${q.num}`);
      const qHeight = qEl ? qEl.offsetHeight + 6 : 60;

      // Check if this question fits on Page 1
      if (currentP1Height + qHeight <= maxPageHeight) {
        p1Questions.push(q);
        currentP1Height += qHeight;
      } else {
        p2Questions.push(q);
      }
    });
  }

  // Update editor question cards with placement tag
  const splitNum = p2Questions.length > 0 ? p2Questions[0].num : 99;
  updateEditorTags(allSecB, splitNum);

  return {
    p1Questions,
    p2Questions,
    totalPages: p2Questions.length > 0 ? 2 : 1,
    splitNum
  };
}

function updateEditorTags(allSecB, splitNum) {
  allSecB.forEach(q => {
    const tag = document.getElementById(`q-page-tag-${q.num}`);
    if (tag) {
      if (q.num < splitNum) {
        tag.textContent = '📄 Page 1';
        tag.style.color = '#0284c7';
      } else {
        tag.textContent = '📄 Page 2';
        tag.style.color = '#d97706';
      }
    }
  });
}

// Header HTML generator
function generateHeaderHTML() {
  const p = currentPaper;
  return `
    <div class="paper-code-row">${escapeHtml(p.paperCode || '')}</div>

    <div class="hallticket-row">
      <span>Hall Ticket No</span>
      <div class="ht-boxes">
        ${Array(10).fill('<div class="ht-box"></div>').join('')}
      </div>
    </div>

    <div class="institution-header">
      <div class="inst-name">${escapeHtml(p.collegeName || '')}</div>
      <div class="inst-address">${escapeHtml(p.collegeAddress || '')}</div>
      <div class="inst-exam">${escapeHtml(p.examDetails || '')}</div>
      <div class="inst-subject">${escapeHtml(p.subjectTitle || '')}</div>
      <div class="inst-stream">${escapeHtml(p.streamDetails || '')}</div>
    </div>

    <div class="meta-row">
      <span>${escapeHtml(p.timeStr || '')}</span>
      <span>${escapeHtml(p.maxMarksStr || '')}</span>
    </div>
  `;
}

// Section A HTML generator
function generateSectionAHTML() {
  const p = currentPaper;
  let qHtml = '';
  for (let i = 0; i < 8; i++) {
    const text = p.sectionA.questions[i] || '';
    qHtml += `
      <div class="q-item">
        <span class="q-num">${i + 1}.</span>
        <div class="q-text">${formatQuestionContent(text)}</div>
      </div>
    `;
  }

  return `
    <div class="section-header">${escapeHtml(p.sectionA.title || 'SECTION - A')}</div>
    <div class="instruction-row">
      <span>${escapeHtml(p.sectionA.instruction || '')}</span>
      <span class="instruction-marks">${escapeHtml(p.sectionA.marks || '')}</span>
    </div>
    <div class="questions-list">
      ${qHtml}
    </div>
  `;
}

// Section B Questions group HTML
function generateSecBGroupHTML(questions, showHeader = false) {
  const p = currentPaper;
  let secBHtml = '';
  if (showHeader) {
    secBHtml += `
      <div class="section-header" style="margin-top:2px;">${escapeHtml(p.sectionB.title || 'SECTION - B')}</div>
      <div class="instruction-row">
        <span>${escapeHtml(p.sectionB.instruction || '')}</span>
        <span class="instruction-marks">${escapeHtml(p.sectionB.marks || '')}</span>
      </div>
    `;
  }

  let qItems = '';
  questions.forEach(q => {
    qItems += `
      <div class="choice-q">
        <div class="choice-part-row">
          <span class="choice-part-num">${q.num}. a)</span>
          <div class="q-text">${formatQuestionContent(q.a || '')}</div>
        </div>
        <div class="choice-label">${q.choice || 'Or'}</div>
        <div class="choice-part-row">
          <span class="choice-sub-num">b)</span>
          <div class="q-text">${formatQuestionContent(q.b || '')}</div>
        </div>
      </div>
    `;
  });

  return secBHtml + `<div class="questions-list">${qItems}</div>`;
}

// Format Question text
function formatQuestionContent(str) {
  if (!str) return '';
  if (str.includes('<table')) return str;
  return escapeHtml(str).replace(/\n/g, '<br/>');
}

// Render Preview
function renderPreview() {
  const { p1Questions, p2Questions, totalPages } = calculateDynamicPagination();

  const spreadClass = autoSpreadSpace ? ' spread-vertical' : '';

  // Content for Page 1
  const p1Content = `
    <div class="page-content-wrapper${spreadClass}">
      <div class="page-top-block">
        ${generateHeaderHTML()}
        ${generateSectionAHTML()}
        ${p1Questions.length > 0 ? generateSecBGroupHTML(p1Questions, true) : ''}
      </div>
      ${totalPages === 1 ? '<div class="end-asterisks">************</div>' : ''}
    </div>
  `;

  // Content for Page 2 (if needed)
  let p2Content = '';
  if (totalPages > 1 && p2Questions.length > 0) {
    p2Content = `
      <div class="page-content-wrapper${spreadClass}">
        <div class="page-top-block">
          ${generateSecBGroupHTML(p2Questions, p1Questions.length === 0)}
        </div>
        <div class="end-asterisks">************</div>
      </div>
    `;
  }

  // Update Page 2 visibility & Toolbar Export button
  const btnExpP2 = document.getElementById('btn-exp-p2');
  const btnShowP2 = document.getElementById('btn-show-p2');
  if (totalPages === 1) {
    previewPage2.style.display = 'none';
    if (btnExpP2) btnExpP2.style.display = 'none';
    if (btnShowP2) btnShowP2.style.display = 'none';
    if (page2StatusBadge) {
      page2StatusBadge.textContent = 'P2: Not Needed (Fits in 1 Page)';
      page2StatusBadge.className = 'badge-status badge-ok';
    }
  } else {
    previewPage2.style.display = 'flex';
    if (btnExpP2) btnExpP2.style.display = 'inline-flex';
    if (btnShowP2) btnShowP2.style.display = 'inline-block';
  }

  if (currentLayoutMode === '2up') {
    // 2-Up Duplicate Mode (A4 Landscape)
    previewPage1.className = 'exam-page mode-2up' + (showCutLine ? ' show-cut-line' : '');
    previewPage1.innerHTML = `
      <div class="paper-half left-half">
        <div class="cut-indicator">✂ CUT</div>
        ${p1Content}
      </div>
      <div class="paper-half right-half">
        ${p1Content}
      </div>
    `;

    if (totalPages > 1) {
      previewPage2.className = 'exam-page mode-2up' + (showCutLine ? ' show-cut-line' : '');
      previewPage2.innerHTML = `
        <div class="paper-half left-half">
          <div class="cut-indicator">✂ CUT</div>
          ${p2Content}
        </div>
        <div class="paper-half right-half">
          ${p2Content}
        </div>
      `;
    }
  } else {
    // Full A4 Portrait Mode (Single Page)
    previewPage1.className = 'exam-page mode-full-a4';
    previewPage1.innerHTML = `
      <div class="paper-full">
        ${p1Content}
      </div>
    `;

    if (totalPages > 1) {
      previewPage2.className = 'exam-page mode-full-a4';
      previewPage2.innerHTML = `
        <div class="paper-full">
          ${p2Content}
        </div>
      `;
    }
  }

  // Trigger KaTeX math rendering
  renderMathFormulas();

  // Check Page Fill / Overflow
  setTimeout(() => checkPageOverflow(totalPages), 60);
}

function renderMathFormulas() {
  if (window.renderMathInElement) {
    try {
      const options = {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      };
      window.renderMathInElement(previewPage1, options);
      if (previewPage2.style.display !== 'none') {
        window.renderMathInElement(previewPage2, options);
      }
    } catch (e) {
      console.warn('Math rendering error:', e);
    }
  }
}

// Measure and verify page fill
function checkPageOverflow(totalPages) {
  const p1Container = previewPage1.querySelector('.paper-half') || previewPage1.querySelector('.paper-full');
  const p2Container = previewPage2.querySelector('.paper-half') || previewPage2.querySelector('.paper-full');

  if (p1Container && page1StatusBadge) {
    const scrollH = p1Container.scrollHeight;
    const clientH = p1Container.clientHeight;
    const fillPercent = Math.round((scrollH / clientH) * 100);
    if (fillPercent > 102) {
      page1StatusBadge.textContent = `P1: ${fillPercent}% (Overflow)`;
      page1StatusBadge.className = 'badge-status badge-warn';
    } else {
      page1StatusBadge.textContent = `P1: ${fillPercent}% (Filled)`;
      page1StatusBadge.className = 'badge-status badge-ok';
    }
  }

  if (totalPages > 1 && p2Container && page2StatusBadge) {
    const scrollH = p2Container.scrollHeight;
    const clientH = p2Container.clientHeight;
    const fillPercent = Math.round((scrollH / clientH) * 100);
    if (fillPercent > 102) {
      page2StatusBadge.textContent = `P2: ${fillPercent}% (Overflow)`;
      page2StatusBadge.className = 'badge-status badge-warn';
    } else {
      page2StatusBadge.textContent = `P2: ${fillPercent}% (Filled)`;
      page2StatusBadge.className = 'badge-status badge-ok';
    }
  }
}

// Smart Auto-Fit: Automatically adjusts font size & spacing to fit 2 pages
window.autoFitToTwoPages = function() {
  const fontSizes = ['10pt', '9.5pt', '9pt', '8.5pt', '8pt'];
  const gaps = ['3px', '2px', '1.5px', '1px'];
  const lineHeights = ['1.25', '1.22', '1.18', '1.15'];

  for (let f of fontSizes) {
    for (let g of gaps) {
      for (let lh of lineHeights) {
        document.documentElement.style.setProperty('--base-paper-font', f);
        document.documentElement.style.setProperty('--question-gap', g);
        document.documentElement.style.setProperty('--line-height', lh);
        baseFontSize = f;
        questionGap = g;

        const p1 = previewPage1.querySelector('.paper-half') || previewPage1.querySelector('.paper-full');
        const p2 = previewPage2.querySelector('.paper-half') || previewPage2.querySelector('.paper-full');

        if (p1 && p1.scrollHeight <= p1.clientHeight && (!p2 || previewPage2.style.display === 'none' || p2.scrollHeight <= p2.clientHeight)) {
          const selFontSize = document.getElementById('sel-font-size');
          if (selFontSize) selFontSize.value = f;
          const selGap = document.getElementById('sel-question-gap');
          if (selGap) selGap.value = g;
          checkPageOverflow(previewPage2.style.display === 'none' ? 1 : 2);
          alert(`Auto-Fit Success: Adjusted to Font ${f}, Gap ${g}! All questions fit cleanly!`);
          return;
        }
      }
    }
  }

  document.documentElement.style.setProperty('--base-paper-font', '8pt');
  document.documentElement.style.setProperty('--question-gap', '1px');
  document.documentElement.style.setProperty('--line-height', '1.15');
  baseFontSize = '8pt';
  questionGap = '1px';
  checkPageOverflow(2);
  alert('Applied most compact settings.');
};

// Zoom control
function setupZoom() {
  if (zoomRange) {
    zoomRange.addEventListener('input', (e) => {
      const scale = e.target.value / 100;
      if (zoomValue) zoomValue.textContent = `${e.target.value}%`;
      document.querySelectorAll('.exam-page').forEach(page => {
        page.style.transform = `scale(${scale})`;
        const pageHeight = currentLayoutMode === '2up' ? 210 : 297;
        page.style.marginBottom = `${(scale - 1) * pageHeight}mm`;
      });
    });
  }

  const pAll = document.getElementById('btn-show-both');
  const p1Btn = document.getElementById('btn-show-p1');
  const p2Btn = document.getElementById('btn-show-p2');

  const pageBtns = [pAll, p1Btn, p2Btn];
  function selectPageBtn(btn) {
    pageBtns.forEach(b => { if (b) b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
  }

  if (pAll) pAll.addEventListener('click', () => {
    selectPageBtn(pAll);
    previewPage1.style.display = 'flex';
    if (previewPage2.innerHTML.trim() !== '') previewPage2.style.display = 'flex';
  });

  if (p1Btn) p1Btn.addEventListener('click', () => {
    selectPageBtn(p1Btn);
    previewPage1.style.display = 'flex';
    previewPage2.style.display = 'none';
  });

  if (p2Btn) p2Btn.addEventListener('click', () => {
    selectPageBtn(p2Btn);
    previewPage1.style.display = 'none';
    previewPage2.style.display = 'flex';
  });
}

// Load Template
window.loadTemplate = function(name) {
  if (TEMPLATES[name]) {
    currentPaper = JSON.parse(JSON.stringify(TEMPLATES[name]));
    persistState();
    renderForm();
    renderPreview();
  }
};

// Save draft as JSON
window.saveDraft = function() {
  const draft = {
    paper: currentPaper,
    layoutMode: currentLayoutMode,
    flowMode: pageFlowMode,
    baseFontSize,
    questionGap,
    autoSpreadSpace
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(draft, null, 2));
  const downloadAnchor = document.createElement('a');
  const cleanCode = (currentPaper.paperCode || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${cleanCode}_paper.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

// Load draft from JSON
window.loadDraft = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (data.paper) {
        currentPaper = data.paper;
        if (data.layoutMode) setLayoutMode(data.layoutMode);
        if (data.flowMode) {
          pageFlowMode = data.flowMode;
          const selFlow = document.getElementById('sel-page-flow');
          if (selFlow) selFlow.value = pageFlowMode;
        }
      } else {
        currentPaper = data;
      }
      persistState();
      renderForm();
      renderPreview();
      alert('Exam paper draft loaded successfully!');
    } catch (err) {
      alert('Error parsing JSON draft file.');
    }
  };
  reader.readAsText(file);
};

// High-Res 300 DPI Export using html2canvas
window.exportPageAsJpg = async function(pageId, filename) {
  const element = document.getElementById(pageId);
  if (!element || element.style.display === 'none') return;

  const btn = document.getElementById(pageId === 'preview-page-1' ? 'btn-exp-p1' : 'btn-exp-p2') || event?.target;
  const oldText = btn ? btn.textContent : '';
  if (btn) {
    btn.textContent = "Generating 300 DPI...";
    btn.disabled = true;
  }

  try {
    const prevDisplay = element.style.display;
    const prevTransform = element.style.transform;

    element.style.display = 'flex';
    element.style.transform = 'none';

    const targetWidth = currentLayoutMode === '2up' ? 3508 : 2480;

    const hadCutLine = element.classList.contains('show-cut-line');
    element.classList.remove('show-cut-line');

    const canvas = await html2canvas(element, {
      scale: targetWidth / element.offsetWidth,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    element.style.transform = prevTransform;
    element.style.display = prevDisplay;
    if (hadCutLine) element.classList.add('show-cut-line');

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
    link.remove();
  } catch (e) {
    console.error('Export failed', e);
    alert('Export failed: ' + e.message);
  } finally {
    if (btn) {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  }
};

// Print PDF Handler
window.printExamPaper = function() {
  document.body.className = currentLayoutMode === '2up' ? 'print-landscape' : 'print-portrait';

  let printStyle = document.getElementById('dynamic-print-style');
  if (!printStyle) {
    printStyle = document.createElement('style');
    printStyle.id = 'dynamic-print-style';
    document.head.appendChild(printStyle);
  }

  if (currentLayoutMode === '2up') {
    printStyle.textContent = `@media print { @page { size: 297mm 210mm; margin: 0; } }`;
  } else {
    printStyle.textContent = `@media print { @page { size: 210mm 297mm; margin: 0; } }`;
  }

  window.print();
};

// Helper: Insert text into active textarea
window.insertSnippet = function(text) {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'INPUT')) {
    const start = activeEl.selectionStart;
    const end = activeEl.selectionEnd;
    const val = activeEl.value;
    activeEl.value = val.substring(0, start) + text + val.substring(end);
    activeEl.selectionStart = activeEl.selectionEnd = start + text.length;
    activeEl.dispatchEvent(new Event('input'));
    activeEl.focus();
  } else {
    alert('Please click inside a question text box before clicking a snippet button.');
  }
};

// Insert table template
window.insertTableTemplate = function() {
  const tableHtml = `<table class="paper-table bordered">
<tr><th>Particulars</th><th>2024</th><th>2025</th></tr>
<tr><td>Item A</td><td>10,000</td><td>15,000</td></tr>
<tr><td>Item B</td><td>20,000</td><td>25,000</td></tr>
</table>`;
  insertSnippet(tableHtml);
};
