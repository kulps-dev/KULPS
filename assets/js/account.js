/* KULPS Account JS — данные в localStorage. Легко заменить на API. */

const $  = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => p.querySelectorAll(s);

const Store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v? JSON.parse(v): d; }catch{ return d } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};

const state = {
  user: Store.get('kulps_user', {
    avatar:'', firstName:'Иван', lastName:'Иванов',
    email:'ivan@example.com', phone:'+7 (900) 000-00-00',
    birthday:'', gender:'', lang:'ru', tz:'Europe/Moscow'
  }),
  addresses: Store.get('kulps_addresses', [
    { id:1, city:'Москва', zip:'101000', line1:'ул. Пушкина, д.1, кв.1', comment:'Домофон 1234', primary:true }
  ]),
  orders: Store.get('kulps_orders', [
    { id:'MSK-000345', date:'2025-01-01', total:'12 490 ₽', status:'paid', progress:60, items:[{name:'Лицензия CRM', qty:1, price:'9 990 ₽'},{name:'Внедрение (блок 1)', qty:1, price:'2 500 ₽'}] },
    { id:'MSK-000346', date:'2025-01-04', total:'5 200 ₽', status:'shipped', progress:85, items:[{name:'Подписка ERP (мес.)', qty:1, price:'5 200 ₽'}] },
    { id:'MSK-000347', date:'2025-01-06', total:'5 200 ₽', status:'new', progress:20, items:[{name:'Подписка ERP (мес.)', qty:1, price:'5 200 ₽'}] },
    { id:'MSK-000348', date:'2025-01-08', total:'5 200 ₽', status:'delivered', progress:100, items:[{name:'Подписка ERP (мес.)', qty:1, price:'5 200 ₽'}] },
    { id:'MSK-000349', date:'2025-01-10', total:'5 200 ₽', status:'cancelled', progress:0, items:[{name:'Подписка ERP (мес.)', qty:1, price:'5 200 ₽'}] },
  ]),
  company: Store.get('kulps_company', { enabled:false, orgName:'', inn:'', kpp:'', ogrn:'', legalAddress:'', bik:'', rs:'', ks:'', signer:'' }),
  notify: Store.get('kulps_notify', { email:true, sms:false, tg:false, freq:'live', quiet:'22:00–08:00' }),
  tfaEnabled: Store.get('kulps_tfa', false),
  devices: Store.get('kulps_devices', [
    { id:1, title:'Chrome, Windows 11', ip:'94.123.12.1', last:'сегодня, 10:22', current:true },
    { id:2, title:'Safari, iPhone', ip:'94.123.12.1', last:'вчера, 21:05', current:false }
  ])
};

function toast(msg){
  const t = $('#toast'); if(!t) return;
  t.textContent = msg; t.classList.add('show');
  setTimeout(()=> t.classList.remove('show'), 2000);
}

/* Sidebar switching */
function bindNavigation(){
  $$('.aside-nav .nav-link').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      $$('.aside-nav .nav-link').forEach(a=>a.classList.remove('active'));
      link.classList.add('active');
      const target = link.getAttribute('data-target');
      $$('.page').forEach(p => p.hidden = true);
      $(target).hidden = false;
      // плавный скролл к верху контента
      $('.app-content').scrollIntoView({behavior:'smooth', block:'start'});
    });
  });
  // стартовая секция
  $$('.page').forEach(p => p.hidden = true);
  $('#p-profile').hidden = false;

  // Collapse aside
  $('#asideToggle').addEventListener('click', ()=>{
    $('#appAside').classList.toggle('collapsed');
  });
}

/* Quick stats */
function fillQuick(){
  $('#qOrders').textContent     = state.orders.length;
  $('#qProcessing').textContent = state.orders.filter(o=>['new','paid','shipped'].includes(o.status)).length;
  $('#qDelivered').textContent  = state.orders.filter(o=>o.status==='delivered').length;
}

