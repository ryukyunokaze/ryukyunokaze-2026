const url = "https://script.google.com/macros/s/AKfycbzQzVpK70xJZcr34bQVsskN7-vP9Jy_sgX_WYzuK5oO3K6KNJfpm77smWSClJEfP1nWZA/exec"; 
let currentData = [];
let selectedId = "";
let masterPrices = {}; 

/**
 * 1. データの取得と反映
 */
async function fetchData() {
  const listDiv = document.getElementById("admin-list");
  if(listDiv) listDiv.innerHTML = "<p style='text-align:center; padding:30px; color:#94a3b8;'>読み込み中...</p>";
  
  try {
    const response = await fetch(`${url}?type=getAdmin`);
    const result = await response.json();
    
    currentData = result.orders.reverse(); 
    masterPrices = result.config; 

    const setVal = (id, val) => { 
      const el = document.getElementById(id);
      if(el) el.innerText = val; 
    };
    
    setVal("stat-total-orders", result.stats.total_orders || 0);
    setVal("stat-total-persons", result.stats.total_persons || 0);
    setVal("stat-total-money", (Number(result.stats.total_money) || 0).toLocaleString());
    setVal("stat-paid-money", (Number(result.stats.paid_money) || 0).toLocaleString());

    const ana = result.analysis;
    if (ana) {
      setVal("ana-child-orders", ana.with_child_count || 0);
      setVal("ana-takasaki", ana.region.gunma_takasaki || 0);
      setVal("ana-gunma", ana.region.gunma_other || 0);
      setVal("ana-outside", ana.region.out_of_pref || 0);
      setVal("ana-s-total", (ana.area_details.s_area.adult + ana.area_details.s_area.child) + " 名");
      setVal("ana-s-a", ana.area_details.s_area.adult || 0);
      setVal("ana-s-c", ana.area_details.s_area.child || 0);
      setVal("ana-g-total", (ana.area_details.g_area.adult + ana.area_details.g_area.child) + " 名");
      setVal("ana-g-a", ana.area_details.g_area.adult || 0);
      setVal("ana-g-c", ana.area_details.g_area.child || 0);
      setVal("ana-online", ana.sales_type.online || 0);
      setVal("ana-direct", ana.sales_type.direct || 0);
      setVal("ana-door", ana.sales_type.door || 0);
      setVal("ana-male", ana.gender.male || 0);
      setVal("ana-female", ana.gender.female || 0);
      setVal("ana-gender-other", ana.gender.other || 0);

      const ageContainer = document.getElementById("ana-age-list");
      if (ageContainer) {
        ageContainer.innerHTML = "";
        const ageOrder = ["10代", "20代", "30代", "40代", "50代", "60代", "70代以上"];
        ageOrder.forEach(age => {
          const count = (ana.age && ana.age[age]) ? ana.age[age] : 0;
          const row = document.createElement("div");
          row.className = "ana-row";
          row.innerHTML = `<span>${age}</span><strong>${count} 名</strong>`;
          ageContainer.appendChild(row);
        });
      }
    }
    renderList(currentData);
  } catch (e) { 
    console.error("データ取得エラー:", e); 
  }
}

/**
 * 2. 注文一覧の描画
 */
