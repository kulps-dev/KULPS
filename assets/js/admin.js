/* KULPS Admin App — localStorage демо (готов к замене на реальный API) */
const $  = (s,p=document)=>p.querySelector(s);
const $$ = (s,p=document)=>p.querySelectorAll(s);
const Store = { get(k,d){ try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch{return d} }, set(k,v){localStorage.setItem(k,JSON.stringify(v))} };
const toast = m => { const t=$('#toast'); t.textContent=m; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1500); };

/* ---- Mock DB ---- */
const DB = {
  services: Store.get('admin_services', [
    {id:1, title:'Внедрение CRM', descr:'Под ключ. Интеграции, воронки, отчёты.', price: 'от 99 000 ₽', icon:'fa fa-network-wired', status:'active', features:['Аналитика','Сквозные воронки']},
  ]),
  posts: Store.get('admin_posts', [
    {id:1, title:'Как выбрать CRM', slug:'how-to-choose-crm', status:'published', cover:'', tags:['crm'], meta:{title:'Как выбрать CRM', desc:'Гайд для бизнеса', og:''}, content:'Текст статьи...'},
  ]),
  products: Store.get('admin_products', [
    {id:1, title:'Подписка ERP (мес.)', sku:'ERP-M-001', price:5200, stock:100, status:'active', category:'Подписки', images:[] },
  ]),
  orders: Store.get('admin_orders', [
    {id:'MSK-000345', date:'2025-01-01', email:'ivan@example.com', total:12490, status:'paid', items:[{name:'Лицензия CRM', qty:1, price:9990},{name:'Внедрение (блок 1)', qty:1, price:2500}]},
    {id:'MSK-000346', date:'2025-01-04', email:'anna@example.com', total:5200, status:'shipped', items:[{name:'Подписка ERP (мес.)', qty:1, price:5200}]},
  ]),
  customers: Store.get('admin_customers', [
    {id:1, name:'Иван Иванов', email:'ivan@example.com', phone:'+7 900 000-00-00', note:'VIP', status:'active'},
    {id:2, name:'Анна Петрова', email:'anna@example.com', phone:'+7 912 111-22-33', note:'', status:'active'},
  ]),
  messages: Store.get('admin_messages', [
    {id:1, userId:1, userName:'Иван Иванов', last:'Нужна помощь с заказом', unread:1, thread:[
      {me:false, text:'Здравствуйте! Помогите по заказу MSK-000345.', at:'10:00'},
      {me:true, text:'Добрый день! Сейчас проверю информацию.', at:'10:01'}
    ]},
    {id:2, userId:2, userName:'Анна Петрова', last:'Спасибо!', unread:0, thread:[
      {me:false, text:'Как подключить Telegram уведомления?', at:'09:40'},
      {me:true, text:'В ЛК в разделе Уведомления включите Telegram и следуйте инструкции.', at:'09:42'},
      {me:false, text:'Спасибо!', at:'09:43'},
    ]},
  ]),
  media: Store.get('admin_media', []),
  pages: Store.get('admin_pages', [
    {id:1, title:'О нас', slug:'about', status:'published', content:'Контент страницы О нас...'},
  ]),
  menu: Store.get('admin_menu', [
    {id:1, label:'Главная', href:'index.html', order:1},
    {id:2, label:'Решения', href:'services.html', order:2},
    {id:3, label:'Блог', href:'blog.html', order:3},
  ]),
  seo: Store.get('admin_seo', {title:'KULPS — CRM & ERP', desc:'Автоматизация и внедрение', og:'', postTpl:'%title% — KULPS'}),
  settings: Store.get('admin_settings', {site:'KULPS', email:'info@kulps.dev', phone:'+7 (993) 970-97-07', chat:true, index:true})
};
function save(key){ Store.set(key, DB[key]); }

/* ---- Навигация/тема (header уже на странице) ---- */
function bindNavigation(){
  $$('.aside-nav .nav-link').forEach(a=>{
    a.addEventListener('click', e=>{
      e.preventDefault();
      $$('.aside-nav .nav-link').forEach(x=>x.classList.remove('active'));
      a.classList.add('active');
      const page = a.dataset.page;
      $$('.page').forEach(p=>p.hidden=true);
      $(page).hidden=false;
      $('#appContent').scrollTop = 0;
    });
  });
  // Сворачивание боковой
  const burger = document.querySelector('.js-main-header__nav-trigger'); // бургер хэдера (моб. меню)
  document.getElementById('appAside').addEventListener('dblclick', ()=>document.getElementById('appAside').classList.toggle('collapsed'));
  // Переключатель темы из шапки
  const switcher = document.getElementById('switcher');
  if(switcher){
    switcher.addEventListener('change', ()=>{
      document.body.setAttribute('data-theme', switcher.checked ? 'light' : 'dark');
    });
  }
}

