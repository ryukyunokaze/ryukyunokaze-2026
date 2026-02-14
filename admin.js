const url = "https://script.google.com/macros/s/AKfycbzINaaOI2F6xP1UydVKDxrEjkCPiKplNf8qG5B2PNinenLU8ZDvGU0SijuyOpSZsdJDiA/exec"; 
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

    setVal("stat-total-orders", stats.total_orders);
    setVal("stat-total-persons", stats.total_persons);
    setVal("stat-total-money", stats.total_money.toLocaleString());
    setVal("stat-paid-money", stats.paid_money.toLocaleString());

    if (ana) {
      setVal("ana-takasaki", ana.region.gunma_takasaki);
      setVal("ana-gunma", ana.region.gunma_other);
      setVal("ana-outside", ana.region.out_of_pref);
      setVal("ana-child-orders", ana.with_child_count);
      setVal("ana-s-a", ana.area_details.s_area.adult);
      setVal("ana-s-c", ana.area_details.s_area.child);
      setVal("ana-s-money", ana.area_details.s_area.amount.toLocaleString());
      setVal("ana-g-a", ana.area_details.g_area.adult);
      setVal("ana-g-c", ana.area_details.g_area.child);
      setVal("ana-g-money", ana.area_details.g_area.amount.toLocaleString());
      setVal("ana-sales-online", ana.sales_type.online);
      setVal("ana-sales-direct", ana.sales_type.direct);
      setVal("ana-sales-door", ana.sales_type.door);
    }
      
    renderTable(currentData);
    
  } catch (e) {
    console.error("Fetch Error:", e);
    if(adminList) adminList.innerHTML = "<tr><td colspan='10' style='text-align:center; color:red;'>データ取得失敗。</td></tr>";
  }
}

