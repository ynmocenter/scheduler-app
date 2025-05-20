// app.js

// =======================================
// 1) استدعاء Firebase (قاعدة البيانات) من ملف firebase-config.js
import { db } from "./firebase-config.js";
import {
  ref,
  push,
  set,
  onValue,
  remove,
  update
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// 2) إعداد EmailJS
// استخدم المفتاح العام (Public Key) الذي حصلت عليه من EmailJS
const EMAILJS_USER_ID     = "Ol1_k8IqKWQbPcbNv";
const EMAILJS_SERVICE_ID  = "service_cuzf74k";
const EMAILJS_TEMPLATE_ID = "template_b04f8pi";
emailjs.init(EMAILJS_USER_ID);

// 3) متغيّرات عالمية لحفظ البيانات مؤقتًا من Firebase
let children     = {}; // بيانات جميع الأطفال
let specialists  = {}; // بيانات جميع الأخصائيين (مع dept)
let appointments = {}; // بيانات جميع المواعيد

// 4) عناصر DOM
const toastContainer = document.getElementById("toast-container");

// تبويبات
const tabChildrenBtn      = document.getElementById("tab-children-btn");
const tabSpecialistsBtn   = document.getElementById("tab-specialists-btn");
const tabAppointmentsBtn  = document.getElementById("tab-appointments-btn");
const tabReportsBtn       = document.getElementById("tab-reports-btn");
const tabSendBtn          = document.getElementById("tab-send-btn");

// أقسام التبويبات
const tabChildrenSection      = document.getElementById("tab-children");
const tabSpecialistsSection   = document.getElementById("tab-specialists");
const tabAppointmentsSection  = document.getElementById("tab-appointments");
const tabReportsSection       = document.getElementById("tab-reports");
const tabSendSection          = document.getElementById("tab-send");

// جداول العرض
const tableChildrenBody     = document.getElementById("table-children-body");
const tableSpecialistsBody  = document.getElementById("table-specialists-body");
const tableAppointmentsBody = document.getElementById("table-appointments-body");

// التقارير
const reportExpiringChildren = document.getElementById("report-expiring-children");
const reportPausedChildren   = document.getElementById("report-paused-children");

// أزرار فتح المودالات
const btnAddChild       = document.getElementById("btn-add-child");
const btnAddSpecialist  = document.getElementById("btn-add-specialist");
const btnAddAppointment = document.getElementById("btn-add-appointment");
const btnSendEmail      = document.getElementById("btn-send-email");

// إرسال جدول الأخصائي
const sendFilterInput   = document.getElementById("send-filter-spec");
const emailSpecInput    = document.getElementById("email-spec");

// === مودال إضافة / تعديل طفل ===
const modalChild         = document.getElementById("modal-child");
const formModalChild     = document.getElementById("form-modal-child");
const modalChildName     = document.getElementById("modal-child-name");
const modalChildSubtype  = document.getElementById("modal-child-subtype");
const modalChildStart    = document.getElementById("modal-child-start");
const modalChildPaused   = document.getElementById("modal-child-paused");
const modalChildCancel   = document.getElementById("modal-child-cancel");
let editingChildKey      = null;

// === مودال إضافة / تعديل أخصائي ===
const modalSpecialist      = document.getElementById("modal-specialist");
const formModalSpecialist  = document.getElementById("form-modal-specialist");
const modalSpecName        = document.getElementById("modal-spec-name");
const modalSpecEmail       = document.getElementById("modal-spec-email");
const modalSpecDept        = document.getElementById("modal-spec-dept");
const modalSpecDays        = document.getElementById("modal-spec-days");
const modalSpecTimes       = document.getElementById("modal-spec-times");
const modalSpecCancel      = document.getElementById("modal-spec-cancel");
let editingSpecialistKey   = null;

// === مودال إضافة / تعديل موعد ===
const modalAppointment       = document.getElementById("modal-appointment");
const formModalAppointment   = document.getElementById("form-modal-appointment");
const modalApptChild         = document.getElementById("modal-appt-child");
const modalApptDay           = document.getElementById("modal-appt-day");
const modalApptTime          = document.getElementById("modal-appt-time");
const modalApptDept          = document.getElementById("modal-appt-dept");
// حقل الأخصائي أصبح حقل نصي
const modalApptSpec          = document.getElementById("modal-appt-spec");
const modalApptType          = document.getElementById("modal-appt-type");
const modalApptCancel        = document.getElementById("modal-appt-cancel");
let editingAppointmentKey    = null;

// -------------------------------------------------
// 5) دوال Toast لإظهار التنبيهات
// -------------------------------------------------
function showToast(message, type = "success") {
  const div = document.createElement("div");
  div.className = `toast toast-${type}`;
  div.textContent = message;
  toastContainer.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// -------------------------------------------------
// 6) إدارة التبويبات (Tabs)
// -------------------------------------------------
function deactivateAllTabs() {
  [tabChildrenSection, tabSpecialistsSection, tabAppointmentsSection, tabReportsSection, tabSendSection]
    .forEach(sec => sec.classList.add("hidden"));
  [tabChildrenBtn, tabSpecialistsBtn, tabAppointmentsBtn, tabReportsBtn, tabSendBtn]
    .forEach(btn => btn.classList.remove("btn-tab-active"));
}
tabChildrenBtn.addEventListener("click", () => {
  deactivateAllTabs();
  tabChildrenSection.classList.remove("hidden");
  tabChildrenBtn.classList.add("btn-tab-active");
});
tabSpecialistsBtn.addEventListener("click", () => {
  deactivateAllTabs();
  tabSpecialistsSection.classList.remove("hidden");
  tabSpecialistsBtn.classList.add("btn-tab-active");
});
tabAppointmentsBtn.addEventListener("click", () => {
  deactivateAllTabs();
  tabAppointmentsSection.classList.remove("hidden");
  tabAppointmentsBtn.classList.add("btn-tab-active");
});
tabReportsBtn.addEventListener("click", () => {
  deactivateAllTabs();
  tabReportsSection.classList.remove("hidden");
  tabReportsBtn.classList.add("btn-tab-active");
  renderReports();
});
tabSendBtn.addEventListener("click", () => {
  deactivateAllTabs();
  tabSendSection.classList.remove("hidden");
  tabSendBtn.classList.add("btn-tab-active");
});

// -------------------------------------------------
// 7) مراجع Firebase
// -------------------------------------------------
const childrenRef     = ref(db, "children");
const specialistsRef  = ref(db, "specialists");
const appointmentsRef = ref(db, "appointments");

// استماع لتغييرات بيانات الأطفال
onValue(childrenRef, snapshot => {
  children = snapshot.val() || {};
  renderChildren();
  populateChildDropdown();
});
// استماع لتغييرات بيانات الأخصائيين
onValue(specialistsRef, snapshot => {
  specialists = snapshot.val() || {};
  renderSpecialists();
});
// استماع لتغييرات بيانات المواعيد
onValue(appointmentsRef, snapshot => {
  appointments = snapshot.val() || {};
  renderAppointments();
});

// -------------------------------------------------
// 8) عرض جدول الأطفال (renderChildren)
// -------------------------------------------------
function renderChildren() {
  tableChildrenBody.innerHTML = "";
  const keys = Object.keys(children);
  keys.forEach((key, idx) => {
    const ch = children[key];
    let totalSessions = 0;
    if (ch.subtype === "24")      totalSessions = 24;
    else if (ch.subtype === "36") totalSessions = 36;
    else if (ch.subtype === "48") totalSessions = 48;
    else if (ch.subtype === "psych")    totalSessions = 1;
    else if (ch.subtype === "iq-test")  totalSessions = 1;
    else if (ch.subtype === "speech")   totalSessions = 1;

    const left = ch.sessionsLeft;
    const pausedText = ch.paused === "true" ? "متوقف" : "غير متوقف";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2">${idx + 1}</td>
      <td class="py-2">${ch.name}</td>
      <td class="py-2">
        ${
          ch.subtype === "24"    ? "24 جلسة" :
          ch.subtype === "36"    ? "36 جلسة" :
          ch.subtype === "48"    ? "48 جلسة" :
          ch.subtype === "psych" ? "جلسة نفسية" :
          ch.subtype === "iq-test"? "اختبار ذكاء" :
          ch.subtype === "speech"? "تخاطب منفردة" : ""
        }
      </td>
      <td class="py-2">${ch.startDate}</td>
      <td class="py-2">${totalSessions}</td>
      <td class="py-2">${left}</td>
      <td class="py-2">${pausedText}</td>
      <td class="py-2 space-x-3">
        <button onclick="openEditChild('${key}')" class="text-blue-500 hover:text-blue-700 text-sm">تعديل</button>
        <button onclick="deleteChild('${key}')" class="text-red-500 hover:text-red-700 text-sm">حذف</button>
      </td>`;
    tableChildrenBody.appendChild(tr);
  });
}

// -------------------------------------------------
// 9) فتح المودال لإضافة طفل أو تعديل بياناته
// -------------------------------------------------
function openAddChild() {
  editingChildKey = null;
  formModalChild.reset();
  modalChildSubtype.value = "24";
  modalChildStart.value   = new Date().toISOString().split("T")[0];
  modalChildPaused.value  = "false";
  modalChild.classList.remove("hidden");
}
window.openEditChild = function(key) {
  editingChildKey = key;
  const ch = children[key];
  modalChildName.value     = ch.name;
  modalChildSubtype.value  = ch.subtype;
  modalChildStart.value    = ch.startDate;
  modalChildPaused.value   = ch.paused;
  modalChild.classList.remove("hidden");
};
window.deleteChild = function(key) {
  if (!confirm("هل تريد حذف هذا الطفل؟")) return;
  remove(ref(db, "children/" + key));
  showToast("تم حذف بيانات الطفل", "info");
};
formModalChild.addEventListener("submit", (e) => {
  e.preventDefault();
  const name    = modalChildName.value.trim();
  const subtype = modalChildSubtype.value;
  const start   = modalChildStart.value;
  const paused  = modalChildPaused.value;

  let sessionsTotal, sessionsLeft;
  if (subtype === "24") {
    sessionsTotal = 24;
    sessionsLeft  = 8;
  }
  else if (subtype === "36") {
    sessionsTotal = 36;
    sessionsLeft  = 12;
  }
  else if (subtype === "48") {
    sessionsTotal = 48;
    sessionsLeft  = 16;
  }
  else if (subtype === "psych") {
    sessionsTotal = 1;
    sessionsLeft  = 1;
  }
  else if (subtype === "iq-test") {
    sessionsTotal = 1;
    sessionsLeft  = 1;
  }
  else if (subtype === "speech") {
    sessionsTotal = 1;
    sessionsLeft  = 1;
  }

  if (!name || !start) {
    showToast("يرجى تعبئة الاسم وتاريخ البدء", "error");
    return;
  }

  if (editingChildKey === null) {
    const newRef = push(childrenRef);
    set(newRef, {
      name,
      subtype,
      startDate: start,
      sessionsTotal,
      sessionsLeft,
      paused
    });
    showToast("تمت إضافة الطفل بنجاح", "success");
  } else {
    update(ref(db, "children/" + editingChildKey), {
      name,
      subtype,
      startDate: start,
      sessionsTotal,
      sessionsLeft,
      paused
    });
    showToast("تم تعديل بيانات الطفل", "success");
  }
  modalChild.classList.add("hidden");
});
modalChildCancel.addEventListener("click", () => {
  modalChild.classList.add("hidden");
});
btnAddChild.addEventListener("click", openAddChild);

// -------------------------------------------------
// 10) عرض جدول الأخصائيين (renderSpecialists)
// -------------------------------------------------
function renderSpecialists() {
  tableSpecialistsBody.innerHTML = "";
  const keys = Object.keys(specialists);
  keys.forEach((key, idx) => {
    const sp = specialists[key];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2">${idx + 1}</td>
      <td class="py-2">${sp.name}</td>
      <td class="py-2">${sp.email}</td>
      <td class="py-2">${sp.dept}</td>
      <td class="py-2">${sp.days.join("، ")}</td>
      <td class="py-2">${sp.times.join("، ")}</td>
      <td class="py-2 space-x-3">
        <button onclick="openEditSpecialist('${key}')" class="text-blue-500 hover:text-blue-700 text-sm">تعديل</button>
        <button onclick="deleteSpecialist('${key}')" class="text-red-500 hover:text-red-700 text-sm">حذف</button>
      </td>`;
    tableSpecialistsBody.appendChild(tr);
  });
}

// -------------------------------------------------
// 11) فتح المودال لإضافة أو تعديل أخصائي
// -------------------------------------------------
function openAddSpecialist() {
  editingSpecialistKey = null;
  formModalSpecialist.reset();
  modalSpecDept.value   = "تعديل سلوك";
  modalSpecialist.classList.remove("hidden");
}
window.openEditSpecialist = function(key) {
  editingSpecialistKey = key;
  const sp = specialists[key];
  modalSpecName.value  = sp.name;
  modalSpecEmail.value = sp.email;
  modalSpecDept.value  = sp.dept;
  modalSpecDays.value  = sp.days.join(",");
  modalSpecTimes.value = sp.times.join(",");
  modalSpecialist.classList.remove("hidden");
};
window.deleteSpecialist = function(key) {
  if (!confirm("هل تريد حذف هذا الأخصائي؟")) return;
  remove(ref(db, "specialists/" + key));
  showToast("تم حذف الأخصائي", "info");
};
formModalSpecialist.addEventListener("submit", (e) => {
  e.preventDefault();
  const name  = modalSpecName.value.trim();
  const email = modalSpecEmail.value.trim();
  const dept  = modalSpecDept.value;
  const days  = modalSpecDays.value.split(",").map(d => d.trim()).filter(d => d);
  const times = modalSpecTimes.value.split(",").map(t => t.trim()).filter(t => t);

  if (!name || !email || !dept || days.length === 0 || times.length === 0) {
    showToast("يرجى تعبئة جميع الحقول بشكل صحيح", "error");
    return;
  }

  if (editingSpecialistKey === null) {
    const newRef = push(specialistsRef);
    set(newRef, { name, email, dept, days, times });
    showToast("تمت إضافة الأخصائي بنجاح", "success");
  } else {
    update(ref(db, "specialists/" + editingSpecialistKey), { name, email, dept, days, times });
    showToast("تم تعديل بيانات الأخصائي", "success");
  }
  modalSpecialist.classList.add("hidden");
});
modalSpecCancel.addEventListener("click", () => {
  modalSpecialist.classList.add("hidden");
});
btnAddSpecialist.addEventListener("click", openAddSpecialist);

// -------------------------------------------------
// 12) ملء قائمة الأطفال في مودال الموعد
// -------------------------------------------------
function populateChildDropdown() {
  modalApptChild.innerHTML = `<option value="">-- اختر الطفل --</option>`;
  Object.keys(children).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = children[key].name;
    modalApptChild.appendChild(opt);
  });
}

