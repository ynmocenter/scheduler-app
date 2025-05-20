// app.js

// =======================================
// هذا الملف لا يعتمد على ES Modules، وإنما يستخدم firebase (v8) وemailjs (v2) المضمّنتين عبر <script> في الـ HTML.

// 1) الحصول على مراجع Firebase Realtime Database
var childrenRef     = firebase.database().ref("children");
var specialistsRef  = firebase.database().ref("specialists");
var appointmentsRef = firebase.database().ref("appointments");

// 2) المتغيّرات العالمية للاحتفاظ بالبيانات مؤقتاً
var children     = {};
var specialists  = {};
var appointments = {};

// 3) عناصر DOM
var toastContainer = document.getElementById("toast-container");

// تبويبات
var tabChildrenBtn      = document.getElementById("tab-children-btn");
var tabSpecialistsBtn   = document.getElementById("tab-specialists-btn");
var tabAppointmentsBtn  = document.getElementById("tab-appointments-btn");
var tabReportsBtn       = document.getElementById("tab-reports-btn");
var tabSendBtn          = document.getElementById("tab-send-btn");

// أقسام التبويبات
var tabChildrenSection      = document.getElementById("tab-children");
var tabSpecialistsSection   = document.getElementById("tab-specialists");
var tabAppointmentsSection  = document.getElementById("tab-appointments");
var tabReportsSection       = document.getElementById("tab-reports");
var tabSendSection          = document.getElementById("tab-send");

// جداول العرض
var tableChildrenBody     = document.getElementById("table-children-body");
var tableSpecialistsBody  = document.getElementById("table-specialists-body");
var tableAppointmentsBody = document.getElementById("table-appointments-body");

// التقارير
var reportExpiringChildren = document.getElementById("report-expiring-children");
var reportPausedChildren   = document.getElementById("report-paused-children");

// أزرار فتح المودالات
var btnAddChild       = document.getElementById("btn-add-child");
var btnAddSpecialist  = document.getElementById("btn-add-specialist");
var btnAddAppointment = document.getElementById("btn-add-appointment");
var btnSendEmail      = document.getElementById("btn-send-email");

// إرسال جدول الأخصائي
var sendFilterInput   = document.getElementById("send-filter-spec");
var emailSpecInput    = document.getElementById("email-spec");

// === مودال إضافة / تعديل طفل ===
var modalChild         = document.getElementById("modal-child");
var formModalChild     = document.getElementById("form-modal-child");
var modalChildName     = document.getElementById("modal-child-name");
var modalChildSubtype  = document.getElementById("modal-child-subtype");
var modalChildStart    = document.getElementById("modal-child-start");
var modalChildPaused   = document.getElementById("modal-child-paused");
var modalChildCancel   = document.getElementById("modal-child-cancel");
var editingChildKey    = null;

// === مودال إضافة / تعديل أخصائي ===
var modalSpecialist      = document.getElementById("modal-specialist");
var formModalSpecialist  = document.getElementById("form-modal-specialist");
var modalSpecName        = document.getElementById("modal-spec-name");
var modalSpecEmail       = document.getElementById("modal-spec-email");
var modalSpecDept        = document.getElementById("modal-spec-dept");
var modalSpecDays        = document.getElementById("modal-spec-days");
var modalSpecTimes       = document.getElementById("modal-spec-times");
var modalSpecCancel      = document.getElementById("modal-spec-cancel");
var editingSpecialistKey = null;

// === مودال إضافة / تعديل موعد ===
var modalAppointment       = document.getElementById("modal-appointment");
var formModalAppointment   = document.getElementById("form-modal-appointment");
var modalApptChild         = document.getElementById("modal-appt-child");
var modalApptDay           = document.getElementById("modal-appt-day");
var modalApptTime          = document.getElementById("modal-appt-time");
var modalApptDept          = document.getElementById("modal-appt-dept");
var modalApptSpec          = document.getElementById("modal-appt-spec");
var modalApptType          = document.getElementById("modal-appt-type");
var modalApptCancel        = document.getElementById("modal-appt-cancel");
var editingAppointmentKey  = null;


// -------------------------------------------------
// 4) دوال Toast لإظهار التنبيهات
// -------------------------------------------------
function showToast(message, type) {
  type = type || "success";
  var div = document.createElement("div");
  div.className = "toast toast-" + type;
  div.textContent = message;
  toastContainer.appendChild(div);
  setTimeout(function() {
    div.remove();
  }, 3000);
}


