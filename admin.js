const url = "https://script.google.com/macros/s/AKfycbxQi_NtTx-33KDrUkC8jG9AAnh4zXfxerPzC-PJqhhGB46j3fw_YPhChbBTBG9PJV4cwg/exec"; 
let currentData = [];
let selectedId = "";

/**
 * データの取得と反映
 */
async function fetchData() {
  const adminList = document.getElementById("admin-list");
  if(adminList) adminList.innerHTML = "<tr><td colspan='10' style='text-align:center;'>データ読み込み中...</td></tr>";

  try {
    const response = await fetch(`${url}?type=getAdmin`);
    const result = await response.json();
    
    currentData = result.orders.reverse(); 
    const stats = result.stats;
    const ana = result.analysis;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if(el) el.innerText = val;
    };

    // 数字がなくてもエラーにならないように「|| 0」を付けます
    setVal("stat-total-orders", stats.total_orders || 0);
    setVal("stat-total-persons", stats.total_persons || 0);
    setVal("stat-total-money", (Number(stats.total_money) || 0).toLocaleString());
    setVal("stat-paid-money", (Number(stats.paid_money) || 0).toLocaleString());

    if (ana) {
      setVal("ana-takasaki", ana.region.gunma_takasaki);
      setVal("ana-gunma", ana.region.gunma_other);
      setVal("ana-outside", ana.region.out_of_pref);
      setVal("ana-child-orders", ana.with_child_count);
      setVal("ana-s-a", ana.area_details.s_area.adult);
      setVal("ana-s-c", ana.area_details.s_area.child);
      setVal("ana-s-money", (ana.area_details.s_area.amount || 0).toLocaleString());
      setVal("ana-g-a", ana.area_details.g_area.adult);
      setVal("ana-g-c", ana.area_details.g_area.child);
      setVal("ana-g-money", (ana.area_details.g_area.amount || 0).toLocaleString());
      setVal("ana-sales-online", ana.sales_type.online);
      setVal("ana-sales-direct", ana.sales_type.direct);
      setVal("ana-sales-door", ana.sales_type.door);
    }
      
    renderTable(currentData);
    
  } catch (e) {
    console.error("Fetch Error:", e);
    if(adminList) adminList.innerHTML = "<tr><td colspan='10' style='text-align:center; color:red;'>データ取得失敗。詳細："+e.message+"</td></tr>";
  }
}

