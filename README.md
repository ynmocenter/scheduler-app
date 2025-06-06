# نظام مواعيد المركز (Scheduler App)

هذا المشروع عبارة عن **نموذج إلكتروني متكامل لإدارة مواعيد مركز** (أطفال، أخصائيين، جلسات، اشتراكات، تعويضات وتقاارير أسبوعية)، مع إمكانية:
- إضافة/تعديل/حذف أطفال وجدولة اشتراكاتهم.
- إضافة/تعديل/حذف الأخصائيين وتحديد أيامهم وفترات عملهم.
- حجز مواعيد (Regular) وخصم جلسات من الاشتراك.
- تسجيل غياب (Missed) وإضافة مواعيد تعويضية (Make-Up) دون حذف الموعد الأساسي.
- تقارير أسبوعية عن من أوشك اشتراكه على الانتهاء ومن في حالة توقف مؤقت.
- إرسال جدول مواعيد كل أخصائي بالبريد الإلكتروني (HTML) باستخدام EmailJS.

---

## 3. خطوات الإعداد والتشغيل المحلية

1. **استنساخ المستودع** (Clone) أو تحميله:
   ```bash
   git clone https://github.com/YourUsername/scheduler_app.git
   cd scheduler_app
