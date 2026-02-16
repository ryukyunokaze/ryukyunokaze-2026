const url = "https://script.google.com/macros/s/AKfycbzhfkeHtk-ZPN3iSA5Chi_t46JqVG_6YGjxas0MgySYSM9Ypau_c8AxhGxfmVWCgd1LNw/exec"; 
let currentData = [];
let selectedId = "";

/**
 * 1. データの取得と反映（統計・集計機能維持）
 */
async function fetchData() {
  const listDiv = document.getElementById("admin-list");
  if(listDiv) listDiv.innerHTML = "<p style='text-align:center; padding:30px; color:#94a3b8;'>読み込み中...</p>";
  try {
    const response = await fetch(`${url}?type=getAdmin`);
    const result = await response.json();
    currentData = result.orders.reverse(); 
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    
    setVal("stat-total-orders", result.stats.total_orders || 0);
    setVal("stat-total-persons", result.stats.total_persons || 0);
    setVal("stat-total-money", (Number(result.stats.total_money) || 0).toLocaleString());
    setVal("stat-paid-money", (Number(result.stats.paid_money) || 0).toLocaleString());

    const ana = result.analysis;
    if (ana) {
      setVal("ana-takasaki", ana.region.gunma_takasaki || 0);
      setVal("ana-gunma", ana.region.gunma_other || 0);
      setVal("ana-outside", ana.region.out_of_pref || 0);
      setVal("ana-child-orders", ana.with_child_count || 0);
      setVal("ana-s-a", ana.area_details.s_area.adult || 0);
      setVal("ana-s-c", ana.area_details.s_area.child || 0);
      setVal("ana-g-a", ana.area_details.g_area.adult || 0);
      setVal("ana-g-c", ana.area_details.g_area.child || 0);
    }
    renderList(currentData);
  } catch (e) { console.error(e); }
}

/**
 * 2. 注文一覧の描画（クリックで詳細表示維持）
 */
function renderList(data) {
  const listDiv = document.getElementById("admin-list");
  if(!listDiv) return;
  listDiv.innerHTML = "";
  data.forEach(row => {
    const statusClass = (row.status || "未入金").replace(/\s+/g, '');
    const item = document.createElement("div");
    item.className = "order-item";
    item.onclick = () => openModal(row.id, 'view');
    item.innerHTML = `
      <div>
        <div style="font-size:0.65rem; color:#94a3b8;">${row.id}</div>
        <div style="font-weight:bold; font-size:1rem;">${row.name} 様</div>
      </div>
      <div style="text-align:right;">
        <span class="status-badge status-${statusClass}">${row.status}</span>
        <div style="font-weight:bold; color:#1e3a8a; font-size:0.9rem; margin-top:3px;">${(Number(row.total)||0).toLocaleString()}円</div>
      </div>
    `;
    listDiv.appendChild(item);
  });
}

