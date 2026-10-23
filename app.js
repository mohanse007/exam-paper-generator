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
      <div class="question-card-header">
        <span>Question ${i + 1}</span>
        <button type="button" class="btn-mini-tool" onclick="openTableModal('secA', ${i}, null)">
          📊 + Add Table
        </button>
      </div>
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
        <div class="q-box-toolbar">
          <label style="margin:0;">Option (a):</label>
          <button type="button" class="btn-mini-tool" onclick="openTableModal('secB', ${idx}, 'a')">
            📊 + Add Table
          </button>
        </div>
        <textarea rows="3" data-type="secB" data-index="${idx}" data-part="a">${escapeHtml(q.a || '')}</textarea>
      </div>

      <div class="choice-row">
        <label style="margin:0; font-size:11px;">Choice word:</label>
        <input type="text" data-type="secB" data-index="${idx}" data-part="choice" value="${escapeHtml(q.choice || 'Or')}" />
      </div>

      <div class="form-group" style="margin-bottom:2px;">
        <div class="q-box-toolbar">
          <label style="margin:0;">Option (b):</label>
          <button type="button" class="btn-mini-tool" onclick="openTableModal('secB', ${idx}, 'b')">
            📊 + Add Table
          </button>
        </div>
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
  // Allow safe formatting tags: <sub>, <sup>, <b>, <i>, <br>
  let safe = escapeHtml(str)
    .replace(/&lt;sub&gt;/gi, '<sub>')
    .replace(/&lt;\/sub&gt;/gi, '</sub>')
    .replace(/&lt;sup&gt;/gi, '<sup>')
    .replace(/&lt;\/sup&gt;/gi, '</sup>')
    .replace(/&lt;b&gt;/gi, '<b>')
    .replace(/&lt;\/b&gt;/gi, '</b>')
    .replace(/&lt;i&gt;/gi, '<i>')
    .replace(/&lt;\/i&gt;/gi, '</i>')
    .replace(/\n/g, '<br/>');
  return safe;
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

/* =================================================== */
/* MODULE 1: VISUAL TABLE BUILDER & EXCEL IMPORTER     */
/* =================================================== */

let activeTableTarget = null; // { type: 'secA'|'secB', index: number, part: 'a'|'b'|null }

window.openTableModal = function(type, index, part) {
  activeTableTarget = { type, index, part };
  const modal = document.getElementById('table-builder-modal');
  if (modal) {
    modal.style.display = 'flex';
    initTableGridWithDefaults();
  }
};

window.closeTableModal = function() {
  const modal = document.getElementById('table-builder-modal');
  if (modal) modal.style.display = 'none';
  activeTableTarget = null;
};

function initTableGridWithDefaults() {
  const rows = parseInt(document.getElementById('tbl-rows').value, 10) || 4;
  const cols = parseInt(document.getElementById('tbl-cols').value, 10) || 3;
  buildGridHTML(rows, cols, [
    ['Particulars', '2024', '2025'],
    ['Sales', '3,00,000', '4,00,000'],
    ['Cost of goods sold', '1,50,000', '2,00,000'],
    ['Net Profit', '1,50,000', '2,00,000']
  ]);
}

window.resizeTableGrid = function() {
  const rows = parseInt(document.getElementById('tbl-rows').value, 10) || 2;
  const cols = parseInt(document.getElementById('tbl-cols').value, 10) || 2;
  const currentData = getGridData();
  buildGridHTML(rows, cols, currentData);
};

window.addTableRow = function() {
  const rowsInp = document.getElementById('tbl-rows');
  rowsInp.value = parseInt(rowsInp.value, 10) + 1;
  resizeTableGrid();
};

window.removeTableRow = function() {
  const rowsInp = document.getElementById('tbl-rows');
  const val = parseInt(rowsInp.value, 10);
  if (val > 1) {
    rowsInp.value = val - 1;
    resizeTableGrid();
  }
};

window.addTableCol = function() {
  const colsInp = document.getElementById('tbl-cols');
  colsInp.value = parseInt(colsInp.value, 10) + 1;
  resizeTableGrid();
};

window.removeTableCol = function() {
  const colsInp = document.getElementById('tbl-cols');
  const val = parseInt(colsInp.value, 10);
  if (val > 1) {
    colsInp.value = val - 1;
    resizeTableGrid();
  }
};

window.clearTableCells = function() {
  const rows = parseInt(document.getElementById('tbl-rows').value, 10) || 3;
  const cols = parseInt(document.getElementById('tbl-cols').value, 10) || 3;
  buildGridHTML(rows, cols, []);
};