/* ---- Обзор ---- */
function renderDash(){
  const rev = DB.orders.reduce((s,o)=> s + (o.total||0), 0);
  $('#kpiOrders').textContent   = DB.orders.length;
  $('#kpiRevenue').textContent  = rev.toLocaleString('ru-RU')+' ₽';
  $('#kpiPosts').textContent    = DB.posts.length;
  $('#kpiProducts').textContent = DB.products.length;

  const lastOrders = DB.orders.slice(-5).reverse();
  const lo = $('#dashLastOrders'); lo.innerHTML='';
  lastOrders.forEach(o=>{
    const e = document.createElement('div'); e.className='item';
    e.innerHTML = `<div><strong>#${o.id}</strong> • ${o.date} — ${(o.total||0).toLocaleString('ru-RU')} ₽</div><div class="meta">${o.email} • ${o.status}</div>`;
    lo.appendChild(e);
  });

  const lastMsgs = DB.messages.slice(-5).reverse();
  const lm = $('#dashLastMsgs'); lm.innerHTML='';
  lastMsgs.forEach(m=>{
    const e=document.createElement('div'); e.className='item';
    e.innerHTML = `<div><strong>${m.userName}</strong> • ${m.last}</div><div class="meta">${m.unread? 'Непрочитано':'—'}</div>`;
    lm.appendChild(e);
  });
}