/**
 * 3. 詳細モーダル（QRコード人数分表示・住所表示維持）
 */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;
  const body = document.getElementById("modal-body");
  const mySiteUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026"; 

  const headerHtml = `
    <div style="padding:12px; background:#f8fafc; border-radius:10px; border-bottom:2px solid #e2e8f0; margin-bottom:15px;">
      <div style="font-size:0.7rem; color:#94a3b8;">${p.id}</div>
      <div style="font-size:1.1rem; font-weight:bold;">${p.name} 様</div>
    </div>
  `;

  if (mode === 'view') {
    let breakdown = "";
    if(p.s_a > 0) breakdown += `<li>S大人: ${p.s_a}枚</li>`;
    if(p.s_c > 0) breakdown += `<li>S子供: ${p.s_c}名</li>`;
    if(p.g_a > 0) breakdown += `<li>一般大: ${p.g_a}枚</li>`;
    if(p.g_c > 0) breakdown += `<li>一般子: ${p.g_c}名</li>`;

    const totalCount = Number(p.s_a) + Number(p.s_c) + Number(p.g_a) + Number(p.g_c);
    let qrHtml = "";

    if (p.status !== "未入金") {
      qrHtml += `<div style="background:#fffbeb; border:1px solid #fcd34d; padding:10px; border-radius:12px; margin-bottom:15px;">`;
      qrHtml += `<div style="font-size:0.75rem; font-weight:bold; color:#b45309; margin-bottom:10px; text-align:center;">入場用QR（${totalCount}個）</div>`;
      qrHtml += `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">`;
      for (let i = 1; i <= totalCount; i++) {
        const branchId = `${p.id}-${i}`;
        qrHtml += `<div style="text-align:center; background:#fff; padding:5px; border:1px solid #eee; border-radius:5px; width:100px;">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${branchId}" style="width:80px; height:80px;">
          <div style="font-size:0.55rem; color:#666;">${branchId}</div>
        </div>`;
      }
      qrHtml += `</div></div>`;
    }

    body.innerHTML = `
      ${headerHtml}
      <div style="font-size:0.85rem; line-height:1.6;">
        <div style="display:flex; gap:8px; margin-bottom:15px;">
          <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#10b981; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold;">📞 電話</button>
          <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3b82f6; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold;">✉️ メール</button>
        </div>
        <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:10px;">
          <div>💰 入金: ${p.paid_at || '未'} / 🚚 発送: ${p.sent_at || '未'}</div>
          <div>住所: 〒${p.zip||''} ${p.pref||''}${p.city||''}${p.rest||''}</div>
        </div>
        ${qrHtml}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:15px;">
          <button onclick="handleStatusMail('${p.id}', 'PAYMENT')" style="background:#10b981; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">入金＆メール</button>
          <button onclick="handleStatusMail('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">発送＆メール</button>
          <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">✏️ 編集</button>
          <button onclick="printTicket('${p.id}')" style="background:#000; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">🎫 ぴあ風印刷</button>
        </div>
      </div>
    `;
  } else {
    // 編集モード（住所自動入力維持）
    body.innerHTML = `
      ${headerHtml}
      <div style="display:flex; flex-direction:column; gap:10px; max-height:60vh; overflow-y:auto; padding:5px;">
        <input type="text" id="edit-zip" value="${p.zip||''}" onblur="autoZip(this.value)" placeholder="郵便番号" style="padding:10px;">
        <input type="text" id="edit-pref" value="${p.pref||''}" placeholder="都道府県" style="padding:10px;">
        <input type="text" id="edit-city" value="${p.city||''}" placeholder="市区町村" style="padding:10px;">
        <input type="text" id="edit-rest" value="${p.rest||''}" placeholder="番地・建物" style="padding:10px;">
        <textarea id="edit-remarks" placeholder="備考" style="height:80px; padding:10px;">${p.remarks||''}</textarea>
        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:15px; border-radius:8px; font-weight:bold; border:none;">💾 保存</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/**
 * 4. 🖨️ チケット印刷（【今回の修正】大人・子供・単価を反映）
 */
function printTicket(id) {
  const p = currentData.find(item => item.id === id);
  const printArea = document.getElementById("print-content");
  printArea.innerHTML = ""; 
  const logoUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026/logo.png"; 

  // 🌟 チケット1枚ごとの種別と単価を振り分けるロジック
  let tickets = [];
  for(let i=0; i < Number(p.s_a); i++) tickets.push({ type: "Sエリア (大人)", price: 3500 });
  for(let i=0; i < Number(p.s_c); i++) tickets.push({ type: "Sエリア (子供)", price: 1500 });
  for(let i=0; i < Number(p.g_a); i++) tickets.push({ type: "一般エリア (大人)", price: 1500 });
  for(let i=0; i < Number(p.g_c); i++) tickets.push({ type: "一般エリア (子供)", price: 1500 });

  tickets.forEach((t, index) => {
    const branchId = `${p.id}-${index + 1}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${branchId}`;
    const ticketDiv = document.createElement("div");
    ticketDiv.className = "ticket-page-wrapper";
    ticketDiv.innerHTML = `
      <div style="flex: 3; padding: 15px; border-right: 1.5mm dashed #000; position: relative; text-align: left;">
        <img src="${logoUrl}" style="width: 50px; float: left; margin-right: 12px;" onerror="this.src='https://img.icons8.com/color/96/000000/island.png'">
        <div>
          <p style="font-size: 0.65rem; margin: 0; color: #666;">RYUKYU NO KAZE ~OKINAWA MATSURI IN TAKASAKI~2026</p>
          <h1 style="font-size: 1.3rem; font-weight: bold; color: #1e3a8a; margin: 0;">琉球の風 2026</h1>
        </div>
        <div style="margin-top: 15px;">
          <div style="font-size: 0.6rem; color: #999; font-family: monospace;">SERIAL: ${branchId}</div>
          <div style="font-size: 1.15rem; font-weight: bold; border-bottom: 1.5px solid #000; display: inline-block;">${p.name} 様</div>
          <div style="margin-top: 10px; font-size: 1.1rem; font-weight: bold; color: #1e3a8a;">【 ${t.type} 】</div>
          <p style="font-size: 0.75rem; margin-top: 5px;">本券1枚につき指定の1名様のみ有効</p>
        </div>
        <div style="position: absolute; bottom: 12px; right: 20px; text-align: right;">
          <div style="font-size: 0.6rem; color: #666;">Ticket Price (tax incl.)</div>
          <div style="font-size: 1.3rem; font-weight: bold;">¥${(masterPrices[t.type.includes("Sエリア") ? (t.type.includes("大人") ? "s_a_price" : "s_c_price") : (t.type.includes("大人") ? "g_a_price" : "g_c_price")] || t.price).toLocaleString()}</div>
        </div>
      </div>
      <div style="flex: 1; padding: 10px; background: #fafafa; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
        <div style="font-size: 0.5rem; color: #999; margin-bottom: 3px;">${branchId}</div>
        <img src="${qrUrl}" style="width: 85px; height: 85px; border: 1px solid #eee; background: #fff;">
        <div style="font-size: 0.6rem; font-weight: bold; margin-top: 10px;">琉球の風 2026</div>
        <div style="font-size: 0.55rem; font-weight: bold; color: #1e3a8a;">${t.type.includes("大人") ? "大人" : "子供"}</div>
      </div>`;
    printArea.appendChild(ticketDiv);
  });
  window.print();
}

/** 5. 補助関数（メール・住所検索・再計算維持） **/
/** 5. 補助関数（メール・住所検索・再計算維持） **/
async function handleStatusMail(id, action) {
  const p = currentData.find(item => item.id === id);
  const status = (action === 'PAYMENT') ? "入金済み" : "完了";
  
  if(!confirm(status + " に更新してメールを起動しますか？")) return;

  const replaceTags = (text) => {
    if (!text) return "";
    return text
      .replace(/{event_title}/g, masterPrices.event_title || "").replace(/{name}/g, p.name || "");
  };

  const signature = "\n\n" + (masterPrices.mail_signature || "");
  let subject, bodyMain;

  if (action === 'PAYMENT') {
    subject = replaceTags(masterPrices.mail_pay_sub);
    bodyMain = replaceTags(masterPrices.mail_pay_body);
  } else {
    // 受取方法（郵送 or QR）によってシートの項目を自動選択
    const isQR = p.shipping.includes("QR");
    subject = replaceTags(isQR ? masterPrices.mail_sent_sub_qr : masterPrices.mail_sent_sub_post);
    bodyMain = replaceTags(isQR ? masterPrices.mail_sent_body_qr : masterPrices.mail_sent_body_post);
  }

  const mySiteUrl = window.location.origin + window.location.pathname.replace("admin.html", "");
  const qrUrl = p.shipping.includes("QR") ? `\n\n▼QRコード表示URL\n${mySiteUrl}qr.html?id=${p.id}-1` : "";

  const fullBody = `${p.name} 様\n\n${bodyMain}${qrUrl}${signature}`;

  // メーラーを起動
  window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;

  // ステータスを更新
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
  fetchData(); 
  closeModal();
} // 🌟 ここが抜けていた閉じカッコです

function reCalc() {
  const sa = parseInt(document.getElementById('edit-sa').value) || 0;
  const sc = parseInt(document.getElementById('edit-sc').value) || 0;
  const ga = parseInt(document.getElementById('edit-ga').value) || 0;
  const gc = parseInt(document.getElementById('edit-gc').value) || 0;

  // 1. 基本単価で計算
  let total = (sa * (masterPrices.s_a_price || 0)) + (sc * (masterPrices.s_c_price || 0)) + 
              (ga * (masterPrices.g_a_price || 0)) + (gc * (masterPrices.g_c_price || 0));

  // 2. 日付判定
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(masterPrices.event_date);
  eventDate.setHours(0, 0, 0, 0);

  if (today >= eventDate) {
    const doorFee = Number(masterPrices.door_ticket_fee) || 0;
    total += (sa + ga) * doorFee;
  }
  document.getElementById('edit-total').value = total;
}

function showPage(p) {
  document.getElementById('page-list').style.display = (p==='list')?'block':'none';
  document.getElementById('page-analysis').style.display = (p==='analysis')?'block':'none';
  document.getElementById('btn-list').classList.toggle('active', p==='list');
  document.getElementById('btn-analysis').classList.toggle('active', p==='analysis');
}

function filterTable() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll(".order-item").forEach(item => { item.style.display = item.innerText.toLowerCase().includes(q) ? "flex" : "none"; });
}

async function autoZip(z) {
  if (z.length >= 7) {
    const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${z}`);
    const d = await r.json();
    if (d.results) { 
      document.getElementById("edit-pref").value = d.results[0].address1; 
      document.getElementById("edit-city").value = d.results[0].address2 + d.results[0].address3; 
    }
  }
}

async function saveEdit() {
  const d = {
    type: "editData", 
    id: selectedId, 
    zip: document.getElementById("edit-zip").value, 
    pref: document.getElementById("edit-pref").value, 
    city: document.getElementById("edit-city").value, 
    rest: document.getElementById("edit-rest").value, 
    s_a: document.getElementById("edit-sa").value, 
    s_c: document.getElementById("edit-sc").value, 
    g_a: document.getElementById("edit-ga").value, 
    g_c: document.getElementById("edit-gc").value, 
    total: document.getElementById("edit-total").value, 
    remarks: document.getElementById("edit-remarks").value
  };
  await fetch(url, { method: "POST", body: JSON.stringify(d) });
  fetchData(); 
  closeModal();
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
window.onload = fetchData;