function buildGridHTML(rows, cols, existingData = []) {
  const grid = document.getElementById('builder-grid');
  if (!grid) return;

  const hasHeader = document.getElementById('tbl-has-header').checked;
  let html = '';

  for (let r = 0; r < rows; r++) {
    html += '<tr>';
    const isHead = r === 0 && hasHeader;
    for (let c = 0; c < cols; c++) {
      const cellVal = (existingData[r] && existingData[r][c] !== undefined) ? existingData[r][c] : '';
      if (isHead) {
        html += `<th><input type="text" value="${escapeHtml(cellVal)}" placeholder="Header ${c + 1}"></th>`;
      } else {
        html += `<td><input type="text" value="${escapeHtml(cellVal)}" placeholder="R${r + 1}C${c + 1}"></td>`;
      }
    }
    html += '</tr>';
  }
  grid.innerHTML = html;
}

function getGridData() {
  const grid = document.getElementById('builder-grid');
  if (!grid) return [];
  const rows = grid.querySelectorAll('tr');
  const data = [];
  rows.forEach(tr => {
    const row = [];
    tr.querySelectorAll('input').forEach(input => {
      row.push(input.value.trim());
    });
    data.push(row);
  });
  return data;
}

// Paste Excel / Google Sheets data
window.parsePastedExcelData = function() {
  const pasteInput = document.getElementById('tbl-paste-input');
  const raw = pasteInput.value.trim();
  if (!raw) {
    alert('Please paste copied spreadsheet cells into the box first.');
    return;
  }

  // Split lines and tabs
  const lines = raw.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return;

  const parsedData = lines.map(line => line.split('\t').map(cell => cell.trim()));
  const numRows = parsedData.length;
  const numCols = Math.max(...parsedData.map(r => r.length));

  document.getElementById('tbl-rows').value = numRows;
  document.getElementById('tbl-cols').value = numCols;
  buildGridHTML(numRows, numCols, parsedData);
  pasteInput.value = '';
};

// Generate HTML and insert into active target
window.insertTableFromModal = function() {
  if (!activeTableTarget) {
    alert('No question selected. Please click + Add Table inside a question box.');
    closeTableModal();
    return;
  }

  const isBordered = document.getElementById('tbl-bordered').checked;
  const hasHeader = document.getElementById('tbl-has-header').checked;
  const gridData = getGridData();

  if (gridData.length === 0) {
    closeTableModal();
    return;
  }

  const tableClass = isBordered ? 'paper-table bordered' : 'paper-table';
  let tableHtml = `<table class="${tableClass}">\n`;

  gridData.forEach((row, rIdx) => {
    tableHtml += '<tr>';
    const isHead = rIdx === 0 && hasHeader;
    row.forEach(cell => {
      const tag = isHead ? 'th' : 'td';
      tableHtml += `<${tag}>${escapeHtml(cell)}</${tag}>`;
    });
    tableHtml += '</tr>\n';
  });
  tableHtml += '</table>';

  const { type, index, part } = activeTableTarget;

  if (type === 'secA') {
    const prev = currentPaper.sectionA.questions[index] || '';
    currentPaper.sectionA.questions[index] = prev ? `${prev}\n${tableHtml}` : tableHtml;
  } else if (type === 'secB') {
    const qObj = currentPaper.sectionB.questions[index];
    if (qObj) {
      const prev = qObj[part] || '';
      qObj[part] = prev ? `${prev}\n${tableHtml}` : tableHtml;
    }
  }

  persistState();
  renderForm();
  renderPreview();
  closeTableModal();
};

/* =================================================== */
/* MODULE 2: DOCUMENT (.DOCX) & TEXT AUTO-IMPORTER     */
/* =================================================== */

window.openImportModal = function() {
  const modal = document.getElementById('import-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('import-status-msg').style.display = 'none';
  }
};

window.closeImportModal = function() {
  const modal = document.getElementById('import-modal');
  if (modal) modal.style.display = 'none';
};