// -------------------------------------------------
// 5) إدارة التبويبات (Tabs)
// -------------------------------------------------
function deactivateAllTabs() {
  tabChildrenSection.classList.add("hidden");
  tabSpecialistsSection.classList.add("hidden");
  tabAppointmentsSection.classList.add("hidden");
  tabReportsSection.classList.add("hidden");
  tabSendSection.classList.add("hidden");

  tabChildrenBtn.classList.remove("btn-tab-active");
  tabSpecialistsBtn.classList.remove("btn-tab-active");
  tabAppointmentsBtn.classList.remove("btn-tab-active");
  tabReportsBtn.classList.remove("btn-tab-active");
  tabSendBtn.classList.remove("btn-tab-active");
}

tabChildrenBtn.addEventListener("click", function() {
  deactivateAllTabs();
  tabChildrenSection.classList.remove("hidden");
  tabChildrenBtn.classList.add("btn-tab-active");
});
tabSpecialistsBtn.addEventListener("click", function() {
  deactivateAllTabs();
  tabSpecialistsSection.classList.remove("hidden");
  tabSpecialistsBtn.classList.add("btn-tab-active");
});
tabAppointmentsBtn.addEventListener("click", function() {
  deactivateAllTabs();
  tabAppointmentsSection.classList.remove("hidden");
  tabAppointmentsBtn.classList.add("btn-tab-active");
});
tabReportsBtn.addEventListener("click", function() {
  deactivateAllTabs();
  tabReportsSection.classList.remove("hidden");
  tabReportsBtn.classList.add("btn-tab-active");
  renderReports();
});
tabSendBtn.addEventListener("click", function() {
  deactivateAllTabs();
  tabSendSection.classList.remove("hidden");
  tabSendBtn.classList.add("btn-tab-active");
});



// -------------------------------------------------
// 6) مراجع Firebase (Realtime Database listeners)
// -------------------------------------------------
childrenRef.on("value", function(snapshot) {
  children = snapshot.val() || {};
  renderChildren();
  populateChildDropdown();
});
specialistsRef.on("value", function(snapshot) {
  specialists = snapshot.val() || {};
  renderSpecialists();
});
appointmentsRef.on("value", function(snapshot) {
  appointments = snapshot.val() || {};
  renderAppointments();
});



// -------------------------------------------------
// 7) عرض جدول الأطفال (renderChildren)
// -------------------------------------------------
function renderChildren() {
  tableChildrenBody.innerHTML = "";
  var keys = Object.keys(children);
  keys.forEach(function(key, idx) {
    var ch = children[key];
    var totalSessions = 0;
    if (ch.subtype === "24")      totalSessions = 24;
    else if (ch.subtype === "36") totalSessions = 36;
    else if (ch.subtype === "48") totalSessions = 48;
    else if (ch.subtype === "psych")    totalSessions = 1;
    else if (ch.subtype === "iq-test")  totalSessions = 1;
    else if (ch.subtype === "speech")   totalSessions = 1;

    var left = ch.sessionsLeft;
    var pausedText = (ch.paused === "true") ? "متوقف" : "غير متوقف";

    var tr = document.createElement("tr");
    tr.innerHTML = ""
      + "<td class='py-2'>" + (idx + 1) + "</td>"
      + "<td class='py-2'>" + ch.name + "</td>"
      + "<td class='py-2'>" 
        + ( ch.subtype === "24"    ? "24 جلسة" :
            ch.subtype === "36"    ? "36 جلسة" :
            ch.subtype === "48"    ? "48 جلسة" :
            ch.subtype === "psych" ? "جلسة نفسية" :
            ch.subtype === "iq-test"? "اختبار ذكاء" :
            ch.subtype === "speech"? "تخاطب منفردة" : ""
          )
      + "</td>"
      + "<td class='py-2'>" + ch.startDate + "</td>"
      + "<td class='py-2'>" + totalSessions + "</td>"
      + "<td class='py-2'>" + left + "</td>"
      + "<td class='py-2'>" + pausedText + "</td>"
      + "<td class='py-2 space-x-3'>"
        + "<button onclick=\"openEditChild('" + key + "')\" class='text-blue-500 hover:text-blue-700 text-sm'>تعديل</button>"
        + " "
        + "<button onclick=\"deleteChild('" + key + "')\" class='text-red-500 hover:text-red-700 text-sm'>حذف</button>"
      + "</td>";
    tableChildrenBody.appendChild(tr);
  });
}



