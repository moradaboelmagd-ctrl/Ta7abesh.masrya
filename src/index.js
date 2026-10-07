export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // =========================
    // اختبار قاعدة البيانات
    // =========================
    if (url.pathname === "/api/health") {
      const result = await env.DB.prepare("SELECT 1 AS ok").first();

      return Response.json({
        success: true,
        database: result?.ok === 1
      });
    }

    // =========================
    // الأقسام
    // =========================
    if (url.pathname === "/api/categories") {
      const result = await env.DB
        .prepare(
          "SELECT * FROM categories WHERE active = 1 ORDER BY sort_order"
        )
        .all();

      return Response.json(result.results);
    }

    // =========================
    // المنتجات
    // =========================
    if (url.pathname === "/api/products") {
      const result = await env.DB
        .prepare(
          "SELECT * FROM products WHERE active = 1 ORDER BY category, id"
        )
        .all();

      return Response.json(result.results);
    }

    // =========================
    // لوحة التحكم
    // =========================
    if (url.pathname === "/admin") {
      return new Response(`
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
  color:#333;
}
h1{color:#b51f2a}
.box{
  background:white;
  padding:18px;
  border-radius:15px;
  margin-bottom:15px;
}
input,select,button{
  width:100%;
  box-sizing:border-box;
  padding:12px;
  margin:6px 0;
  border:1px solid #ddd;
  border-radius:10px;
  font-size:16px;
}
button{
  background:#b51f2a;
  color:white;
  border:0;
  font-weight:bold;
}
.product{
  border-top:1px solid #eee;
  padding:15px 0;
}
.price{font-weight:bold;color:#b51f2a}
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

  <button onclick="addProduct()">إضافة الصنف</button>
</div>

<div class="box">
  <h3>الأصناف</h3>
  <div id="products">جاري التحميل...</div>
</div>

<script>
async function loadProducts(){
  const res = await fetch('/api/products');
  const products = await res.json();

  const box = document.getElementById('products');

  if(!products.length){
    box.innerHTML = 'لا توجد أصناف حالياً';
    return;
  }

  box.innerHTML = products.map(p => `
    <div class="product">
      <b>${p.name}</b>
      <div>${p.category}</div>
      <div class="price">${p.price} ريال</div>
      ${p.description ? `<div>${p.description}</div>` : ''}
    </div>
  `).join('');
}

async function addProduct(){
  const name = document.getElementById('name').value.trim();
  const category = document.getElementById('category').value.trim();
  const price = Number(document.getElementById('price').value);
  const description = document.getElementById('description').value.trim();

  if(!name || !category || !price){
    alert('اكتب اسم الصنف والقسم والسعر');
    return;
  }

  const res = await fetch('/api/admin/products', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      name,
      category,
      price,
      description
    })
  });

  const data = await res.json();

  if(data.success){
    alert('تم إضافة الصنف');
    location.reload();
  }else{
    alert(data.error || 'حدث خطأ');
  }
}

loadProducts();
</script>

</body>
</html>
      `, {
        headers: {
          "content-type": "text/html; charset=UTF-8"
        }
      });
    }

    // =========================
    // إضافة منتج
    // =========================
    if (
      url.pathname === "/api/admin/products" &&
      request.method === "POST"
    ) {
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

    // =========================
    // الموقع الأساسي
    // =========================
    return env.ASSETS.fetch(request);
  }
};
