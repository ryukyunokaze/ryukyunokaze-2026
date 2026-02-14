const url = "https://script.google.com/macros/s/AKfycbxQi_NtTx-33KDrUkC8jG9AAnh4zXfxerPzC-PJqhhGB46j3fw_YPhChbBTBG9PJV4cwg/exec"; 
let currentData = [];
let selectedId = "";

/**
 * 1. データの取得と反映
 */
async function fetchData() {
  const listDiv = document.getElementById("admin-list");
  if(listDiv) listDiv.innerHTML = "<p style='text-align:center; padding:30px; color:#94a3b8;'>最新データを読み込み中...</p>";
  try {
    const response = await fetch(`${url}?type=getAdmin`);
    const result = await response.json();
    currentData = result.orders.reverse(); 
    const setVal = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    
    // 基本統計
    setVal("stat-total-orders", result.stats.total_orders || 0);
    setVal("stat-total-persons", result.stats.total_persons || 0);
    setVal("stat-total-money", (Number(result.stats.total_money) || 0).toLocaleString());
    setVal("stat-paid-money", (Number(result.stats.paid_money) || 0).toLocaleString());

    // 集計反映
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
  } catch (e) { 
    console.error(e);
    if(listDiv) listDiv.innerHTML = "<p style='color:red;'>データ取得に失敗しました</p>";
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
 * 3. 詳細モーダル表示
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

    const totalTickets = Number(p.s_a) + Number(p.s_c) + Number(p.g_a) + Number(p.g_c);
    let qrHtml = "";

    if (p.status !== "未入金") {
      qrHtml += `<div style="background:#fffbeb; border:1px solid #fcd34d; padding:10px; border-radius:10px; margin-bottom:15px;">`;
      qrHtml += `<div style="font-size:0.75rem; font-weight:bold; color:#b45309; margin-bottom:10px; text-align:center;">🎫 入場用QRコード（枚数分：${totalTickets}個）</div>`;
      qrHtml += `<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">`;
      for (let i = 1; i <= totalTickets; i++) {
        const branchId = `${p.id}-${i}`;
        qrHtml += `
          <div style="text-align:center; background:#fff; padding:5px; border:1px solid #eee; border-radius:5px; width:100px;">
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${branchId}" style="width:80px; height:80px;">
            <div style="font-size:0.55rem; color:#666;">${branchId}</div>
          </div>`;
      }
      qrHtml += `</div></div>`;
    } else {
      qrHtml = `<p style="text-align:center; color:#94a3b8; font-size:0.8rem; margin:15px 0;">※入金後にQRコードが表示されます</p>`;
    }

    body.innerHTML = `
      ${headerHtml}
      <div style="font-size:0.85rem; line-height:1.6;">
        <div style="display:flex; gap:8px; margin-bottom:15px;">
          <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#10b981; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold;">📞 電話</button>
          <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3b82f6; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold;">✉️ メール</button>
        </div>
        <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:10px; border:1px solid #e2e8f0;">
          <div>💰 入金: ${p.paid_at || '未'} / 🚚 発送: ${p.sent_at || '未'}</div>
          <div>住所: 〒${p.zip||''} ${p.pref||''}${p.city||''}${p.rest||''}</div>
        </div>
        <div style="background:#fff; border:1px solid #e2e8f0; padding:10px; border-radius:8px; margin-bottom:10px;">
          <div style="font-weight:bold; color:#1e3a8a;">注文内訳 (受取: ${p.shipping})</div>
          <ul style="margin:5px 0; padding-left:20px;">${breakdown}</ul>
          <div style="text-align:right; font-weight:bold; color:#ef4444; font-size:1.1rem;">合計: ${(Number(p.total)||0).toLocaleString()} 円</div>
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
    body.innerHTML = `
      ${headerHtml}
      <div style="display:flex; flex-direction:column; gap:10px; max-height:60vh; overflow-y:auto; padding:5px;">
        <input type="text" id="edit-zip" value="${p.zip||''}" onblur="autoZip(this.value)" placeholder="郵便番号" style="padding:10px;">
        <input type="text" id="edit-pref" value="${p.pref||''}" placeholder="都道府県" style="padding:10px;">
        <input type="text" id="edit-city" value="${p.city||''}" placeholder="市区町村" style="padding:10px;">
        <input type="text" id="edit-rest" value="${p.rest||''}" placeholder="番地・建物" style="padding:10px;">
        <div style="background:#f8fafc; padding:10px; border-radius:10px; border:1px solid #e2e8f0;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div><label style="font-size:0.6rem;">S大人</label><input type="number" id="edit-sa" value="${p.s_a}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.6rem;">S子供</label><input type="number" id="edit-sc" value="${p.s_c}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.6rem;">一般大</label><input type="number" id="edit-ga" value="${p.g_a}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.6rem;">一般子</label><input type="number" id="edit-gc" value="${p.g_c}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
          </div>
          <div style="text-align:right; margin-top:10px; font-weight:bold; color:red;">合計: <span id="display-total">${(Number(p.total)||0).toLocaleString()}</span>円</div>
          <input type="hidden" id="edit-total" value="${p.total}">
        </div>
        <textarea id="edit-remarks" placeholder="備考" style="height:80px; padding:10px;">${p.remarks||''}</textarea>
        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:15px; border-radius:8px; font-weight:bold; border:none;">💾 保存</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/**
 * 4. 🖨️ A4縦4分割印刷用
 */
function printTicket(id) {
  const p = currentData.find(item => item.id === id);
  const totalTickets = Number(p.s_a) + Number(p.s_c) + Number(p.g_a) + Number(p.g_c);
  const printArea = document.getElementById("print-content");
  printArea.innerHTML = ""; 

  const logoUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026/logo.png"; 

  for (let i = 1; i <= totalTickets; i++) {
    const individualId = `${p.id}-${i}`;
    const ticketHtml = `
      <div class="ticket-page-wrapper" style="width:185mm; height:68mm; border:1px solid #333; margin:2mm auto; display:flex; font-family:sans-serif; background:#fff; page-break-inside:avoid; position:relative; text-align:left;">
        <div style="flex:3; padding:15px; border-right:1.5mm dashed #000; position:relative;">
          <img src="${logoUrl}" style="width:45px; float:left; margin-right:12px;" onerror="this.src='https://img.icons8.com/color/96/000000/island.png'">
          <div>
            <p style="font-size:0.65rem; margin:0; color:#666;">5th Anniversary performance "Mabui"</p>
            <h1 style="font-size:1.3rem; font-weight:bold; color:#1e3a8a; margin:0;">琉球の風 2026</h1>
          </div>
          <div style="margin-top:15px;">
            <div style="font-size:0.6rem; color:#999; font-family:monospace;">SERIAL: ${individualId}</div>
            <div style="font-size:1.15rem; font-weight:bold; border-bottom:1.5px solid #000; display:inline-block;">${p.name} 様</div>
            <p style="font-size:0.75rem; margin-top:8px;">本券1枚につき1名様有効 / 注文No: ${p.id}</p>
          </div>
          <div style="position:absolute; bottom:12px; right:20px; text-align:right;">
            <div style="font-size:0.6rem; color:#666;">Total (tax incl.)</div>
            <div style="font-size:1.4rem; font-weight:bold;">¥${Number(p.total).toLocaleString()}</div>
          </div>
        </div>
        <div style="flex:1; padding:10px; background:#fafafa; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div style="font-size:0.5rem; color:#999; margin-bottom:5px;">${individualId}</div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${individualId}" style="width:90px; height:90px; border:1px solid #eee; background:#fff;">
          <div style="font-size:0.6rem; font-weight:bold; margin-top:10px;">琉球の風 2026</div>
          <div style="font-size:0.55rem;">入場用QR</div>
        </div>
      </div>
    `;
    printArea.innerHTML += ticketHtml;
  }
  window.print();
}

/** 5. 補助関数 **/
async function handleStatusMail(id, action) {
  const p = currentData.find(item => item.id === id);
  const status = (action === 'PAYMENT') ? "入金済み" : "完了";
  if(!confirm(status + " に更新してメールを起動しますか？")) return;
  const subject = (action === 'PAYMENT') ? "【入金確認】琉球の風 2026 受領通知" : "【発送連絡】琉球の風 2026 チケットお届け";
  const mySiteUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026"; 
  const body = `${p.name} 様\n\n琉球の風 事務局です。\n${status}の処理が完了いたしました。\n\n${p.shipping.includes("QR") ? "▼QRコード表示URL\n" + mySiteUrl + "/qr.html?id=" + p.id + "-1" : "チケットは本日郵送いたしました。"}\n\n当日お待ちしております。`;
  const a = document.createElement('a');
  a.href = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  a.click();
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
  fetchData(); closeModal();
}
function reCalc() {
  const sa = Number(document.getElementById("edit-sa").value)||0; const sc = Number(document.getElementById("edit-sc").value)||0;
  const ga = Number(document.getElementById("edit-ga").value)||0; const gc = Number(document.getElementById("edit-gc").value)||0;
  const total = (sa+sc)*3500 + (ga+gc)*1500;
  document.getElementById("edit-total").value = total;
  document.getElementById("display-total").innerText = total.toLocaleString();
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
    type: "editData", id: selectedId, zip: document.getElementById("edit-zip").value, pref: document.getElementById("edit-pref").value, city: document.getElementById("edit-city").value, rest: document.getElementById("edit-rest").value, s_a: document.getElementById("edit-sa").value, s_c: document.getElementById("edit-sc").value, g_a: document.getElementById("edit-ga").value, g_c: document.getElementById("edit-gc").value, total: document.getElementById("edit-total").value, remarks: document.getElementById("edit-remarks").value
  };
  await fetch(url, { method: "POST", body: JSON.stringify(d) });
  fetchData(); closeModal();
}
function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
window.onload = fetchData;