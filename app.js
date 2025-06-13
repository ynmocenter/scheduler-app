// ---------- Firebase config ----------
const firebaseConfig = {
  apiKey: "AIzaSyBinpejpZQv71xxhJrlYcET-uNLPL0pROY",
  authDomain: "ynmo-center-scheduler.firebaseapp.com",
  databaseURL: "https://ynmo-center-scheduler-default-rtdb.firebaseio.com",
  projectId: "ynmo-center-scheduler",
  storageBucket: "ynmo-center-scheduler.appspot.com",
  messagingSenderId: "287665928063",
  appId: "1:287665928063:web:67f6bccd66a25ef0118c4a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ---------- Data & Constants ----------
let children={}, specialists={}, appointments={};

const packages = {
  "24": { weekly:2, total:24, days:["Saturday","Wednesday"] },
  "36": { weekly:3, total:36, days:["Saturday","Monday","Thursday"] },
  "48": { weekly:4, total:48, days:["Saturday","Monday","Wednesday","Friday"] },
  "psychology": { weekly:1, total:0, days:["Saturday"] },
  "iq":          { weekly:1, total:0, days:["Saturday"] }
};
const timeSlots = ["13:00","15:20","17:40"];

// ---------- UI Helpers ----------
function $(s){ return document.querySelector(s); }
function showTab(id){
  document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));
  document.querySelector(`nav button[data-tab="${id}"]`).classList.add('active');
  document.querySelectorAll('section').forEach(sec=>sec.id===id?sec.classList.add('active'):sec.classList.remove('active'));
}
document.querySelectorAll('nav button').forEach(b=>{
  b.onclick=()=>showTab(b.dataset.tab);
});

// ---------- Load & Render ----------
async function loadData(){
  let [c,s,a] = await Promise.all([
    db.ref('children').once('value'),
    db.ref('specialists').once('value'),
    db.ref('appointments').once('value')
  ]);
  children    = c.val()||{};
  specialists = s.val()||{};
  appointments= a.val()||{};
  renderChildren();
  renderSpecialists();
  renderAppointments();
  renderReports();
}
loadData();

function renderChildren(){
  let tb = $("#tblChildren tbody"); tb.innerHTML="";
  Object.entries(children).forEach(([id,ch],i)=>{
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${ch.name}</td>
        <td>${ch.package}</td>
        <td>${ch.startDate}</td>
        <td>${packages[ch.package].total}</td>
        <td>${ch.remaining}</td>
        <td>${ch.status}</td>
        <td>
          <button onclick="editChild('${id}')">تعديل</button>
          <button onclick="deleteChild('${id}')">حذف</button>
        </td>
      </tr>`;
  });
}

function renderSpecialists(){
  let tb = $("#tblSpecs tbody"); tb.innerHTML="";
  Object.entries(specialists).forEach(([id,sp],i)=>{
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${sp.name}</td>
        <td>${sp.email}</td>
        <td>${sp.section}</td>
        <td>${sp.workingDays.join(',')}</td>
        <td>
          <button onclick="editSpec('${id}')">تعديل</button>
          <button onclick="deleteSpec('${id}')">حذف</button>
        </td>
      </tr>`;
  });
}