// Handle File upload (.docx, .pdf, .txt)
window.handleFileUpload = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  const statusMsg = document.getElementById('import-status-msg');
  statusMsg.style.display = 'block';
  statusMsg.style.color = '#0284c7';

  if (fileName.endsWith('.pdf')) {
    // PDF Parsing using PDF.js
    statusMsg.textContent = '⏳ Reading PDF pages and extracting text & questions...';
    const fileReader = new FileReader();
    fileReader.onload = function() {
      const typedarray = new Uint8Array(this.result);
      if (window.pdfjsLib) {
        pdfjsLib.getDocument(typedarray).promise.then(async function(pdf) {
          let fullText = '';
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageItems = textContent.items;

            // Sort text items by vertical position (Y) and horizontal (X) for accurate reading
            let lastY = null;
            let pageStr = '';
            for (let item of pageItems) {
              if (lastY === null || Math.abs(item.transform[5] - lastY) > 5) {
                pageStr += '\n' + item.str;
                lastY = item.transform[5];
              } else {
                pageStr += ' ' + item.str;
              }
            }
            fullText += '\n' + pageStr;
          }
          parseImportedHtmlOrText(fullText, false);
          statusMsg.style.color = '#059669';
          statusMsg.textContent = '✓ PDF successfully imported!';
          setTimeout(closeImportModal, 900);
        }).catch(err => {
          console.error(err);
          statusMsg.style.color = '#dc2626';
          statusMsg.textContent = 'Error parsing PDF: ' + err.message;
        });
      } else {
        statusMsg.style.color = '#dc2626';
        statusMsg.textContent = 'PDF.js library not loaded. Please ensure internet access.';
      }
    };
    fileReader.readAsArrayBuffer(file);

  } else if (fileName.endsWith('.docx')) {
    // Word (.docx) Parsing using Mammoth
    statusMsg.textContent = '⏳ Reading Word document and converting tables...';
    const reader = new FileReader();
    reader.onload = function(loadEvent) {
      const arrayBuffer = loadEvent.target.result;
      if (window.mammoth) {
        window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
          .then(result => {
            const html = result.value;
            parseImportedHtmlOrText(html, true);
            statusMsg.style.color = '#059669';
            statusMsg.textContent = '✓ Word document successfully imported!';
            setTimeout(closeImportModal, 900);
          })
          .catch(err => {
            console.error(err);
            statusMsg.style.color = '#dc2626';
            statusMsg.textContent = 'Error parsing Word document: ' + err.message;
          });
      } else {
        statusMsg.style.color = '#dc2626';
        statusMsg.textContent = 'Mammoth parser library not loaded. Please ensure internet access.';
      }
    };
    reader.readAsArrayBuffer(file);

  } else {
    // Plain Text file
    const reader = new FileReader();
    reader.onload = function(e) {
      parseImportedHtmlOrText(e.target.result, false);
      statusMsg.style.color = '#059669';
      statusMsg.textContent = '✓ Text file imported!';
      setTimeout(closeImportModal, 900);
    };
    reader.readAsText(file);
  }
};

// Handle plain text import
window.processTextImport = function() {
  const rawText = document.getElementById('inp-import-raw-text').value.trim();
  if (!rawText) {
    alert('Please paste some question paper text or upload a Word document.');
    return;
  }
  parseImportedHtmlOrText(rawText, false);
  closeImportModal();
};

// Core parser for Word HTML / Text
function parseImportedHtmlOrText(content, isHtml) {
  let docLines = [];

  if (isHtml) {
    // Parse using DOM parser to preserve tables, subscripts, superscripts, and paragraphs cleanly
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');

    // Convert any HTML table into .paper-table bordered
    doc.querySelectorAll('table').forEach(tbl => {
      tbl.className = 'paper-table bordered';
      // Normalize th and td styles
      tbl.querySelectorAll('p').forEach(p => {
        const text = p.innerHTML;
        p.replaceWith(text);
      });
    });

    // Helper to sanitize an inline HTML node while preserving <sub>, <sup>, <b>, <i>, <table>
    function extractFormattedText(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.tagName.toLowerCase();
        if (tag === 'table') {
          return node.outerHTML;
        }
        if (tag === 'sub' || tag === 'sup' || tag === 'b' || tag === 'strong' || tag === 'i' || tag === 'em') {
          let inner = '';
          node.childNodes.forEach(child => { inner += extractFormattedText(child); });
          const outTag = (tag === 'strong') ? 'b' : (tag === 'em') ? 'i' : tag;
          return `<${outTag}>${inner}</${outTag}>`;
        }
        if (tag === 'br') {
          return '\n';
        }
        let inner = '';
        node.childNodes.forEach(child => { inner += extractFormattedText(child); });
        return inner;
      }
      return '';
    }

    // Extract blocks: paragraphs, headings, tables
    const blocks = doc.body.children;
    for (let i = 0; i < blocks.length; i++) {
      const el = blocks[i];
      if (el.tagName === 'TABLE') {
        docLines.push(el.outerHTML);
      } else {
        const formatted = extractFormattedText(el).trim();
        if (formatted) docLines.push(formatted);
      }
    }
  } else {
    docLines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  }

  // Smart Section & Question Extractor
  extractExamStructure(docLines);
  persistState();
  renderForm();
  renderPreview();
}

