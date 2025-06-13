// تهيئة Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBinpejpZQv71xxhJrlYcET-uNLPL0pROY",
  authDomain: "ynmo-center-scheduler.firebaseapp.com",
  databaseURL:"https://ynmo-center-scheduler-default-rtdb.firebaseio.com",
  projectId: "ynmo-center-scheduler"
});
const db = firebase.database();

// البيانات والثوابت
let children={}, specialists={}, appointments={};
const packages = {
  "24": { weekly:2, total:24, days:["Saturday","Wednesday"] },
  "36": { weekly:3, total:36, days:["Saturday","Monday","Thursday"] },
  "48": { weekly:4, total:48, days:["Saturday","Monday","Wednesday","Friday"] },
  "psychology": { weekly:1, total:0, days:["Saturday"] },
  "iq": { weekly:1, total:0, days:["Saturday"] }
};
const timeSlots = ["13:00","15:20","17:40"];

// المساعدات
const $ = s=>document.querySelector(s);
function showTab(id){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===id));
  document.querySelectorAll('section').forEach(sec=>sec.id===id?sec.classList.add('active'):sec.classList.remove('active'));
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>showTab(b.dataset.tab));

// جلب البيانات
async function loadData(){
  let [c,s,a] = await Promise.all([
    db.ref('children').once('value'),
    db.ref('specialists').once('value'),
    db.ref('appointments').once('value'),
  ]);
  children = c.val()||{}; specialists = s.val()||{}; appointments = a.val()||{};
  renderAll();
}
loadData();

// العرض
function renderAll(){
  renderChildren(); renderSpecs(); renderAppts(); renderReports();
}
function renderChildren(){
  let tb = $('#tblChildren tbody'); tb.innerHTML="";
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
          <button onclick="openModal('child','${id}')">تعديل</button>
          <button onclick="deleteChild('${id}')">حذف</button>
        </td>
      </tr>`;
  });
}
function renderSpecs(){
  let tb = $('#tblSpecs tbody'); tb.innerHTML="";
  Object.entries(specialists).forEach(([id,sp],i)=>{
    tb.innerHTML+=`
      <tr>
        <td>${i+1}</td>
        <td>${sp.name}</td>
        <td>${sp.email}</td>
        <td>${sp.section}</td>
        <td>${sp.workingDays.join(',')}</td>
        <td>
          <button onclick="openModal('spec','${id}')">تعديل</button>
          <button onclick="deleteSpec('${id}')">حذف</button>
        </td>
      </tr>`;
  });
}
function renderAppts(){
  let tb = $('#tblAppts tbody'); tb.innerHTML="";
  Object.entries(appointments).forEach(([id,ap],i)=>{
    let ch = children[ap.childId]?.name||"–", sp = specialists[ap.specId]?.name||"–";
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td><td>${ch}</td><td>${ap.date}</td><td>${ap.time}</td>
        <td>${ap.section}</td><td>${sp}</td><td>${ap.type}</td><td>${ap.status}</td>
        <td>
          ${ap.status==="scheduled"?`<button onclick="markAbsent('${id}')">غاب</button>`:""}
          <button onclick="openModal('appt','${id}')">تعديل</button>
          <button onclick="deleteAppt('${id}')">حذف</button>
          ${ap.status==="absent"?`<button onclick="makeupAppt('${id}')">تعويض</button>`:""}
        </td>
      </tr>`;
  });
}
function renderReports(){
  let end = Object.values(children).filter(c=>c.status==="active" && c.remaining<=packages[c.package].weekly)
            .map(c=>`<li>${c.name} (${c.remaining})</li>`).join("")||"<li>لا أحد</li>";
  $('#endingReport').innerHTML = `<h3>قريب الانتهاء:</h3><ul>${end}</ul>`;
  let paused = Object.values(children).filter(c=>c.status==="paused").map(c=>`<li>${c.name}</li>`).join("")||"<li>لا أحد</li>";
  $('#pausedReport').innerHTML  = `<h3>متوقفون:</h3><ul>${paused}</ul>`;
}

// CRUD Children
function deleteChild(id){
  if(!confirm("حذف الطفل؟"))return;
  delete children[id]; db.ref('children').set(children).then(loadData);
}
function saveChild(id,data){
  if(!id){ id = db.ref('children').push().key; data.remaining=packages[data.package].total; }
  children[id]=data; db.ref('children').set(children).then(loadData);
}

// CRUD Specs
function deleteSpec(id){
  if(!confirm("حذف الأخصائي؟"))return;
  delete specialists[id]; db.ref('specialists').set(specialists).then(loadData);
}
function saveSpec(id,data){
  if(!id) id = db.ref('specialists').push().key;
  data.workingDays = data.workingDays.split(",").map(x=>x.trim());
  specialists[id]=data; db.ref('specialists').set(specialists).then(loadData);
}