function renderAppointments(){
  let tb = $("#tblAppts tbody"); tb.innerHTML="";
  Object.entries(appointments).forEach(([id,ap],i)=>{
    let ch = children[ap.childId]?.name||"–",
        sp = specialists[ap.specId]?.name||"–";
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${ch}</td>
        <td>${ap.date}</td>
        <td>${ap.time}</td>
        <td>${ap.section}</td>
        <td>${sp}</td>
        <td>${ap.type}</td>
        <td>${ap.status}</td>
        <td>
          ${ap.status==="scheduled"?`<button onclick="markAbsent('${id}')">غاب</button>`:""}
          <button onclick="editAppt('${id}')">تعديل</button>
          <button onclick="deleteAppt('${id}')">حذف</button>
          ${ap.status==="absent"?`<button onclick="makeupAppt('${id}')">تعويض</button>`:""}
        </td>
      </tr>`;
  });
}

function renderReports(){
  let endList = Object.values(children)
    .filter(c=>c.status==="active" && c.remaining <= packages[c.package].weekly)
    .map(c=>`<li>${c.name} (${c.remaining} جلسات متبقية)</li>`);
  $("#endingReport").innerHTML = `<h3>اشتراكات على وشك الانتهاء:</h3><ul>${endList.join("")||"<li>لا أحد</li>"}</ul>`;

  let pausedList = Object.values(children)
    .filter(c=>c.status==="paused")
    .map(c=>`<li>${c.name}</li>`);
  $("#pausedReport").innerHTML  = `<h3>متوقفون مؤقتًا:</h3><ul>${pausedList.join("")||"<li>لا أحد</li>"}</ul>`;
}

// ---------- CRUD Children ----------
function editChild(id){ openModal("child", id); }
function deleteChild(id){
  if(!confirm("حذف هذا الطفل؟")) return;
  delete children[id];
  db.ref("children").set(children).then(loadData);
}
function saveChild(id,data){
  if(!id){
    id = db.ref("children").push().key;
    data.remaining = packages[data.package].total;
  }
  children[id] = data;
  db.ref("children").set(children).then(loadData);
}

// ---------- CRUD Specialists ----------
function editSpec(id){ openModal("spec", id); }
function deleteSpec(id){
  if(!confirm("حذف هذا الأخصائي؟")) return;
  delete specialists[id];
  db.ref("specialists").set(specialists).then(loadData);
}
function saveSpec(id,data){
  if(!id) id = db.ref("specialists").push().key;
  data.workingDays = data.workingDays.split(",").map(x=>x.trim());
  specialists[id] = data;
  db.ref("specialists").set(specialists).then(loadData);
}

// ---------- CRUD Appointments ----------
function editAppt(id){ openModal("appt", id); }
function deleteAppt(id){
  if(!confirm("حذف هذا الموعد؟")) return;
  let ap = appointments[id];
  if(ap.type==="regular"){
    children[ap.childId].remaining++;
    db.ref("children").set(children);
  }
  delete appointments[id];
  db.ref("appointments").set(appointments).then(loadData);
}
function saveAppt(id,data){
  if(!id && data.type==="regular"){
    children[data.childId].remaining--;
    db.ref("children").set(children);
  }
  if(!id) id = db.ref("appointments").push().key;
  appointments[id] = {...data, status:"scheduled"};
  db.ref("appointments").set(appointments).then(loadData);
}
function markAbsent(id){
  appointments[id].status = "absent";
  children[appointments[id].childId].remaining++;
  db.ref("children").set(children);
  db.ref("appointments").set(appointments).then(loadData);
}
function makeupAppt(id){
  autoScheduleChild(appointments[id].childId,{type:"makeup"});
}

// ---------- Automatic Scheduling ----------
async function autoScheduleChild(childId, opts={type:"regular"}){
  let ch = children[childId],
      pkg = packages[ch.package],
      needed = pkg.weekly;

  for(let day of pkg.days){
    if(needed<=0) break;
    let date = nextDate(day);
    for(let time of timeSlots){
      if(needed<=0) break;
      let entry = Object.entries(specialists)
        .find(([iid,sp])=>sp.section===ch.package && sp.workingDays.includes(day));
      if(!entry) continue;
      let [specId] = entry;

      // تأكد من عدم تداخل
      let clash = Object.values(appointments).some(a=>a.specId===specId && a.date===date && a.time===time);
      if(clash) continue;

      // جدول موعد
      let nid = db.ref("appointments").push().key;
      appointments[nid] = {
        childId,
        specId,
        section: ch.package,
        date,
        time,
        type: opts.type,
        status: "scheduled"
      };
      if(opts.type==="regular"){
        ch.remaining--;
        needed--;
      }
      await db.ref("appointments").set(appointments);
      await db.ref("children").set(children);
    }
  }
  loadData();
}
function autoScheduleAll(){
  Object.keys(children).forEach(id=>{
    if(children[id].status==="active")
      autoScheduleChild(id);
  });
}
function nextDate(dayName){
  let map = {Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6},
      today=new Date(), target=map[dayName],
      diff=(target - today.getDay() +7)%7||7,
      d=new Date(today.getFullYear(), today.getMonth(), today.getDate()+diff);
  return d.toISOString().split("T")[0];
}

// ---------- Modal Logic ----------
let modalType, modalId;
function openModal(type, id=null){
  modalType=type; modalId=id;
  let title = {child:"طفل", spec:"أخصائي", appt:"موعد"}[type],
      data  = id ? (type==="appt"? appointments[id] : (type==="child"? children[id] : specialists[id])) : {};
  $("#modalTitle").innerText = id ? `تعديل ${title}` : `إضافة ${title}`;
  let form = $("#modalForm");
  form.innerHTML = "";

  if(type==="child"){
    form.innerHTML = `
      <label>اسم: <input name="name" value="${data.name||""}"/></label><br>
      <label>بكيج:
        <select name="package">
          ${Object.keys(packages).map(k=>`<option ${k===data.package?"selected":""} value="${k}">${k}</option>`).join("")}
        </select>
      </label><br>
      <label>تاريخ: <input type="date" name="startDate" value="${data.startDate||""}"/></label><br>
      <label>حالة:
        <select name="status">
          <option ${data.status==="active"?"selected":""} value="active">نشط</option>
          <option ${data.status==="paused"?"selected":""} value="paused">متوقف</option>
        </select>
      </label>`;
  }

  if(type==="spec"){
    form.innerHTML = `
      <label>اسم: <input name="name" value="${data.name||""}"/></label><br>
      <label>بريد: <input name="email" value="${data.email||""}"/></label><br>
      <label>قسم:
        <select name="section">
          <option value="speech">تخاطب</option>
          <option value="behavior">تعديل سلوك</option>
          <option value="skills">تنمية مهارات</option>
          <option value="psychology">جلسة نفسية</option>
          <option value="iq">اختبار ذكاء</option>
        </select>
      </label><br>
      <label>أيام (مثال: Saturday,Monday):
        <input name="workingDays" value="${(data.workingDays||[]).join(",")}"/>
      </label>`;
  }

  if(type==="appt"){
    form.innerHTML = `
      <label>طفل:
        <select name="childId">
          ${Object.entries(children).map(([cid,ch])=>`<option ${cid===data.childId?"selected":""} value="${cid}">${ch.name}</option>`).join("")}
        </select>
      </label><br>
      <label>قسم:
        <select name="section">
          ${Object.keys(packages).map(k=>`<option ${k===data.section?"selected":""} value="${k}">${k}</option>`).join("")}
        </select>
      </label><br>
      <label>تاريخ: <input type="date" name="date" value="${data.date||""}"/></label><br>
      <label>وقت:
        <select name="time">
          ${timeSlots.map(t=>`<option ${t===data.time?"selected":""} value="${t}">${t}</option>`).join("")}
        </select>
      </label><br>
      <label>نوع:
        <select name="type">
          <option ${data.type==="regular"?"selected":""} value="regular">عادي</option>
          <option ${data.type==="makeup"?"selected":""} value="makeup">تعويض</option>
        </select>
      </label>`;
  }

  $("#modal").style.display = "flex";
}
function closeModal(e){ e.preventDefault(); $("#modal").style.display="none" }
function saveModal(e){
  e.preventDefault();
  let fm = new FormData($("#modalForm")), obj = {};
  for(let [k,v] of fm.entries()) obj[k]=v;
  if(modalType==="child")   saveChild(modalId, obj);
  if(modalType==="spec")    saveSpec(modalId, obj);
  if(modalType==="appt")    saveAppt(modalId, obj);
  closeModal(e);
}