/* Profile */
function fillProfile(){
  const f = $('#profileForm');
  f.firstName.value = state.user.firstName || '';
  f.lastName.value  = state.user.lastName  || '';
  f.email.value     = state.user.email     || '';
  f.phone.value     = state.user.phone     || '';
  f.birthday.value  = state.user.birthday  || '';
  f.gender.value    = state.user.gender    || '';
  f.lang.value      = state.user.lang      || 'ru';
  f.tz.value        = state.user.tz        || 'Europe/Moscow';

  // Hello block
  $('#helloName').textContent = state.user.firstName || 'Гость';

  // Aside avatar + profile avatar
  setAvatar(state.user.avatar);
}
function setAvatar(dataUrl){
  const ap = $('#avatarPreview'), ph = $('.avatar-placeholder'), asidePh = $('#asideAvatarPh'), asideImg = $('#asideAvatar');
  if(dataUrl){
    ap.src = dataUrl; ap.style.display='block'; ph.style.display='none';
    asideImg.src = dataUrl; asideImg.style.display='block'; asidePh.style.display='none';
  }else{
    ap.src=''; ap.style.display='none'; ph.style.display='flex';
    asideImg.src=''; asideImg.style.display='none'; asidePh.style.display='inline-block';
  }
}
function bindProfile(){
  // save
  $('#profileForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = e.target;
    Object.assign(state.user, {
      firstName:f.firstName.value.trim(),
      lastName: f.lastName.value.trim(),
      email:    f.email.value.trim(),
      phone:    f.phone.value.trim(),
      birthday: f.birthday.value,
      gender:   f.gender.value,
      lang:     f.lang.value,
      tz:       f.tz.value
    });
    Store.set('kulps_user', state.user);
    $('#helloName').textContent = state.user.firstName || 'Гость';
    toast('Профиль сохранён');
  });

  // avatar
  const drop = $('#avatarDrop'), input = $('#avatarInput'), reset = $('#avatarReset');
  function handle(file){
    if(!file || !file.type.startsWith('image/')) return;
    if(file.size > 5*1024*1024){ toast('Файл больше 5 МБ'); return; }
    const r = new FileReader();
    r.onload = () => { state.user.avatar = r.result; Store.set('kulps_user', state.user); setAvatar(state.user.avatar); toast('Аватар обновлён'); }
    r.readAsDataURL(file);
  }
  input.addEventListener('change', e=> handle(e.target.files[0]));
  ;['dragenter','dragover'].forEach(ev=> drop.addEventListener(ev, e=>{e.preventDefault(); drop.style.borderColor='var(--color-primary)';}));
  ;['dragleave','drop'].forEach(ev=> drop.addEventListener(ev, e=>{e.preventDefault(); drop.style.borderColor='var(--color-contrast-low)';}));
  drop.addEventListener('drop', e=> handle(e.dataTransfer.files[0]));
  drop.addEventListener('click', ()=> input.click());
  reset.addEventListener('click', ()=>{ state.user.avatar=''; Store.set('kulps_user', state.user); setAvatar(''); });
}

/* Addresses */
function renderAddresses(){
  const wrap = $('#addressList'); wrap.innerHTML='';
  state.addresses.forEach(a=>{
    const node = document.createElement('div');
    node.className='address-item';
    node.innerHTML = `
      <div><strong>${a.city}</strong> • ${a.zip}</div>
      <div>${a.line1}</div>
      ${a.comment? `<div class="muted">${a.comment}</div>`:''}
      <div class="addr-actions">
        ${a.primary? `<span class="badge primary">Основной</span>`:`<button class="btn ghost" data-act="primary" data-id="${a.id}"><i class="fa fa-star"></i>Основной</button>`}
        <button class="btn ghost" data-act="edit" data-id="${a.id}"><i class="fa fa-edit"></i>Редактировать</button>
        <button class="btn ghost" data-act="del" data-id="${a.id}"><i class="fa fa-trash"></i>Удалить</button>
      </div>
    `;
    wrap.appendChild(node);
  });
}
function bindAddresses(){
  $('#addressList').addEventListener('click', e=>{
    const btn = e.target.closest('[data-act]'); if(!btn) return;
    const id = +btn.dataset.id, act = btn.dataset.act;
    if(act==='del'){
      state.addresses = state.addresses.filter(x=>x.id!==id);
      Store.set('kulps_addresses', state.addresses);
      renderAddresses(); toast('Адрес удалён');
    } else if(act==='primary'){
      state.addresses = state.addresses.map(x=>({...x, primary: x.id===id}));
      Store.set('kulps_addresses', state.addresses);
      renderAddresses(); toast('Обновлено');
    } else if(act==='edit'){
      const a = state.addresses.find(x=>x.id===id);
      if(!a) return;
      const f = $('#addressForm');
      f.city.value=a.city; f.zip.value=a.zip; f.line1.value=a.line1; f.comment.value=a.comment||'';
      $('#addrPrimary').checked = !!a.primary;
      f.dataset.editId = id;
      f.closest('details').open = true;
      f.scrollIntoView({behavior:'smooth', block:'start'});
    }
  });

  $('#addressForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = e.target, editId = +f.dataset.editId || 0;
    const addr = {
      id: editId || Date.now(),
      city: f.city.value.trim(),
      zip: f.zip.value.trim(),
      line1: f.line1.value.trim(),
      comment: f.comment.value.trim(),
      primary: $('#addrPrimary').checked
    };
    if(addr.primary) state.addresses = state.addresses.map(x=>({...x, primary:false}));
    if(editId) state.addresses = state.addresses.map(x=> x.id===editId? addr: x);
    else state.addresses.push(addr);
    Store.set('kulps_addresses', state.addresses);
    renderAddresses(); toast('Адрес сохранён');
    f.reset(); f.dataset.editId='';
  });
}

