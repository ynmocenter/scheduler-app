```javascript
import { ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
const db = window.dbFirebase;

let children = {}, specialists = {}, visits = {};

// استماع للتغييرات
onValue(ref(db, "children"), snap => {
  children = snap.val() || {};
  renderChildren();
  populateChildDropdown();
  renderReports();
});
onValue(ref(db, "specialists"), snap => {
  specialists = snap.val() || {};
  renderSpecialists();
});
onValue(ref(db, "visits"), snap => {
  visits = snap.val() || {};
  renderVisits();
});

// Toast
function showToast(msg, type = "success") {
  const div = document.createElement("div");
  div.className = `toast toast-${type}`;
  div.textContent = msg;
  document.getElementById("toast-container").append(div);
  setTimeout(() => div.remove(), 3000);
}

// Tabs
function deactivateTabs() {
  ["tab-children", "tab-specialists", "tab-appointments", "tab-reports", "tab-send"].forEach(id => document.getElementById(id).classList.add("hidden"));
  ["tab-children-btn", "tab-specialists-btn", "tab-appointments-btn", "tab-reports-btn", "tab-send-btn"].forEach(id => document.getElementById(id).classList.remove("btn-tab-active"));
}
["tab-children-btn", "tab-specialists-btn", "tab-appointments-btn", "tab-reports-btn", "tab-send-btn"].forEach((btn, i) => {
  document.getElementById(btn).addEventListener("click", () => {
    deactivateTabs();
    const sec = ["tab-children", "tab-specialists", "tab-appointments", "tab-reports", "tab-send"][i];
    document.getElementById(sec).classList.remove("hidden");
    document.getElementById(btn).classList.add("btn-tab-active");
  });
});

// ===== Children =====
function renderChildren() {
  const tbody = document.getElementById("table-children-body");
  tbody.innerHTML = "";
  Object.entries(children).forEach(([key, ch], i) => {
    const end = new Date(ch.startDate);
    const weeks = Math.ceil(ch.visitsTotal / ch.freqPerWeek);
    end.setDate(end.getDate() + weeks * 7);
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${ch.name}</td>
        <td>${ch.subtype}</td>
        <td>${ch.startDate}</td>
        <td>${end.toISOString().split('T')[0]}</td>
        <td>${ch.visitsLeft}/${ch.visitsTotal}</td>
        <td>${ch.paused === 'true' ? 'نعم' : 'لا'}</td>
        <td>
          <button onclick="openEditChild('${key}')" class="text-blue-500">تعديل</button>
          <button onclick="deleteChild('${key}')" class="text-red-500">حذف</button>
        </td>
      </tr>`;
  });
}

let editingChild = null;
document.getElementById("form-modal-child").addEventListener("submit", e => {
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
    showToast('تم الحفظ');
    document.getElementById('modal-child').classList.add('hidden');
  });
});
window.openEditChild = key => {
  editingChild = key;
  const ch = children[key];
  document.getElementById("modal-child-name").value = ch.name;
  document.getElementById("modal-child-subtype").value = ch.subtype;
  document.getElementById("modal-child-start").value = ch.startDate;
  document.getElementById("modal-child-paused").value = ch.paused;
  document.getElementById('modal-child').classList.remove('hidden');
};
function deleteChild(key) {
  if (!confirm('حذف الطفل؟')) return;
  remove(ref(db, `children/${key}`)).then(() => showToast('تم الحذف'));
}
document.getElementById("btn-add-child").addEventListener("click", () => {
  editingChild = null;
  document.getElementById('form-modal-child').reset();
  document.getElementById('modal-child').classList.remove('hidden');
});
document.getElementById("modal-child-cancel").addEventListener("click", () => document.getElementById('modal-child').classList.add('hidden'));

// ===== Specialists =====
function renderSpecialists() {
  const tbody = document.getElementById("table-specialists-body");
  tbody.innerHTML = "";
  Object.entries(specialists).forEach(([key, sp], i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${sp.name}</td>
        <td>${sp.email}</td>
        <td>${sp.dept}</td>
        <td>${sp.days.join('، ')}</td>
        <td>${sp.times.join('، ')}</td>
        <td>
          <button onclick="openEditSpecialist('${key}')" class="text-blue-500">تعديل</button>
          <button onclick="deleteSpecialist('${key}')" class="text-red-500">حذف</button>
        </td>
      </tr>`;
  });
}
let editingSpec = null;
document.getElementById("form-modal-specialist").addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("modal-spec-name").value.trim();
  const email = document.getElementById("modal-spec-email").value.trim();
  const dept = document.getElementById("modal-spec-dept").value;
  const days = document.getElementById("modal-spec-days").value.split(',').map(x => x.trim());
  const times = document.getElement.ById("modal-spec-times").value.split(',').map(x => x.trim());
  const data = { name, email, dept, days, times };
  const dbRef = editingSpec ? ref(db, `specialists/${editingSpec}`) : push(ref(db, 'specialists'));
  set(dbRef, data).then(() => {
    showToast('تم الحفظ');
    document.getElementById('modal-specialist').classList.add('hidden');
  });
});
window.openEditSpecialist = key => {/* ... مماثل للسابق ... */};
function deleteSpecialist(key) {/* ... */}
document.getElementById("btn-add-specialist").addEventListener("click",()=>{/* ... */});
\```