// -------------------------------------------------
// 8) فتح المودال لإضافة / تعديل طفل
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
  var ch = children[key];
  modalChildName.value    = ch.name;
  modalChildSubtype.value = ch.subtype;
  modalChildStart.value   = ch.startDate;
  modalChildPaused.value  = ch.paused;
  modalChild.classList.remove("hidden");
};
window.deleteChild = function(key) {
  if (!confirm("هل تريد حذف هذا الطفل؟")) return;
  childrenRef.child(key).remove();
  showToast("تم حذف بيانات الطفل", "info");
};
formModalChild.addEventListener("submit", function(e) {
  e.preventDefault();
  var name    = modalChildName.value.trim();
  var subtype = modalChildSubtype.value;
  var start   = modalChildStart.value;
  var paused  = modalChildPaused.value;

  var sessionsTotal, sessionsLeft;
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
    var newRef = childrenRef.push();
    newRef.set({
      name: name,
      subtype: subtype,
      startDate: start,
      sessionsTotal: sessionsTotal,
      sessionsLeft: sessionsLeft,
      paused: paused
    });
    showToast("تمت إضافة الطفل بنجاح", "success");
  } else {
    childrenRef.child(editingChildKey).update({
      name: name,
      subtype: subtype,
      startDate: start,
      sessionsTotal: sessionsTotal,
      sessionsLeft: sessionsLeft,
      paused: paused
    });
    showToast("تم تعديل بيانات الطفل", "success");
  }
  modalChild.classList.add("hidden");
});
modalChildCancel.addEventListener("click", function() {
  modalChild.classList.add("hidden");
});
btnAddChild.addEventListener("click", openAddChild);



// -------------------------------------------------
// 9) عرض جدول الأخصائيين (renderSpecialists)
// -------------------------------------------------
function renderSpecialists() {
  tableSpecialistsBody.innerHTML = "";
  var keys = Object.keys(specialists);
  keys.forEach(function(key, idx) {
    var sp = specialists[key];
    var tr = document.createElement("tr");
    tr.innerHTML = ""
      + "<td class='py-2'>" + (idx + 1) + "</td>"
      + "<td class='py-2'>" + sp.name + "</td>"
      + "<td class='py-2'>" + sp.email + "</td>"
      + "<td class='py-2'>" + sp.dept + "</td>"
      + "<td class='py-2'>" + sp.days.join("، ") + "</td>"
      + "<td class='py-2'>" + sp.times.join("، ") + "</td>"
      + "<td class='py-2 space-x-3'>"
        + "<button onclick=\"openEditSpecialist('" + key + "')\" class='text-blue-500 hover:text-blue-700 text-sm'>تعديل</button>"
        + " "
        + "<button onclick=\"deleteSpecialist('" + key + "')\" class='text-red-500 hover:text-red-700 text-sm'>حذف</button>"
      + "</td>";
    tableSpecialistsBody.appendChild(tr);
  });
}



