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

// toast
function showToast(msg, type = "success") {
  const div = document.createElement("div");
  div.className = `toast toast-${type}`;
  div.textContent = msg;
  document.getElementById("toast-container").append(div);
  setTimeout(() => div.remove(), 3000);
}

// تبويبات
function deactivateTabs() {
  ["tab-children","tab-specialists","tab-appointments","tab-reports","tab-send"]
    .forEach(id => document.getElementById(id).classList.add("hidden"));
  ["tab-children-btn","tab-specialists-btn","tab-appointments-btn","tab-reports-btn","tab-send-btn"]
    .forEach(id => document.getElementById(id).classList.remove("btn-tab-active"));
}
["tab-children-btn","tab-specialists-btn","tab-appointments-btn","tab-reports-btn","tab-send-btn"]
  .forEach((btn,i) => {
    document.getElementById(btn).addEventListener("click",()=>{
      deactivateTabs();
      const sec=["tab-children","tab-specialists","tab-appointments","tab-reports","tab-send"][i];
      document.getElementById(sec).classList.remove("hidden");
      document.getElementById(btn).classList.add("btn-tab-active");
    });
  });

// ===== الأطفال =====
function renderChildren(){
  const tbody = document.getElementById("table-children-body");
  tbody.innerHTML = "";
  Object.entries(children).forEach(([key,ch],i)=>{
    let end=new Date(ch.startDate);
    const weeks=Math.ceil(ch.visitsTotal/ch.freqPerWeek);
    end.setDate(end.getDate()+weeks*7);
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${i+1}</td>
      <td>${ch.name}</td>
      <td>${ch.subtype}</td>
      <td>${ch.startDate}</td>
      <td>${end.toISOString().split('T')[0]}</td>
      <td>${ch.visitsLeft}/${ch.visitsTotal}</td>
      <td>${ch.paused==='true'?'نعم':'لا'}</td>
      <td>
        <button onclick="openEditChild('${key}')" class="text-blue-500">تعديل</button>
        <button onclick="deleteChild('${key}')" class="text-red-500">حذف</button>
      </td>`;
    tbody.append(tr);
  });
}

// إضافة/تعديل طفل
let editingChild=null;
const formChild=document.getElementById("form-modal-child");
formChild.addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("modal-child-name").value.trim();
  const subtype=document.getElementById("modal-child-subtype").value;
  const startDate=document.getElementById("modal-child-start").value;
  const paused=document.getElementById("modal-child-paused").value;
  let visitsTotal=1,freqPerWeek=1;
  if(subtype==='24'){ visitsTotal=8;freqPerWeek=2; }
  else if(subtype==='36'){ visitsTotal=12;freqPerWeek=3; }
  else if(subtype==='48'){ visitsTotal=16;freqPerWeek=4; }
  const data={ name,subtype,startDate,paused,visitsTotal,visitsLeft:visitsTotal,freqPerWeek };
  const dbRef=editingChild? ref(db,`children/${editingChild}`): push(ref(db,'children'));
  set(dbRef,data).then(()=>{
    showToast("تم الحفظ");
    document.getElementById("modal-child").classList.add("hidden");
  });
});
window.openEditChild=key=>{
  editingChild=key;
  const ch=children[key];
  document.getElementById("modal-child-name").value=ch.name;
  document.getElementById("modal-child-subtype").value=ch.subtype;
  document.getElementById("modal-child-start").value=ch.startDate;
  document.getElementById("modal-child-paused").value=ch.paused;
  document.getElementById("modal-child").classList.remove("hidden");
};
function deleteChild(key){
  if(!confirm("حذف؟")) return;
  remove(ref(db,`children/${key}`)).then(()=>showToast("تم الحذف"));
}
document.getElementById("btn-add-child").addEventListener("click",()=>{
  editingChild=null; formChild.reset();
  document.getElementById("modal-child").classList.remove("hidden");
});
document.getElementById("modal-child-cancel").addEventListener("click",()=>{
  document.getElementById("modal-child").classList.add("hidden");
});

// ===== الأخصائيون =====
function renderSpecialists(){
  const tbody=document.getElementById("table-specialists-body");
  tbody.innerHTML="";
  Object.entries(specialists).forEach(([key,sp],i)=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${i+1}</td>
      <td>${sp.name}</td>
      <td>${sp.email}</td>
      <td>${sp.dept}</td>
      <td>${sp.days.join("، ")}</td>
      <td>${sp.times.join("، ")}</td>
      <td>
        <button onclick="openEditSpecialist('${key}')" class="text-blue-500">تعديل</button>
        <button onclick="deleteSpecialist('${key}')" class="text-red-500">حذف</button>
      </td>`;
    tbody.append(tr);
  });
}
let editingSpec=null;
const formSpec=document.getElementById("form-modal-specialist");
formSpec.addEventListener("submit",e=>{
  e.preventDefault();
  const name=document.getElementById("modal-spec-name").value.trim();
  const email=document.getElementById("modal-spec-email").value.trim();
  const dept=document.getElementById("modal-spec-dept").value;
  const days=document.getElementById("modal-spec-days").value.split(",").map(x=>x.trim());
  const times=document.getElementById("modal-spec-times").value.split(",").map(x=>x.trim());
  const data={ name,email,dept,days,times };
  const dbRef=editingSpec? ref(db,`specialists/${editingSpec}`): push(ref(db,'specialists'));
  set(dbRef,data).then(()=>{
    showToast("تم الحفظ");
    document.getElementById("modal-specialist").classList.add("hidden");
  });
});
window.openEditSpecialist=key=>{
  editingSpec=key;
  const sp=specialists[key];
  document.getElementById("modal-spec-name").value=sp.name;
  document.getElementById("modal-spec-email").value=sp.email;
  document.getElementById("modal-spec-dept").value=sp.dept;
  document.getElementById("modal-spec-days").value=sp.days.join(",");
  document.getElementById("modal-spec-times").value=sp.times.join(",");
  document.getElementById("modal-specialist").classList.remove("hidden");
};
function deleteSpecialist(key){
  if(!confirm("حذف؟")) return;
  remove(ref(db,`specialists/${key}`)).then(()=>showToast("تم الحذف"));
}
document.getElementById("btn-add-specialist").addEventListener("click",()=>{
  editingSpec=null; formSpec.reset();
  document.getElementById("modal-specialist").classList.remove("hidden");
});
document.getElementById("modal-spec-cancel").addEventListener("click",()=>{
  document.getElementById("modal-specialist").classList.add("hidden");
});

