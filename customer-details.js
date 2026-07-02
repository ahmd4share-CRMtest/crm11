const urlParams = new URLSearchParams(window.location.search);
const clientCode = urlParams.get('code');
let clientName = '';

const STORAGE_KEY = 'asgate_customers_final_v2';
const VISITS_KEY = 'asgate_visits_final_v21';

const contentBody = document.getElementById('contentBody');
const managerTableBody = document.getElementById('managerTableBody');
const tabTitle = document.getElementById('tabTitle');

function safe(v, fallback = '-') {
  return v && String(v).trim() ? v : fallback;
}

function goBackAndFocus() {
  if (clientCode) sessionStorage.setItem('last_viewed_client_code', clientCode);
  window.location.href = 'customers.html';
}

function getTodayDateFormatted() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function handleMainSelection(checkbox) {
  if (checkbox.checked) {
    document.querySelectorAll('.main-check').forEach(cb => {
      if (cb !== checkbox) cb.checked = false;
    });
  }
  saveManagersToLocalStorage();
}

function loadClientData() {
  if (!clientCode) return;

  const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const client = data.find(c => c.code === clientCode);

  if (!client) return;

  clientName = client.comp || '';
  document.title = `${safe(client.comp, 'تفاصيل العميل')} | ASGate`;
  document.getElementById('c-name').innerText = safe(client.comp, 'غير محدد');
  document.getElementById('c-cr1').innerText = safe(client.cr1 || client.cr || client.record, '0000000');
  document.getElementById('c-cr2').innerText = safe(client.cr2, 'غير محدد');
  document.getElementById('c-city').innerText = safe(client.city || client.address, 'غير محدد');
  document.getElementById('c-district').innerText = safe(client.district, 'غير محدد');
  document.getElementById('c-source').innerText = safe(client.classification || client.source, 'نظام داخلي');
  document.getElementById('c-owner').innerText = safe(client.owner, 'غير محدد');
}

function renderEmptyMessage(message) {
  contentBody.innerHTML = `
    <tr>
      <td colspan="4" style="text-align:center;padding:24px;color:#6b7280;">${message}</td>
    </tr>
  `;
}

function openTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  if (tab === 'o-history') {
    document.getElementById('btn-o').classList.add('active');
    tabTitle.innerText = 'الأوامر / الطلبات';
    renderEmptyMessage('لا توجد طلبات سابقة مسجلة لهذا العميل حتى الآن.');
  } else if (tab === 'attachments') {
    document.getElementById('btn-a').classList.add('active');
    tabTitle.innerText = 'المرفقات والملفات';
    renderEmptyMessage('لا توجد ملفات مرفقة.');
  } else if (tab === 'v-history') {
    document.getElementById('btn-v').classList.add('active');
    tabTitle.innerText = 'سجل الزيارات الميدانية';

    const visits = JSON.parse(localStorage.getItem(VISITS_KEY) || '[]').filter(v => v.comp === clientName);
    if (!visits.length) {
      renderEmptyMessage('لا توجد سجلات زيارات مسجلة لهذا العميل حالياً.');
      return;
    }

    contentBody.innerHTML = visits.map(v => `
      <tr>
        <td>${safe(v.visitDate)}</td>
        <td>${safe(v.address || v.location || 'غير محدد')}</td>
        <td>${safe(v.status || 'مكتملة')}</td>
        <td>${safe(v.notes || '-')}</td>
      </tr>
    `).join('');
  }
}

function loadManagersData() {
  if (!managerTableBody) return;

  const key = `asgate_customer_managers_${clientCode}`;
  const managers = JSON.parse(localStorage.getItem(key) || '[]');

  if (!managers.length) {
    managerTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:22px;color:#6b7280;">لا توجد بيانات متابعة بعد</td>
      </tr>
    `;
    return;
  }

  managerTableBody.innerHTML = managers.map((m, index) => `
    <tr>
      <td>${safe(m.name)}</td>
      <td>${safe(m.mob)}</td>
      <td>${safe(m.email)}</td>
      <td>
        <input type="checkbox" class="main-check" ${m.main ? 'checked' : ''} onchange="handleMainSelection(this)">
      </td>
      <td>${safe(m.date || getTodayDateFormatted())}</td>
      <td>
        <button class="btn" onclick="removeManagerRow(${index})">حذف</button>
      </td>
    </tr>
  `).join('');
}

function saveManagersToLocalStorage() {
  const key = `asgate_customer_managers_${clientCode}`;
  const rows = [...document.querySelectorAll('#managerTableBody tr')];

  const data = rows.map(row => {
    const cells = row.querySelectorAll('td');
    if (!cells.length || row.querySelector('td[colspan]')) return null;
    return {
      name: cells[0].innerText.trim(),
      mob: cells[1].innerText.trim(),
      email: cells[2].innerText.trim(),
      main: !!row.querySelector('.main-check')?.checked,
      date: cells[4].innerText.trim()
    };
  }).filter(Boolean);

  localStorage.setItem(key, JSON.stringify(data));
}

function addNewManagerRow() {
  const todayStr = getTodayDateFormatted();
  const key = `asgate_customer_managers_${clientCode}`;
  const managers = JSON.parse(localStorage.getItem(key) || '[]');

  managers.push({
    name: 'مسؤول جديد',
    mob: '-',
    email: '-',
    main: false,
    date: todayStr
  });

  localStorage.setItem(key, JSON.stringify(managers));
  loadManagersData();
}

function removeManagerRow(index) {
  const key = `asgate_customer_managers_${clientCode}`;
  const managers = JSON.parse(localStorage.getItem(key) || '[]');
  managers.splice(index, 1);
  localStorage.setItem(key, JSON.stringify(managers));
  loadManagersData();
}

document.addEventListener('DOMContentLoaded', () => {
  loadClientData();
  loadManagersData();
  openTab('o-history');
});