/* Orders */
function renderOrders(filter='all'){
  const wrap = $('#ordersList'); wrap.innerHTML='';
  const statChip = s=>{
    switch(s){
      case 'new': return '<span class="status st-new">Новый</span>';
      case 'paid': return '<span class="status st-paid">Оплачен</span>';
      case 'shipped': return '<span class="status st-shipped">Отправлен</span>';
      case 'delivered': return '<span class="status st-delivered">Доставлен</span>';
      case 'cancelled': return '<span class="status st-cancelled">Отменён</span>';
      default: return `<span class="status">${s}</span>`;
    }
  }
  state.orders.filter(o => filter==='all' || o.status===filter).forEach(o=>{
    const el = document.createElement('div');
    el.className='order';
    el.innerHTML = `
      <div class="order-head">
        <div><strong>#${o.id}</strong> • ${o.date}</div>
        <div class="sum">${statChip(o.status)} <strong>${o.total}</strong></div>
      </div>
      <div class="progress"><span style="width:${o.progress}%"></span></div>
      <button class="btn ghost small" data-toggle="${o.id}"><i class="fa fa-list"></i>Состав</button>
      <div class="order-items" id="oi-${o.id}">
        ${o.items.map(i=>`<div class="flex justify-between"><div>${i.name} × ${i.qty}</div><div class="muted">${i.price}</div></div>`).join('')}
      </div>
    `;
    wrap.appendChild(el);
  });
}
function bindOrders(){
  $('#orderFilter').addEventListener('change', e=> renderOrders(e.target.value));
  $('#ordersList').addEventListener('click', e=>{
    const b = e.target.closest('[data-toggle]'); if(!b) return;
    const id = b.getAttribute('data-toggle');
    const box = $('#oi-'+id);
    box.classList.toggle('visible');
  });
}

/* Company */
function fillCompany(){
  $('#isCompany').checked = !!state.company.enabled;
  $('#companyForm').hidden = !state.company.enabled;
  const f = $('#companyForm');
  ['orgName','inn','kpp','ogrn','legalAddress','bik','rs','ks','signer'].forEach(k=>{
    f[k].value = state.company[k] || '';
  });
}
function bindCompany(){
  $('#isCompany').addEventListener('change', e=>{
    state.company.enabled = e.target.checked;
    Store.set('kulps_company', state.company);
    $('#companyForm').hidden = !state.company.enabled;
  });
  $('#companyForm').addEventListener('submit', e=>{
    e.preventDefault();
    const f = e.target;
    ['orgName','inn','kpp','ogrn','legalAddress','bik','rs','ks','signer'].forEach(k=> state.company[k]=f[k].value.trim());
    Store.set('kulps_company', state.company);
    toast('Реквизиты сохранены');
  });
  $('#exportRequisites').addEventListener('click', ()=>{
    downloadText(JSON.stringify(state.company,null,2), 'requisites.json');
  });
}

