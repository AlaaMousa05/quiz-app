import type { TranslationKey } from "./en.js";

export const ar: Record<TranslationKey, string> = {
  "app.title": "تطبيق الاختبارات",
  "app.tagline": "مركز نور التعليمي",

  "nav.logout": "تسجيل الخروج",

  "login.title": "تسجيل الدخول",
  "login.usernameLabel": "اسم المستخدم",
  "login.passwordLabel": "كلمة المرور",
  "login.submit": "تسجيل الدخول",
  "login.submitting": "جارٍ تسجيل الدخول…",

  "auth.invalidCredentials": "اسم المستخدم أو كلمة المرور غير صحيحة.",
  "auth.deactivated": "تم إيقاف هذا الحساب.",

  "error.unauthorized": "يرجى تسجيل الدخول للمتابعة.",
  "error.forbidden": "لا تملك صلاحية الوصول إلى هذه الصفحة.",
  "error.notFound": "تعذر العثور على ذلك.",
  "error.validation": "يرجى مراجعة ما أدخلته والمحاولة مرة أخرى.",
  "error.conflict": "لا يمكن تنفيذ ذلك الآن.",
  "error.deadlinePassed": "لقد انتهى الموعد النهائي لذلك.",
  "error.attemptFinalized": "تم إنهاء هذه المحاولة بالفعل.",
  "error.generic": "حدث خطأ ما. حاول مرة أخرى.",

  "role.student.home": "الصفحة الرئيسية للطالب",
  "role.teacher.home": "الصفحة الرئيسية للمعلم",
  "role.admin.home": "الصفحة الرئيسية للمشرف",

  "language.toggle": "English",
  "common.loading": "جارٍ التحميل…",
};