function renderList(data) {
  const listDiv = document.getElementById("admin-list");
  if(!listDiv) return;
  listDiv.innerHTML = "";
  data.forEach(row => {
    const statusClass = (row.status || "未入金").replace(/\s+/g, '');
    const item = document.createElement("div");
    item.className = "order-item";
    item.setAttribute("data-id", row.id); // 🌟 IDを確実に拾うための目印
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
* 🖨️ 表示されている名簿（一覧表）を印刷する
 */
function printOrderList() {
  const listItems = document.querySelectorAll(".order-item");
  let rows = "";
  let count = 0;

  listItems.forEach(item => {
    if (item.style.display !== "none") {
      const id = item.getAttribute("data-id"); 
      const p = currentData.find(d => d.id === id);
      
      if (p) {
        count++;
        
        // 🌟 チケット表示の組み立て（エリアが同じなら1行、違うなら2行）
        let displayArr = [];
        let s_tickets = [];
        if (Number(p.s_a) > 0) s_tickets.push(`大人 ${p.s_a}枚`);
        if (Number(p.s_c) > 0) s_tickets.push(`子供 ${p.s_c}枚`);
        if (s_tickets.length > 0) {
          displayArr.push(`<div style="color:#1e3a8a; white-space:nowrap;">[S] ${s_tickets.join(' ')}</div>`);
        }

        let g_tickets = [];
        if (Number(p.g_a) > 0) g_tickets.push(`大人 ${p.g_a}枚`);
        if (Number(p.g_c) > 0) g_tickets.push(`子供 ${p.g_c}枚`);
        if (g_tickets.length > 0) {
          displayArr.push(`<div style="color:#334155; white-space:nowrap;">[一般] ${g_tickets.join(' ')}</div>`);
        }

        const isUnpaid = (p.status === "未入金");
        const priceStyle = isUnpaid ? "color:#e11d48; font-weight:bold;" : "color:#334155;";
        const statusStyle = isUnpaid ? "background:#ffe4e6; color:#e11d48; font-weight:bold; border:1px solid #e11d48;" : "color:#334155;";

        // 🌟 ここが重要！ rows という文字の中に HTML を正しく組み立てます
        rows += `
          <tr>
            <td style="text-align:center; font-weight:bold;">${count}</td>
            <td>
              <strong style="font-size:1.1rem;">${p.name} 様</strong><br>
              <span style="font-size:0.7rem; color:#64748b;">ID: ${p.id}</span>
            </td>
            <td style="text-align:center; font-size:0.85rem;">${p.shipping || '-'}</td>
            <td style="font-weight:bold; line-height:1.2; font-size:0.85rem;">
              ${displayArr.join('') || "枚数なし"}
            </td>
            <td style="text-align:right; ${priceStyle} font-size:1.1rem;">
              ${(Number(p.total) || 0).toLocaleString()}円
            </td>
            <td style="text-align:center;">
              <div style="padding:4px; border-radius:4px; font-size:0.8rem; ${statusStyle}">
                ${p.status}
              </div>
            </td>
            <td style="width:70px; border-right:2px solid #000;"></td>
          </tr>`;
      }
    }
  });

  if (count === 0) {
    alert("表示中のデータがありません。");
    return;
  }

  const win = window.open('', '_blank');
  win.document.write(`
    <html><head><title>受付名簿</title>
    <style>
      @page { size: A4 portrait; margin: 8mm; }
      body { font-family: "Hiragino Kaku Gothic ProN", Meiryo, sans-serif; margin:0; padding:0; color:#1e293b; }
      h2 { margin: 0 0 8px 0; font-size: 1.5rem; border-bottom: 3px solid #1e3a8a; display:inline-block; }
      .meta { display:flex; justify-content:space-between; font-weight:bold; margin-bottom:10px; font-size:0.9rem; }
      table { width: 100%; border-collapse: collapse; table-layout: auto; }
      th { background: #f8fafc; border: 1px solid #333; border-bottom: 3px solid #333; padding: 8px 4px; font-size: 0.8rem; text-align:center; }
      td { border: 1px solid #333; padding: 6px 4px; vertical-align: middle; }
      tr:nth-child(even) { background: #f1f5f9; }
    </style></head>
    <body>
      <h2>琉球の風 2026 受付名簿</h2>
      <div class="meta">
        <span>出力日時: ${new Date().toLocaleString('ja-JP')}</span>
        <span>合計: ${count} 名</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:35px;">No</th>
            <th style="width:160px;">お名前 / ID</th>
            <th style="width:70px;">受取</th>
            <th>チケット種類・枚数</th>
            <th style="width:100px;">合計金額</th>
            <th style="width:80px;">状況</th>
            <th style="width:70px;">確認</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}
/**
 * 4. 詳細モーダル
 */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;
  const body = document.getElementById("modal-body");

  const statusColors = {
    "未入金": "#e11d48", "入金済み": "#10b981", "完了": "#1e3a8a", "キャンセル": "#64748b", "オキチケ": "#f59e0b"
  };
  const currentStatusColor = statusColors[p.status] || "#64748b";

  const headerHtml = `
    <div style="padding:15px; background:#f8fafc; border-radius:12px; border-bottom:2px solid #e2e8f0; margin-bottom:15px;">
      <div style="font-size:0.7rem; color:#94a3b8; margin-bottom:4px;">ID: ${p.id}</div>
      <div style="font-size:1.4rem; font-weight:bold; color:#1e293b; margin-bottom:8px;">${p.name} 様</div>
      <div style="display:inline-block; background:${currentStatusColor}; color:white; font-size:0.8rem; padding:5px 14px; border-radius:8px; font-weight:bold;">
        状況：${p.status || '未入金'}
      </div>
    </div>
  `;

  const paidStatus = (p.status === "入金済み" || p.status === "完了" || p.status === "オキチケ") ? p.paid_at : "未";
  const sentStatus = (p.status === "完了") ? p.sent_at : "未";

  if (mode === 'view') {
    let ticketDetailHtml = "";
    if (Number(p.s_a) > 0) ticketDetailHtml += `<div>S大人: ${p.s_a}枚</div>`;
    if (Number(p.s_c) > 0) ticketDetailHtml += `<div>S子供: ${p.s_c}枚</div>`;
    if (Number(p.g_a) > 0) ticketDetailHtml += `<div>一般大人: ${p.g_a}枚</div>`;
    if (Number(p.g_c) > 0) ticketDetailHtml += `<div>一般子供: ${p.g_c}枚</div>`;

    const totalCount = Number(p.s_a) + Number(p.s_c) + Number(p.g_a) + Number(p.g_c);
    let qrHtml = "";
    if (p.status !== "未入金" && p.status !== "キャンセル") {
      qrHtml += `<div style="background:#fffbeb; border:1px solid #fcd34d; padding:10px; border-radius:12px; margin-bottom:15px;">
                  <div style="font-size:0.75rem; font-weight:bold; color:#b45309; margin-bottom:10px; text-align:center;">入場用QR（${totalCount}個）</div>
                  <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">`;
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
      <div style="font-size:0.85rem; line-height:1.4;">
        <div style="display:flex; gap:10px; margin-bottom:12px;">
          <a href="tel:${p.tel}" style="flex:1; background:#10b981; color:white; padding:12px; border-radius:10px; text-decoration:none; text-align:center; font-weight:bold;">📞 電話</a>
          <a href="mailto:${p.email}" style="flex:1; background:#3b82f6; color:white; padding:12px; border-radius:10px; text-decoration:none; text-align:center; font-weight:bold;">✉️ メール</a>
        </div>
        <div style="background:#fff7ed; padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid #fed7aa;">
          <div style="font-size:0.75rem; font-weight:bold; color:#9a3412; margin-bottom:5px;">🎟️ 購入内容</div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div>${ticketDetailHtml}</div>
            <div style="text-align:right; font-size:1.2rem; color:#e11d48; font-weight:bold;">合計 ${(Number(p.total)||0).toLocaleString()}円</div>
          </div>
        </div>
        <div style="background:#f1f5f9; padding:12px; border-radius:12px; margin-bottom:12px; border:1px solid #e2e8f0;">
          <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
             <span style="font-weight:bold; color:#1e3a8a;">受取方法: ${p.shipping || '未設定'}</span>
             <span style="color:#64748b; font-size:0.75rem;">${p.timestamp}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="font-weight:bold;">💰 入金: ${paidStatus}</span>
            <span style="font-weight:bold;">🚚 発送: ${sentStatus}</span>
          </div>
          <div style="color:#475569; padding-top:5px; border-top:1px dashed #cbd5e1; margin-top:5px;">
            📍 〒${p.zip||''} ${p.pref||''}${p.city||''}${p.rest||''}
          </div>
        </div>
        <div style="background:#fff; padding:10px; border-radius:8px; border:1px solid #cbd5e1; margin-bottom:15px; font-size:0.8rem;">
          <strong>📝 備考:</strong><br>${(p.remarks || "なし").replace(/\n/g, '<br>')}
        </div>
        ${qrHtml}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:15px;">
          <button onclick="handleStatusMail('${p.id}', 'PAYMENT')" style="background:#10b981; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">入金＆メール</button>
          <button onclick="handleStatusMail('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">発送＆メール</button>
          <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">✏️ 編集</button>
          <button onclick="printTicket('${p.id}')" style="background:#000; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">🎫 印刷</button>
        </div>
        <button type="button" onclick="handleCancelStatus('${p.id}')" style="width:100%; margin-top:15px; background:#fff; color:#e11d48; padding:12px; border-radius:10px; font-weight:bold; border:2px solid #e11d48; cursor:pointer;">🚫 この注文をキャンセルする</button>
      </div>
    `;
  } else {
    body.innerHTML = `
      ${headerHtml}
      <div style="display:flex; flex-direction:column; gap:12px; max-height:75vh; overflow-y:auto; padding:5px;">
        <div style="background:#f0fdf4; padding:15px; border-radius:12px; border:1px solid #dcfce7;">
          <p style="font-size:0.75rem; font-weight:bold; color:#166534; margin:0 0 10px;">👤 連絡先編集</p>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <input type="text" id="edit-tel" value="${p.tel||''}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
            <input type="text" id="edit-email" value="${p.email||''}" style="width:100%; padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
          </div>
        </div>
        <div style="background:#f1f5f9; padding:15px; border-radius:12px; border:1px solid #e2e8f0;">
          <p style="font-size:0.75rem; font-weight:bold; color:#475569; margin:0 0 10px;">📍 お届け先</p>
          <input type="text" id="edit-zip" value="${p.zip||''}" onblur="autoZip(this.value)" placeholder="郵便番号" style="width:100%; padding:10px; margin-bottom:8px; border-radius:8px; border:1px solid #cbd5e1;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <input type="text" id="edit-pref" value="${p.pref||''}" placeholder="都道府県" style="padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
            <input type="text" id="edit-city" value="${p.city||''}" placeholder="市区町村" style="padding:10px; border-radius:8px; border:1px solid #cbd5e1;">
          </div>
          <input type="text" id="edit-rest" value="${p.rest||''}" placeholder="番地・建物名" style="width:100%; padding:10px; margin-top:8px; border-radius:8px; border:1px solid #cbd5e1;">
        </div>
        <div style="background:#fff7ed; padding:15px; border-radius:12px; border:1px solid #ffedd5;">
          <p style="font-size:0.75rem; font-weight:bold; color:#9a3412; margin:0 0 10px;">🎟️ 注文内容 & 受取</p>
          <select id="edit-shipping" style="width:100%; padding:10px; margin-bottom:12px; border-radius:8px;">
            <option value="郵送" ${p.shipping === '郵送' ? 'selected' : ''}>郵送</option>
            <option value="当日受取" ${p.shipping === '当日受取' ? 'selected' : ''}>当日受取</option>
            <option value="手渡し" ${p.shipping === '手渡し' ? 'selected' : ''}>手渡し</option>
          </select>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <input type="number" id="edit-sa" value="${p.s_a}" oninput="reCalc()">
            <input type="number" id="edit-sc" value="${p.s_c}" oninput="reCalc()">
            <input type="number" id="edit-ga" value="${p.g_a}" oninput="reCalc()">
            <input type="number" id="edit-gc" value="${p.g_c}" oninput="reCalc()">
          </div>
          <div style="margin-top:10px; padding-top:10px; border-top:1px dashed #fed7aa; display:flex; justify-content:space-between;">
            <span>合計</span><input type="number" id="edit-total" value="${p.total}" readonly style="border:none; color:#e11d48; font-weight:bold; width:100px; text-align:right;">
          </div>
        </div>
        <div style="background:#fff; padding:15px; border-radius:12px; border:1px solid #cbd5e1;">
          <p style="font-size:0.75rem; font-weight:bold; color:#334155; margin:0 0 10px;">📝 備考</p>
          <textarea id="edit-remarks" style="width:100%; height:120px; padding:10px; border-radius:8px;">${p.remarks||''}</textarea>
        </div>
        <button type="button" onclick="saveEdit()" style="width:100%; background:#1e3a8a; color:white; padding:16px; border-radius:10px; font-weight:bold; border:none; cursor:pointer;">💾 変更を保存</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/** 4. チケット印刷（個別） */
function printTicket(id) {
  const p = currentData.find(item => item.id === id);
  const printArea = document.getElementById("print-content");
  printArea.innerHTML = ""; 
  const logoUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026/logo.png"; 

  let tickets = [];
  for(let i=0; i < Number(p.s_a); i++) tickets.push({ type: "Sエリア (大人)", key: "s_a_price" });
  for(let i=0; i < Number(p.s_c); i++) tickets.push({ type: "Sエリア (子供)", key: "s_c_price" });
  for(let i=0; i < Number(p.g_a); i++) tickets.push({ type: "一般エリア (大人)", key: "g_a_price" });
  for(let i=0; i < Number(p.g_c); i++) tickets.push({ type: "一般エリア (子供)", key: "g_c_price" });

  tickets.forEach((t, index) => {
    const branchId = `${p.id}-${index + 1}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${branchId}`;
    const ticketDiv = document.createElement("div");
    ticketDiv.className = "ticket-page-wrapper";
    ticketDiv.innerHTML = `
      <div style="flex: 3; padding: 15px; border-right: 1.5mm dashed #000; text-align: left;">
        <img src="${logoUrl}" style="width: 50px; float: left; margin-right: 12px;">
        <p style="font-size: 0.65rem; margin: 0; color: #666;">RYUKYU NO KAZE 2026</p>
        <h1 style="font-size: 1.3rem; font-weight: bold; color: #1e3a8a; margin: 0;">琉球の風 2026</h1>
        <div style="margin-top: 15px;">
          <div style="font-size: 0.6rem; color: #999;">SERIAL: ${branchId}</div>
          <div style="font-size: 1.15rem; font-weight: bold; border-bottom: 1.5px solid #000; display: inline-block;">${p.name} 様</div>
          <div style="margin-top: 10px; font-size: 1.1rem; font-weight: bold; color: #1e3a8a;">【 ${t.type} 】</div>
        </div>
      </div>
      <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <img src="${qrUrl}" style="width: 85px; height: 85px;">
        <div style="font-size: 0.55rem; font-weight: bold; margin-top: 5px;">${t.type}</div>
      </div>`;
    printArea.appendChild(ticketDiv);
  });
  window.print();
}

/** 5. 補助関数群 */
async function handleStatusMail(id, action) {
  const p = currentData.find(item => item.id === id);
  const status = (action === 'PAYMENT') ? "入金済み" : "完了";
  if(!confirm(status + " に更新してメールを起動しますか？")) return;
  const replaceTags = (text) => text ? text.replace(/{event_title}/g, masterPrices.event_title || "").replace(/{name}/g, p.name || "") : "";
  const signature = "\n\n" + (masterPrices.mail_signature || "");
  let subject, bodyMain;
  if (action === 'PAYMENT') { subject = replaceTags(masterPrices.mail_pay_sub); bodyMain = replaceTags(masterPrices.mail_pay_body); }
  else { const isQR = p.shipping.includes("QR"); subject = replaceTags(isQR ? masterPrices.mail_sent_sub_qr : masterPrices.mail_sent_sub_post); bodyMain = replaceTags(isQR ? masterPrices.mail_sent_body_qr : masterPrices.mail_sent_body_post); }
  const mySiteUrl = window.location.origin + window.location.pathname.replace("admin.html", "");
  const qrUrl = p.shipping.includes("QR") ? `\n\n▼チケット表示URL\n${mySiteUrl}qr.html?id=${p.id}` : "";
  const fullBody = `${p.name} 様\n\n${bodyMain}${qrUrl}${signature}`;
  window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`;
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
  fetchData(); closeModal();
}

function reCalc() {
  const sa = parseInt(document.getElementById('edit-sa').value) || 0;
  const sc = parseInt(document.getElementById('edit-sc').value) || 0;
  const ga = parseInt(document.getElementById('edit-ga').value) || 0;
  const gc = parseInt(document.getElementById('edit-gc').value) || 0;
  let total = (sa * (masterPrices.s_a_price || 0)) + (sc * (masterPrices.s_c_price || 0)) + (ga * (masterPrices.g_a_price || 0)) + (gc * (masterPrices.g_c_price || 0));
  const today = new Date(); today.setHours(0,0,0,0);
  if (today >= new Date(masterPrices.event_date)) total += (sa + ga) * (Number(masterPrices.door_ticket_fee) || 0);
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
    if (d.results) { document.getElementById("edit-pref").value = d.results[0].address1; document.getElementById("edit-city").value = d.results[0].address2 + d.results[0].address3; }
  }
}

async function saveEdit() {
  const d = {
    type: "editData", id: selectedId,
    tel: document.getElementById("edit-tel").value,
    email: document.getElementById("edit-email").value,
    zip: document.getElementById("edit-zip").value,
    pref: document.getElementById("edit-pref").value,
    city: document.getElementById("edit-city").value,
    rest: document.getElementById("edit-rest").value,
    shipping: document.getElementById("edit-shipping").value,
    s_a: document.getElementById("edit-sa").value,
    s_c: document.getElementById("edit-sc").value,
    g_a: document.getElementById("edit-ga").value,
    g_c: document.getElementById("edit-gc").value,
    total: document.getElementById("edit-total").value,
    remarks: document.getElementById("edit-remarks").value
  };
  const response = await fetch(url, { method: "POST", body: JSON.stringify(d) });
  const res = await response.json();
  if(res.result === "success") { alert("更新しました"); fetchData(); closeModal(); }
}

async function handleCancelStatus(id) {
  if (!window.confirm("キャンセル状態にしますか？")) return;
  const response = await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" }) });
  const res = await response.json();
  if (res.result === "success") { alert("完了"); fetchData(); closeModal(); }
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
window.onload = fetchData;