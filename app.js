import { ref, push, set, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
const db = window.dbFirebase;

let children = {}, specialists = {}, visits = {};

// Toast helper
function showToast(msg, type = "success") {
  const d = document.createElement("div");
  d.className = `toast toast-${type}`;
  d.textContent = msg;
  document.getElementById("toast-container").append(d);
  setTimeout(() => d.remove(), 3000);
}

// Tabs logic
const tabs = ["children","specialists","appointments","reports","send"];
function showTab(name) {
  tabs.forEach(t => {
    document.getElementById(`tab-${t}`).classList.toggle("hidden", t !== name);
    document.getElementById(`tab-${t}-btn`).classList.toggle("btn-tab-active", t === name);
  });
}
// Init
window.addEventListener("DOMContentLoaded", () => showTab("children"));
tabs.forEach(t => {
  document.getElementById(`tab-${t}-btn`).onclick = () => showTab(t);
});

// Listen Firebase
onValue(ref(db,"children"), snap => {
  children = snap.val() || {};
  renderChildren();
  populateChildDropdown();
  renderReports();
});
onValue(ref(db,"specialists"), snap => {
  specialists = snap.val() || {};
  renderSpecialists();
});
onValue(ref(db,"visits"), snap => {
  visits = snap.val() || {};
  renderVisits();
});

// Render Children
function renderChildren() {
  const tbody = document.getElementById("table-children-body");
  tbody.innerHTML = "";
  Object.entries(children).forEach(([k,ch],i) => {
    const end = new Date(ch.startDate);
    const weeks = Math.ceil(ch.visitsTotal/ch.freqPerWeek);
    end.setDate(end.getDate() + weeks*7);
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${ch.name}</td>
        <td>${ch.subtype}</td>
        <td>${ch.startDate}</td>
        <td>${end.toISOString().split('T')[0]}</td>
        <td>${ch.visitsLeft}/${ch.visitsTotal}</td>
        <td>${ch.paused==='true'?'نعم':'لا'}</td>
        <td>
          <button onclick="openEditChild('${k}')">تعديل</button>
          <button onclick="deleteChild('${k}')">حذف</button>
        </td>
      </tr>`;
  });
}

// Add/Edit Child
let editingChild = null;
document.getElementById("btn-add-child").onclick = () => {
  editingChild = null;
  document.getElementById("form-modal-child").reset();
  document.getElementById("modal-child").classList.remove("hidden");
};
document.getElementById("modal-child-cancel").onclick = () => {
  document.getElementById("modal-child").classList.add("hidden");
};
document.getElementById("form-modal-child").onsubmit = e => {
  e.preventDefault();
  const name = document.getElementById("modal-child-name").value.trim();
  const subtype = document.getElementById("modal-child-subtype").value;
  const startDate = document.getElementById("modal-child-start").value;
  const paused = document.getElementById("modal-child-paused").value;
  let visitsTotal=1, freqPerWeek=1;
  if(subtype==="24"){ visitsTotal=8; freqPerWeek=2; }
  else if(subtype==="36"){ visitsTotal=12; freqPerWeek=3; }
  else if(subtype==="48"){ visitsTotal=16; freqPerWeek=4; }
  const data = { name, subtype, startDate, paused, visitsTotal, visitsLeft:visitsTotal, freqPerWeek };
  const dbRef = editingChild
    ? ref(db, `children/${editingChild}`)
    : push(ref(db,"children"));
  set(dbRef,data).then(()=>{
    showToast("تم الحفظ");
    document.getElementById("modal-child").classList.add("hidden");
  });
};
window.openEditChild = k => {
  editingChild = k;
  const ch = children[k];
  document.getElementById("modal-child-name").value = ch.name;
  document.getElementById("modal-child-subtype").value = ch.subtype;
  document.getElementById("modal-child-start").value = ch.startDate;
  document.getElementById("modal-child-paused").value = ch.paused;
  document.getElementById("modal-child").classList.remove("hidden");
};
function deleteChild(k) {
  remove(ref(db,`children/${k}`)).then(()=>showToast("تم الحذف"));
}

// Render Specialists
function renderSpecialists() {
  const tbody = document.getElementById("table-specialists-body");
  tbody.innerHTML = "";
  Object.entries(specialists).forEach(([k,sp],i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${sp.name}</td>
        <td>${sp.email}</td>
        <td>${sp.dept}</td>
        <td>${sp.days.join("، ")}</td>
        <td>${sp.times.join("، ")}</td>
        <td>
          <button onclick="openEditSpecialist('${k}')">تعديل</button>
          <button onclick="deleteSpecialist('${k}')">حذف</button>
        </td>
      </tr>`;
  });
}

// Add/Edit Specialist
let editingSpec = null;
document.getElementById("btn-add-specialist").onclick = () => {
  editingSpec = null;
  document.getElementById("form-modal-specialist").reset();
  document.getElementById("modal-specialist").classList.remove("hidden");
};
document.getElementById("modal-spec-cancel").onclick = () => {
  document.getElementById("modal-specialist").classList.add("hidden");
};
document.getElementById("form-modal-specialist").onsubmit = e => {
  e.preventDefault();
  const name = document.getElementById("modal-spec-name").value.trim();
  const email = document.getElementById("modal-spec-email").value.trim();
  const dept = document.getElementById("modal-spec-dept").value;
  const days = document.getElementById("modal-spec-days").value.split(",").map(x=>x.trim());
  const times = document.getElementById("modal-spec-times").value.split(",").map(x=>x.trim());
  const data = { name, email, dept, days, times };
  const dbRef = editingSpec
    ? ref(db, `specialists/${editingSpec}`)
    : push(ref(db,"specialists"));
  set(dbRef,data).then(()=>{
    showToast("تم الحفظ");
    document.getElementById("modal-specialist").classList.add("hidden");
  });
};
window.openEditSpecialist = k => {
  editingSpec = k;
  const sp = specialists[k];
  document.getElementById("modal-spec-name").value = sp.name;
  document.getElementById("modal-spec-email").value = sp.email;
  document.getElementById("modal-spec-dept").value = sp.dept;
  document.getElementById("modal-spec-days").value = sp.days.join(",");
  document.getElementById("modal-spec-times").value = sp.times.join(",");
  document.getElementById("modal-specialist").classList.remove("hidden");
};
function deleteSpecialist(k) {
  remove(ref(db,`specialists/${k}`)).then(()=>showToast("تم الحذف"));
}

// Render Visits
function renderVisits() {
  const tbody = document.getElementById("table-appointments-body");
  tbody.innerHTML = "";
  Object.entries(visits).forEach(([k,v],i) => {
    const text = v.status==='regular'?'جاري': v.status==='missed'?'غاب':'تعويض';
    tbody.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${children[v.child]?.name||'-'}</td>
        <td>${v.day}</td>
        <td>${v.period}</td>
        <td>${text}</td>
        <td>
          ${v.status==='regular'?`<button onclick="markMissed('${k}')">غاب</button>`:''}
          ${v.status==='missed'?`<button onclick="openMakeup('${k}')">تعويض</button>`:''}
          <button onclick="deleteVisit('${k}')">حذف</button>
        </td>
      </tr>`;
  });
}

// Add/Edit Visit
let editingVisit = null;
document.getElementById("btn-add-appointment").onclick = () => {
  editingVisit = null;
  document.getElementById("form-modal-appointment").reset();
  document.getElementById("modal-appointment").classList.remove("hidden");
};
document.getElementById("modal-appt-cancel").onclick = () => {
  document.getElementById("modal-appointment").classList.add("hidden");
};
document.getElementById("form-modal-appointment").onsubmit = e => {
  e.preventDefault();
  const child = document.getElementById("modal-appt-child").value;
  const day = document.getElementById("modal-appt-day").value;
  const period = document.getElementById("modal-appt-period").value;
  if(!child){ showToast("اختر الطفل","error"); return; }
  const ch = children[child];
  if(ch.paused==='true'||ch.visitsLeft<1){ showToast("لا يمكن الحجز","error"); return; }
  const dbRef = editingVisit
    ? ref(db, `visits/${editingVisit}`)
    : push(ref(db,"visits"));
  if(!editingVisit) {
    update(ref(db,`children/${child}`), { visitsLeft: ch.visitsLeft-1 });
  }
  set(dbRef, { child, day, period, status:'regular', createdAt:new Date().toISOString() })
    .then(()=> {
      showToast("تم الحجز");
      document.getElementById("modal-appointment").classList.add("hidden");
    });
};
window.openMakeup = k => {
  editingVisit = null;
  const v = visits[k];
  document.getElementById("modal-appt-child").value = v.child;
  document.getElementById("modal-appt-day").value = v.day;
  document.getElementById("modal-appt-period").value = v.period;
  document.getElementById("modal-appointment").classList.remove("hidden");
};
window.markMissed = k => {
  update(ref(db,`visits/${k}`),{status:'missed'}).then(()=>showToast("سُجل الغياب"));
};
function deleteVisit(k) {
  remove(ref(db,`visits/${k}`)).then(()=>showToast("تم الحذف"));
}

// Reports
function renderReports() {
  const exp = document.getElementById("report-expiring-children");
  const psd = document.getElementById("report-paused-children");
  exp.innerHTML = "";
  psd.innerHTML = "";
  Object.values(children).forEach(ch => {
    if(ch.visitsLeft <= 2) exp.innerHTML += `<li>${ch.name} (${ch.visitsLeft} زيارات متبقية)</li>`;
    if(ch.paused==='true') psd.innerHTML += `<li>${ch.name}</li>`;
  });
  if(!exp.innerHTML) exp.innerHTML = "<li>لا توجد اشتراكات على وشك الانتهاء</li>";
  if(!psd.innerHTML) psd.innerHTML = "<li>لا يوجد أطفال متوقفون</li>";
}

// Send schedule
document.getElementById("btn-send-email").onclick = () => {
  const name = document.getElementById("send-filter-spec").value.trim();
  const email = document.getElementById("email-spec").value.trim();
  if(!name||!email){ showToast("املأ الحقول","error"); return; }
  const url = `https://script.google.com/macros/s/.../exec?specName=${encodeURIComponent(name)}&specEmail=${encodeURIComponent(email)}`;
  window.open(url,"_blank");
  showToast("تم الإرسال");
};
