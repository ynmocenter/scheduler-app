const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);

// التخزين المحلي
const S = {
  children: JSON.parse(localStorage.getItem('children') || '{}'),
  specialists: JSON.parse(localStorage.getItem('specialists') || '{}'),
  appointments: JSON.parse(localStorage.getItem('appointments') || '{}')
};
function sync() {
  localStorage.setItem('children', JSON.stringify(S.children));
  localStorage.setItem('specialists', JSON.stringify(S.specialists));
  localStorage.setItem('appointments', JSON.stringify(S.appointments));
}

// التعريفات
const packages = {
  "24": { weekly: 2, total: 24, days: ["Saturday","Wednesday"] },
  "36": { weekly: 3, total: 36, days: ["Saturday","Monday","Thursday"] },
  "48": { weekly: 4, total: 48, days: ["Saturday","Monday","Wednesday","Friday"] },
  "psychology": { weekly: 1, total: 1, days: ["Saturday"] },
  "iq": { weekly: 1, total: 1, days: ["Saturday"] }
};
const timeSlots = ["13:00","15:20","17:40"];

// تبديل التبويبات
$$('nav button').forEach(btn => {
  btn.onclick = () => {
    $$('nav button').forEach(b => b.classList.remove('active'));
    $$('section').forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    $('#' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'reports') renderReports();
  };
});

// عرض البيانات
function renderChildren() {
  const tb = $('#tblChildren tbody'); tb.innerHTML = '';
  Object.entries(S.children).forEach(([id, c], i) => {
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${c.name}</td>
        <td>${c.pkg}</td>
        <td>${c.start}</td>
        <td>${packages[c.pkg].total}</td>
        <td>${c.remaining}</td>
        <td>${c.status}</td>
        <td>
          <button onclick="openModal('child','${id}')">تعديل</button>
          <button onclick="deleteChild('${id}')">حذف</button>
        </td>
      </tr>`;
  });
}

function renderSpecs() {
  const tb = $('#tblSpecs tbody'); tb.innerHTML = '';
  Object.entries(S.specialists).forEach(([id, s], i) => {
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${s.name}</td>
        <td>${s.section}</td>
        <td>${s.days.join(',')}</td>
        <td>
          <button onclick="openModal('spec','${id}')">تعديل</button>
          <button onclick="deleteSpec('${id}')">حذف</button>
        </td>
      </tr>`;
  });
}

function renderAppts() {
  const tb = $('#tblAppts tbody'); tb.innerHTML = '';
  Object.entries(S.appointments).forEach(([id, a], i) => {
    const ch = S.children[a.childId]?.name || '–';
    const sp = S.specialists[a.specId]?.name || '–';
    tb.innerHTML += `
      <tr>
        <td>${i+1}</td>
        <td>${ch}</td>
        <td>${a.date}</td>
        <td>${a.time}</td>
        <td>${a.section}</td>
        <td>${sp}</td>
        <td>${a.type}</td>
        <td>${a.status}</td>
        <td>
          ${a.status==='scheduled'?`<button onclick="markAbsent('${id}')">غاب</button>` : ''}
          <button onclick="openModal('appt','${id}')">تعديل</button>
          <button onclick="deleteAppt('${id}')">حذف</button>
          ${a.status==='absent'?`<button onclick="makeup('${id}')">تعويض</button>` : ''}
        </td>
      </tr>`;
  });
}

function renderReports() {
  const endList = Object.values(S.children)
    .filter(c => c.status==='active' && c.remaining <= packages[c.pkg].weekly * 3)
    .map(c => `<li>${c.name} (${c.remaining})</li>`).join('') || '<li>لا أحد</li>';
  const pausedList = Object.values(S.children)
    .filter(c => c.status==='paused')
    .map(c => `<li>${c.name}</li>`).join('') || '<li>لا أحد</li>';
  $('#endingReport').innerHTML = `<h3>قريب الانتهاء:</h3><ul>${endList}</ul>`;
  $('#pausedReport').innerHTML  = `<h3>متوقف:</h3><ul>${pausedList}</ul>`;
}

// CRUD وغياب وتعويض
function deleteChild(id) { if(!confirm('حذف؟')) return; delete S.children[id]; sync(); renderChildren(); }
function deleteSpec(id) { if(!confirm('حذف؟')) return; delete S.specialists[id]; sync(); renderSpecs(); }
function deleteAppt(id) {
  if(!confirm('حذف؟')) return;
  const a = S.appointments[id];
  if(a.type==='regular') S.children[a.childId].remaining++;
  delete S.appointments[id];
  sync(); renderAppts(); renderChildren();
}
function markAbsent(id) {
  S.appointments[id].status = 'absent';
  S.children[S.appointments[id].childId].remaining++;
  sync(); renderAppts(); renderChildren();
}
function makeup(id) { autoScheduleChild(S.appointments[id].childId,{type:'makeup'}); }

// المودال
let mType, mId;

function openModal(type, id=null) {
  mType = type; mId = id;
  $('#modalTitle').innerText = (id?'تعديل ':'إضافة ') + {child:'طفل',spec:'أخصائي',appt:'موعد'}[type];
  const form = $('#modalForm'); form.innerHTML = '';
  const d = id?(
    type==='child'? S.children[id] :
    type==='spec'? S.specialists[id] :
    S.appointments[id]
  ) : {};

  if(type==='child') {
    form.innerHTML = `
      <label>اسم: <input name="name" value="${d.name||''}" /></label>
      <label>بكيج:
        <select name="pkg">
          ${Object.keys(packages).map(k=>`
            <option value="${k}" ${k===d.pkg?'selected':''}>${k}</option>`
          ).join('')}
        </select>
      </label>
      <label>بدء: <input type="date" name="start" value="${d.start||''}" /></label>
      <label>حالة:
        <select name="status">
          <option value="active" ${d.status==='active'?'selected':''}>نشط</option>
          <option value="paused" ${d.status==='paused'?'selected':''}>متوقف</option>
        </select