// -------------------------------------------------
// 10) فتح المودال لإضافة / تعديل أخصائي
// -------------------------------------------------
function openAddSpecialist() {
  editingSpecialistKey = null;
  formModalSpecialist.reset();
  modalSpecDept.value   = "تعديل سلوك";
  modalSpecialist.classList.remove("hidden");
}
window.openEditSpecialist = function(key) {
  editingSpecialistKey = key;
  var sp = specialists[key];
  modalSpecName.value  = sp.name;
  modalSpecEmail.value = sp.email;
  modalSpecDept.value  = sp.dept;
  modalSpecDays.value  = sp.days.join(",");
  modalSpecTimes.value = sp.times.join(",");
  modalSpecialist.classList.remove("hidden");
};
window.deleteSpecialist = function(key) {
  if (!confirm("هل تريد حذف هذا الأخصائي؟")) return;
  specialistsRef.child(key).remove();
  showToast("تم حذف الأخصائي", "info");
};
formModalSpecialist.addEventListener("submit", function(e) {
  e.preventDefault();
  var name  = modalSpecName.value.trim();
  var email = modalSpecEmail.value.trim();
  var dept  = modalSpecDept.value;
  var days  = modalSpecDays.value.split(",").map(function(d){ return d.trim(); }).filter(function(d){ return d; });
  var times = modalSpecTimes.value.split(",").map(function(t){ return t.trim(); }).filter(function(t){ return t; });

  if (!name || !email || !dept || days.length === 0 || times.length === 0) {
    showToast("يرجى تعبئة جميع الحقول بشكل صحيح", "error");
    return;
  }

  if (editingSpecialistKey === null) {
    var newRef = specialistsRef.push();
    newRef.set({
      name: name,
      email: email,
      dept: dept,
      days: days,
      times: times
    });
    showToast("تمت إضافة الأخصائي بنجاح", "success");
  } else {
    specialistsRef.child(editingSpecialistKey).update({
      name: name,
      email: email,
      dept: dept,
      days: days,
      times: times
    });
    showToast("تم تعديل بيانات الأخصائي", "success");
  }
  modalSpecialist.classList.add("hidden");
});
modalSpecCancel.addEventListener("click", function() {
  modalSpecialist.classList.add("hidden");
});
btnAddSpecialist.addEventListener("click", openAddSpecialist);



// -------------------------------------------------
// 11) ملء قائمة الأطفال في مودال الموعد
// -------------------------------------------------
function populateChildDropdown() {
  modalApptChild.innerHTML = "<option value=''>-- اختر الطفل --</option>";
  Object.keys(children).forEach(function(key) {
    var opt = document.createElement("option");
    opt.value = key;
    opt.textContent = children[key].name;
    modalApptChild.appendChild(opt);
  });
}



// -------------------------------------------------
// 12) عرض جدول المواعيد (renderAppointments)
// -------------------------------------------------
function renderAppointments() {
  tableAppointmentsBody.innerHTML = "";
  var keys = Object.keys(appointments);
  keys.forEach(function(key, idx) {
    var ap = appointments[key];
    var chName   = children[ap.childId] ? children[ap.childId].name : "(غير متوفر)";
    var specName = ap.spec || "-";
    var statusText = (ap.status === "regular") ? "جاري" 
                   : (ap.status === "makeup")  ? "تعويض" 
                   : (ap.status === "missed")  ? "غاب"   : "";

    var subtypeText = "";
    if (children[ap.childId]) {
      var st = children[ap.childId].subtype;
      subtypeText = (st === "24")    ? "24 جلسة"
                  : (st === "36")    ? "36 جلسة"
                  : (st === "48")    ? "48 جلسة"
                  : (st === "psych") ? "جلسة نفسية"
                  : (st === "iq-test")? "اختبار ذكاء"
                  : (st === "speech")? "تخاطب منفردة" : "";
    }

    var tr = document.createElement("tr");
    tr.innerHTML = ""
      + "<td class='py-2'>" + (idx + 1) + "</td>"
      + "<td class='py-2'>" + chName + "</td>"
      + "<td class='py-2'>" + ap.day + "</td>"
      + "<td class='py-2'>" + ap.time + "</td>"
      + "<td class='py-2'>" + ap.dept + "</td>"
      + "<td class='py-2'>" + specName + "</td>"
      + "<td class='py-2'>" + subtypeText + "</td>"
      + "<td class='py-2'>" + statusText + "</td>"
      + "<td class='py-2 space-x-1'>"
        + "<button onclick=\"openEditAppointment('" + key + "')\" class='text-blue-500 hover:text-blue-700 text-sm'>تعديل</button>"
        + " "
        + "<button onclick=\"deleteAppointment('" + key + "')\" class='text-red-500 hover:text-red-700 text-sm'>حذف</button>"
        + (ap.status === "regular"
            ? " <button onclick=\"markMissed('" + key + "')\" class='text-yellow-500 hover:text-yellow-700 text-sm'>غاب</button>"
            : "" )
        + (ap.status === "missed"
            ? " <button onclick=\"openMakeupAppointment('" + key + "')\" class='text-green-500 hover:text-green-700 text-sm'>تعويض</button>"
            : "" )
      + "</td>";
    tableAppointmentsBody.appendChild(tr);
  });
}



