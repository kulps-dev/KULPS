// assets/js/requisites.js
// Версия: стекло + анимации + QR-модалка + быстрые действия + компактные левые блоки
(function () {
  // === 1) ДАННЫЕ (замените на реальные) ===
  const details = {
    companyName: 'ИП Кульпин Александр Сергеевич',
    shortName: 'ИП Кульпин А. С.',
    inn: '471511914682',
    ogrn: '319470400066449',
    bankName: 'АО "ТБанк"',
    bik: '044525974',
    corAccount: '30101810145250000974',
    account: '40802810900003226955',
    addressLegal: '187515, Россия, Ленинградская обл, Тихвинский р-н, деревня Бор, д.2, кв.7',
    addressFact:  'Санкт-Петербург',
    email: 'info@kulps.dev',
    phone: '+7 (993) 970-97-07',
    website: 'https://kulps.dev'
  };

  // === 2) Рендер списков ===
  const reqList = document.getElementById('req-list');
  const reqExtra = document.getElementById('req-extra');
  const reqContacts = document.getElementById('req-contacts');
  const toast = document.getElementById('toast');

  const rowsMain = [
    { key: 'Наименование',          val: details.companyName },
    { key: 'Краткое наименование',  val: details.shortName },
    { key: 'ИНН',                   val: details.inn },
    { key: 'ОГРНИП',                  val: details.ogrn },
    { key: 'Банк',                  val: details.bankName },
    { key: 'БИК',                   val: details.bik },
    { key: 'Корр. счёт',            val: details.corAccount },
    { key: 'Расчётный счёт',        val: details.account }
  ];
  const rowsExtra = [
    { key: 'Юридический адрес', val: details.addressLegal },
    { key: 'Фактический адрес', val: details.addressFact }
  ];
  const rowsContacts = [
    { key: 'Телефон', val: details.phone },
    { key: 'E-mail',  val: details.email },
    { key: 'Сайт',    val: details.website }
  ];

  function renderList(el, rows) {
    el.innerHTML = rows.map(r => `
      <li>
        <span class="req-key">${r.key}</span>
        <span class="req-value">${escapeHtml(r.val || '—')}</span>
        <button class="req-copy js-copy" type="button" data-copy="${escapeAttr(r.val || '')}">
          <i class="far fa-copy"></i> Копировать
        </button>
        <span class="req-tooltip">Скопировано!</span>
      </li>`).join('');
  }
  renderList(reqList, rowsMain);
  renderList(reqExtra, rowsExtra);
  renderList(reqContacts, rowsContacts);

  // === 3) Копирование + ripple + tooltip + конфетти ===
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.js-copy');
    if (!btn) return;

    // ripple
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--x', (e.clientX - rect.left) + 'px');
    btn.style.setProperty('--y', (e.clientY - rect.top) + 'px');
    btn.classList.add('rippling');
    setTimeout(() => btn.classList.remove('rippling'), 350);

    const val = btn.getAttribute('data-copy') || '';
    await copyToClipboard(val);
    showToast('Скопировано');

    // tooltip + подсветка значения
    const li = btn.closest('li');
    li.querySelector('.req-tooltip')?.classList.add('show');
    flashValue(li.querySelector('.req-value'));
    setTimeout(() => li.querySelector('.req-tooltip')?.classList.remove('show'), 900);

    confettiAt(btn, 22);
  });

  // === 4) Скопировать всё / Печать / JSON ===
  document.getElementById('btn-copy-all')?.addEventListener('click', async (e) => {
    const txt = buildTextBlock(details);
    await copyToClipboard(txt);
    showToast('Все реквизиты скопированы');
    confettiAt(e.currentTarget, 40);
  });
  document.getElementById('btn-print')?.addEventListener('click', () => window.print());
  document.getElementById('btn-download-json')?.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(details, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'requisites.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // === 5) QR (модалка) + Быстрые действия (vCard/share/mail/txt) ===
  document.getElementById('btn-show-qr')?.addEventListener('click', () => {
    openQrModal();
  });

  document.getElementById('btn-vcard')?.addEventListener('click', () => {
    const vcf = buildVCard(details);
    const blob = new Blob([vcf], {type: 'text/vcard;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'KULPS.vcf'; a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById('btn-share')?.addEventListener('click', async () => {
    const text = buildTextBlock(details);
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Реквизиты KULPS', text, url: details.website });
      } else {
        await copyToClipboard(text);
        showToast('Реквизиты скопированы (нет Web Share API)');
      }
    } catch(_) {}
  });

  document.getElementById('btn-mail')?.addEventListener('click', () => {
    const subject = encodeURIComponent('Реквизиты KULPS');
    const body    = encodeURIComponent(buildTextBlock(details));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  });

  document.getElementById('btn-txt')?.addEventListener('click', () => {
    const blob = new Blob([buildTextBlock(details)], {type:'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'requisites.txt'; a.click();
    URL.revokeObjectURL(url);
  });

    function openQrModal() {
    const payload = buildQrPayload(details, {
        purpose: 'Оплата по реквизитам KULPS',
        // sum: 0 // при необходимости подставьте сумму в рублях
    });
    const src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&ecc=Q&margin=2&data=${encodeURIComponent(payload)}`;
    
    const modal = document.createElement('div');
    modal.innerHTML = `
      <div class="rq-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(4px)">
        <div class="rq-modal-card" style="background:var(--color-bg);color:var(--color-contrast-higher);border-radius:24px;padding:20px;width:360px;max-width:90%;box-shadow:0 14px 36px rgba(0,0,0,.18);transform:translateY(10px);opacity:0;transition:.28s ease">
          <h4 style="margin:0 0 12px 0;font-weight:800">QR с реквизитами</h4>
          <p class="color-contrast-medium" style="margin:0 0 12px 0">Отсканируйте камерой приложения банка.</p>
          <div style="display:grid;gap:10px;justify-items:center">
            <img src="${src}" alt="QR" style="width:260px;height:260px;border-radius:16px;background:var(--color-contrast-lower)">
            <a href="${src}" download="requisites-qr.png" class="btn btn-mokko btn--md"><span class="ms-btn__text">Скачать PNG</span></a>
          </div>
          <button class="btn-close" aria-label="Close" style="position:absolute;top:12px;right:12px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--color-contrast-lower);border:none;">✕</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
      const card = modal.querySelector('.rq-modal-card');
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    });
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('rq-modal-overlay') || e.target.closest('.btn-close')) modal.remove();
    });
  }

  // === 6) GSAP анимации появления строк ===
  try {
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo(['#req-list li','#req-extra li','#req-contacts li'],
        {y:10,opacity:0},{y:0,opacity:1,duration:.45,ease:'power2.out',stagger:.06,
          scrollTrigger:{trigger:'.project-area .container',start:'top 75%',once:true}});
    }
  } catch(_) {}

  // === 7) Micro‑UX: 3D tilt для стекло-карточек ===
  document.querySelectorAll('.widget-box').forEach(card=>{
    let raf;
    card.addEventListener('mousemove', (e)=>{
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(()=>{
        const r=card.getBoundingClientRect();
        const x=e.clientX-r.left, y=e.clientY-r.top;
        const rx=((y-r.height/2)/r.height)*6;
        const ry=((x-r.width/2)/r.width)*-6;
        card.style.transform = `translateY(-4px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform=''; });
  });

  // === Helpers ===
  function buildTextBlock(d){
    return [
      `Наименование: ${d.companyName}`,
      `Краткое наименование: ${d.shortName}`,
      `ИНН: ${d.inn}`,
      `КПП: ${d.kpp}`,
      `ОГРН: ${d.ogrn}`,
      `Банк: ${d.bankName}`,
      `БИК: ${d.bik}`,
      `Корр. счёт: ${d.corAccount}`,
      `Расчётный счёт: ${d.account}`,
      `Юр. адрес: ${d.addressLegal}`,
      `Факт. адрес: ${d.addressFact}`,
      `Тел.: ${d.phone}`,
      `E-mail: ${d.email}`,
      `Сайт: ${d.website}`
    ].join('\n');
  }
    function buildQrPayload(d, opts = {}) {
    const safe = s => String(s || '').replace(/\|/g, '/'); // без символа | внутри значений
    const parts = [
        'ST00012',
        `Name=${safe(d.companyName)}`,
        `PersonalAcc=${(d.account||'').replace(/\s+/g,'')}`,
        `BankName=${safe(d.bankName)}`,
        `BIC=${(d.bik||'').replace(/\s+/g,'')}`,
        `CorrespAcc=${(d.corAccount||'').replace(/\s+/g,'')}`,
        `PayeeINN=${(d.inn||'').replace(/\s+/g,'')}`
    ];
    if (d.kpp) parts.push(`KPP=${(d.kpp||'').replace(/\s+/g,'')}`); // ИП — без КПП
    if (opts.purpose) parts.push(`Purpose=${safe(opts.purpose)}`);
    if (opts.sum) parts.push(`Sum=${Math.round(Number(opts.sum) * 100)}`); // рубли -> копейки
    return parts.join('|');
    }
  function buildVCard(d){
    // vCard 3.0 — чтобы добавлять контакт компании
    const addr = d.addressLegal || '';
    const [street='ул. Примерная, д. 1', city='Москва', zip='101000'] = parseAddr(addr);
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:;${escapeV(d.companyName)};;;`,
      `FN:${escapeV(d.companyName)}`,
      `ORG:${escapeV(d.companyName)}`,
      `TEL;TYPE=work,voice:${d.phone}`,
      `EMAIL;TYPE=work:${d.email}`,
      `URL:${d.website}`,
      `ADR;TYPE=work:;;${escapeV(street)};${escapeV(city)};;${escapeV(zip)};Россия`,
      'END:VCARD'
    ].join('\n');
  }
  function parseAddr(s=''){
    // очень грубо: достаём улицу, город, индекс (если найдётся)
    const zipMatch = s.match(/\b\d{6}\b/);
    const zip = zipMatch ? zipMatch[0] : '';
    const cityMatch = s.match(/г\.\s*([А-ЯЁа-яёA-Za-z\-\s]+)/);
    const city = cityMatch ? cityMatch[1].trim() : '';
    const street = s.replace(zip, '').replace(cityMatch?.[0]||'', '').replace(/,+/g, ',').trim();
    return [street.replace(/^,|,$/g,''), city, zip];
  }
  function escapeV(str){return String(str).replace(/[,;]/g,'\\$&');}

  function showToast(text){
    if(!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(()=>toast.classList.remove('show'),1400);
  }
  async function copyToClipboard(text){
    try { await navigator.clipboard.writeText(text) }
    catch {
      const ta=document.createElement('textarea');
      ta.value=text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove();
    }
  }
  function flashValue(el){
    if(!el) return;
    const bg=el.style.backgroundColor;
    el.style.transition='background-color .25s ease';
    el.style.backgroundColor='rgba(173,255,2,.25)';
    setTimeout(()=> el.style.backgroundColor = bg || 'transparent', 250);
  }
  function confettiAt(target, count=18){
    const rect=target.getBoundingClientRect();
    const x=rect.left + rect.width/2;
    const y=rect.top + window.scrollY - 10;
    for(let i=0;i<count;i++){
      const p=document.createElement('span');
      p.style.position='absolute'; p.style.left=x+'px'; p.style.top=y+'px';
      p.style.width = p.style.height = (6+Math.random()*6)+'px';
      p.style.background = i%2 ? '#adff02' : getComputedStyle(document.body).getPropertyValue('--color-contrast-high');
      p.style.borderRadius='2px'; p.style.pointerEvents='none'; p.style.zIndex=9999;
      p.style.transform=`translate(-50%,-50%) rotate(${Math.random()*180}deg)`;
      document.body.appendChild(p);
      const dx=(Math.random()-.5)*160, dy=100+Math.random()*140, rot=Math.random()*600;
      p.animate([{transform:`translate(-50%,-50%) translate(0,0) rotate(0)`,opacity:1},
                 {transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${rot}deg)`,opacity:0}],
                 {duration:900+Math.random()*400,easing:'cubic-bezier(.2,.7,.2,1)'}).onfinish=()=>p.remove();
    }
  }
  function escapeHtml(str){return String(str).replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}
  function escapeAttr(str){return String(str).replace(/"/g,'&quot;')}
})();