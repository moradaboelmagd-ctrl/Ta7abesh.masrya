تحابيش مصرية — نسخة Worker + Static Assets + D1

1) هذه النسخة ليست للرفع داخل Worker Static Assets فقط. يجب إنشاء Worker حقيقي يحتوي على Worker script + Static Assets.
2) بعد إنشاء Worker، أنشئ D1 database باسم: tehabish-menu
3) أضف D1 Binding باسم: DB واربطه بقاعدة tehabish-menu.
4) أضف Secret باسم: ADMIN_KEY وضع فيه كلمة مرور طويلة خاصة بك.
5) انشر المشروع.
6) افتح /admin/ لإنشاء/تعديل الأصناف عبر API بعد إضافة واجهة الإدارة المناسبة.

ملاحظة: wrangler.jsonc يحتوي REPLACE_WITH_YOUR_D1_DATABASE_ID ويجب استبداله بمعرف قاعدة D1 إذا كان النشر عبر Wrangler/Git.