/**
 * テーブル ＆ スマホ用スリムリスト描画
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  const listPageContent = document.getElementById("page-list-content"); // 修正後のID

  if(listBody) listBody.innerHTML = "";
  if(listPageContent) listPageContent.innerHTML = ""; 

  data.forEach(row => {
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');
    
    // --- 【PC用】テーブル行 ---
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="print-only"></td> 
      <td>${row.id || '---'}</td>
      <td><strong>${row.name || '名前なし'}</strong></td>
      <td class="no-print">
        <button onclick="openModal('${row.id}', 'view')" class="opt-btn" style="padding:6px 10px; background:#ebfdf7; border:1px solid #c2eadd; border-radius:4px; cursor:pointer;">詳細</button>
      </td>
      <td><span class="status-badge status-${safeStatus}">${row.status || '未設定'}</span></td>
      <td class="no-print">${row.shipping || '---'}</td>
      <td class="print-only" style="font-weight: bold; text-align: right;">${totalDisplay}</td>
      <td class="no-print">${row.salesType || '---'}</td>
      <td style="font-size: 0.8rem;">${row.s_a > 0 ? 'S' : ''}${row.g_a > 0 ? '般' : ''}</td>
    `;
    if(listBody) listBody.appendChild(tr);

    // --- 【スマホ用】スリムリスト行 ---
    const mRow = document.createElement("div");
    mRow.className = "mobile-row no-print";
    mRow.onclick = () => openModal(row.id, 'view');
    mRow.innerHTML = `
      <div style="flex: 1;">
        <div style="font-size: 0.7rem; color: #94a3b8;">${row.id}</div>
        <div style="font-size: 1rem; font-weight: bold; color: #1e293b;">${row.name} 様</div>
      </div>
      <div style="text-align: right; min-width: 100px;">
        <span class="status-badge status-${safeStatus}" style="font-size: 0.7rem; padding: 2px 6px;">${row.status}</span>
        <div style="font-size: 0.9rem; font-weight: bold; color: #1e3a8a; margin-top: 4px;">${totalDisplay}円</div>
      </div>
    `;
    if(listPageContent) listPageContent.appendChild(mRow); 
  });
}

/**
 * モーダル等の他関数は変更なし（維持）
 */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;
  const body = document.getElementById("modal-body");
  const sa = Number(p.s_a) || 0;
  const sc = Number(p.s_c) || 0;
  const ga = Number(p.g_a) || 0;
  const gc = Number(p.g_c) || 0;
  const totalCount = sa + sc + ga + gc;
  if (mode === 'view') {
    document.getElementById("modal-title").innerText = "📋 予約詳細・操作";
    let ticketRows = "";
    if (sa > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Sエリア大人</span><span>${sa} 枚</span></div>`;
    if (sc > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Sエリア子供</span><span>${sc} 名</span></div>`;
    if (ga > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>一般エリア大人</span><span>${ga} 枚</span></div>`;
    if (gc > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>一般エリア子供</span><span>${gc} 名</span></div>`;
    body.innerHTML = `
      <div class="view-container">
        <div style="display:flex; gap:10px; margin-bottom:15px;">
          <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#38a169; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">📞 電話</button>
          <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3182ce; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">✉️ メール</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
          <button onclick="handleNotifyAction('${p.id}', 'PAYMENT')" style="background:#38a169; color:white; padding:12px; border-radius:8px; font-weight:bold; border:none;">💰 入金確認 ＆ 更新</button>
          <button onclick="handleNotifyAction('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:12px; border-radius:8px; font-weight:bold; border:none;">🎟 QR・発送連絡 ＆ 完了</button>
        </div>
        <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:15px; border:1px solid #cbd5e0;">
          <h5 style="margin:0 0 10px; font-size:12px; color:#64748b;">🎟 注文内訳</h5>
          ${ticketRows}
          <div style="text-align:right; margin-top:10px; font-weight:bold; font-size:1.2rem; color:#e53e3e;">合計：${(Number(p.total) || 0).toLocaleString()} 円</div>
        </div>
        <div style="margin-top:20px; text-align:center;">
          <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">${generateQRHtml(p.id, totalCount)}</div>
        </div>
      </div>`;
  } else {
    document.getElementById("modal-title").innerText = "✏️ 修正";
    body.innerHTML = `<p>編集機能準備中...</p>`; // 必要に応じて以前の編集用コードをここに
  }
  document.getElementById("detail-modal").style.display = "block";
}

function generateQRHtml(id, count) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${id}-${i}`;
    html += `<div style="text-align:center;"><img src="${qrUrl}" width="80"><br><span style="font-size:10px;">${i}/${count}</span></div>`;
  }
  return html || "<p>枚数0</p>";
}

function filterTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll("#admin-list tr").forEach(row => { row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none"; });
  document.querySelectorAll(".mobile-row").forEach(row => { row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none"; });
}

function showPage(page) {
  const listPage = document.getElementById('page-list');
  const analysisPage = document.getElementById('page-analysis');
  const btnList = document.getElementById('btn-list');
  const btnAna = document.getElementById('btn-analysis');
  if (page === 'list') {
    listPage.style.display = 'block'; analysisPage.style.display = 'none';
    btnList.classList.add('active'); btnAna.classList.remove('active');
  } else {
    listPage.style.display = 'none'; analysisPage.style.display = 'block';
    btnAna.classList.add('active'); btnList.classList.remove('active');
  }
}

async function handleNotifyAction(id, type) {
  const p = currentData.find(item => item.id === id);
  let nextStatus = (type === 'PAYMENT') ? "入金済み" : "完了";
  try {
    await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: nextStatus }) });
    fetchData(); closeModal();
  } catch (e) { alert("更新失敗"); }
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
function printList() { window.print(); }