export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // اختبار قاعدة البيانات
    if (url.pathname === "/api/health") {
      const result = await env.DB.prepare("SELECT 1 AS ok").first();

      return Response.json({
        success: true,
        database: result?.ok === 1
      });
    }

    // جلب الأقسام
    if (url.pathname === "/api/categories") {
      const result = await env.DB
        .prepare("SELECT * FROM categories WHERE active = 1 ORDER BY sort_order")
        .all();

      return Response.json(result.results);
    }

    // جلب الأصناف
    if (url.pathname === "/api/products") {
      const result = await env.DB
        .prepare("SELECT * FROM products WHERE active = 1 ORDER BY category, id")
        .all();

      return Response.json(result.results);
    }

    // باقي الموقع
    return env.ASSETS.fetch(request);
  }
};