// -------------------------------------------------
// 13) فتح المودال لإضافة / تعديل موعد
// -------------------------------------------------
function openAddAppointment() {
  editingAppointmentKey = null;
  formModalAppointment.reset();
  modalApptChild.value  = "";
  modalApptDay.value    = "السبت";
  modalApptTime.value   = "1:00 - 1:40";
  modalApptDept.value   = "";
  modalApptSpec.value   = "";
  modalApptType.value   = "regular";
  modalAppointment.classList.remove("hidden");
}
window.openEditAppointment = function(key) {
  editingAppointmentKey = key;
  var ap = appointments[key];
  modalApptChild.value = ap.childId;
  modalApptDay.value   = ap.day;
  modalApptTime.value  = ap.time;
  modalApptDept.value  = ap.dept;
  modalApptSpec.value  = ap.spec;
  modalApptType.value  = (ap.status === "makeup") ? "makeup" : "regular";
  modalAppointment.classList.remove("hidden");
};
window.deleteAppointment = function(key) {
  if (!confirm("هل تريد حذف هذا الموعد؟")) return;
  var ap = appointments[key];
  if (ap.status === "regular") {
    var childKey = ap.childId;
    var ch = children[childKey];
    database.ref("children/" + childKey).update({
      sessionsLeft: ch.sessionsLeft + 1
    });
  }
  appointmentsRef.child(key).remove();
  showToast("تم حذف الموعد", "info");
};

// معالجة حفظ الموعد
formModalAppointment.addEventListener("submit", function(e) {
  e.preventDefault();
  var childId = modalApptChild.value;
  var day     = modalApptDay.value;
  var time    = modalApptTime.value;
  var dept    = modalApptDept.value;
  var spec    = modalApptSpec.value.trim();
  var status  = modalApptType.value; // "regular" أو "makeup"

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
    database.ref("children/" + childId).update({
      sessionsLeft: children[childId].sessionsLeft - 1
    });
  }

  if (editingAppointmentKey === null) {
    var newRef = appointmentsRef.push();
    newRef.set({
      childId: childId,
      day: day,
      time: time,
      dept: dept,
      spec: spec,
      status: status,
      createdAt: new Date().toISOString()
    });
    showToast("تمت إضافة الموعد بنجاح", "success");
  } else {
    var oldAp = appointments[editingAppointmentKey];
    // تعديل من "تعويض" إلى "عادي" → نقص جلسة
    if (oldAp.status === "makeup" && status === "regular") {
      database.ref("children/" + childId).update({
        sessionsLeft: children[childId].sessionsLeft - 1
      });
    }
    // تعديل من "عادي" إلى "تعويض" → استرجاع جلسة
    if (oldAp.status === "regular" && status === "makeup") {
      database.ref("children/" + childId).update({
        sessionsLeft: children[childId].sessionsLeft + 1
      });
    }
    appointmentsRef.child(editingAppointmentKey).update({
      childId: childId,
      day: day,
      time: time,
      dept: dept,
      spec: spec,
      status: status
    });
    showToast("تم تعديل الموعد", "success");
  }
  modalAppointment.classList.add("hidden");
});
modalApptCancel.addEventListener("click", function() {
  modalAppointment.classList.add("hidden");
});
btnAddAppointment.addEventListener("click", openAddAppointment);

// -------------------------------------------------
// 14) تسجيل غياب أو فتح تعويض
// -------------------------------------------------
window.markMissed = function(key) {
  appointmentsRef.child(key).update({ status: "missed" });
  showToast("تمّ تسجيل غياب الموعد. يمكنك الآن إضافة تعويض.", "info");
};
window.openMakeupAppointment = function(missedKey) {
  editingAppointmentKey = null;
  formModalAppointment.reset();
  var missedAppt = appointments[missedKey];
  modalApptChild.value = missedAppt.childId;
  modalApptDay.value   = missedAppt.day;
  modalApptTime.value  = missedAppt.time;
  modalApptDept.value  = missedAppt.dept;
  modalApptSpec.value  = missedAppt.spec;
  modalApptType.value  = "makeup";
  modalAppointment.classList.remove("hidden");
};

