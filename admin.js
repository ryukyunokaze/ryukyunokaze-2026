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

    // 基本統計
    setVal("stat-total-orders", stats.total_orders || 0);
    setVal("stat-total-persons", stats.total_persons || 0);
    setVal("stat-total-money", (Number(stats.total_money) || 0).toLocaleString());
    setVal("stat-paid-money", (Number(stats.paid_money) || 0).toLocaleString());

    // 分析データ（集計ページ用）
    if (ana) {
      setVal("ana-takasaki", ana.region.gunma_takasaki || 0);
      setVal("ana-gunma", ana.region.gunma_other || 0);
      setVal("ana-outside", ana.region.out_of_pref || 0);
      setVal("ana-child-orders", ana.with_child_count || 0);
      setVal("ana-s-a", ana.area_details.s_area.adult || 0);
      setVal("ana-s-c", ana.area_details.s_area.child || 0);
      setVal("ana-s-money", (ana.area_details.s_area.amount || 0).toLocaleString());
      setVal("ana-g-a", ana.area_details.g_area.adult || 0);
      setVal("ana-g-c", ana.area_details.g_area.child || 0);
      setVal("ana-g-money", (ana.area_details.g_area.amount || 0).toLocaleString());
      setVal("ana-sales-online", ana.sales_type.online || 0);
      setVal("ana-sales-direct", ana.sales_type.direct || 0);
      setVal("ana-sales-door", ana.sales_type.door || 0);
    }
      
    renderTable(currentData);
    
  } catch (e) {
    console.error("Fetch Error:", e);
    if(adminList) adminList.innerHTML = "<tr><td colspan='10' style='text-align:center; color:red;'>データ取得失敗</td></tr>";
  }
}

/**
 * テーブル描画（スクロール対応）
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  const listPageContent = document.getElementById("page-list-content");

  if(listBody) listBody.innerHTML = "";
  if(listPageContent) listPageContent.innerHTML = ""; 

  data.forEach(row => {
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');
    
    // PC用テーブル行
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="print-only"></td> 
      <td>${row.id || '---'}</td>
      <td><strong>${row.name || '名前なし'}</strong></td>
      <td class="no-print">
        <button onclick="openModal('${row.id}', 'view')" class="opt-btn">詳細</button>
        <button onclick="openModal('${row.id}', 'edit')" class="opt-btn" style="background:#fef3c7; color:#92400e;">編集</button>
      </td>
      <td><span class="status-badge status-${safeStatus}">${row.status || '未設定'}</span></td>
      <td class="no-print">${row.shipping || '---'}</td>
      <td class="no-print">${row.salesType || '---'}</td>
      <td style="font-size: 0.8rem;">${row.s_a > 0 ? 'S' : ''}${row.g_a > 0 ? '般' : ''}</td>
    `;
    if(listBody) listBody.appendChild(tr);

    // スマホ用スリムリスト
    const mRow = document.createElement("div");
    mRow.className = "mobile-row no-print";
    mRow.onclick = () => openModal(row.id, 'view');
    mRow.innerHTML = `
      <div style="flex: 1;">
        <div style="font-size: 0.7rem; color: #94a3b8;">${row.id}</div>
        <div style="font-size: 1rem; font-weight: bold;">${row.name} 様</div>
      </div>
      <div style="text-align: right;">
        <span class="status-badge status-${safeStatus}">${row.status}</span>
        <div style="font-weight: bold; color: #1e3a8a; margin-top: 4px;">${totalDisplay}円</div>
      </div>
    `;
    if(listPageContent) listPageContent.appendChild(mRow); 
  });
}

/**
 * ページ切り替え機能
 */
function showPage(page) {
  const listPage = document.getElementById('page-list');
  const analysisPage = document.getElementById('page-analysis');
  const btnList = document.getElementById('btn-list');
  const btnAna = document.getElementById('btn-analysis');

  if (page === 'list') {
    listPage.style.display = 'block';
    analysisPage.style.display = 'none';
    btnList.classList.add('active');
    btnAna.classList.remove('active');
  } else {
    listPage.style.display = 'none';
    analysisPage.style.display = 'block';
    btnAna.classList.add('active');
    btnList.classList.remove('active');
  }
}

/**
 * 詳細・編集モーダル
 */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;

  const body = document.getElementById("modal-body");
  const modalTitle = document.getElementById("modal-title");
  
  if (mode === 'view') {
    modalTitle.innerText = "📋 予約詳細";
    body.innerHTML = `
      <div style="display:flex; gap:10px; margin-bottom:15px;">
        <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#38a169; color:white; padding:12px; border:none; border-radius:8px;">📞 電話</button>
        <button onclick="handleNotifyAction('${p.id}', 'PAYMENT')" style="flex:1; background:#1e3a8a; color:white; padding:12px; border:none; border-radius:8px;">💰 入金済みへ</button>
      </div>
      <div style="background:#f1f5f9; padding:15px; border-radius:8px;">
        <p><strong>名前:</strong> ${p.name} 様</p>
        <p><strong>合計:</strong> ${Number(p.total).toLocaleString()} 円</p>
        <p><strong>受取:</strong> ${p.shipping}</p>
        <p><strong>状態:</strong> ${p.status}</p>
      </div>
    `;
  } else {
    modalTitle.innerText = "✏️ 内容の編集";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <label>お名前</label><input type="text" id="edit-name" value="${p.name}" style="padding:10px; border:1px solid #ccc;">
        <label>合計金額</label><input type="number" id="edit-total" value="${p.total}" style="padding:10px; border:1px solid #ccc;">
        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:12px; border:none; border-radius:8px; margin-top:10px;">💾 保存する</button>
      </div>
    `;
  }
  document.getElementById("detail-modal").style.display = "block";
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }

async function saveEdit() {
  const data = {
    type: "editData",
    id: selectedId,
    name: document.getElementById("edit-name").value,
    total: document.getElementById("edit-total").value
  };
  await fetch(url, { method: "POST", body: JSON.stringify(data) });
  alert("保存しました");
  closeModal();
  fetchData();
}

async function handleNotifyAction(id, type) {
  const status = (type === 'PAYMENT') ? "入金済み" : "完了";
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
  fetchData();
  closeModal();
}

window.onload = fetchData;