// ===== الزيارات =====
function renderVisits(){
  const tbody=document.getElementById("table-appointments-body");
  tbody.innerHTML="";
  Object.entries(visits).forEach(([key,v],i=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${i+1}</td>
      <td>${children[v.child]?.name||'-'}</td>
      <td>${v.day}</td>
      <td>${v.period}</td>
      <td>${v.status==='regular'?'جاري':(v.status==='missed'?'غاب':'تعويض')}</td>
      <td>
        ${v.status==='regular'?`<button onclick="markMissed('${key}')">غاب</button>`:''}
        ${v.status==='missed'?`<button onclick="openMakeup('${key}')">تعويض</button>`:''}
        <button onclick="deleteVisit('${key}')">حذف</button>
      </td>`;
    tbody.append(tr);
  }));
}
function deleteVisit(key){
  remove(ref(db,`visits/${key}`)).then(()=>showToast("تم الحذف"));
}

// إضافة / تعديل زيارة
let editingVisit=null;
const formVis=document.getElementById("form-modal-appointment");
formVis.addEventListener("submit",e=>{
  e.preventDefault();
  const child=document.getElementById("modal-appt-child").value;
  const day=document.getElementById("modal-appt-day").value;
  const period=document.getElementById("modal-appt-period").value;
  const status=document.getElementById("modal-appt-type")?.value||'regular';
  if(!child){ showToast("اختر الطفل",'error'); return; }
  const ch=children[child];
  if(ch.paused==='true' || (status==='regular' && ch.visitsLeft<1)){
    showToast("لا يمكن الحجز",'error'); return;
  }
  const dbRef=editingVisit? ref(db,`visits/${editingVisit}`): push(ref(db,'visits'));
  if(!editingVisit && status==='regular'){
    update(ref(db,`children/${child}`),{ visitsLeft:ch.visitsLeft-1 });
  }
  set(dbRef,{ child,day,period,status,createdAt:new Date().toISOString() }).then(()=>{
    showToast("تم الحفظ");
    document.getElementById("modal-appointment").classList.add("hidden");
  });
});
window.openMakeup=key=>{
  editingVisit=null;
  const v=visits[key];
  document.getElementById("modal-appt-child").value=v.child;
  document.getElementById("modal-appt-day").value=v.day;
  document.getElementById("modal-appt-period").value=v.period;
  document.getElementById("modal-appointment").classList.remove("hidden");
};
document.getElementById("btn-add-appointment").addEventListener("click",()=>{
  editingVisit=null; formVis.reset();
  document.getElementById("modal-appointment").classList.remove("hidden");
});
document.getElementById("modal-appt-cancel").addEventListener("click",()=>{
  document.getElementById("modal-appointment").classList.add("hidden");
});
function markMissed(key){
  update(ref(db,`visits/${key}`),{ status:'missed' }).then(()=>showToast("سُجل الغياب"));
}

// ===== التقارير =====
function renderReports(){
  const exp=document.getElementById("report-expiring-children");
  const pausedEl=document.getElementById("report-paused-children");
  exp.innerHTML=""; pausedEl.innerHTML="";
  Object.values(children).forEach(ch=>{
    if(ch.visitsLeft<=2) exp.innerHTML+=`<li>${ch.name} (${ch.visitsLeft} زيارات متبقية)</li>`;
    if(ch.paused==='true') pausedEl.innerHTML+=`<li>${ch.name}</li>`;
  });
  if(!exp.innerHTML) exp.innerHTML="<li>لا توجد اشتراكات على وشك الانتهاء</li>";
  if(!pausedEl.innerHTML) pausedEl.innerHTML="<li>لا يوجد أطفال متوقفون</li>";
}

// ===== إرسال جدول =====
function sendSchedule(specName,email){
  const url=`https://script.google.com/macros/s/.../exec?specName=${encodeURIComponent(specName)}&specEmail=${encodeURIComponent(email)}`;
  window.open(url,'_blank');
  showToast("تم الإرسال");
}
document.getElementById("btn-send-email").addEventListener("click",()=>{
  const spec=document.getElementById("send-filter-spec").value.trim();
  const email=document.getElementById("email-spec").value.trim();
  if(!spec||!email){ showToast("املأ الحقول",'error'); return; }
  sendSchedule(spec,email);
});