// -------------------------------------------------
// 13) عرض جدول المواعيد (renderAppointments)
// -------------------------------------------------
function renderAppointments() {
  tableAppointmentsBody.innerHTML = "";
  const keys = Object.keys(appointments);
  keys.forEach((key, idx) => {
    const ap = appointments[key];
    const chName   = children[ap.childId]?.name || "(غير متوفر)";
    const specName = ap.spec || "-";
    const statusText = ap.status === "regular" ? "جاري"
                     : ap.status === "makeup"  ? "تعويض"
                     : ap.status === "missed"  ? "غاب"   : "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="py-2">${idx + 1}</td>
      <td class="py-2">${chName}</td>
      <td class="py-2">${ap.day}</td>
      <td class="py-2">${ap.time}</td>
      <td class="py-2">${ap.dept}</td>
      <td class="py-2">${specName}</td>
      <td class="py-2">${
        children[ap.childId]?.subtype === "24"    ? "24 جلسة" :
        children[ap.childId]?.subtype === "36"    ? "36 جلسة" :
        children[ap.childId]?.subtype === "48"    ? "48 جلسة" :
        children[ap.childId]?.subtype === "psych" ? "جلسة نفسية" :
        children[ap.childId]?.subtype === "iq-test"? "اختبار ذكاء" :
        children[ap.childId]?.subtype === "speech" ? "تخاطب منفردة" : ""
      }</td>
      <td class="py-2">${statusText}</td>
      <td class="py-2 space-x-1">
        <button onclick="openEditAppointment('${key}')" class="text-blue-500 hover:text-blue-700 text-sm">تعديل</button>
        <button onclick="deleteAppointment('${key}')" class="text-red-500 hover:text-red-700 text-sm">حذف</button>
        ${
          (ap.status === "regular")
            ? `<button onclick="markMissed('${key}')" class="text-yellow-500 hover:text-yellow-700 text-sm">غاب</button>`
            : ``
        }
        ${
          (ap.status === "missed")
            ? `<button onclick="openMakeupAppointment('${key}')" class="text-green-500 hover:text-green-700 text-sm">تعويض</button>`
            : ``
        }
      </td>`;
    tableAppointmentsBody.appendChild(tr);
  });
}

// -------------------------------------------------
// 14) فتح مودال إضافة / تعديل موعد
// -------------------------------------------------
function openAddAppointment() {
  editingAppointmentKey = null;
  formModalAppointment.reset();
  modalApptChild.value = "";
  modalApptDay.value   = "السبت";
  modalApptTime.value  = "1:00 - 1:40";
  modalApptDept.value  = "";
  modalApptSpec.value  = "";       // حقل نصي يدوياً
  modalApptType.value  = "regular";
  modalAppointment.classList.remove("hidden");
}
window.openEditAppointment = function(key) {
  editingAppointmentKey = key;
  const ap = appointments[key];
  modalApptChild.value = ap.childId;
  modalApptDay.value   = ap.day;
  modalApptTime.value  = ap.time;
  modalApptDept.value  = ap.dept;
  modalApptSpec.value  = ap.spec;  // نضع الاسم المكتوب مسبقًا
  modalApptType.value  = ap.status === "makeup" ? "makeup" : "regular";
  modalAppointment.classList.remove("hidden");
};
window.deleteAppointment = function(key) {
  if (!confirm("هل تريد حذف هذا الموعد؟")) return;
  const ap = appointments[key];
  if (ap.status === "regular") {
    const childKey = ap.childId;
    const ch = children[childKey];
    update(ref(db, "children/" + childKey), { sessionsLeft: ch.sessionsLeft + 1 });
  }
  remove(ref(db, "appointments/" + key));
  showToast("تم حذف الموعد", "info");
};

// معالجة حفظ الموعد
formModalAppointment.addEventListener("submit", (e) => {
  e.preventDefault();
  const childId = modalApptChild.value;
  const day     = modalApptDay.value;
  const time    = modalApptTime.value;
  const dept    = modalApptDept.value;
  const spec    = modalApptSpec.value.trim();   // نأخذ الاسم المكتوب يدويًا
  const status  = modalApptType.value; // "regular" أو "makeup"

  if (!childId || !dept || !spec) {
    showToast("يرجى اختيار الطفل وكتابة القسم والأخصائي", "error");
    return;
  }
  if (children[childId].paused === "true") {
    showToast("هذا الطفل متوقف مؤقتًا، لا يمكن حجز موعد.", "error");
    return;
  }
  if (status === "regular" && children[childId].sessionsLeft <= 0) {
    showToast("انتهت جلسات الطفل، يرجى تجديد الاشتراك أولًا.", "error");
    return;
  }

  if (status === "regular") {
    // نقص جلسة واحدة
    update(ref(db, "children/" + childId), {
      sessionsLeft: children[childId].sessionsLeft - 1
    });
  }

  if (editingAppointmentKey === null) {
    const newRef = push(appointmentsRef);
    set(newRef, {
      childId,
      day,
      time,
      dept,
      spec,              // الاسم المكتوب يدويًا
      status,
      createdAt: new Date().toISOString()
    });
    showToast("تمت إضافة الموعد بنجاح", "success");
  } else {
    const oldAp = appointments[editingAppointmentKey];
    // تعديل من "تعويض" إلى "عادي" → نقص جلسة
    if (oldAp.status === "makeup" && status === "regular") {
      update(ref(db, "children/" + childId), {
        sessionsLeft: children[childId].sessionsLeft - 1
      });
    }
    // تعديل من "عادي" إلى "تعويض" → استرجاع جلسة
    if (oldAp.status === "regular" && status === "makeup") {
      update(ref(db, "children/" + childId), {
        sessionsLeft: children[childId].sessionsLeft + 1
      });
    }
    update(ref(db, "appointments/" + editingAppointmentKey), {
      childId,
      day,
      time,
      dept,
      spec,
      status
    });
    showToast("تم تعديل الموعد", "success");
  }
  modalAppointment.classList.add("hidden");
});
modalApptCancel.addEventListener("click", () => {
  modalAppointment.classList.add("hidden");
});
btnAddAppointment.addEventListener("click", openAddAppointment);

// -------------------------------------------------
// 15) تسجيل غياب أو فتح تعويض
// -------------------------------------------------
window.markMissed = function(key) {
  update(ref(db, "appointments/" + key), { status: "missed" });
  showToast("تمّ تسجيل غياب الموعد. يمكنك الآن إضافة تعويض.", "info");
};
window.openMakeupAppointment = function(missedKey) {
  editingAppointmentKey = null;
  formModalAppointment.reset();
  const missedAppt = appointments[missedKey];
  modalApptChild.value = missedAppt.childId;
  modalApptDay.value   = missedAppt.day;
  modalApptTime.value  = missedAppt.time;
  modalApptDept.value  = missedAppt.dept;
  modalApptSpec.value  = missedAppt.spec;   // نستخدم الاسم المكتوب مسبقًا
  modalApptType.value  = "makeup";
  modalAppointment.classList.remove("hidden");
};

// -------------------------------------------------
// 16) إرسال جدول الأخصائي عبر EmailJS
// -------------------------------------------------
btnSendEmail.addEventListener("click", () => {
  const specName = sendFilterInput.value.trim();
  const emailTo  = emailSpecInput.value.trim();
  if (!specName || !emailTo) {
    showToast("يرجى إدخال اسم الأخصائي والبريد الإلكتروني", "error");
    return;
  }
  // اجمع جميع المواعيد حسب اسم الأخصائي (غير حساس لحالة الأحرف)
  const apptsForSpec = Object.values(appointments).filter(
    a => a.spec && a.spec.toLowerCase() === specName.toLowerCase()
  );
  if (apptsForSpec.length === 0) {
    showToast("لا توجد مواعيد لهذا الأخصائي", "error");
    return;
  }
  // أنشئ جدول HTML داخل البريد:
  let htmlTable = `
    <h3 style="background: var(--clr-header-bg); color: white; padding: 8px; border-radius: 4px; text-align: center;">
      جدول مواعيد ${specName}
    </h3>
    <table border="1" cellpadding="5" cellspacing="0"
           style="border-collapse:collapse; width:100%; direction:rtl; margin-top:8px; font-size:14px;">
      <tr style="background: #EBD8C7; font-weight: bold;">
        <th>الطفل</th><th>اليوم</th><th>الوقت</th><th>القسم</th><th>نوع الموعد</th>
      </tr>`;
  apptsForSpec.forEach(a => {
    const childName = children[a.childId]?.name || "(غير متوفر)";
    const statusTxt = a.status === "regular" ? "عادي" : "تعويض";
    htmlTable += `
      <tr>
        <td>${childName}</td><td>${a.day}</td><td>${a.time}</td><td>${a.dept}</td><td>${statusTxt}</td>
      </tr>`;
  });
  htmlTable += `</table><p style="margin-top:12px;">مع تحيات إدارة المركز</p>`;

  const templateParams = {
    to_email: emailTo,
    to_name : specName,
    schedule_html: htmlTable
  };

  // نمرّر Public Key كوسيط رابع (لضمان عمل الإرسال):
  emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    templateParams,
    EMAILJS_USER_ID
  )
    .then((response) => {
      console.log("EmailJS response:", response);
      showToast(`تم إرسال جدول ${specName} بنجاح`, "success");
    })
    .catch((error) => {
      console.error("Error sending EmailJS:", error);
      showToast("خطأ أثناء الإرسال، الرجاء التحقق من إعدادات EmailJS", "error");
    });
});

// -------------------------------------------------
// 17) التقارير الأسبوعية
// -------------------------------------------------
function renderReports() {
  reportExpiringChildren.innerHTML = "";
  reportPausedChildren.innerHTML   = "";
  for (const key in children) {
    const ch = children[key];
    if (ch.paused === "true") {
      const li = document.createElement("li");
      li.textContent = `${ch.name} (متوقف مؤقتًا)`;
      reportPausedChildren.appendChild(li);
    }
    if (ch.sessionsLeft <= 2 && ch.sessionsLeft > 0) {
      const li2 = document.createElement("li");
      li2.textContent = `${ch.name} (${ch.sessionsLeft} جلسات متبقية)`;
      reportExpiringChildren.appendChild(li2);
    }
    if (ch.sessionsLeft === 0) {
      const li3 = document.createElement("li");
      li3.textContent = `${ch.name} (انتهى اشتراكه؛ راجع للتجديد)`;
      reportExpiringChildren.appendChild(li3);
    }
  }
  if (!reportExpiringChildren.hasChildNodes()) {
    const li = document.createElement("li");
    li.textContent = "لا توجد اشتراكات على وشك الانتهاء.";
    reportExpiringChildren.appendChild(li);
  }
  if (!reportPausedChildren.hasChildNodes()) {
    const li = document.createElement("li");
    li.textContent = "لا يوجد أطفال متوقفون حاليًا.";
    reportPausedChildren.appendChild(li);
  }
}

// -------------------------------------------------
// 18) التهيئة عند تحميل الصفحة
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  deactivateAllTabs();
  tabChildrenSection.classList.remove("hidden");
  tabChildrenBtn.classList.add("btn-tab-active");
});