/* ---- Сервисы ---- */
function renderServices(filter=''){
  const wrap = $('#srvList'); wrap.innerHTML='';
  DB.services.filter(s => s.title.toLowerCase().includes(filter.toLowerCase())).forEach(s=>{
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div><strong><i class="${s.icon||'fa fa-cube'}"></i> ${s.title}</strong><div class="meta">${s.descr||''}</div></div>
      <div>${s.price||''}</div>
      <div class="meta">${s.status==='active'?'Активен':'Скрыт'}</div>
      <div class="actions">
        <button class="btn ghost btn-sm" data-edit="${s.id}"><i class="fa fa-edit"></i>Ред.</button>
        <button class="btn ghost btn-sm" data-del="${s.id}"><i class="fa fa-trash"></i></button>
      </div>
    `;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const del = e.target.closest('[data-del]'); if(del){ const id=+del.dataset.del; DB.services = DB.services.filter(x=>x.id!==id); save('services'); renderServices($('#srvSearch').value||''); toast('Удалено'); return; }
    const ed = e.target.closest('[data-edit]'); if(ed){ openServiceDrawer(+ed.dataset.edit); }
  };
}
function openServiceDrawer(id=0){
  const item = id? DB.services.find(x=>x.id===id) : {title:'',descr:'',price:'',icon:'fa fa-cube',status:'active',features:[]};
  Drawer.open(id? 'Редактировать сервис':'Новый сервис', `
    <form id="srvForm" class="row-2">
      <label class="field"><span>Название</span><input name="title" class="control" value="${item.title||''}" required></label>
      <label class="field"><span>Цена</span><input name="price" class="control" value="${item.price||''}" placeholder="от 99 000 ₽"></label>
      <label class="field" style="grid-column:1/-1"><span>Описание</span><textarea name="descr" class="control" rows="4">${item.descr||''}</textarea></label>
      <label class="field"><span>Иконка (FA)</span><input name="icon" class="control" value="${item.icon||'fa fa-cube'}" placeholder="fa fa-cube"></label>
      <label class="field"><span>Статус</span><select name="status" class="control">
        <option value="active" ${item.status==='active'?'selected':''}>Активен</option>
        <option value="hidden" ${item.status==='hidden'?'selected':''}>Скрыт</option>
      </select></label>
      <label class="field" style="grid-column:1/-1"><span>Преимущества (через запятую)</span><input name="features" class="control" value="${(item.features||[]).join(', ')}"></label>
      <div class="actions" style="grid-column:1/-1">
        <button class="btn primary btn-sm" type="submit"><i class="fa fa-save"></i>Сохранить</button>
      </div>
    </form>
  `, body=>{
    body.querySelector('#srvForm').addEventListener('submit', e=>{
      e.preventDefault();
      const f=e.target;
      const rec = {
        id: id || Date.now(),
        title: f.title.value.trim(),
        descr: f.descr.value.trim(),
        price: f.price.value.trim(),
        icon: f.icon.value.trim() || 'fa fa-cube',
        status: f.status.value,
        features: f.features.value.split(',').map(x=>x.trim()).filter(Boolean)
      };
      if(id) DB.services = DB.services.map(x=> x.id===id? rec: x);
      else DB.services.push(rec);
      save('services');
      Drawer.close(); renderServices($('#srvSearch').value||''); toast('Готово');
    });
  });
}

/* ---- Блог ---- */
function renderPosts(status='all', q=''){
  const wrap = $('#postList'); wrap.innerHTML='';
  DB.posts.filter(p=>{
    let ok = true;
    if(status!=='all') ok = ok && p.status===status;
    if(q) ok = ok && (p.title.toLowerCase().includes(q.toLowerCase()) || p.slug.toLowerCase().includes(q.toLowerCase()));
    return ok;
  }).forEach(p=>{
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div><strong>${p.title}</strong><div class="meta">${p.slug}</div></div>
      <div>${p.status==='published'?'Опубликован':'Черновик'}</div>
      <div class="meta">${(p.tags||[]).join(', ')}</div>
      <div class="actions">
        <button class="btn ghost btn-sm" data-edit="${p.id}"><i class="fa fa-edit"></i>Ред.</button>
        <button class="btn ghost btn-sm" data-pub="${p.id}">${p.status==='published'?'<i class="fa fa-eye-slash"></i>В черновик':'<i class="fa fa-eye"></i>Опубликовать'}</button>
        <button class="btn ghost btn-sm" data-del="${p.id}"><i class="fa fa-trash"></i></button>
      </div>
    `;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const id = +(e.target.closest('[data-edit]')?.dataset.edit || e.target.closest('[data-pub]')?.dataset.pub || e.target.closest('[data-del]')?.dataset.del || 0);
    if(!id) return;
    const ed = e.target.closest('[data-edit]'); if(ed) return openPostDrawer(id);
    const pb = e.target.closest('[data-pub]'); if(pb){ DB.posts = DB.posts.map(x=> x.id===id? {...x, status: x.status==='published'?'draft':'published'} : x); save('posts'); renderPosts($('#postStatus').value, $('#postSearch').value||''); toast('Статус обновлён'); return; }
    const dl = e.target.closest('[data-del]'); if(dl){ DB.posts = DB.posts.filter(x=>x.id!==id); save('posts'); renderPosts($('#postStatus').value, $('#postSearch').value||''); toast('Удалено'); }
  };
}
function openPostDrawer(id=0){
  const item = id? DB.posts.find(x=>x.id===id) : {title:'',slug:'',status:'draft',cover:'',tags:[],meta:{title:'',desc:'',og:''},content:''};
  Drawer.open(id?'Редактировать статью':'Новая статья', `
    <form id="postForm" class="row-2">
      <label class="field"><span>Заголовок</span><input name="title" class="control" value="${item.title||''}" required></label>
      <label class="field"><span>Slug</span><input name="slug" class="control" value="${item.slug||''}" placeholder="how-to-choose-crm" required></label>
      <label class="field"><span>Статус</span><select name="status" class="control">
        <option value="draft" ${item.status==='draft'?'selected':''}>Черновик</option>
        <option value="published" ${item.status==='published'?'selected':''}>Опубликован</option>
      </select></label>
      <label class="field"><span>Теги</span><input name="tags" class="control" value="${(item.tags||[]).join(', ')}"></label>
      <label class="field" style="grid-column:1/-1"><span>Обложка (URL или data)</span><input name="cover" class="control" value="${item.cover||''}"></label>
      <label class="field" style="grid-column:1/-1"><span>Контент</span><textarea name="content" class="control" rows="8">${item.content||''}</textarea></label>
      <div class="box" style="grid-column:1/-1">
        <div class="box-title">SEO</div>
        <div class="row-2">
          <label class="field"><span>Meta Title</span><input name="mTitle" class="control" value="${item.meta?.title||''}"></label>
          <label class="field"><span>Meta Description</span><input name="mDesc" class="control" value="${item.meta?.desc||''}"></label>
          <label class="field" style="grid-column:1/-1"><span>OG Image</span><input name="mOg" class="control" value="${item.meta?.og||''}"></label>
        </div>
      </div>
      <div class="actions" style="grid-column:1/-1">
        <button class="btn primary btn-sm" type="submit"><i class="fa fa-save"></i>Сохранить</button>
      </div>
    </form>
  `, body=>{
    body.querySelector('#postForm').addEventListener('submit', e=>{
      e.preventDefault();
      const f=e.target;
      const obj = {
        id: id || Date.now(),
        title: f.title.value.trim(),
        slug: f.slug.value.trim(),
        status: f.status.value,
        cover: f.cover.value.trim(),
        tags: f.tags.value.split(',').map(x=>x.trim()).filter(Boolean),
        meta: { title:f.mTitle.value.trim(), desc:f.mDesc.value.trim(), og:f.mOg.value.trim() },
        content: f.content.value
      };
      if(id) DB.posts = DB.posts.map(x=> x.id===id? obj: x);
      else DB.posts.push(obj);
      save('posts'); Drawer.close(); renderPosts($('#postStatus').value, $('#postSearch').value||''); toast('Готово');
    });
  });
}

/* ---- Товары ---- */
function renderProducts(filter='all', q=''){
  const wrap = $('#prdList'); wrap.innerHTML='';
  DB.products.filter(p=>{
    let ok = true;
    if(filter==='active') ok = ok && p.status==='active';
    if(filter==='hidden') ok = ok && p.status==='hidden';
    if(filter==='out') ok = ok && (p.stock||0)<=0;
    if(q) ok = ok && (p.title.toLowerCase().includes(q.toLowerCase()) || (p.sku||'').toLowerCase().includes(q.toLowerCase()));
    return ok;
  }).forEach(p=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div><strong>${p.title}</strong><div class="meta">SKU: ${p.sku||'-'} | Категория: ${p.category||'-'}</div></div>
      <div>${(p.price||0).toLocaleString('ru-RU')} ₽</div>
      <div class="meta">${(p.stock||0)>0? 'В наличии: '+p.stock: 'Нет в наличии'}</div>
      <div class="actions">
        <button class="btn ghost btn-sm" data-edit="${p.id}"><i class="fa fa-edit"></i>Ред.</button>
        <button class="btn ghost btn-sm" data-vis="${p.id}">${p.status==='active'?'<i class="fa fa-eye-slash"></i>Скрыть':'<i class="fa fa-eye"></i>Показать'}</button>
        <button class="btn ghost btn-sm" data-del="${p.id}"><i class="fa fa-trash"></i></button>
      </div>
    `;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const id = +(e.target.closest('[data-edit]')?.dataset.edit || e.target.closest('[data-vis]')?.dataset.vis || e.target.closest('[data-del]')?.dataset.del || 0);
    if(!id) return;
    const ed = e.target.closest('[data-edit]'); if(ed) return openProductDrawer(id);
    const vs = e.target.closest('[data-vis]'); if(vs){ DB.products = DB.products.map(x=> x.id===id? {...x, status:x.status==='active'?'hidden':'active'}: x); save('products'); renderProducts($('#prdFilter').value,$('#prdSearch').value||''); toast('Статус обновлён'); return; }
    const dl = e.target.closest('[data-del]'); if(dl){ DB.products = DB.products.filter(x=>x.id!==id); save('products'); renderProducts($('#prdFilter').value,$('#prdSearch').value||''); toast('Удалено'); return; }
  };
}
function openProductDrawer(id=0){
  const item = id? DB.products.find(x=>x.id===id) : {title:'', sku:'', price:0, stock:0, status:'active', category:'', images:[]};
  Drawer.open(id?'Редактировать товар':'Новый товар', `
    <form id="prdForm" class="row-2">
      <label class="field"><span>Название</span><input name="title" class="control" value="${item.title||''}" required></label>
      <label class="field"><span>SKU</span><input name="sku" class="control" value="${item.sku||''}"></label>
      <label class="field"><span>Цена</span><input name="price" class="control" type="number" min="0" value="${item.price||0}"></label>
      <label class="field"><span>Остаток</span><input name="stock" class="control" type="number" min="0" value="${item.stock||0}"></label>
      <label class="field"><span>Категория</span><input name="category" class="control" value="${item.category||''}"></label>
      <label class="field"><span>Статус</span><select name="status" class="control">
        <option value="active" ${item.status==='active'?'selected':''}>Активен</option>
        <option value="hidden" ${item.status==='hidden'?'selected':''}>Скрыт</option>
      </select></label>
      <label class="field" style="grid-column:1/-1"><span>Изображения (URL/data, через запятую)</span><input name="images" class="control" value="${(item.images||[]).join(', ')}"></label>
      <div class="actions" style="grid-column:1/-1"><button class="btn primary btn-sm" type="submit"><i class="fa fa-save"></i>Сохранить</button></div>
    </form>
  `, body=>{
    body.querySelector('#prdForm').addEventListener('submit', e=>{
      e.preventDefault();
      const f=e.target;
      const rec = {
        id: id||Date.now(),
        title: f.title.value.trim(),
        sku: f.sku.value.trim(),
        price: +f.price.value||0,
        stock: +f.stock.value||0,
        category: f.category.value.trim(),
        status: f.status.value,
        images: f.images.value.split(',').map(x=>x.trim()).filter(Boolean)
      };
      if(id) DB.products = DB.products.map(x=>x.id===id? rec: x); else DB.products.push(rec);
      save('products'); Drawer.close(); renderProducts($('#prdFilter').value,$('#prdSearch').value||''); toast('Готово');
    });
  });
}

/* ---- Заказы ---- */
function renderOrders(filter='all', q=''){
  const wrap = $('#ordList'); wrap.innerHTML='';
  DB.orders.filter(o=>{
    let ok=true;
    if(filter!=='all') ok = ok && o.status===filter;
    if(q){ const s=q.toLowerCase(); ok = ok && (o.id.toLowerCase().includes(s) || (o.email||'').toLowerCase().includes(s)); }
    return ok;
  }).forEach(o=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div><strong>#${o.id}</strong><div class="meta">${o.date} • ${o.email}</div></div>
      <div>${(o.total||0).toLocaleString('ru-RU')} ₽</div>
      <div class="meta">${o.status}</div>
      <div class="actions">
        <button class="btn ghost btn-sm" data-view="${o.id}"><i class="fa fa-eye"></i>Состав</button>
        <button class="btn ghost btn-sm" data-status="${o.id}"><i class="fa fa-exchange-alt"></i>Статус</button>
      </div>
    `;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const vid = e.target.closest('[data-view]')?.dataset.view; if(vid) return openOrderView(vid);
    const sid = e.target.closest('[data-status]')?.dataset.status; if(sid) return openOrderStatus(sid);
  };
}
function openOrderView(id){
  const o = DB.orders.find(x=>x.id===id); if(!o) return;
  Drawer.open('Состав заказа '+id, `
    <div class="row-2">
      <div><strong>Покупатель</strong><div class="meta">${o.email}</div></div>
      <div><strong>Дата</strong><div class="meta">${o.date}</div></div>
      <div><strong>Сумма</strong><div class="meta">${(o.total||0).toLocaleString('ru-RU')} ₽</div></div>
      <div><strong>Статус</strong><div class="meta">${o.status}</div></div>
      <div style="grid-column:1/-1">
        <div class="mini-list">
          ${o.items.map(i=>`<div class="item"><div>${i.name}</div><div class="meta">x${i.qty} • ${(i.price||0).toLocaleString('ru-RU')} ₽</div></div>`).join('')}
        </div>
      </div>
    </div>
  `);
}
function openOrderStatus(id){
  const o = DB.orders.find(x=>x.id===id); if(!o) return;
  Drawer.open('Статус заказа '+id, `
    <form id="ordStatusForm" class="row-2">
      <label class="field"><span>Статус</span>
        <select name="status" class="control">
          <option value="new" ${o.status==='new'?'selected':''}>Новый</option>
          <option value="paid" ${o.status==='paid'?'selected':''}>Оплачен</option>
          <option value="shipped" ${o.status==='shipped'?'selected':''}>Отправлен</option>
          <option value="delivered" ${o.status==='delivered'?'selected':''}>Доставлен</option>
          <option value="cancelled" ${o.status==='cancelled'?'selected':''}>Отменён</option>
        </select>
      </label>
      <div class="actions" style="grid-column:1/-1"><button class="btn primary btn-sm"><i class="fa fa-save"></i>Сохранить</button></div>
    </form>
  `, body=>{
    body.querySelector('#ordStatusForm').addEventListener('submit', e=>{
      e.preventDefault();
      const status = e.target.status.value;
      DB.orders = DB.orders.map(x=> x.id===id? {...x, status}: x);
      save('orders'); Drawer.close(); renderOrders($('#ordFilter').value,$('#ordSearch').value||''); toast('Статус обновлён');
    });
  });
}

/* ---- Клиенты ---- */
function renderCustomers(q=''){
  const wrap = $('#custList'); wrap.innerHTML='';
  DB.customers.filter(c=> !q || c.name.toLowerCase().includes(q.toLowerCase()) || (c.email||'').toLowerCase().includes(q.toLowerCase())).forEach(c=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div><strong>${c.name}</strong><div class="meta">${c.email} | ${c.phone||''}</div></div>
      <div class="meta">${c.status}</div>
      <div class="meta">${c.note||''}</div>
      <div class="actions">
        <button class="btn ghost btn-sm" data-edit="${c.id}"><i class="fa fa-edit"></i>Ред.</button>
        <button class="btn ghost btn-sm" data-msg="${c.id}"><i class="fa fa-comment"></i>Написать</button>
        <button class="btn ghost btn-sm" data-del="${c.id}"><i class="fa fa-trash"></i></button>
      </div>
    `;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const id = +(e.target.closest('[data-edit]')?.dataset.edit || e.target.closest('[data-msg]')?.dataset.msg || e.target.closest('[data-del]')?.dataset.del || 0);
    if(!id) return;
    if(e.target.closest('[data-edit]')) return openCustomerDrawer(id);
    if(e.target.closest('[data-msg]')){ openThreadByUser(id); document.querySelector('.aside-nav [data-page="#messages"]').click(); }
    if(e.target.closest('[data-del]')){ DB.customers = DB.customers.filter(x=>x.id!==id); save('customers'); renderCustomers($('#custSearch').value||''); toast('Удалено'); }
  };
}
function openCustomerDrawer(id=0){
  const item = id? DB.customers.find(x=>x.id===id) : {name:'', email:'', phone:'', note:'', status:'active'};
  Drawer.open(id?'Редактировать клиента':'Новый клиент', `
    <form id="custForm" class="row-2">
      <label class="field"><span>Имя</span><input name="name" class="control" value="${item.name||''}" required></label>
      <label class="field"><span>Email</span><input name="email" class="control" value="${item.email||''}"></label>
      <label class="field"><span>Телефон</span><input name="phone" class="control" value="${item.phone||''}"></label>
      <label class="field"><span>Статус</span><select name="status" class="control">
        <option value="active" ${item.status==='active'?'selected':''}>Активен</option>
        <option value="blocked" ${item.status==='blocked'?'selected':''}>Заблокирован</option>
      </select></label>
      <label class="field" style="grid-column:1/-1"><span>Заметка</span><input name="note" class="control" value="${item.note||''}"></label>
      <div class="actions" style="grid-column:1/-1"><button class="btn primary btn-sm" type="submit"><i class="fa fa-save"></i>Сохранить</button></div>
    </form>
  `, body=>{
    body.querySelector('#custForm').addEventListener('submit', e=>{
      e.preventDefault();
      const f=e.target;
      const rec = { id:id||Date.now(), name:f.name.value.trim(), email:f.email.value.trim(), phone:f.phone.value.trim(), note:f.note.value.trim(), status:f.status.value };
      if(id) DB.customers = DB.customers.map(x=>x.id===id? rec : x); else DB.customers.push(rec);
      save('customers'); Drawer.close(); renderCustomers($('#custSearch').value||''); toast('Готово');
    });
  });
}

/* ---- Сообщения ---- */
let currentThreadId = 0;
function renderThreads(q=''){
  const list = $('#threadList'); list.innerHTML='';
  DB.messages.filter(t => !q || t.userName.toLowerCase().includes(q.toLowerCase()) || (t.last||'').toLowerCase().includes(q.toLowerCase())).forEach(t=>{
    const div=document.createElement('div'); div.className='thread'+(t.id===currentThreadId?' active':''); div.dataset.id=t.id;
    div.innerHTML = `<div class="who">${t.userName}</div><div class="last">${t.last||''}</div>`;
    list.appendChild(div);
  });
}
function openThread(id){
  currentThreadId = +id;
  renderThreads($('#msgSearch').value||'');
  const t = DB.messages.find(x=>x.id===currentThreadId); if(!t) return;
  t.unread=0; save('messages');
  $('#chatHead').innerHTML = `<strong>${t.userName}</strong><div class="meta">${t.thread.length} сообщений</div>`;
  const body = $('#chatBody'); body.innerHTML='';
  t.thread.forEach(m=>{
    const el = document.createElement('div'); el.className='msg'+(m.me?' me':'');
    el.innerHTML = `${m.text}<div class="meta" style="font-size:11px;opacity:.6;margin-top:4px">${m.at||''}</div>`;
    body.appendChild(el);
  });
  body.scrollTop = body.scrollHeight;
}
function openThreadByUser(userId){
  let t = DB.messages.find(x=>x.userId===userId);
  if(!t){ const u = DB.customers.find(x=>x.id===userId); t = {id:Date.now(), userId, userName:u?u.name:'Клиент', last:'', unread:0, thread:[]}; DB.messages.push(t); save('messages'); }
  currentThreadId=t.id; openThread(currentThreadId);
}
function sendMessage(){
  const t = DB.messages.find(x=>x.id===currentThreadId); if(!t) return;
  const input = $('#chatInput'); const text=input.value.trim(); if(!text) return;
  const now = new Date(); const at = now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
  t.thread.push({me:true, text, at}); t.last=text; save('messages'); input.value=''; openThread(currentThreadId);
}
function bindMessages(){
  renderThreads();
  $('#threadList').addEventListener('click', e=>{
    const t=e.target.closest('.thread'); if(!t) return; openThread(+t.dataset.id);
  });
  $('#msgSearch').addEventListener('input', e=> renderThreads(e.target.value));
  $('#chatSend').addEventListener('click', sendMessage);
  $('#chatInput').addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }});
}

/* ---- Страницы ---- */
function renderPages(q=''){
  const wrap=$('#pgList'); wrap.innerHTML='';
  DB.pages.filter(p => !q || p.title.toLowerCase().includes(q.toLowerCase()) || (p.slug||'').toLowerCase().includes(q.toLowerCase())).forEach(p=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div><strong>${p.title}</strong><div class="meta">${p.slug}</div></div><div>${p.status==='published'?'Опубликована':'Черновик'}</div><div></div>
      <div class="actions"><button class="btn ghost btn-sm" data-edit="${p.id}"><i class="fa fa-edit"></i>Ред.</button><button class="btn ghost btn-sm" data-del="${p.id}"><i class="fa fa-trash"></i></button></div>`;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const id = +(e.target.closest('[data-edit]')?.dataset.edit || e.target.closest('[data-del]')?.dataset.del || 0);
    if(!id) return;
    if(e.target.closest('[data-edit]')) return openPageDrawer(id);
    if(e.target.closest('[data-del]')){ DB.pages = DB.pages.filter(x=>x.id!==id); save('pages'); renderPages($('#pgSearch').value||''); toast('Удалено'); }
  };
}
function openPageDrawer(id=0){
  const p = id? DB.pages.find(x=>x.id===id) : {title:'',slug:'',status:'draft',content:''};
  Drawer.open(id?'Редактировать страницу':'Новая страница', `
    <form id="pgForm" class="row-2">
      <label class="field"><span>Заголовок</span><input name="title" class="control" value="${p.title||''}" required></label>
      <label class="field"><span>Slug</span><input name="slug" class="control" value="${p.slug||''}" required></label>
      <label class="field"><span>Статус</span><select name="status" class="control">
        <option value="draft" ${p.status==='draft'?'selected':''}>Черновик</option>
        <option value="published" ${p.status==='published'?'selected':''}>Опубликована</option>
      </select></label>
      <label class="field" style="grid-column:1/-1"><span>Контент</span><textarea name="content" class="control" rows="8">${p.content||''}</textarea></label>
      <div class="actions" style="grid-column:1/-1"><button class="btn primary btn-sm" type="submit"><i class="fa fa-save"></i>Сохранить</button></div>
    </form>
  `, body=>{
    body.querySelector('#pgForm').addEventListener('submit', e=>{
      e.preventDefault(); const f=e.target;
      const obj={ id:id||Date.now(), title:f.title.value.trim(), slug:f.slug.value.trim(), status:f.status.value, content:f.content.value };
      if(id) DB.pages = DB.pages.map(x=>x.id===id? obj: x); else DB.pages.push(obj);
      save('pages'); Drawer.close(); renderPages($('#pgSearch').value||''); toast('Готово');
    });
  });
}

/* ---- Медиа ---- */
function renderMedia(q=''){
  const grid=$('#mdGrid'); grid.innerHTML='';
  DB.media.filter(m=> !q || (m.name||'').toLowerCase().includes(q.toLowerCase())).forEach(m=>{
    const it=document.createElement('div'); it.className='media-item';
    it.innerHTML=`
      <img src="${m.data}" alt="">
      <div class="mi-actions">
        <small class="meta">${m.name||'image'}</small>
        <div>
          <button class="btn ghost btn-sm" data-copy="${m.id}"><i class="fa fa-copy"></i></button>
          <button class="btn ghost btn-sm" data-del="${m.id}"><i class="fa fa-trash"></i></button>
        </div>
      </div>
    `;
    grid.appendChild(it);
  });
  grid.onclick = e=>{
    const c=e.target.closest('[data-copy]'); if(c){ const id=+c.dataset.copy; const m=DB.media.find(x=>x.id===id); if(m){ navigator.clipboard.writeText(m.data); toast('Ссылка скопирована'); } return; }
    const d=e.target.closest('[data-del]'); if(d){ const id=+d.dataset.del; DB.media = DB.media.filter(x=>x.id!==id); save('media'); renderMedia($('#mdSearch').value||''); toast('Удалено'); }
  };
}
function bindMedia(){
  const drop=$('#mdDrop'), input=$('#mdInput');
  function handleFiles(files){
    [...files].forEach(file=>{
      if(!file.type.startsWith('image/')) return;
      const r=new FileReader(); r.onload=()=>{ DB.media.push({id:Date.now()+Math.random(), name:file.name, data:r.result}); save('media'); renderMedia($('#mdSearch').value||''); };
      r.readAsDataURL(file);
    });
    toast('Загружено');
  }
  drop.addEventListener('click', ()=> input.click());
  input.addEventListener('change', e=> handleFiles(e.target.files));
  ;['dragenter','dragover'].forEach(ev=> drop.addEventListener(ev, e=>{e.preventDefault(); drop.style.borderColor='var(--color-primary)';}));
  ;['dragleave','drop'].forEach(ev=> drop.addEventListener(ev, e=>{e.preventDefault(); drop.style.borderColor='var(--color-contrast-low)';}));
  drop.addEventListener('drop', e=> handleFiles(e.dataTransfer.files));
}

/* ---- Меню ---- */
function renderMenu(){
  const wrap=$('#mnList'); wrap.innerHTML='';
  DB.menu.sort((a,b)=>a.order-b.order).forEach(m=>{
    const row=document.createElement('div'); row.className='row';
    row.innerHTML=`<div><strong>${m.label}</strong><div class="meta">${m.href}</div></div><div>Порядок: ${m.order}</div><div></div>
      <div class="actions">
        <button class="btn ghost btn-sm" data-up="${m.id}"><i class="fa fa-arrow-up"></i></button>
        <button class="btn ghost btn-sm" data-down="${m.id}"><i class="fa fa-arrow-down"></i></button>
        <button class="btn ghost btn-sm" data-edit="${m.id}"><i class="fa fa-edit"></i>Ред.</button>
        <button class="btn ghost btn-sm" data-del="${m.id}"><i class="fa fa-trash"></i></button>
      </div>`;
    wrap.appendChild(row);
  });
  wrap.onclick = e=>{
    const id = +(e.target.closest('[data-up]')?.dataset.up || e.target.closest('[data-down]')?.dataset.down || e.target.closest('[data-edit]')?.dataset.edit || e.target.closest('[data-del]')?.dataset.del || 0);
    if(!id) return;
    const up=e.target.closest('[data-up]'); if(up){ const m=DB.menu.find(x=>x.id===id); m.order=Math.max(1,(m.order||1)-1); save('menu'); renderMenu(); return; }
    const dn=e.target.closest('[data-down]'); if(dn){ const m=DB.menu.find(x=>x.id===id); m.order=(m.order||1)+1; save('menu'); renderMenu(); return; }
    const ed=e.target.closest('[data-edit]'); if(ed) return openMenuDrawer(id);
    const dl=e.target.closest('[data-del]'); if(dl){ DB.menu = DB.menu.filter(x=>x.id!==id); save('menu'); renderMenu(); toast('Удалено'); }
  };
}
function openMenuDrawer(id=0){
  const m = id? DB.menu.find(x=>x.id===id) : {label:'', href:'', order: (Math.max(0,...DB.menu.map(x=>x.order||0))+1)||1};
  Drawer.open(id?'Пункт меню':'Новый пункт', `
    <form id="mnForm" class="row-2">
      <label class="field"><span>Название</span><input name="label" class="control" value="${m.label||''}" required></label>
      <label class="field"><span>Ссылка</span><input name="href" class="control" value="${m.href||''}" required></label>
      <label class="field"><span>Порядок</span><input name="order" type="number" class="control" value="${m.order||1}"></label>
      <div class="actions" style="grid-column:1/-1"><button class="btn primary btn-sm"><i class="fa fa-save"></i>Сохранить</button></div>
    </form>
  `, body=>{
    body.querySelector('#mnForm').addEventListener('submit', e=>{
      e.preventDefault();
      const f=e.target; const rec={ id:id||Date.now(), label:f.label.value.trim(), href:f.href.value.trim(), order:+f.order.value||1 };
      if(id) DB.menu = DB.menu.map(x=>x.id===id? rec: x); else DB.menu.push(rec);
      save('menu'); Drawer.close(); renderMenu(); toast('Готово');
    });
  });
}

/* ---- SEO / Settings ---- */
function bindSEO(){
  const f=$('#seoForm');
  f.title.value = DB.seo.title||''; f.desc.value=DB.seo.desc||''; f.og.value=DB.seo.og||''; f.postTpl.value=DB.seo.postTpl||'';
  f.addEventListener('submit', e=>{ e.preventDefault(); DB.seo={ title:f.title.value.trim(), desc:f.desc.value.trim(), og:f.og.value.trim(), postTpl:f.postTpl.value.trim() }; save('seo'); toast('SEO сохранено'); });
}
function bindSettings(){
  const f=$('#setForm');
  f.site.value=DB.settings.site||''; f.email.value=DB.settings.email||''; f.phone.value=DB.settings.phone||''; f.chat.checked=!!DB.settings.chat; f.index.checked=!!DB.settings.index;
  f.addEventListener('submit', e=>{ e.preventDefault(); DB.settings={ site:f.site.value.trim(), email:f.email.value.trim(), phone:f.phone.value.trim(), chat:f.chat.checked, index:f.index.checked }; save('settings'); toast('Настройки сохранены'); });
  $('#exportAll').addEventListener('click', ()=>{
    const dump = JSON.stringify(DB, null, 2);
    const blob=new Blob([dump],{type:'application/json'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download='kulps-admin-export.json'; a.click(); a.remove();
  });
  $('#importAll').addEventListener('change', e=>{
    const file = e.target.files[0]; if(!file) return;
    const r=new FileReader(); r.onload=()=>{
      try{
        const data=JSON.parse(r.result);
        ['services','posts','products','orders','customers','messages','media','pages','menu','seo','settings'].forEach(k=>{
          if(data[k]){ DB[k]=data[k]; save(k); }
        });
        toast('Импорт завершён'); location.reload();
      }catch{ toast('Ошибка импорта'); }
    }; r.readAsText(file);
  });
}

/* ---- Drawer ---- */
const Drawer = {
  open(title, html, onMount){
    $('#drawerTitle').textContent = title;
    $('#drawerBody').innerHTML = html;
    $('#drawer').classList.add('open');
    if(onMount) onMount($('#drawerBody'));
  },
  close(){ $('#drawer').classList.remove('open'); }
};
$('#drawerMask').addEventListener('click', ()=>Drawer.close());
$('#drawerClose').addEventListener('click', ()=>Drawer.close());

/* ---- Привязки ---- */
function bindTopActions(){
  // Сервисы
  $('#srvAdd').addEventListener('click', ()=> openServiceDrawer(0));
  $('#srvSearch').addEventListener('input', e=> renderServices(e.target.value));
  // Блог
  $('#postAdd').addEventListener('click', ()=> openPostDrawer(0));
  $('#postStatus').addEventListener('change', e=> renderPosts(e.target.value, $('#postSearch').value||''));
  $('#postSearch').addEventListener('input', e=> renderPosts($('#postStatus').value, e.target.value));
  // Товары
  $('#prdAdd').addEventListener('click', ()=> openProductDrawer(0));
  $('#prdFilter').addEventListener('change', e=> renderProducts(e.target.value, $('#prdSearch').value||''));
  $('#prdSearch').addEventListener('input', e=> renderProducts($('#prdFilter').value, e.target.value));
  // Заказы
  $('#ordFilter').addEventListener('change', e=> renderOrders(e.target.value, $('#ordSearch').value||''));
  $('#ordSearch').addEventListener('input', e=> renderOrders($('#ordFilter').value, e.target.value));
  // Клиенты
  $('#custAdd').addEventListener('click', ()=> openCustomerDrawer(0));
  $('#custSearch').addEventListener('input', e=> renderCustomers(e.target.value));
  // Сообщения
  bindMessages();
  // Страницы
  $('#pgAdd').addEventListener('click', ()=> openPageDrawer(0));
  $('#pgSearch').addEventListener('input', e=> renderPages(e.target.value));
  // Медиа
  $('#mdAdd').addEventListener('click', ()=> $('#mdInput').click());
  $('#mdSearch').addEventListener('input', e=> renderMedia(e.target.value));
  bindMedia();
  // Меню
  $('#mnAdd').addEventListener('click', ()=> openMenuDrawer(0));
}

/* ---- Init ---- */
document.addEventListener('DOMContentLoaded', ()=>{
  bindNavigation();

  renderDash();

  renderServices(); 
  renderPosts('all','');
  renderProducts('all','');
  renderOrders('all','');
  renderCustomers('');
  renderPages('');
  renderMedia('');
  renderMenu();

  bindSEO();
  bindSettings();
  bindTopActions();
});