// -------------------------------------------------
// 15) إرسال جدول الأخصائي عبر EmailJS
// -------------------------------------------------
btnSendEmail.addEventListener("click", function() {
  var specName = sendFilterInput.value.trim();
  var emailTo  = emailSpecInput.value.trim();
  if (!specName || !emailTo) {
    showToast("يرجى إدخال اسم الأخصائي والبريد الإلكتروني", "error");
    return;
  }

  // اجمع جميع المواعيد حسب اسم الأخصائي (غير حساس لحالة الأحرف)
  var apptsForSpec = [];
  Object.keys(appointments).forEach(function(key) {
    var a = appointments[key];
    if (a.spec && a.spec.toLowerCase() === specName.toLowerCase()) {
      apptsForSpec.push(a);
    }
  });

  if (apptsForSpec.length === 0) {
    showToast("لا توجد مواعيد لهذا الأخصائي", "error");
    return;
  }

  // أنشئ جدول HTML داخل البريد:
  var htmlTable = ""
    + "<h3 style=\"background: var(--clr-header-bg); color: white; padding: 8px; border-radius: 4px; text-align: center;\">"
    + "جدول مواعيد " + specName
    + "</h3>"
    + "<table border=\"1\" cellpadding=\"5\" cellspacing=\"0\""
    + " style=\"border-collapse:collapse; width:100%; direction:rtl; margin-top:8px; font-size:14px;\">"
    + "<tr style=\"background: #EBD8C7; font-weight: bold;\">"
    + "<th>الطفل</th><th>اليوم</th><th>الوقت</th><th>القسم</th><th>نوع الموعد</th>"
    + "</tr>";

  apptsForSpec.forEach(function(a) {
    var childName = children[a.childId] ? children[a.childId].name : "(غير متوفر)";
    var statusTxt = (a.status === "regular") ? "عادي" : "تعويض";
    htmlTable += ""
      + "<tr>"
      + "<td>" + childName + "</td>"
      + "<td>" + a.day + "</td>"
      + "<td>" + a.time + "</td>"
      + "<td>" + a.dept + "</td>"
      + "<td>" + statusTxt + "</td>"
      + "</tr>";
  });

  htmlTable += "</table><p style=\"margin-top:12px;\">مع تحيات إدارة المركز</p>";

  // إعداد متغيرات القالب
  var templateParams = {
    to_email: emailTo,
    to_name : specName,
    schedule_html: htmlTable
  };

  // إرسال عبر EmailJS
  emailjs.send("service_cuzf74k", "template_b04f8pi", templateParams)
    .then(function(response) {
      console.log("EmailJS response:", response);
      showToast("تم إرسال جدول " + specName + " بنجاح", "success");
    }, function(error) {
      console.error("Error sending EmailJS:", error);
      showToast("خطأ أثناء الإرسال، الرجاء التحقق من إعدادات EmailJS", "error");
    });
});



// -------------------------------------------------
// 16) التقارير الأسبوعية
// -------------------------------------------------
function renderReports() {
  reportExpiringChildren.innerHTML = "";
  reportPausedChildren.innerHTML   = "";

  Object.keys(children).forEach(function(key) {
    var ch = children[key];
    if (ch.paused === "true") {
      var li = document.createElement("li");
      li.textContent = ch.name + " (متوقف مؤقتًا)";
      reportPausedChildren.appendChild(li);
    }
    if (ch.sessionsLeft <= 2 && ch.sessionsLeft > 0) {
      var li2 = document.createElement("li");
      li2.textContent = ch.name + " (" + ch.sessionsLeft + " جلسات متبقية)";
      reportExpiringChildren.appendChild(li2);
    }
    if (ch.sessionsLeft === 0) {
      var li3 = document.createElement("li");
      li3.textContent = ch.name + " (انتهى اشتراكه؛ راجع للتجديد)";
      reportExpiringChildren.appendChild(li3);
    }
  });

  if (!reportExpiringChildren.hasChildNodes()) {
    var li = document.createElement("li");
    li.textContent = "لا توجد اشتراكات على وشك الانتهاء.";
    reportExpiringChildren.appendChild(li);
  }
  if (!reportPausedChildren.hasChildNodes()) {
    var li = document.createElement("li");
    li.textContent = "لا يوجد أطفال متوقفون حاليًا.";
    reportPausedChildren.appendChild(li);
  }
}



// -------------------------------------------------
// 17) التهيئة عند تحميل الصفحة
// -------------------------------------------------
window.addEventListener("DOMContentLoaded", function() {
  deactivateAllTabs();
  tabChildrenSection.classList.remove("hidden");
  tabChildrenBtn.classList.add("btn-tab-active");
});