/**
 * テーブル ＆ スマホ用スリムリスト描画
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  const listPage = document.getElementById("page-list");
  
  listBody.innerHTML = "";
  // 既存のスマホ用リストがあれば削除
  document.querySelectorAll('.mobile-row').forEach(el => el.remove());

  data.forEach(row => {
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');
    
    // --- 【PC用】テーブル行 (QR列は削除) ---
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
    listBody.appendChild(tr);

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
    listPage.appendChild(mRow);
  });
}

/**
 * 注文詳細（QRコードはここで一括表示）
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
          <button onclick="handleNotifyAction('${p.id}', 'PAYMENT')" style="background:#38a169; color:white; padding:12px; border-radius:8px; font-weight:bold; border:none;">💰 入金確認 ＆ ステータス更新</button>
          <button onclick="handleNotifyAction('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:12px; border-radius:8px; font-weight:bold; border:none;">🎟 QR・発送連絡 ＆ 完了</button>
        </div>

        <div style="background:#f8fafc; padding:12px; border-radius:8px; margin-bottom:15px; border:1px solid #cbd5e0;">
          <h5 style="margin:0 0 10px; font-size:12px; color:#64748b;">🎟 注文内訳 (受取: ${p.shipping || '---'})</h5>
          ${ticketRows}
          <div style="text-align:right; margin-top:10px; font-weight:bold; font-size:1.2rem; color:#e53e3e;">
            合計：${(Number(p.total) || 0).toLocaleString()} 円
          </div>
        </div>

        <div style="margin-top:20px; text-align:center;">
          <h5 style="margin:0 0 10px; font-size:12px; color:#64748b;">🎟 発行QRコード (${totalCount}枚分)</h5>
          <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
            ${generateQRHtml(p.id, totalCount)}
          </div>
        </div>
      </div>`;
  } else {
    // 編集モード（今のデザイン維持）
    document.getElementById("modal-title").innerText = "✏️ 内容の修正";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <label>お名前</label><input type="text" id="edit-name" value="${p.name || ''}" style="padding:10px; border:1px solid #ccc; border-radius:5px;">
        <label>電話番号</label><input type="tel" id="edit-tel" value="${p.tel || ''}" style="padding:10px; border:1px solid #ccc; border-radius:5px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div><label>S大</label><input type="number" id="edit-sa" value="${sa}" oninput="reCalcTotal()" style="width:100%; padding:10px;"></div>
          <div><label>S子</label><input type="number" id="edit-sc" value="${sc}" oninput="reCalcTotal()" style="width:100%; padding:10px;"></div>
          <div><label>般大</label><input type="number" id="edit-ga" value="${ga}" oninput="reCalcTotal()" style="width:100%; padding:10px;"></div>
          <div><label>般子</label><input type="number" id="edit-gc" value="${gc}" oninput="reCalcTotal()" style="width:100%; padding:10px;"></div>
        </div>
        <label>合計金額</label><input type="number" id="edit-total" value="${p.total || 0}" style="padding:10px; background:#eee;" readonly>
        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:15px; border-radius:8px; font-weight:bold; cursor:pointer; border:none; margin-top:10px;">💾 変更を保存して更新</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

function generateQRHtml(id, count) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${id}-${i}`;
    html += `<div style="text-align:center;"><img src="${qrUrl}" width="80"><br><span style="font-size:10px;">${i}/${count}</span></div>`;
  }
  return html || "<p style='color:#999;'>枚数0です</p>";
}

function filterTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  // PC用の絞り込み
  document.querySelectorAll("#admin-list tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
  });
  // スマホ用の絞り込み
  document.querySelectorAll(".mobile-row").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
  });
}

function showPage(page) {
  const listPage = document.getElementById('page-list');
  const analysisPage = document.getElementById('page-analysis');
  const btnList = document.getElementById('btn-list');
  const btnAna = document.getElementById('btn-analysis');

  if (page === 'list') {
    if(listPage) listPage.style.display = 'block';
    if(analysisPage) analysisPage.style.display = 'none';
    if(btnList) { btnList.classList.add('active'); }
    if(btnAna) { btnAna.classList.remove('active'); }
  } else {
    if(listPage) listPage.style.display = 'none';
    if(analysisPage) analysisPage.style.display = 'block';
    if(btnAna) { btnAna.classList.add('active'); }
    if(btnList) { btnList.classList.remove('active'); }
  }
}

async function handleNotifyAction(id, type) {
  const p = currentData.find(item => item.id === id);
  if (!p || !p.email) return alert("メールアドレスが見つかりません。");
  let nextStatus = (type === 'PAYMENT') ? "入金済み" : "完了";
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ type: "updateStatus", id: id, status: nextStatus })
    });
    if (response.ok) {
      let subject = (type === 'PAYMENT') ? "【入金確認】琉球の風 チケット代金受領のお知らせ" : "【重要】琉球の風 チケットQRコードのご案内";
      let body = `${p.name} 様\n\nお世話になっております。琉球の風 事務局です。\n\nステータスを「${nextStatus}」に更新いたしました。\n\n▼チケット表示はこちらから\nhttps://ryukyunokaze.github.io/ryukyunokaze-2026/qr.html?id=${p.id}`;
      window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      fetchData(); 
      closeModal();
    }
  } catch (e) { alert("更新に失敗しました。"); }
}

function reCalcTotal() {
  const sa = Number(document.getElementById("edit-sa").value) || 0;
  const sc = Number(document.getElementById("edit-sc").value) || 0;
  const ga = Number(document.getElementById("edit-ga").value) || 0;
  const gc = Number(document.getElementById("edit-gc").value) || 0;
  document.getElementById("edit-total").value = (sa * 3500) + (sc * 3500) + (ga * 1500) + (gc * 1500); 
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
function printList() { window.print(); }

async function saveEdit() {
  if(!confirm("変更を保存しますか？")) return;
  const data = {
    type: "editData", id: selectedId,
    name: document.getElementById("edit-name").value,
    tel: document.getElementById("edit-tel").value,
    s_a: document.getElementById("edit-sa").value, s_c: document.getElementById("edit-sc").value,
    g_a: document.getElementById("edit-ga").value, g_c: document.getElementById("edit-gc").value,
    total: document.getElementById("edit-total").value
  };
  try {
    await fetch(url, { method: "POST", body: JSON.stringify(data) });
    alert("保存が完了しました"); 
    closeModal(); fetchData();
  } catch (e) { alert("エラー: " + e); }
}

async function quickCancel(id) {
  if(!confirm("キャンセルしますか？")) return;
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" }) });
  fetchData();
}