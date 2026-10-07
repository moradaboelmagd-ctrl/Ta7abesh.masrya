export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      const result = await env.DB.prepare("SELECT 1 AS ok").first();

      return Response.json({
        success: true,
        database: result?.ok === 1
      });
    }

    if (url.pathname === "/api/categories") {
      const result = await env.DB
        .prepare("SELECT * FROM categories WHERE active = 1 ORDER BY sort_order")
        .all();

      return Response.json(result.results);
    }

    if (url.pathname === "/api/products") {
      const result = await env.DB
        .prepare("SELECT * FROM products WHERE active = 1 ORDER BY category, id")
        .all();

      return Response.json(result.results);
    }

    if (url.pathname === "/api/admin/products" && request.method === "POST") {
      const data = await request.json();

      if (!data.name || !data.category || !data.price) {
        return Response.json(
          { success: false, error: "بيانات ناقصة" },
          { status: 400 }
        );
      }

      await env.DB.prepare(`
        INSERT INTO products
        (name, category, price, description, active)
        VALUES (?, ?, ?, ?, 1)
      `)
        .bind(
          data.name,
          data.category,
          Number(data.price),
          data.description || ""
        )
        .run();

      return Response.json({ success: true });
    }

    if (url.pathname === "/admin") {
      const result = await env.DB
        .prepare("SELECT * FROM products ORDER BY category, id")
        .all();

      const products = result.results || [];

      const productHtml = products.map(function (p) {
        return (
          '<div class="product">' +
          '<b>' + p.name + '</b>' +
          '<div>' + p.category + '</div>' +
          '<strong>' + p.price + ' ريال</strong>' +
          '</div>'
        );
      }).join("");

      const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>تحابيش مصرية - لوحة التحكم</title>
<style>
body{
  font-family:Arial,sans-serif;
  background:#f7f3ee;
  margin:0;
  padding:20px;
  color:#333
}
h1{color:#b51f2a}
.box{
  background:#fff;
  padding:18px;
  border-radius:15px;
  margin-bottom:15px
}
input,button{
  width:100%;
  box-sizing:border-box;
  padding:12px;
  margin:6px 0;
  border:1px solid #ddd;
  border-radius:10px;
  font-size:16px
}
button{
  background:#b51f2a;
  color:#fff;
  border:0;
  font-weight:bold
}
.product{
  border-top:1px solid #eee;
  padding:15px 0
}
.product strong{
  display:block;
  color:#b51f2a;
  margin-top:5px
}
</style>
</head>
<body>

<h1>🍴 تحابيش مصرية</h1>
<h2>لوحة التحكم</h2>

<div class="box">
<h3>إضافة صنف جديد</h3>

<input id="name" placeholder="اسم الصنف">
<input id="category" placeholder="القسم">
<input id="price" type="number" placeholder="السعر">
<input id="description" placeholder="الوصف">

<button id="add">إضافة الصنف</button>
</div>

<div class="box">
<h3>الأصناف الحالية</h3>
${productHtml || "لا توجد أصناف حالياً"}
</div>

<script>
document.getElementById("add").addEventListener("click", async function(){

  const name = document.getElementById("name").value.trim();
  const category = document.getElementById("category").value.trim();
  const price = Number(document.getElementById("price").value);
  const description = document.getElementById("description").value.trim();

  if (!name || !category || !price) {
    alert("اكتب اسم الصنف والقسم والسعر");
    return;
  }

  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: name,
      category: category,
      price: price,
      description: description
    })
  });

  const data = await response.json();

  if (data.success) {
    alert("تم إضافة الصنف بنجاح");
    location.reload();
  } else {
    alert(data.error || "حدث خطأ");
  }
});
</script>

</body>
</html>
`;

      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    return env.ASSETS.fetch(request);
  }
};