function extractExamStructure(lines) {
  // 1. Reset current paper to clean slate so old template text doesn't mix with imported paper
  currentPaper = {
    paperCode: '',
    collegeName: '',
    collegeAddress: '',
    examDetails: '',
    subjectTitle: '',
    streamDetails: '',
    timeStr: 'Time:3Hrs',
    maxMarksStr: 'Max Marks:60',
    sectionA: {
      title: 'SECTION - A',
      instruction: 'I. Answer any Five questions.',
      marks: '5x4=20',
      questions: ['', '', '', '', '', '', '', '']
    },
    sectionB: {
      title: 'SECTION - B',
      instruction: 'II. Answer ALL the following questions.',
      marks: '5x8=40',
      questions: [
        { num: 9, a: '', choice: 'Or', b: '' },
        { num: 10, a: '', choice: 'Or', b: '' },
        { num: 11, a: '', choice: 'Or', b: '' },
        { num: 12, a: '', choice: 'Or', b: '' },
        { num: 13, a: '', choice: 'Or', b: '' }
      ]
    }
  };

  let currentSection = 'header'; // 'header', 'secA', 'secB'
  let secAQuestions = [];
  let secBQuestions = [];
  let currentSecBQuestion = null;
  let currentSecBPart = 'a'; // 'a' or 'b'
  let headerLines = [];

  // Helper to clean up sub-question numbers like "ii." or "ii)" that run together in a paragraph
  function formatSubpoints(text) {
    if (!text) return '';
    // Strip redundant leading "a)" or "b)" or "a." or "b." if present at start
    text = text.replace(/^[aAbB][\.\)]\s*/, '').trim();
    // Add clean newline before roman numerals like "ii.", "iii.", "iv.", "ii)", "iii)" or "b)" when preceded by text
    text = text.replace(/([^\n])\s+(ii|iii|iv|v|vi|b)[\.\)]\s+/gi, '$1\n$2) ');
    return text;
  }

  lines.forEach(line => {
    const rawText = line.replace(/<[^>]*>/g, '').trim();
    const upper = rawText.toUpperCase();

    // Check for Section A trigger
    if (upper.includes('SECTION - A') || upper.includes('SECTION A') || upper.includes('PART - A') || upper.includes('PART A')) {
      currentSection = 'secA';
      return;
    }

    // Check for Section B trigger
    if (upper.includes('SECTION - B') || upper.includes('SECTION B') || upper.includes('PART - B') || upper.includes('PART B')) {
      currentSection = 'secB';
      return;
    }

    // Header extraction
    if (currentSection === 'header') {
      if (rawText.startsWith('[') && rawText.includes(']')) {
        currentPaper.paperCode = rawText;
        return;
      }

      // Check Time and Marks anywhere
      if (upper.includes('TIME:') || upper.includes('TIME :') || upper.includes('HOURS') || upper.includes('HRS')) {
        // Match Time & Marks on same line if present
        const timeMatch = rawText.match(/Time\s*[:\-]?\s*([0-9\.\s\w]+?)(?=\s+(?:Max|Marks|Set)|$)/i);
        const marksMatch = rawText.match(/(?:Max\s*Marks|Marks)\s*[:\-]?\s*([0-9]+)/i);
        if (timeMatch) currentPaper.timeStr = 'Time:' + timeMatch[1].trim();
        else currentPaper.timeStr = rawText;
        if (marksMatch) currentPaper.maxMarksStr = 'Max Marks:' + marksMatch[1].trim();
        return;
      }

      if (upper.includes('MARKS:') || upper.includes('MARKS :') || upper.includes('MAX MARKS')) {
        const marksMatch = rawText.match(/(?:Max\s*Marks|Marks)\s*[:\-]?\s*([0-9]+)/i);
        if (marksMatch) currentPaper.maxMarksStr = 'Max Marks:' + marksMatch[1].trim();
        else currentPaper.maxMarksStr = rawText;
        return;
      }

      headerLines.push(rawText);
      return;
    }

    // Section A Question Extraction (1 to 8)
    if (currentSection === 'secA') {
      // Check for instruction line
      if (upper.includes('ANSWER ANY') || upper.includes('FIVE QUESTIONS') || upper.includes('MARKS')) {
        return;
      }

      const qMatch = line.match(/^(\d{1,2})[\.\)\-]\s*(.*)/);
      if (qMatch) {
        const num = parseInt(qMatch[1], 10);
        if (num <= 8) {
          secAQuestions[num - 1] = formatSubpoints(qMatch[2]);
          return;
        } else if (num >= 9) {
          // Implicit Section B started
          currentSection = 'secB';
        }
      } else if (secAQuestions.length > 0) {
        // Append continuation line / table to previous question
        secAQuestions[secAQuestions.length - 1] += '\n' + formatSubpoints(line);
        return;
      }
    }

    // Section B Question Extraction (9 to 13 with Or choice)
    if (currentSection === 'secB') {
      // Check for instruction line
      if (upper.includes('ANSWER ALL') || upper.includes('FOLLOWING QUESTIONS')) {
        return;
      }

      // Check for Question start: e.g. "9. a)", "9.", "10."
      const qStartMatch = line.match(/^(\d{1,2})[\.\)\-]?\s*(?:[aA][\.\)])?\s*(.*)/);
      const isChoiceWord = upper === 'OR' || upper === '(OR)' || line.includes('(లేదా)') || upper === 'లేదా';

      if (qStartMatch && parseInt(qStartMatch[1], 10) >= 9) {
        const qNum = parseInt(qStartMatch[1], 10);
        currentSecBQuestion = {
          num: qNum,
          a: formatSubpoints(qStartMatch[2] || ''),
          choice: 'Or',
          b: ''
        };
        secBQuestions.push(currentSecBQuestion);
        currentSecBPart = 'a';
        return;
      }

      if (isChoiceWord && currentSecBQuestion) {
        currentSecBQuestion.choice = '(Or)';
        currentSecBPart = 'b';
        return;
      }

      // Check for explicit "b)" or "B)"
      const bPartMatch = line.match(/^[bB][\.\)]\s*(.*)/);
      if (bPartMatch && currentSecBQuestion) {
        currentSecBQuestion.b = formatSubpoints(bPartMatch[1]);
        currentSecBPart = 'b';
        return;
      }

      // Append continuation lines or tables
      if (currentSecBQuestion) {
        const formatted = formatSubpoints(line);
        if (currentSecBPart === 'a') {
          currentSecBQuestion.a += (currentSecBQuestion.a ? '\n' : '') + formatted;
        } else {
          currentSecBQuestion.b += (currentSecBQuestion.b ? '\n' : '') + formatted;
        }
      }
    }
  });

  // Assign parsed header lines cleanly
  if (headerLines.length > 0) {
    currentPaper.collegeName = headerLines[0] || 'COLLEGE NAME';
    if (headerLines.length > 1) {
      // Look for address / college recognition
      const addrIdx = headerLines.findIndex((l, i) => i > 0 && (l.includes('530') || l.includes('UGC') || l.includes('NAAC') || l.includes('Malkapuram') || l.includes('Andhra')));
      if (addrIdx !== -1) {
        currentPaper.collegeAddress = headerLines[addrIdx];
      }
      // Look for exam / semester details
      const examIdx = headerLines.findIndex((l, i) => i > 0 && (l.toUpperCase().includes('SEMESTER') || l.toUpperCase().includes('BATCH') || l.toUpperCase().includes('DEGREE') || l.toUpperCase().includes('EXAMINATIONS')));
      if (examIdx !== -1) {
        currentPaper.examDetails = headerLines[examIdx];
      }
      // Look for subject course title
      const courseIdx = headerLines.findIndex((l, i) => i > 0 && (l.toUpperCase().includes('COURSE') || l.toUpperCase().includes('CHEMISTRY') || l.toUpperCase().includes('PHYSICS') || l.toUpperCase().includes('MATHEMATICS') || l.toUpperCase().includes('COMMERCE') || l.toUpperCase().includes('ACCOUNTING') || l.toUpperCase().includes('PAPER')));
      if (courseIdx !== -1 && courseIdx !== examIdx) {
        currentPaper.subjectTitle = headerLines[courseIdx];
      }
      // Look for stream
      const streamIdx = headerLines.findIndex((l, i) => i > 0 && (l.toUpperCase().includes('B.SC') || l.toUpperCase().includes('B.COM') || l.toUpperCase().includes('B.A') || l.toUpperCase().includes('MAJOR')));
      if (streamIdx !== -1 && streamIdx !== courseIdx && streamIdx !== examIdx) {
        currentPaper.streamDetails = headerLines[streamIdx];
      }
    }
  }

  // Assign questions to current paper
  for (let i = 0; i < 8; i++) {
    if (secAQuestions[i]) {
      currentPaper.sectionA.questions[i] = secAQuestions[i];
    }
  }

  secBQuestions.forEach(newQ => {
    const existing = currentPaper.sectionB.questions.find(q => q.num === newQ.num);
    if (existing) {
      if (newQ.a) existing.a = newQ.a;
      if (newQ.choice) existing.choice = newQ.choice;
      if (newQ.b) existing.b = newQ.b;
    }
  });
}