/* Security */
function bindSecurity(){
  $('#passwordForm').addEventListener('submit', e=>{
    e.preventDefault();
    const {newPass} = e.target; 
    if((newPass.value||'').length<8){ toast('Пароль должен быть не менее 8 символов'); return; }
    // TODO: запрос к API
    e.target.reset(); toast('Пароль обновлён');
  });

  $('#tfaToggle').checked = !!state.tfaEnabled;
  $('#tfaBlock').hidden  = !state.tfaEnabled;
  $('#tfaToggle').addEventListener('change', e=>{
    state.tfaEnabled = e.target.checked; Store.set('kulps_tfa', state.tfaEnabled);
    $('#tfaBlock').hidden = !state.tfaEnabled;
  });
  $('#tfaConfirm').addEventListener('click', e=>{ e.preventDefault(); toast('2FA привязан'); });
  $('#tfaReset').addEventListener('click', e=>{ e.preventDefault(); $('#tfaCode').value=''; });

  renderDevices();
  $('#logoutOthers').addEventListener('click', ()=>{
    state.devices = state.devices.filter(d=>d.current);
    Store.set('kulps_devices', state.devices);
    renderDevices(); toast('Другие сессии завершены');
  });
}
function renderDevices(){
  const wrap = $('#deviceList'); wrap.innerHTML='';
  state.devices.forEach(d=>{
    const row = document.createElement('div');
    row.className='device';
    row.innerHTML = `
      <div><strong>${d.title}</strong><div class="muted">${d.ip}, ${d.last} ${d.current?'• текущее устройство':''}</div></div>
      ${d.current? '<span class="status st-delivered">Активно</span>' : `<button class="btn ghost small" data-logout="${d.id}"><i class="fa fa-times"></i>Завершить</button>`}
    `;
    wrap.appendChild(row);
  });
  wrap.addEventListener('click', e=>{
    const b = e.target.closest('[data-logout]'); if(!b) return;
    const id = +b.getAttribute('data-logout');
    state.devices = state.devices.filter(x=>x.id!==id);
    Store.set('kulps_devices', state.devices);
    renderDevices(); toast('Сессия завершена');
  });
}

/* Notify */
function fillNotify(){
  $('#nEmail').checked = !!state.notify.email;
  $('#nSMS').checked   = !!state.notify.sms;
  $('#nTG').checked    = !!state.notify.tg;
  $('#nFreq').value    = state.notify.freq || 'live';
  $('#nQuiet').value   = state.notify.quiet || '';
}
function bindNotify(){
  $('#notifyForm').addEventListener('submit', e=>{
    e.preventDefault();
    state.notify = {
      email: $('#nEmail').checked,
      sms:   $('#nSMS').checked,
      tg:    $('#nTG').checked,
      freq:  $('#nFreq').value,
      quiet: $('#nQuiet').value
    };
    Store.set('kulps_notify', state.notify);
    toast('Настройки уведомлений сохранены');
  });
  $('#connectTG').addEventListener('click', ()=> toast('Откройте бота в Telegram и подтвердите связку'));
}

/* Support */
function bindSupport(){
  $('#supportForm').addEventListener('submit', e=>{
    e.preventDefault();
    // TODO: отправить в ваш CRM
    e.target.reset();
    toast('Заявка отправлена');
  });
  $('#openChat').addEventListener('click', ()=>{
    toast('Открываем чат...');
    // Вызов виджета B24 при необходимости
  });

  $('#deleteAccount').addEventListener('click', ()=>{
    if(confirm('Удалить аккаунт без возможности восстановления?')){
      ['kulps_user','kulps_addresses','kulps_orders','kulps_company','kulps_notify','kulps_tfa','kulps_devices']
        .forEach(k=> localStorage.removeItem(k));
      toast('Аккаунт удалён');
      setTimeout(()=> location.href='index.html', 1200);
    }
  });
}

/* Export profile JSON */
function bindExport(){
  $('#exportData').addEventListener('click', ()=>{
    const obj = { user:state.user, addresses:state.addresses, company:state.company, notify:state.notify };
    downloadText(JSON.stringify(obj,null,2), 'account-data.json');
  });
}
function downloadText(text, filename){
  const blob = new Blob([text], {type:'application/json;charset=utf-8;'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = filename; document.body.appendChild(a); a.click(); a.remove();
}

/* Init */
document.addEventListener('DOMContentLoaded', ()=>{
  bindNavigation();

  fillQuick();

  fillProfile(); bindProfile();

  renderAddresses(); bindAddresses();

  renderOrders('all'); bindOrders();

  fillCompany(); bindCompany();

  bindSecurity();

  fillNotify(); bindNotify();

  bindSupport();

  bindExport();

  // Применяем приветствие/аватар в сайдбаре
  if(state.user.avatar){ $('#asideAvatar').style.display='block'; $('#asideAvatar').src=state.user.avatar; $('#asideAvatarPh').style.display='none'; }
  $('#helloName').textContent = state.user.firstName || 'Гость';
});