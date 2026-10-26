// Application State
let currentPaper = JSON.parse(JSON.stringify(TEMPLATES.commerce));
let currentLayoutMode = '2up'; // '2up' or 'full-a4'
let pageFlowMode = 'auto'; // 'auto' (fill p1 first), 'balance', or manual question number '9','10','11','12'
let baseFontSize = '9.5pt';
let secAFont = '9.5pt';
let secBFont = '9.5pt';
let lineHeight = '1.25';
let questionGap = '3px';
let secAGap = '3px';
let secBGap = '6px';
let sectionGap = '6px';
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

// Helper: HTML Entity Decoder
function decodeHtmlEntities(str) {
  if (!str) return '';
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

// Helper: College Name Normalizer
function formatCollegeName(name) {
  if (!name) return '';
  return name
    .replace(/ST\.([a-zA-Z])/gi, 'ST. $1')
    .replace(/([a-zA-Z’']+)(COLLEGE)/gi, '$1 $2')
    .replace(/(COLLEGE)(FOR)(WOMEN)/gi, '$1 $2 $3')
    .replace(/\bAUTONOMUS\b/gi, 'AUTONOMOUS');
}

// Helper: Unicode Subscript and Superscript Converter
const subMap = { '₀':'0', '₁':'1', '₂':'2', '₃':'3', '₄':'4', '₅':'5', '₆':'6', '₇':'7', '₈':'8', '₉':'9', '₊':'+', '₋':'-' };
const supMap = { '⁰':'0', '¹':'1', '²':'2', '³':'3', '⁴':'4', '⁵':'5', '⁶':'6', '⁷':'7', '⁸':'8', '⁹':'9', '⁺':'+', '⁻':'-' };
const subRegex = /[₀₁₂₃₄₅₆₇₈₉₊₋]+/g;
const supRegex = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g;

function convertUnicodeSubSup(str) {
  if (!str) return '';
  return str.replace(subRegex, m => '<sub>' + m.split('').map(c => subMap[c] || c).join('') + '</sub>')
            .replace(supRegex, m => '<sup>' + m.split('').map(c => supMap[c] || c).join('') + '</sup>');
}

// Load saved data from localStorage
try {
  const saved = localStorage.getItem('exam_paper_data');
  if (saved) currentPaper = JSON.parse(saved);
  const savedMode = localStorage.getItem('exam_layout_mode');
  if (savedMode) currentLayoutMode = savedMode;
  const savedFlow = localStorage.getItem('exam_page_flow');
  if (savedFlow) pageFlowMode = savedFlow;
  const savedFont = localStorage.getItem('exam_base_font');
  if (savedFont) {
    baseFontSize = savedFont;
    secAFont = savedFont;
    secBFont = savedFont;
  }
  const savedSecAFont = localStorage.getItem('exam_sec_a_font');
  if (savedSecAFont) secAFont = savedSecAFont;
  const savedSecBFont = localStorage.getItem('exam_sec_b_font');
  if (savedSecBFont) secBFont = savedSecBFont;
  const savedLh = localStorage.getItem('exam_line_height');
  if (savedLh) lineHeight = savedLh;
  const savedGap = localStorage.getItem('exam_question_gap');
  if (savedGap) questionGap = savedGap;
  const savedSecAGap = localStorage.getItem('exam_sec_a_gap');
  if (savedSecAGap) secAGap = savedSecAGap;
  const savedSecBGap = localStorage.getItem('exam_sec_b_gap');
  if (savedSecBGap) secBGap = savedSecBGap;
  const savedSecGap = localStorage.getItem('exam_section_gap');
  if (savedSecGap) sectionGap = savedSecGap;
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
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, false);
  updateDtpToolbarUI();
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
    const isStandalone = !q.b || !q.b.trim();
    const qDiv = document.createElement('div');
    qDiv.className = 'question-card';
    qDiv.innerHTML = `
      <div class="question-card-header">
        <span>Question ${q.num} ${isStandalone ? '(Standalone)' : '(Choice a / b)'}</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <span style="font-size:10.5px; color:#0284c7; font-weight:normal;" id="q-page-tag-${q.num}"></span>
          ${currentPaper.sectionB.questions.length > 1 ? `<button type="button" class="btn-mini-danger" onclick="removeSecBQuestion(${idx})" title="Delete question">✕</button>` : ''}
        </div>
      </div>

      <div class="form-group" style="margin-bottom:5px;">
        <div class="q-box-toolbar">
          <label style="margin:0;">${isStandalone ? 'Question text:' : 'Option (a):'}</label>
          <button type="button" class="btn-mini-tool" onclick="openTableModal('secB', ${idx}, 'a')">
            📊 + Add Table
          </button>
        </div>
        <textarea rows="3" data-type="secB" data-index="${idx}" data-part="a">${escapeHtml(q.a || '')}</textarea>
      </div>

      <div class="choice-row" style="${isStandalone ? 'display:none;' : ''}">
        <label style="margin:0; font-size:11px;">Choice word:</label>
        <input type="text" data-type="secB" data-index="${idx}" data-part="choice" value="${escapeHtml(q.choice || 'Or')}" />
      </div>

      <div class="form-group" style="margin-bottom:2px; ${isStandalone ? 'display:none;' : ''}">
        <div class="q-box-toolbar">
          <label style="margin:0;">Option (b):</label>
          <button type="button" class="btn-mini-tool" onclick="openTableModal('secB', ${idx}, 'b')">
            📊 + Add Table
          </button>
        </div>
        <textarea rows="3" data-type="secB" data-index="${idx}" data-part="b">${escapeHtml(q.b || '')}</textarea>
      </div>

      <div style="margin-top:6px; display:flex; gap:6px;">
        <button type="button" class="btn-mini-tool" style="font-size:11px;" onclick="toggleSecBChoice(${idx})">
          ${isStandalone ? '➕ Add (Or) Option (b)' : '➖ Remove (Or) Option (b)'}
        </button>
      </div>
    `;
    container.appendChild(qDiv);
  });

  const addWrap = document.createElement('div');
  addWrap.style.cssText = 'margin-top:8px; margin-bottom:12px; text-align:center;';
  addWrap.innerHTML = `
    <button type="button" class="btn btn-secondary" style="width:100%; font-size:12px; padding:6px;" onclick="addSecBQuestion()">
      ➕ Add Question to Section B
    </button>
  `;
  container.appendChild(addWrap);
}

window.addSecBQuestion = function() {
  const nextNum = currentPaper.sectionB.questions.length > 0 
    ? Math.max(...currentPaper.sectionB.questions.map(q => q.num)) + 1 
    : 9;
  currentPaper.sectionB.questions.push({
    num: nextNum,
    a: '',
    choice: 'Or',
    b: ''
  });
  persistState();
  renderForm();
  renderPreview();
};

window.removeSecBQuestion = function(idx) {
  if (currentPaper.sectionB.questions.length <= 1) return;
  currentPaper.sectionB.questions.splice(idx, 1);
  currentPaper.sectionB.questions.forEach((q, i) => { q.num = 9 + i; });
  persistState();
  renderForm();
  renderPreview();
};

window.toggleSecBChoice = function(idx) {
  const q = currentPaper.sectionB.questions[idx];
  if (!q) return;
  if (q.b && q.b.trim()) {
    q.b = '';
    q.choice = '';
  } else {
    q.choice = 'Or';
    q.b = ' ';
  }
  persistState();
  renderForm();
  renderPreview();
};

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
  // Available height: in 2-Up (210mm total - padding), approx 785px; in Full A4 (297mm - padding), approx 1060px
  const maxPageHeight = is2Up ? 785 : 1060;
  const colWidth = is2Up ? '135mm' : '180mm';

  measureContainer.className = is2Up ? 'exam-page mode-2up' : 'exam-page mode-full-a4';
  measureContainer.innerHTML = `
    <div class="${is2Up ? 'paper-half' : 'paper-full'}" style="width:${colWidth}; height:auto; visibility:hidden; position:absolute;">
      <div id="m-header">${generateHeaderHTML()}</div>
      <div id="m-sec-a">${generateSectionAHTML()}</div>
      <div class="section-b-wrap">
        <div id="m-sec-b-header">
          <div class="section-header">${escapeHtml(currentPaper.sectionB.title || 'SECTION - B')}</div>
          <div class="instruction-row">
            <span>${escapeHtml(currentPaper.sectionB.instruction || '')}</span>
            <span class="instruction-marks">${escapeHtml(currentPaper.sectionB.marks || '')}</span>
          </div>
        </div>
        <div id="m-questions" class="questions-list sec-b-list" style="gap: var(--sec-b-gap) !important;">
          ${allSecB.map(q => {
            if (q.b && q.b.trim()) {
              return `
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
              `;
            } else {
              return `
                <div class="q-item" id="m-q-${q.num}">
                  <span class="q-num">${q.num}.</span>
                  <div class="q-text">${formatQuestionContent(q.a || '')}</div>
                </div>
              `;
            }
          }).join('')}
        </div>
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
                     12; // padding/margins buffer

  let currentP1Height = baseFixedH;
  const p1Questions = [];
  const p2Questions = [];
  const bGapNum = parseInt(secBGap, 10) || 6;

  if (pageFlowMode === 'balance') {
    // Balanced mode: distribute questions so both pages have roughly equal height
    let totalSecBH = 0;
    allSecB.forEach(q => {
      const qEl = measureContainer.querySelector(`#m-q-${q.num}`);
      totalSecBH += (qEl ? qEl.offsetHeight + bGapNum : 60);
    });

    // Target half of Sec B questions on P1
    let accumulated = 0;
    allSecB.forEach(q => {
      const qEl = measureContainer.querySelector(`#m-q-${q.num}`);
      const h = (qEl ? qEl.offsetHeight + bGapNum : 60);
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
      const qHeight = qEl ? qEl.offsetHeight + bGapNum : 60;

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
    <div class="section-a-wrap">
      <div class="section-header">${escapeHtml(p.sectionA.title || 'SECTION - A')}</div>
      <div class="instruction-row">
        <span>${escapeHtml(p.sectionA.instruction || '')}</span>
        <span class="instruction-marks">${escapeHtml(p.sectionA.marks || '')}</span>
      </div>
      <div class="questions-list sec-a-list" style="gap: var(--sec-a-gap) !important;">
        ${qHtml}
      </div>
    </div>
  `;
}

// Section B Questions group HTML
function generateSecBGroupHTML(questions, showHeader = false) {
  const p = currentPaper;
  let secBHtml = '';
  if (showHeader) {
    secBHtml += `
      <div class="section-header">${escapeHtml(p.sectionB.title || 'SECTION - B')}</div>
      <div class="instruction-row">
        <span>${escapeHtml(p.sectionB.instruction || '')}</span>
        <span class="instruction-marks">${escapeHtml(p.sectionB.marks || '')}</span>
      </div>
    `;
  }

  let qItems = '';
  questions.forEach(q => {
    if (q.b && q.b.trim()) {
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
    } else {
      qItems += `
        <div class="q-item">
          <span class="q-num">${q.num}.</span>
          <div class="q-text">${formatQuestionContent(q.a || '')}</div>
        </div>
      `;
    }
  });

  return `
    <div class="section-b-wrap">
      ${secBHtml}
      <div class="questions-list sec-b-list" style="gap: var(--sec-b-gap) !important;">
        ${qItems}
      </div>
    </div>
  `;
}

// Format Question text
function formatQuestionContent(str) {
  if (!str) return '';
  str = convertUnicodeSubSup(str);

  // If there's a table, protect table blocks while escaping and formatting surrounding text
  const tables = [];
  let tokenized = str.replace(/<table[\s\S]*?<\/table>/gi, (tbl) => {
    tables.push(tbl);
    return `___TABLE_PLACEHOLDER_${tables.length - 1}___`;
  });

  let safe = escapeHtml(tokenized)
    .replace(/&lt;sub&gt;/gi, '<sub>')
    .replace(/&lt;\/sub&gt;/gi, '</sub>')
    .replace(/&lt;sup&gt;/gi, '<sup>')
    .replace(/&lt;\/sup&gt;/gi, '</sup>')
    .replace(/&lt;b&gt;/gi, '<b>')
    .replace(/&lt;\/b&gt;/gi, '</b>')
    .replace(/&lt;strong&gt;/gi, '<b>')
    .replace(/&lt;\/strong&gt;/gi, '</b>')
    .replace(/&lt;i&gt;/gi, '<i>')
    .replace(/&lt;\/i&gt;/gi, '</i>')
    .replace(/&lt;em&gt;/gi, '<i>')
    .replace(/&lt;\/em&gt;/gi, '</i>')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br/>')
    .replace(/\r?\n/g, '<br/>');

  return safe.replace(/___TABLE_PLACEHOLDER_(\d+)___/g, (_, idx) => tables[parseInt(idx, 10)]);
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
      ${totalPages === 1 ? '<div class="end-asterisks">****************************</div>' : ''}
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
        <div class="end-asterisks">****************************</div>
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

// ===================================================
// CANVA / PHOTOSHOP STYLE DTP SPACING & TYPOGRAPHY
// ===================================================

function applySpacingValues(font, lh, gapA, gapB, secGap, persist = true) {
  // Support legacy 4-argument call: (font, lh, gap, secGap, persist)
  if (arguments.length === 4 || (typeof secGap === 'boolean')) {
    persist = (typeof secGap === 'boolean') ? secGap : true;
    secGap = gapB;
    gapB = gapA;
  }
  baseFontSize = font || baseFontSize;
  lineHeight = lh || lineHeight;
  secAGap = gapA || secAGap;
  secBGap = gapB || secBGap;
  sectionGap = secGap || sectionGap;

  document.documentElement.style.setProperty('--base-paper-font', baseFontSize);
  document.documentElement.style.setProperty('--sec-a-font', secAFont || baseFontSize);
  document.documentElement.style.setProperty('--sec-b-font', secBFont || baseFontSize);
  document.documentElement.style.setProperty('--line-height', lineHeight);
  document.documentElement.style.setProperty('--sec-a-gap', secAGap);
  document.documentElement.style.setProperty('--sec-b-gap', secBGap);
  document.documentElement.style.setProperty('--section-gap', sectionGap);

  if (persist) {
    try {
      localStorage.setItem('exam_base_font', baseFontSize);
      localStorage.setItem('exam_sec_a_font', secAFont);
      localStorage.setItem('exam_sec_b_font', secBFont);
      localStorage.setItem('exam_line_height', lineHeight);
      localStorage.setItem('exam_sec_a_gap', secAGap);
      localStorage.setItem('exam_sec_b_gap', secBGap);
      localStorage.setItem('exam_question_gap', secAGap);
      localStorage.setItem('exam_section_gap', sectionGap);
    } catch (e) {}
  }
}

function updateDtpToolbarUI() {
  const fNum = parseFloat(baseFontSize) || 9.5;
  const lhNum = parseFloat(lineHeight) || 1.25;
  const gapANum = parseInt(secAGap, 10) || 3;
  const gapBNum = parseInt(secBGap, 10) || 6;
  const secGapNum = parseInt(sectionGap, 10) || 6;
  const secAFNum = parseFloat(secAFont) || fNum;
  const secBFNum = parseFloat(secBFont) || fNum;

  const slFont = document.getElementById('slider-font-size');
  if (slFont) slFont.value = fNum;
  const valFont = document.getElementById('val-font-size');
  if (valFont) valFont.textContent = baseFontSize;

  const slLh = document.getElementById('slider-line-height');
  if (slLh) slLh.value = lhNum;
  const valLh = document.getElementById('val-line-height');
  if (valLh) valLh.textContent = lhNum.toFixed(2);

  // Section A Gap & Font (Toolbar & Sidebar)
  const slGapA = document.getElementById('slider-sec-a-gap');
  if (slGapA) slGapA.value = gapANum;
  const valGapA = document.getElementById('val-sec-a-gap');
  if (valGapA) valGapA.textContent = secAGap;

  const slSideGapA = document.getElementById('slider-sidebar-sec-a-gap');
  if (slSideGapA) slSideGapA.value = gapANum;
  const valSideGapA = document.getElementById('val-sidebar-sec-a-gap');
  if (valSideGapA) valSideGapA.textContent = secAGap;

  const slSideFontA = document.getElementById('slider-sidebar-sec-a-font');
  if (slSideFontA) slSideFontA.value = secAFNum;
  const valSideFontA = document.getElementById('val-sidebar-sec-a-font');
  if (valSideFontA) valSideFontA.textContent = secAFont;

  // Section B Gap & Font (Toolbar & Sidebar)
  const slGapB = document.getElementById('slider-sec-b-gap');
  if (slGapB) slGapB.value = gapBNum;
  const valGapB = document.getElementById('val-sec-b-gap');
  if (valGapB) valGapB.textContent = secBGap;

  const slSideGapB = document.getElementById('slider-sidebar-sec-b-gap');
  if (slSideGapB) slSideGapB.value = gapBNum;
  const valSideGapB = document.getElementById('val-sidebar-sec-b-gap');
  if (valSideGapB) valSideGapB.textContent = secBGap;

  const slSideFontB = document.getElementById('slider-sidebar-sec-b-font');
  if (slSideFontB) slSideFontB.value = secBFNum;
  const valSideFontB = document.getElementById('val-sidebar-sec-b-font');
  if (valSideFontB) valSideFontB.textContent = secBFont;

  // Section Gap
  const slSecGap = document.getElementById('slider-section-gap');
  if (slSecGap) slSecGap.value = secGapNum;
  const valSecGap = document.getElementById('val-section-gap');
  if (valSecGap) valSecGap.textContent = sectionGap;
}

window.nudgeFontSize = function(delta) {
  let cur = parseFloat(baseFontSize) || 9.5;
  cur = Math.min(12.0, Math.max(7.5, Math.round((cur + delta) * 100) / 100));
  baseFontSize = cur + 'pt';
  secAFont = baseFontSize;
  secBFont = baseFontSize;
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.onFontSizeSlider = function(val) {
  baseFontSize = val + 'pt';
  secAFont = baseFontSize;
  secBFont = baseFontSize;
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.nudgeLineHeight = function(delta) {
  let cur = parseFloat(lineHeight) || 1.25;
  cur = Math.min(1.65, Math.max(1.10, Math.round((cur + delta) * 100) / 100));
  lineHeight = cur.toFixed(2);
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.nudgeSecAGap = function(delta) {
  let cur = parseInt(secAGap, 10) || 3;
  cur = Math.min(24, Math.max(0, cur + delta));
  secAGap = cur + 'px';
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.onSecAGapSlider = function(val) {
  secAGap = val + 'px';
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.nudgeSecAFont = function(delta) {
  let cur = parseFloat(secAFont) || parseFloat(baseFontSize) || 9.5;
  cur = Math.min(13.0, Math.max(7.5, Math.round((cur + delta) * 100) / 100));
  secAFont = cur + 'pt';
  document.documentElement.style.setProperty('--sec-a-font', secAFont);
  try { localStorage.setItem('exam_sec_a_font', secAFont); } catch(e){}
  updateDtpToolbarUI();
  renderPreview();
};

window.onSecAFontSlider = function(val) {
  secAFont = val + 'pt';
  document.documentElement.style.setProperty('--sec-a-font', secAFont);
  try { localStorage.setItem('exam_sec_a_font', secAFont); } catch(e){}
  updateDtpToolbarUI();
  renderPreview();
};

window.nudgeSecBGap = function(delta) {
  let cur = parseInt(secBGap, 10) || 6;
  cur = Math.min(36, Math.max(0, cur + delta));
  secBGap = cur + 'px';
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.onSecBGapSlider = function(val) {
  secBGap = val + 'px';
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

window.nudgeSecBFont = function(delta) {
  let cur = parseFloat(secBFont) || parseFloat(baseFontSize) || 9.5;
  cur = Math.min(13.0, Math.max(7.5, Math.round((cur + delta) * 100) / 100));
  secBFont = cur + 'pt';
  document.documentElement.style.setProperty('--sec-b-font', secBFont);
  try { localStorage.setItem('exam_sec_b_font', secBFont); } catch(e){}
  updateDtpToolbarUI();
  renderPreview();
};

window.onSecBFontSlider = function(val) {
  secBFont = val + 'pt';
  document.documentElement.style.setProperty('--sec-b-font', secBFont);
  try { localStorage.setItem('exam_sec_b_font', secBFont); } catch(e){}
  updateDtpToolbarUI();
  renderPreview();
};

// Backwards compatibility for question gap
window.nudgeQuestionGap = function(delta) {
  window.nudgeSecAGap(delta);
  window.nudgeSecBGap(delta);
};
window.onQuestionGapSlider = function(val) {
  window.onSecAGapSlider(val);
  window.onSecBGapSlider(val);
};

window.onLineHeightSlider = function(val) {
  lineHeight = parseFloat(val).toFixed(2);
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  const valLh = document.getElementById('val-line-height');
  if (valLh) valLh.textContent = lineHeight;
  renderPreview();
};

window.onSectionGapSlider = function(val) {
  sectionGap = val + 'px';
  applySpacingValues(baseFontSize, lineHeight, secAGap, secBGap, sectionGap, true);
  const valSecGap = document.getElementById('val-section-gap');
  if (valSecGap) valSecGap.textContent = sectionGap;
  renderPreview();
};

window.applyPreset = function(presetName) {
  if (presetName === 'full') {
    // For short papers: larger font and generous spacing to eliminate empty bottom gap
    secAFont = '10.5pt';
    secBFont = '10.5pt';
    applySpacingValues('10.5pt', '1.35', '5px', '20px', '12px', true);
  } else if (presetName === 'standard') {
    // Standard balanced spacing
    secAFont = '9.5pt';
    secBFont = '9.5pt';
    applySpacingValues('9.5pt', '1.25', '3px', '6px', '6px', true);
  } else if (presetName === 'compact') {
    // For long papers with tables: compact
    secAFont = '8.5pt';
    secBFont = '8.5pt';
    applySpacingValues('8.5pt', '1.16', '1px', '3px', '3px', true);
  }
  updateDtpToolbarUI();
  renderPreview();
};

// Smart Auto-Fit: Automatically calculates the best font size & spacing to fill 92-99% of page cleanly
window.autoFillPageHeight = function() {
  const configurations = [
    { font: '10.5pt', lh: '1.35', gapA: '5px',   gapB: '22px', secGap: '12px' },
    { font: '10.0pt', lh: '1.32', gapA: '4px',   gapB: '18px', secGap: '10px' },
    { font: '9.75pt', lh: '1.28', gapA: '3.5px', gapB: '14px', secGap: '8px' },
    { font: '9.5pt',  lh: '1.25', gapA: '3px',   gapB: '10px', secGap: '6px' },
    { font: '9.25pt', lh: '1.22', gapA: '2.5px', gapB: '6px',  secGap: '5px' },
    { font: '9.0pt',  lh: '1.20', gapA: '2px',   gapB: '4px',  secGap: '4px' },
    { font: '8.75pt', lh: '1.18', gapA: '1px',   gapB: '3px',  secGap: '3px' },
    { font: '8.5pt',  lh: '1.16', gapA: '0.5px', gapB: '2px',  secGap: '2px' },
    { font: '8.0pt',  lh: '1.14', gapA: '0px',   gapB: '1px',  secGap: '2px' }
  ];

  let selectedConfig = null;

  // First pass: try to fit ALL questions onto 1 single page without breaking to Page 2
  for (let cfg of configurations) {
    applySpacingValues(cfg.font, cfg.lh, cfg.gapA, cfg.gapB, cfg.secGap, false);
    const pag = calculateDynamicPagination();
    renderPreview();

    const p1 = previewPage1.querySelector('.paper-half') || previewPage1.querySelector('.paper-full');
    if (p1 && pag.totalPages === 1) {
      const scrollH = p1.scrollHeight;
      const clientH = p1.clientHeight;
      const fill = Math.round((scrollH / clientH) * 100);

      if (fill <= 101) {
        selectedConfig = cfg;
        break; // Found the most spacious configuration that keeps the entire paper on 1 page!
      }
    }
  }

  // Second pass: if the paper is too long to fit on 1 page even at compact settings, find best 2-page fit
  if (!selectedConfig) {
    for (let cfg of configurations) {
      applySpacingValues(cfg.font, cfg.lh, cfg.gapA, cfg.gapB, cfg.secGap, false);
      const pag = calculateDynamicPagination();
      renderPreview();

      const p1 = previewPage1.querySelector('.paper-half') || previewPage1.querySelector('.paper-full');
      const p2 = previewPage2.querySelector('.paper-half') || previewPage2.querySelector('.paper-full');

      if (p1) {
        const p1Scroll = p1.scrollHeight;
        const p1Client = p1.clientHeight;
        const p2Scroll = p2 ? p2.scrollHeight : 0;
        const p2Client = p2 ? p2.clientHeight : 1;

        if (p1Scroll <= p1Client && (!p2 || previewPage2.style.display === 'none' || p2Scroll <= p2Client)) {
          selectedConfig = cfg;
          break;
        }
      }
    }
  }

  if (!selectedConfig) {
    selectedConfig = configurations[configurations.length - 1];
  }

  applySpacingValues(selectedConfig.font, selectedConfig.lh, selectedConfig.gapA, selectedConfig.gapB, selectedConfig.secGap, true);
  updateDtpToolbarUI();
  renderPreview();
};

// Reset to clean empty paper for uploading/typing a new paper
window.resetToEmptyPaper = function() {
  if (!confirm('Are you sure you want to reset this question paper to an empty template?\n\nThis will clear all questions, subject name, and exam details so you can upload or enter a fresh paper.')) {
    return;
  }

  currentPaper = {
    paperCode: '',
    collegeName: "ST. ANN'S COLLEGE FOR WOMEN (AUTONOMOUS)",
    collegeAddress: "MALKAPURAM, VISAKHAPATNAM - 530011",
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

  secAFont = '9.5pt';
  secBFont = '9.5pt';
  try {
    localStorage.removeItem('exam_sec_a_font');
    localStorage.removeItem('exam_sec_b_font');
  } catch(e){}
  persistState();
  renderForm();
  applySpacingValues('9.5pt', '1.25', '3px', '6px', '6px', true);
  updateDtpToolbarUI();
  renderPreview();

  // Clear modal inputs if open
  const rawTextInp = document.getElementById('inp-import-raw-text');
  if (rawTextInp) rawTextInp.value = '';
  const fileInp = document.getElementById('inp-import-file');
  if (fileInp) fileInp.value = '';
  const statusMsg = document.getElementById('import-status-msg');
  if (statusMsg) {
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#059669';
    statusMsg.textContent = '✓ Paper emptied and ready for new upload!';
    setTimeout(() => { statusMsg.style.display = 'none'; }, 2500);
  }
};

// Backwards compatibility alias
window.autoFitToTwoPages = window.autoFillPageHeight;

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
    lineHeight,
    secAGap,
    secBGap,
    sectionGap,
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
        if (data.secAGap || data.secBGap || data.baseFontSize) {
          applySpacingValues(
            data.baseFontSize || baseFontSize,
            data.lineHeight || lineHeight,
            data.secAGap || data.questionGap || secAGap,
            data.secBGap || secBGap,
            data.sectionGap || sectionGap,
            true
          );
          updateDtpToolbarUI();
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

  const { totalPages } = calculateDynamicPagination();
  if (totalPages === 1) {
    document.body.classList.add('single-page-print');
  } else {
    document.body.classList.remove('single-page-print');
  }

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
    let html = convertUnicodeSubSup(content);
    const tables = [];
    let processed = html.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
      let tbl = match.replace(/<table[^>]*>/i, '<table class="paper-table bordered">');
      tables.push(tbl);
      return '\n__TABLE_TOKEN_' + (tables.length - 1) + '__\n';
    });
    processed = processed.replace(/<br\s*\/?>/gi, '\n');
    processed = processed.replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
    processed = processed.replace(/<(p|div|h[1-6]|li)[^>]*>/gi, '');
    let rawLines = processed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    docLines = rawLines.map(line => {
      return line.replace(/__TABLE_TOKEN_(\d+)__/g, (_, idx) => tables[parseInt(idx, 10)]);
    });
  } else {
    docLines = content.split(/\r?\n/).map(l => convertUnicodeSubSup(l.trim())).filter(l => l.length > 0);
  }

  // Smart Section & Question Extractor
  extractExamStructure(docLines);
  persistState();
  renderForm();
  autoFillPageHeight();
}

function extractExamStructure(lines) {
  // 1. Reset current paper to clean slate so old template text doesn't mix with imported paper
  currentPaper = {
    paperCode: '',
    collegeName: "ST. ANN'S COLLEGE FOR WOMEN (AUTONOMOUS)",
    collegeAddress: "MALKAPURAM, VISAKHAPATNAM - 530011",
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

  // 0. Pre-trim: Check if document contains Marking Scheme / Answer Key
  let markingSchemeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const pt = decodeHtmlEntities(lines[i].replace(/<[^>]*>/g, '').trim());
    if (/(?:MARKING\s*SCHEME|ANSWER\s*KEY|KEY\s*SHEET|SCHEME\s*OF\s*(?:VALUATION|EVALUATION)|\bSOLUTIONS?\b)/i.test(pt)) {
      markingSchemeIndex = i;
      break;
    }
  }

  if (markingSchemeIndex !== -1) {
    let cutoff = markingSchemeIndex;
    while (cutoff > 0) {
      const prevPt = decodeHtmlEntities(lines[cutoff - 1].replace(/<[^>]*>/g, '').trim()).toUpperCase();
      if (!prevPt || 
          prevPt.includes('SEMESTER') || 
          prevPt.includes('EXAMINATION') || 
          prevPt.includes('SKILL COURSE') || 
          prevPt.includes('COLLEGE') || 
          prevPt.startsWith('[') || 
          prevPt.includes('MAX TIME') || 
          prevPt.includes('TIME:') || 
          prevPt.includes('MARKS:')) {
        cutoff--;
      } else {
        break;
      }
    }
    lines = lines.slice(0, cutoff);
  }

  let currentSection = 'header'; // 'header', 'secA', 'secB'
  let secAQuestions = [];
  let secBQuestions = [];
  let currentSecBQuestion = null;
  let currentSecBPart = 'a'; // 'a' or 'b'
  let headerLines = [];

  // Helper to clean up question text and format subpoints
  function cleanQuestionText(text) {
    if (!text) return '';
    text = decodeHtmlEntities(text);
    // Replace Mammoth/HTML tags with clean equivalents
    text = text
      .replace(/<\/?(?:p|div|span)[^>]*>/gi, '')
      .replace(/<strong[^>]*>/gi, '<b>')
      .replace(/<\/strong>/gi, '</b>')
      .replace(/<em[^>]*>/gi, '<i>')
      .replace(/<\/em>/gi, '</i>')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<\/?(?:ul|ol)[^>]*>/gi, '');

    // Strip redundant leading numbering, HTML tag wrappers, and (a) / a) / a. or (b) / b) / b. prefixes
    text = text.replace(/^(?:<[^>]*>|\s)*(?:\(?[aAbB]\)?[\.\)])(?:<[^>]*>|\s)*/i, '').trim();
    // Stack roman numeral sub-points like ii. or ii) onto new lines
    text = text.replace(/([^\n])\s+(ii|iii|iv|v|vi)[\.\)]\s+/gi, '$1\n$2) ');
    text = text.replace(/([^\n])\s+\((ii|iii|iv|v|vi)\)\s+/gi, '$1\n($2) ');
    return text.trim();
  }

  lines.forEach(line => {
    const plainText = decodeHtmlEntities(line.replace(/<[^>]*>/g, '').trim());
    const upper = plainText.toUpperCase();

    // Check for Section A trigger
    if (/\b(?:SECTION|PART)\s*[\-–—]?\s*A\b/i.test(plainText)) {
      currentSection = 'secA';
      return;
    }

    // Check for Section B trigger
    if (/\b(?:SECTION|PART)\s*[\-–—]?\s*B\b/i.test(plainText)) {
      currentSection = 'secB';
      return;
    }

    // Header extraction
    if (currentSection === 'header') {
      // Check if a question starts before explicit section header
      if (plainText.match(/^([1-8])[\.\)\-]\s*/)) {
        currentSection = 'secA';
      } else {
        if (plainText.startsWith('[') && plainText.includes(']')) {
          currentPaper.paperCode = plainText;
          return;
        }

        // Check Time and Marks anywhere
        if (upper.includes('TIME:') || upper.includes('TIME :') || upper.includes('HOURS') || upper.includes('HRS')) {
          const timeMatch = plainText.match(/Time\s*[:\-]?\s*([0-9\.\/½¼¾\s]+(?:\s*(?:Hours?|Hrs?|Mins?|Minutes?))?)/i);
          const marksMatch = plainText.match(/(?:Max\s*\.?\s*Marks?|Marks?)\s*[:\-]?\s*([0-9]+(?:\s*M)?)/i);
          if (timeMatch && timeMatch[1]) {
            currentPaper.timeStr = 'Time:' + timeMatch[1].trim();
          } else {
            const shortTime = plainText.split(/Max|Marks|Set|SECTION/i)[0].trim();
            if (shortTime.length < 25) currentPaper.timeStr = shortTime;
          }
          if (marksMatch && marksMatch[1]) {
            currentPaper.maxMarksStr = 'Max Marks:' + marksMatch[1].replace(/M$/i, '').trim();
          }

          // If Section A instruction was on the same line (e.g. Botany paper)
          if (upper.includes('SECTION - A') || upper.includes('SECTION A') || upper.includes('SECTION–A') || upper.includes('ANSWER ANY')) {
            currentSection = 'secA';
            const instMatch = plainText.match(/((?:I\.\s*)?Answer\s+any\s+[^:(]+)/i);
            if (instMatch) {
              let cleanInst = instMatch[1].replace(/\s*\(?\d+\s*[\*xX×]\s*\d+\s*=\s*\d+\s*M?\)?/gi, '').trim();
              if (!cleanInst.startsWith('I.')) cleanInst = 'I. ' + cleanInst;
              currentPaper.sectionA.instruction = cleanInst + (cleanInst.endsWith('.') || cleanInst.endsWith(':') ? '' : '.');
            }
            const secMarksMatch = plainText.match(/(\(?\d+\s*[\*xX×]\s*\d+\s*=\s*\d+\s*M?\)?)(\b|$)/);
            if (secMarksMatch) {
              currentPaper.sectionA.marks = secMarksMatch[1].replace(/[()]/g, '').trim().replace(/\*/g, 'x');
            }
          }
          return;
        }

        if (upper.includes('MARKS:') || upper.includes('MARKS :') || upper.includes('MAX MARKS')) {
          const marksMatch = plainText.match(/(?:Max\s*\.?\s*Marks?|Marks?)\s*[:\-]?\s*([0-9]+(?:\s*M)?)/i);
          if (marksMatch && marksMatch[1]) {
            currentPaper.maxMarksStr = 'Max Marks:' + marksMatch[1].replace(/M$/i, '').trim();
          }
          return;
        }

        headerLines.push(plainText);
        return;
      }
    }

    // Section A Question Extraction (1 to 8)
    if (currentSection === 'secA') {
      // Check for instruction line
      if (upper.includes('ANSWER ANY') || upper.includes('FIVE QUESTIONS') || (upper.includes('ANSWER') && upper.includes('FOLLOWING'))) {
        const instMatch = plainText.match(/((?:I\.\s*)?Answer\s+[^:(]+)/i);
        if (instMatch) {
          let cleanInst = instMatch[1].replace(/\s*\(?\d+\s*[\*xX×]\s*\d+\s*=\s*\d+\s*M?\)?/gi, '').trim();
          if (!cleanInst.startsWith('I.')) cleanInst = 'I. ' + cleanInst;
          currentPaper.sectionA.instruction = cleanInst + (cleanInst.endsWith('.') || cleanInst.endsWith(':') ? '' : '.');
        }
        const secMarksMatch = plainText.match(/(\(?\d+\s*[\*xX×]\s*\d+\s*=\s*\d+\s*M?\)?)(\b|$)/);
        if (secMarksMatch) {
          currentPaper.sectionA.marks = secMarksMatch[1].replace(/[()]/g, '').trim().replace(/\*/g, 'x');
        }
        return;
      }

      const qMatch = plainText.match(/^(\d{1,2})[\.\)\-]\s*(.*)/);
      if (qMatch) {
        const num = parseInt(qMatch[1], 10);
        if (num <= 8) {
          const formattedRest = line.replace(/^(?:<[^>]*>|\s)*\d{1,2}[\.\)\-](?:<[^>]*>|\s)*/i, '').trim();
          secAQuestions[num - 1] = cleanQuestionText(formattedRest);
          return;
        } else if (num >= 9) {
          // Implicit Section B started
          currentSection = 'secB';
        }
      } else if (!secAQuestions[0] && plainText.length > 3 && !upper.startsWith('SECTION')) {
        // Fallback for unnumbered Question 1 (e.g. "What is Information Security?")
        secAQuestions[0] = cleanQuestionText(line);
        return;
      } else if (secAQuestions.length > 0) {
        // Append continuation line / table to previous question
        secAQuestions[secAQuestions.length - 1] += '\n' + cleanQuestionText(line);
        return;
      }
    }

    // Section B Question Extraction (9 to 14+ with optional Or choice)
    if (currentSection === 'secB') {
      // Check for instruction line
      if (upper.includes('ANSWER ALL') || upper.includes('ANSWER ANY') || (upper.includes('ANSWER') && upper.includes('FOLLOWING')) || upper.includes('FOLLOWING QUESTIONS')) {
        const instMatch = plainText.match(/((?:II\.\s*)?Answer\s+[^:(]+)/i);
        if (instMatch) {
          let cleanInst = instMatch[1].replace(/\s*\(?\d+\s*[\*xX×]\s*\d+\s*=\s*\d+\s*M?\)?/gi, '').trim();
          if (!cleanInst.startsWith('II.')) cleanInst = 'II. ' + cleanInst;
          currentPaper.sectionB.instruction = cleanInst + (cleanInst.endsWith('.') || cleanInst.endsWith(':') ? '' : '.');
        }
        const secBMarksMatch = plainText.match(/(\(?\d+\s*[\*xX×]\s*\d+\s*=\s*\d+\s*M?\)?)(\b|$)/);
        if (secBMarksMatch) {
          currentPaper.sectionB.marks = secBMarksMatch[1].replace(/[()]/g, '').trim().replace(/\*/g, 'x');
        }
        return;
      }

      const isChoiceWord = upper === 'OR' || upper === '(OR)' || plainText.includes('(లేదా)') || upper === 'లేదా';
      if (isChoiceWord && currentSecBQuestion) {
        currentSecBQuestion.choice = upper.includes('లేదా') ? 'లేదా' : 'Or';
        currentSecBPart = 'b';
        return;
      }

      // Check for explicit Part (b): "9 b).", "9. b)", "9(b).", "b)", "(b)"
      const bWithNumMatch = plainText.match(/^(\d{1,2})\s*[\.\)\-]?\s*\(?[bB]\)?[\.\)]\s*(.*)/);
      const bWithoutNumMatch = !bWithNumMatch ? plainText.match(/^(?:\(?[bB]\)?[\.\)])\s*(.*)/) : null;

      if (bWithNumMatch || bWithoutNumMatch) {
        const bText = bWithNumMatch ? bWithNumMatch[2] : bWithoutNumMatch[1];
        const qNum = bWithNumMatch ? parseInt(bWithNumMatch[1], 10) : (currentSecBQuestion ? currentSecBQuestion.num : null);

        let targetQ = secBQuestions.find(q => q.num === qNum);
        if (!targetQ && currentSecBQuestion) targetQ = currentSecBQuestion;

        if (targetQ) {
          targetQ.b = cleanQuestionText(bText);
          targetQ.choice = targetQ.choice || 'Or';
          currentSecBQuestion = targetQ;
          currentSecBPart = 'b';
          return;
        }
      }

      // Check for Question start: "9 a).", "9. a)", "9.", "10."
      const qStartMatch = plainText.match(/^(\d{1,2})\s*[\.\)\-]?\s*(?:\(?[aA]\)?[\.\)])?\s*(.*)/);
      if (qStartMatch && parseInt(qStartMatch[1], 10) >= 9) {
        const qNum = parseInt(qStartMatch[1], 10);
        const qText = qStartMatch[2];
        currentSecBQuestion = {
          num: qNum,
          a: cleanQuestionText(qText),
          choice: 'Or',
          b: ''
        };
        secBQuestions.push(currentSecBQuestion);
        currentSecBPart = 'a';
        return;
      }

      // Standalone "(a)" on line following question number
      const aOnlyMatch = plainText.match(/^(?:\(?[aA]\)?[\.\)])\s*(.*)/);
      if (aOnlyMatch && currentSecBQuestion && !currentSecBQuestion.a) {
        currentSecBQuestion.a = cleanQuestionText(aOnlyMatch[1]);
        currentSecBPart = 'a';
        return;
      }

      // Continuation lines or tables
      if (currentSecBQuestion) {
        const formatted = cleanQuestionText(line);
        if (formatted) {
          if (currentSecBPart === 'a') {
            currentSecBQuestion.a += (currentSecBQuestion.a ? '\n' : '') + formatted;
          } else {
            currentSecBQuestion.b += (currentSecBQuestion.b ? '\n' : '') + formatted;
          }
        }
      }
    }
  });

  // Assign parsed header lines cleanly
  if (headerLines.length > 0) {
    const collegeKeywords = ['COLLEGE', 'INSTITUTE', 'UNIVERSITY', 'ACADEMY', 'SCHOOL', 'VIDYALAYA'];
    const collegeLineIdx = headerLines.findIndex(l => collegeKeywords.some(kw => l.toUpperCase().includes(kw)));
    
    if (collegeLineIdx !== -1) {
      currentPaper.collegeName = formatCollegeName(headerLines[collegeLineIdx]);
    }

    headerLines.forEach((l, idx) => {
      if (idx === collegeLineIdx) return;
      const u = l.toUpperCase();
      if (u.includes('530') || u.includes('UGC') || u.includes('NAAC') || u.includes('AFFILIATED') || u.includes('MALKAPURAM') || u.includes('ANDHRA PRADESH')) {
        currentPaper.collegeAddress = (currentPaper.collegeAddress ? currentPaper.collegeAddress + ', ' : '') + l;
      } else if (u.includes('SEMESTER') || u.includes('BATCH') || u.includes('EXAMINATION') || u.includes('DEGREE')) {
        currentPaper.examDetails = (currentPaper.examDetails ? currentPaper.examDetails + ' — ' : '') + l;
      } else if (u.includes('COURSE') || u.includes('SKILL') || u.includes('B.SC') || u.includes('BSC') || u.includes('B.COM') || u.includes('B.A') || u.includes('MAJOR') || u.includes('BOTANY')) {
        currentPaper.streamDetails = (currentPaper.streamDetails ? currentPaper.streamDetails + ' ' : '') + l;
      } else if (u.includes('CHEMISTRY') || u.includes('PHYSICS') || u.includes('MATHEMATICS') || u.includes('COMMERCE') || u.includes('ACCOUNTING') || u.includes('SECURITY') || u.includes('CYBER') || u.includes('PAPER')) {
        const cleanSubj = l.replace(/\s*(?:QUESTION\s*PAPER|QP)\s*$/i, '').trim();
        currentPaper.subjectTitle = (currentPaper.subjectTitle ? currentPaper.subjectTitle + ' | ' : '') + cleanSubj;
      } else {
        if (!currentPaper.examDetails) currentPaper.examDetails = l;
        else if (!currentPaper.subjectTitle) currentPaper.subjectTitle = l;
        else if (!currentPaper.streamDetails) currentPaper.streamDetails = l;
      }
    });
  }

  // Assign Section A questions
  const cleanSecA = secAQuestions.filter(q => q && q.trim());
  if (cleanSecA.length > 0) {
    currentPaper.sectionA.questions = secAQuestions;
  }

  // Assign Section B questions (ALL questions, whether 5 or 6 or more)
  if (secBQuestions.length > 0) {
    currentPaper.sectionB.questions = secBQuestions;
  }
}