// CRUD Appts
function deleteAppt(id){
  if(!confirm("حذف الموعد؟"))return;
  let ap=appointments[id];
  if(ap.type==="regular"){ children[ap.childId].remaining++; db.ref('children').set(children) }
  delete appointments[id]; db.ref('appointments').set(appointments).then(loadData);
}
function saveAppt(id,data){
  if(!id && data.type==="regular"){ children[data.childId].remaining--; db.ref('children').set(children) }
  if(!id) id=db.ref('appointments').push().key;
  appointments[id]={...data,status:"scheduled"};
  db.ref('appointments').set(appointments).then(loadData);
}
function markAbsent(id){
  appointments[id].status="absent";
  children[appointments[id].childId].remaining++;
  db.ref('children').set(children);
  db.ref('appointments').set(appointments).then(loadData);
}
function makeupAppt(id){
  autoScheduleChild(appointments[id].childId,{type:"makeup"});
}

// Scheduling
async function autoScheduleChild(childId,opts={type:"regular"}){
  let ch=children[childId], pkg=packages[ch.package], need=pkg.weekly;
  for(let day of pkg.days){
    if(need<=0) break;
    let date=nextDate(day);
    for(let time of timeSlots){
      if(need<=0) break;
      let entry = Object.entries(specialists).find(([i,s])=>s.section===ch.package && s.workingDays.includes(day));
      if(!entry) continue;
      let [spId] = entry;
      if(Object.values(appointments).some(a=>a.specId===spId && a.date===date && a.time===time)) continue;
      let nid = db.ref('appointments').push().key;
      appointments[nid]={ childId, specId:spId, section:ch.package, date, time, type:opts.type, status:"scheduled" };
      if(opts.type==="regular"){ ch.remaining--; need--; }
      await db.ref('appointments').set(appointments);
      await db.ref('children').set(children);
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
function nextDate(day){
  const map={Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6};
  let t=new Date(), d=(map[day]-t.getDay()+7)%7||7, r=new Date(t.getFullYear(),t.getMonth(),t.getDate()+d);
  return r.toISOString().split("T")[0];
}

// Modal
let mType,mId;
function openModal(type,id=null){
  mType=type; mId=id;
  $("#modalTitle").innerText = (id?"تعديل ":"إضافة ") + {child:"طفل",spec:"أخصائي",appt:"موعد"}[type];
  let form=$("#modalForm"); form.innerHTML="";
  let data = id ? (type==="child"?children[id]:(type==="spec"?specialists[id]:appointments[id])) : {};
  if(type==="child"){
    form.innerHTML=`
      <label>اسم: <input name="name" value="${data.name||""}"/></label><br>
      <label>بكيج:
        <select name="package">${Object.keys(packages).map(k=>`<option ${k===data.package?"selected":""} value="${k}">${k}</option>`).join("")}</select>
      </label><br>
      <label>بدء: <input type="date" name="startDate" value="${data.startDate||""}"/></label><br>
      <label>حالة:
        <select name="status">
          <option ${data.status==="active"?"selected":""} value="active">نشط</option>
          <option ${data.status==="paused"?"selected":""} value="paused">متوقف</option>
        </select>
      </label>`;
  }
  if(type==="spec"){
    form.innerHTML=`
      <label>اسم: <input name="name" value="${data.name||""}"/></label><br>
      <label>بريد: <input name="email" value="${data.email||""}"/></label><br>
      <label>قسم:
        <select name="section">
          <option value="speech">تخاطب</option><option value="behavior">سلوك</option>
          <option value="skills">مهارات</option><option value="psychology">نفسية</option>
          <option value="iq">ذكاء</option>
        </select>
      </label><br>
      <label>أيام (مثال: Saturday,Monday):
        <input name="workingDays" value="${(data.workingDays||[]).join(",")}"/>
      </label>`;
  }
  if(type==="appt"){
    form.innerHTML=`
      <label>طفل:
        <select name="childId">${Object.entries(children).map(([cid,ch])=>
          `<option ${cid===data.childId?"selected":""} value="${cid}">${ch.name}</option>`).join("")}
        </select>
      </label><br>
      <label>قسم:
        <select name="section">${Object.keys(packages).map(k=>
          `<option ${k===data.section?"selected":""} value="${k}">${k}</option>`).join("")}
        </select>
      </label><br>
      <label>تاريخ: <input type="date" name="date" value="${data.date||""}"/></label><br>
      <label>وقت:
        <select name="time">${timeSlots.map(t=>
          `<option ${t===data.time?"selected":""} value="${t}">${t}</option>`).join("")}
        </select>
      </label><br>
      <label>نوع:
        <select name="type">
          <option ${data.type==="regular"?"selected":""} value="regular">عادي</option>
          <option ${data.type==="makeup"?"selected":""} value="makeup">تعويض</option>
        </select>
      </label>`;
  }
  $("#modal").style.display="flex";
}
function closeModal(e){ e.preventDefault(); $("#modal").style.display="none"; }
function saveModal(e){
  e.preventDefault();
  let fm=new FormData($("#modalForm")), obj={};
  for(let [k,v] of fm.entries()) obj[k]=v;
  if(mType==="child") saveChild(mId,obj);
  if(mType==="spec")  saveSpec(mId,obj);
  if(mType==="appt")  saveAppt(mId,obj);
  closeModal(e);
}
