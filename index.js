const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key" };

async function ensureDb(env) {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS menu_items (id TEXT PRIMARY KEY, category TEXT NOT NULL, name TEXT NOT NULL, description TEXT DEFAULT '', price REAL NOT NULL DEFAULT 0, image TEXT DEFAULT '', active INTEGER NOT NULL DEFAULT 1, sort_order INTEGER NOT NULL DEFAULT 0)`).run();
  const row = await env.DB.prepare(`SELECT COUNT(*) AS n FROM menu_items`).first();
  if (!row || Number(row.n) === 0) {
    const seed = await fetch(new URL('/data/menu.json', 'https://' + 'assets.local'));
    if (seed.ok) {
      const data = await seed.json();
      const rows = Array.isArray(data) ? data : (data.items || []);
      for (let i=0;i<rows.length;i++) {
        const x=rows[i];
        await env.DB.prepare(`INSERT OR IGNORE INTO menu_items (id,category,name,description,price,image,active,sort_order) VALUES (?,?,?,?,?,?,?,?)`)
          .bind(String(x.id ?? crypto.randomUUID()), x.category||'أصناف', x.name||'', x.description||'', Number(x.price||0), x.image||'', x.active===false?0:1, i).run();
      }
    }
  }
}

function json(data, status=200) { return new Response(JSON.stringify(data), {status, headers:{...CORS,"Content-Type":"application/json; charset=utf-8"}}); }
function authorized(request, env) { return !!env.ADMIN_KEY && request.headers.get('X-Admin-Key') === env.ADMIN_KEY; }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null,{headers:CORS});
    if (url.pathname.startsWith('/api/')) {
      if (!env.DB) return json({error:'D1 غير مربوط بعد. أضف Binding باسم DB من إعدادات Worker.'},500);
      try {
        await ensureDb(env);
        if (url.pathname === '/api/menu' && request.method === 'GET') {
          const {results}=await env.DB.prepare(`SELECT * FROM menu_items WHERE active=1 ORDER BY sort_order,id`).all();
          const grouped={}; for(const r of results){ (grouped[r.category] ||= []).push({id:r.id,name:r.name,price:r.price,image:r.image,description:r.description}); }
          return json(grouped);
        }
        if (url.pathname === '/api/admin/menu' && request.method === 'GET') {
          if(!authorized(request,env)) return json({error:'Unauthorized'},401);
          const {results}=await env.DB.prepare(`SELECT * FROM menu_items ORDER BY sort_order,id`).all(); return json(results);
        }
        if (!authorized(request,env)) return json({error:'Unauthorized'},401);
        if (url.pathname === '/api/admin/menu' && request.method === 'POST') {
          const x=await request.json(); const id=String(x.id||crypto.randomUUID());
          await env.DB.prepare(`INSERT OR REPLACE INTO menu_items (id,category,name,description,price,image,active,sort_order) VALUES (?,?,?,?,?,?,?,?)`)
            .bind(id,x.category||'أصناف',x.name||'',x.description||'',Number(x.price||0),x.image||'',x.active===false?0:1,Number(x.sort_order||0)).run();
          return json({ok:true,id});
        }
        if (url.pathname.startsWith('/api/admin/menu/') && request.method === 'DELETE') {
          const id=url.pathname.split('/').pop(); await env.DB.prepare(`DELETE FROM menu_items WHERE id=?`).bind(id).run(); return json({ok:true});
        }
        if (url.pathname.startsWith('/api/admin/menu/') && request.method === 'PUT') {
          const id=url.pathname.split('/').pop(); const x=await request.json();
          await env.DB.prepare(`UPDATE menu_items SET category=?,name=?,description=?,price=?,image=?,active=?,sort_order=? WHERE id=?`)
            .bind(x.category||'أصناف',x.name||'',x.description||'',Number(x.price||0),x.image||'',x.active===false?0:1,Number(x.sort_order||0),id).run(); return json({ok:true});
        }
        return json({error:'Not found'},404);
      } catch(e) { return json({error:e.message},500); }
    }
    return env.ASSETS.fetch(request);
  }
};
