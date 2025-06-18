import { ref, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";
import { db } from "./firebase-config.js";

// حالات الواجهة
let children = {}, specialists = {}, appointments = {};

// مساعدات DOM
const $ = s => document.querySelector(s),
      $$ = s => document.querySelectorAll(s),
      toast = (msg, type='success') => {
        const d = document.createElement('div');
        d.className = `toast toast-${type}`; d.textContent = msg;
        document.getElementById('toast-container').appendChild(d);
        setTimeout(() => d.remove(), 3000);
      };

// إعداد البكيجات
const packages = {
  "24": { days:["Saturday","Wednesday"], total:24 },
  "36": { days:["Saturday","Monday","Thursday"], total:36 },
  "48": { days:["Saturday","Monday","Wednesday","Friday"], total:48 },
  "psychology": { days:["Saturday"], total:1 },
  "iq": { days:["Saturday"], total:1 },
  "speech": { days:["Saturday"], total:1 }
};

// فترات الجلسات (40 دقيقة، بين كل دفعة ساعتين)
const slots = ["13:00","15:20","17:40","19:00"];

// تهيئة التبويبات
function switchTab(id) {
  $$('nav button').forEach(b => b.classList.toggle('btn-tab-active', b.dataset.tab===id));
  $$('section').forEach(s => s.id===id ? s.classList.remove('hidden') : s.classList.add('hidden'));
  if(id==='reports') renderReports();
}
$$('nav button').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
window.onload = () => switchTab('children');

// الاستماع لبيانات Firebase
onValue(ref(db,'children'), snap => { children = snap.val()||{}; renderChildren(); });
onValue(ref(db,'specialists'), snap => { specialists = snap.val()||{}; renderSpecialists(); });
onValue(ref(db,'appointments'), snap => { appointments = snap.val()||{}; renderAppointments(); });

// عرض الأطفال
function renderChildren() {
  const tb = $('#table-children-body'); tb.innerHTML = '';
  Object.entries(children).forEach(([k,c],i) => {
    tb.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i+1}</td>
        <td>${c.name}</td>
        <td>${c.subtype} جلسة</td>
        <td>${c.startDate}</td>
        <td>${packages[c.subtype].total}</td>
        <td>${c.sessionsLeft}</td>
        <td>${c.paused==='true'?'متوقف':'نشط'}</td>
        <td>
          <button onclick="openEditChild('${k}')" class="text-blue-500">تعديل</button>
          <button onclick="deleteChild('${k}')" class="text-red-500">حذف</button>
        </td>
      </tr>`);
  });
}

// عرض الأخصائيين
function renderSpecialists() {
  const tb = $('#table-specialists-body'); tb.innerHTML = '';
  Object.entries(specialists).forEach(([k,s],i) => {
    tb.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i+1}</td>
        <td>${s.name}</td><td>${s.email}</td><td>${s.dept}</td>
        <td>${s.days.join(', ')}</td><td>${s.times.join(', ')}</td>
        <td>
          <button onclick="openEditSpec('${k}')" class="text-blue-500">تعديل</button>
          <button onclick="deleteSpec('${k}')" class="text-red-500">حذف</button>
        </td>
      </tr>`);
  });
}

// عرض المواعيد
function renderAppointments() {
  const tb = $('#table-appointments-body'); tb.innerHTML = '';
  Object.entries(appointments).forEach(([k,a],i) => {
    const ch = children[a.childId]?.name || '–';
    const statusText = a.status==='makeup'?'تعويض': a.status==='missed'?'غاب':'✓';
    tb.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${i+1}</td><td>${ch}</td><td>${a.date}</td><td>${a.time}</td>
        <td>${a.dept}</td><td>${a.spec||'–'}</td><td>${a.type}</td><td>${statusText}</td>
        <td>
          <button onclick="openEditAppt('${k}')" class="text-blue-500">تعديل</button>
          <button onclick="deleteAppt('${k}')" class="text-red-500">حذف</button>
          ${a.status==='scheduled'?`<button onclick="markMissed('${k}')" class="text-yellow-500">غاب</button>`:''}
          ${a.status==='missed'?`<button onclick="openMakeup('${k}')" class="text-green-500">تعويض</button>`:''}
        </td>
      </tr>`);
  });
}

// عرض التقارير
function renderReports() {
  const exp = $('#report-expiring-children'), pa = $('#report-paused-children');
  exp.innerHTML = pa.innerHTML = '';
  Object.values(children).forEach(c => {
    if(c.paused==='true') pa.insertAdjacentHTML('beforeend', `<li>${c.name}</li>`);
    if(c.sessionsLeft <= packages[c.subtype].days.length*3)
      exp.insertAdjacentHTML('beforeend', `<li>${c.name} (${c.sessionsLeft})</li>`);
  });
  if(!exp.hasChildNodes()) exp.innerHTML = '<li>لا أحد</li>';
  if(!pa.hasChildNodes()) pa.innerHTML = '<li>لا أحد</li>';
}

// حساب التاريخ التالي لليوم المحدد
function nextDate(day,w=0) {
  const map={Saturday:6,Sunday:0,Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5};
  const t=new Date(), diff=(map[day]-t.getDay()+7)%7 + w*7;
  return new Date(t.getFullYear(),t.getMonth(),t.getDate()+diff).toISOString().split('T')[0];
}

// جدولة تلقائية لكل طفل نشط
function autoScheduleChild(cid,opts={type:'regular'}) {
  const c=children[cid], pkg=packages[c.subtype]; let count=0;
  for(let w=0; w<4; w++){
    for(let day of pkg.days){
      if(count>=pkg.total) break;
      const date=nextDate(day,w);
      // تأكد الطفل لم يحجز نفس اليوم
      if(Object.values(appointments).some(a=>a.childId===cid && a.date===date)) continue;
      for(let slot of slots){
        if(count>=pkg.total) break;
        const entry=Object.entries(specialists)
          .find(([_,sp])=>sp.dept===c.subtype && sp.days.includes(day));
        if(!entry) continue; const [sk,sp]=entry;
        // تحقق عدم تداخل مع جدول الأخصائي
        if(Object.values(appointments).some(a=>a.spec===sp.name && a.date===date && a.time===slot))
          continue;
        // أضف الموعد
        push(ref(db,'appointments'), {
          childId:cid, date, time:slot,
          dept:c.subtype, spec:sp.name,
          type:opts.type, status:'scheduled'
        });
        count++;
        if(opts.type==='regular') update(ref(db,`children/${cid}`), { sessionsLeft:c.sessionsLeft-1 });
        break; // بعد جلسة واحدة في اليوم
      }
    }
  }
}

// تطبيق على الجميع
window.autoScheduleAll = () =>
  Object.keys(children)
    .filter(cid=>children[cid].paused==='false')
    .forEach(cid=>autoScheduleChild(cid));
