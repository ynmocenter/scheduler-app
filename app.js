import { ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
const db = window.dbFirebase;

let children = {}, visits = {};

// الاستماع لتغييرات الأطفال
onValue(ref(db, "children"), snap => {
  children = snap.val() || {};
  renderChildren();
  populateChildDropdown();
  renderReports();
});
// الاستماع لتغييرات الزيارات
onValue(ref(db, "visits"), snap => {
  visits = snap.val() || {};
  renderVisits();
});

// دالة toast
function showToast(msg, type = "success") {
  const div = document.createElement("div");
  div.className = `toast toast-${type}`;
  div.textContent = msg;
  document.getElementById("toast-container").append(div);
  setTimeout(() => div.remove(), 3000);
}

// إدارة التبويبات
function deactivateTabs() {
  ["tab-children", "tab-appointments", "tab-reports"].forEach(id => document.getElementById(id).classList.add("hidden"));
  ["tab-children-btn", "tab-appointments-btn", "tab-reports-btn"].forEach(id => document.getElementById(id).classList.remove("btn-tab-active"));
}
["tab-children-btn", "tab-appointments-btn", "tab-reports-btn"].forEach((btn, i) => {
  document.getElementById(btn).addEventListener("click", () => {
    deactivateTabs();
    const sec = ["tab-children", "tab-appointments", "tab-reports"][i];
    document.getElementById(sec).classList.remove("hidden");
    document.getElementById(btn).classList.add("btn-tab-active");
  });
});

// عرض جدول الأطفال
function renderChildren() {
  const tbody = document.getElementById("table-children-body");
  tbody.innerHTML = "";
  Object.entries(children).forEach(([key, ch], i) => {
    // حساب نهاية الاشتراك
    const end = new Date(ch.startDate);
    const weeks = Math.ceil(ch.visitsTotal / ch.freqPerWeek);
    end.setDate(end.getDate() + weeks * 7);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${i+1}</td>
      <td class="px-4 py-2">${ch.name}</td>
      <td class="px-4 py-2">${ch.subtype}</td>
      <td class="px-4 py-2">${ch.startDate}</td>
      <td class="px-4 py-2">${end.toISOString().split('T')[0]}</td>
      <td class="px-4 py-2">${ch.visitsLeft}/${ch.visitsTotal}</td>
      <td class="px-4 py-2">${ch.paused==='true'?'نعم':'لا'}</td>
      <td class="px-4 py-2"><button onclick="openEditChild('${key}')" class="text-blue-500">تعديل</button></td>`;
    tbody.append(tr);
  });
}

// ملء قائمة الأطفال في مودال الزيارة
function populateChildDropdown() {
  const sel = document.getElementById("modal-appt-child");
  sel.innerHTML = '<option value="">-- اختر الطفل --</option>';
  Object.entries(children).forEach(([key, ch]) => {
    sel.innerHTML += `<option value="${key}">${ch.name}</option>`;
  });
}

// إضافة / تعديل طفل
let editingChild = null;
const formChild = document.getElementById("form-modal-child");
formChild.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("modal-child-name").value.trim();
  const subtype = document.getElementById("modal-child-subtype").value;
  const startDate = document.getElementById("modal-child-start").value;
  const paused = document.getElementById("modal-child-paused").value;
  let visitsTotal = 1, freqPerWeek = 1;
  if (subtype === '24') { visitsTotal = 8; freqPerWeek = 2; }
  else if (subtype === '36') { visitsTotal = 12; freqPerWeek = 3; }
  else if (subtype === '48') { visitsTotal = 16; freqPerWeek = 4; }
  const data = { name, subtype, startDate, paused, visitsTotal, visitsLeft: visitsTotal, freqPerWeek };
  const dbRef = editingChild ? ref(db, `children/${editingChild}`) : push(ref(db, 'children'));
  set(dbRef, data).then(() => {
    showToast('تم حفظ الطفل');
    document.getElementById('modal-child').classList.add('hidden');
  });
});

// فتح تعديل طفل
window.openEditChild = key => {
  editingChild = key;
  const ch = children[key];
  document.getElementById("modal-child-name").value = ch.name;
  document.getElementById("modal-child-subtype").value = ch.subtype;
  document.getElementById("modal-child-start").value = ch.startDate;
  document.getElementById("modal-child-paused").value = ch.paused;
  document.getElementById('modal-child').classList.remove('hidden');
};

// زر إضافة طفل
document.getElementById("btn-add-child").addEventListener("click", () => {
  editingChild = null;
  formChild.reset();
  document.getElementById('modal-child').classList.remove('hidden');
});
document.getElementById("modal-child-cancel").addEventListener("click", () => {
  document.getElementById('modal-child').classList.add('hidden');
});

// عرض جدول الزيارات
function renderVisits() {
  const tbody = document.getElementById("table-appointments-body");
  tbody.innerHTML = "";
  Object.entries(visits).forEach(([key, v], i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="px-4 py-2">${i+1}</td>
      <td class="px-4 py-2">${children[v.child]?.name || '-'}</td>
      <td class="px-4 py-2">${v.day}</td>
      <td class="px-4 py-2">${v.period}</td>
      <td class="px-4 py-2">${v.status}</td>
      <td class="px-4 py-2"><button onclick="markMissed('${key}')">غاب</button></td>`;
    tbody.append(tr);
  });
}

// إضافة زيارة
const formVis = document.getElementById("form-modal-appointment");
formVis.addEventListener("submit", e => {
  e.preventDefault();
  const child = document.getElementById("modal-appt-child").value;
  const day = document.getElementById("modal-appt-day").value;
  const period = document.getElementById("modal-appt-period").value;
  if (!child) { showToast('يرجى اختيار الطفل', 'error'); return; }
  const ch = children[child];
  if (ch.paused === 'true' || ch.visitsLeft < 1) { showToast('لا يمكن الحجز', 'error'); return; }
  const newRef = push(ref(db, 'visits'));
  set(newRef, { child, day, period, status: 'regular', createdAt: new Date().toISOString() });
  update(ref(db, `children/${child}`), { visitsLeft: ch.visitsLeft - 1 });
  showToast('تم الحجز');
  document.getElementById('modal-appointment').classList.add('hidden');
});
document.getElementById("btn-add-appointment").addEventListener("click", () => {
  document.getElementById('modal-appointment').classList.remove('hidden');
});
document.getElementById("modal-appt-cancel").addEventListener("click", () => {
  document.getElementById('modal-appointment').classList.add('hidden');
});

// تسجيل غياب
window.markMissed = key => {
  update(ref(db, `visits/${key}`), { status: 'missed' }).then(() => showToast('تم تسجيل الغياب'));
};

// التقارير
function renderReports() {
  const exp = document.getElementById("report-expiring-children");
  const paused = document.getElementById("report-paused-children");
  exp.innerHTML = "";
  paused.innerHTML = "";
  Object.values(children).forEach(ch => {
    if (ch.visitsLeft <= 2) exp.innerHTML += `<li>${ch.name} (${ch.visitsLeft} زيارات متبقية)</li>`;
    if (ch.paused === 'true') paused.innerHTML += `<li>${ch.name}</li>`;
  });
  if (!exp.innerHTML) exp.innerHTML = '<li>لا توجد اشتراكات على وشك الانتهاء</li>';
  if (!paused.innerHTML) paused.innerHTML = '<li>لا يوجد أطفال متوقفون</li>';
}
