const tokenKey = 'uhuh_proxy_token';
const historyKey = 'uhuh_proxy_history_v1';

const $ = id => document.getElementById(id);
const authSection = $('auth');
const controls = $('controls');
const results = $('results');
const tokenInput = $('tokenInput');
const saveTokenBtn = $('saveToken');
const clearTokenBtn = $('clearToken');
const urlInput = $('urlInput');
const renderBtn = $('renderBtn');
const historySelect = $('historySelect');
const addToHistoryBtn = $('addToHistory');
const clearHistoryBtn = $('clearHistory');
const screenshotContainer = $('screenshotContainer');
const previewFrame = $('previewFrame');
const rawHtml = $('rawHtml');
const statusEl = $('status');
const loading = $('loading');
const downloadScreenshot = $('downloadScreenshot');
const downloadHtml = $('downloadHtml');
const viewportInput = $('viewportInput');
const qualityInput = $('qualityInput');
const screenshotOnly = $('screenshotOnly');

function saveToken(token){
  localStorage.setItem(tokenKey, token);
  tokenInput.value = '';
  showControls();
}
function clearToken(){
  localStorage.removeItem(tokenKey);
  hideControls();
}
function getToken(){ return localStorage.getItem(tokenKey); }

function saveHistory(url){
  const h = JSON.parse(localStorage.getItem(historyKey) || '[]');
  if(!h.includes(url)) h.unshift(url);
  while(h.length>20) h.pop();
  localStorage.setItem(historyKey, JSON.stringify(h));
  populateHistory();
}
function populateHistory(){
  const h = JSON.parse(localStorage.getItem(historyKey) || '[]');
  historySelect.innerHTML = h.length ? h.map(u => `<option value="${u}">${u}</option>`).join('') : '<option value="">— no history —</option>';
}

function showControls(){
  authSection.classList.add('hidden');
  controls.classList.remove('hidden');
  results.classList.remove('hidden');
  populateHistory();
}
function hideControls(){
  authSection.classList.remove('hidden');
  controls.classList.add('hidden');
  results.classList.add('hidden');
}

saveTokenBtn.addEventListener('click', () => {
  const t = tokenInput.value.trim();
  if(!t) return alert('Enter a token');
  saveToken(t);
});
clearTokenBtn.addEventListener('click', () => {
  clearToken();
});

renderBtn.addEventListener('click', () => {
  const url = urlInput.value.trim();
  const token = getToken();
  if(!token) return alert('No token saved');
  if(!url) return alert('Enter a URL');
  doRender(url, token);
});

historySelect.addEventListener('change', () => {
  const v = historySelect.value;
  if(v) urlInput.value = v;
});
addToHistoryBtn.addEventListener('click', () => {
  const u = urlInput.value.trim();
  if(u) saveHistory(u);
});
clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(historyKey);
  populateHistory();
});

// downloads
downloadScreenshot.addEventListener('click', () => {
  const img = screenshotContainer.querySelector('img');
  if(!img) return;
  const a = document.createElement('a');
  a.href = img.src;
  a.download = 'screenshot.jpg';
  a.click();
});
downloadHtml.addEventListener('click', () => {
  const html = rawHtml.textContent || '';
  const blob = new Blob([html], {type: 'text/html'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'page.html';
  a.click();
});

async function doRender(url, token){
  loading.classList.remove('hidden');
  statusEl.textContent = 'Status: rendering…';
  screenshotContainer.innerHTML = '';
  previewFrame.srcdoc = '';
  rawHtml.textContent = '';

  const body = { url };
  // pass options to server in future versions; keep simple for now
  try{
    const resp = await fetch('/api/render', {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'x-api-key': token
      },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    loading.classList.add('hidden');
    if(!resp.ok){
      statusEl.textContent = `Status: error ${resp.status}`;
      alert(JSON.stringify(data));
      return;
    }
    statusEl.textContent = `Status: ${data.status || 'ok'}`;
    if(data.screenshot){
      const src = 'data:image/jpeg;base64,' + data.screenshot;
      screenshotContainer.innerHTML = `<img src="${src}" alt="screenshot" />`;
      downloadScreenshot.classList.remove('hidden');
    } else {
      screenshotContainer.innerHTML = '<div class="placeholder">No screenshot</div>';
      downloadScreenshot.classList.add('hidden');
    }
    if(data.html){
      // show safe preview via srcdoc (sandboxed)
      previewFrame.srcdoc = data.html;
      rawHtml.textContent = data.html;
      downloadHtml.classList.remove('hidden');
    } else {
      previewFrame.srcdoc = '<p>No HTML returned</p>';
      rawHtml.textContent = '';
      downloadHtml.classList.add('hidden');
    }
    saveHistory(url);
  }catch(err){
    loading.classList.add('hidden');
    statusEl.textContent = 'Status: failed';
    alert('Render failed: ' + err.message);
  }
}

(function init(){
  const token = getToken();
  if(token) showControls();
  else hideControls();
  populateHistory();
})();