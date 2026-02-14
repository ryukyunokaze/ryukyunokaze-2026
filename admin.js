const url = "https://script.google.com/macros/s/AKfycbzINaaOI2F6xP1UydVKDxrEjkCPiKplNf8qG5B2PNinenLU8ZDvGU0SijuyOpSZsdJDiA/exec"; 
let currentData = [];
let selectedId = "";

/**
 * 起動時にパスワードを確認してからデータを取得
 */
window.onload = () => {
  // 🌟 パスワード入力（この数字はadmin.html側と合わせておくとスムーズです）
  const password = prompt("管理者パスワードを入力してください");

  if (password === "000000") { 
    fetchData(); 
  } else {
    alert("パスワードが正しくありません。");
    document.body.innerHTML = `
      <div style="text-align:center; margin-top:100px; font-family:sans-serif;">
        <h1>🔒 Access Denied</h1>
        <p>正しいパスワードを入力してページを再読み込みしてください。</p>
        <button onclick="location.reload()" style="padding:10px 20px; cursor:pointer;">再試行</button>
      </div>`;
  }
};

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

    // 🌟 IDが存在する場合のみ代入（エラー防止用の補助関数）
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if(el) el.innerText = val;
    };

    // 統計カードの更新
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
 * テーブル描画（今のレイアウトを維持）
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  listBody.innerHTML = "";
  
  data.forEach(row => {
    let sAreaParts = [];
    if (Number(row.s_a) > 0) sAreaParts.push(`S大${row.s_a}`);
    if (Number(row.s_c) > 0) sAreaParts.push(`S子${row.s_c}`);
    
    let gAreaParts = [];
    if (Number(row.g_a) > 0) gAreaParts.push(`般大${row.g_a}`);
    if (Number(row.g_c) > 0) gAreaParts.push(`般子${row.g_c}`);

    let displayLines = [];
    if (sAreaParts.length > 0) displayLines.push(`${sAreaParts.join(' ')}`);
    if (gAreaParts.length > 0) displayLines.push(`${gAreaParts.join(' ')}`);
    
    const countsDisplay = displayLines.join('<br>') || "---";
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="print-only"></td> 
      <td>${row.id || '---'}</td>
      <td><strong>${row.name || '名前なし'}</strong></td>
      
      <td class="no-print" style="min-width: 150px;">
        <div style="display: flex; gap: 4px;">
          <button onclick="openModal('${row.id}', 'view')" class="opt-btn" style="padding: 6px; background:#ebfdf7; border:1px solid #c2eadd; border-radius:4px; cursor:pointer;">詳細</button>
          <button onclick="openModal('${row.id}', 'edit')" class="opt-btn" style="padding: 6px; background:#d6e5ff; border:1px solid #b8cfff; border-radius:4px; cursor:pointer;">編集</button>
          <button onclick="quickCancel('${row.id}')" class="opt-btn btn-del" style="padding: 6px; background:#ffdde7; border:1px solid #ffb8cf; border-radius:4px; cursor:pointer;">消</button>
        </div>
      </td>

      <td><span class="status-badge status-${safeStatus}">${row.status || '未設定'}</span></td>
      <td class="no-print">${row.shipping || '---'}</td>
      <td class="print-only" style="font-weight: bold; text-align: right;">${totalDisplay}</td>
      <td class="no-print">${row.salesType || '---'}</td>
      <td style="font-size: 0.8rem;">${countsDisplay}</td>
      <td class="no-print">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${row.id}" width="40" height="40" style="background:#eee; vertical-align:middle;">
      </td>
    `;
    listBody.appendChild(tr);
  });
}

/**
 * 注文詳細（今のデザインのまま、QRコードを表示）
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
    document.getElementById("modal-title").innerText = "📋 注文詳細・操作";
    
    let ticketRows = "";
    if (sa > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Sエリア大人</span><span>${sa} 枚</span></div>`;
    if (sc > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>Sエリア子供</span><span>${sc} 名</span></div>`;
    if (ga > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>一般エリア大人</span><span>${ga} 枚</span></div>`;
    if (gc > 0) ticketRows += `<div style="display:flex; justify-content:space-between; margin-bottom:5px;"><span>一般エリア子供</span><span>${gc} 名</span></div>`;

    body.innerHTML = `
      <div class="view-container">
        <div style="display:flex; gap:10px; margin-bottom:15px;">
          <button onclick="location.href='tel:${p.tel || ''}'" style="flex:1; background:#38a169; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">📞 電話</button>
          <button onclick="location.href='mailto:${p.email || ''}'" style="flex:1; background:#3182ce; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">✉️ メール</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:15px;">
          <button onclick="handleNotifyAction('${p.id}', 'PAYMENT')" style="background:#38a169; color:white; padding:12px; border-radius:8px; font-weight:bold; border:none; cursor:pointer;">💰 入金確認メール ＆ 更新</button>
          <button onclick="handleNotifyAction('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; border:none;">🎟 QR・発送連絡メール ＆ 完了</button>
        </div>

        <div style="background:#f8fafc; padding:12px; border:radius:8px; margin-bottom:15px; border:1px solid #cbd5e0;">
          <h5 style="margin:0 0 10px; font-size:12px; color:#64748b;">🎟 注文内訳 (合計: ${(Number(p.total) || 0).toLocaleString()} 円)</h5>
          ${ticketRows}
        </div>

        <div style="margin-top:10px; text-align:center;">
          <h5 style="margin:0 0 10px; font-size:12px; color:#64748b;">🎟 チケット用QRコード</h5>
          <div style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
            ${generateQRHtml(p.id, totalCount)}
          </div>
        </div>
      </div>`;
  } else {
    // 編集モード（今のデザイン維持）
    document.getElementById("modal-title").innerText = "✏️ 注文内容の編集";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <label>お名前</label><input type="text" id="edit-name" value="${p.name || ''}" style="padding:8px;">
        <label>電話番号</label><input type="tel" id="edit-tel" value="${p.tel || ''}" style="padding:8px;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div><label>S大</label><input type="number" id="edit-sa" value="${sa}" oninput="reCalcTotal()" style="width:100%; padding:8px;"></div>
          <div><label>S子</label><input type="number" id="edit-sc" value="${sc}" oninput="reCalcTotal()" style="width:100%; padding:8px;"></div>
          <div><label>般大</label><input type="number" id="edit-ga" value="${ga}" oninput="reCalcTotal()" style="width:100%; padding:8px;"></div>
          <div><label>般子</label><input type="number" id="edit-gc" value="${gc}" oninput="reCalcTotal()" style="width:100%; padding:8px;"></div>
        </div>
        <label>合計金額</label><input type="number" id="edit-total" value="${p.total || 0}" style="padding:8px; background:#eee;" readonly>
        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; border:none; margin-top:10px;">💾 変更を保存する</button>
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
  return html || "<p>枚数0です</p>";
}

/**
 * ページ切り替え（バグ修正済み）
 */
function showPage(page) {
  const listPage = document.getElementById('page-list');
  const analysisPage = document.getElementById('page-analysis');
  const btnList = document.getElementById('btn-list');
  const btnAna = document.getElementById('btn-analysis');

  if (page === 'list') {
    if(listPage) listPage.style.display = 'block';
    if(analysisPage) analysisPage.style.display = 'none';
    if(btnList) { btnList.style.background = '#1e3a8a'; btnList.style.color = 'white'; }
    if(btnAna) { btnAna.style.background = '#edf2f7'; btnAna.style.color = '#1a202c'; }
  } else {
    if(listPage) listPage.style.display = 'none';
    if(analysisPage) analysisPage.style.display = 'block';
    if(btnAna) { btnAna.style.background = '#805ad5'; btnAna.style.color = 'white'; }
    if(btnList) { btnList.style.background = '#edf2f7'; btnList.style.color = '#1a202c'; }
  }
}

/**
 * メール送信 & ステータス更新（今の機能を維持）
 */
async function handleNotifyAction(id, type) {
  const p = currentData.find(item => item.id === id);
  if (!p || !p.email) return alert("メールアドレスが取得できません。");

  let nextStatus = (type === 'PAYMENT') ? "入金済み" : "完了";
  
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ type: "updateStatus", id: id, status: nextStatus })
    });
    
    if (response.ok) {
      let subject = (type === 'PAYMENT') ? "【入金確認】代金のお支払いを確認いたしました" : "【重要】チケットQRコードのご送付";
      let body = `${p.name} 様\n\nご入金を確認いたしました。\nステータスを「${nextStatus}」に更新しました。\n\n▼チケット表示URL（仮）\nhttps://ryukyunokaze.github.io/ryukyunokaze-2026/qr.html?id=${p.id}`;

      const mailtoLink = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      const a = document.createElement('a');
      a.href = mailtoLink;
      a.click();

      alert(`ステータスを「${nextStatus}」に更新しました。`);
      fetchData(); 
      closeModal();
    }
  } catch (e) {
    alert("更新エラーが発生しました。");
  }
}

// 補助機能
function filterTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll("#admin-list tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
  });
}

function reCalcTotal() {
  const sa = Number(document.getElementById("edit-sa").value) || 0;
  const sc = Number(document.getElementById("edit-sc").value) || 0;
  const ga = Number(document.getElementById("edit-ga").value) || 0;
  const gc = Number(document.getElementById("edit-gc").value) || 0;
  // 単価設定（必要に応じて調整してください）
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