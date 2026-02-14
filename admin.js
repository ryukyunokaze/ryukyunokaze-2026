const url = "https://script.google.com/macros/s/AKfycbxQi_NtTx-33KDrUkC8jG9AAnh4zXfxerPzC-PJqhhGB46j3fw_YPhChbBTBG9PJV4cwg/exec"; 
let currentData = [];
let selectedId = "";

/**
 * データの取得と反映
 */
async function fetchData() {
  const adminList = document.getElementById("admin-list");
  if(adminList) adminList.innerHTML = "<tr><td colspan='10' style='text-align:center;'>読み込み中...</td></tr>";

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

    // 統計・分析データの反映（左寄り防止のため数値を整える）
    setVal("stat-total-orders", stats.total_orders || 0);
    setVal("stat-total-persons", stats.total_persons || 0);
    setVal("stat-total-money", (Number(stats.total_money) || 0).toLocaleString());
    setVal("stat-paid-money", (Number(stats.paid_money) || 0).toLocaleString());

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
  }
}

/**
 * テーブル描画（PC・スマホ両対応）
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  const listPageContent = document.getElementById("page-list-content");

  if(listBody) listBody.innerHTML = "";
  if(listPageContent) listPageContent.innerHTML = ""; 

  data.forEach(row => {
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');
    
    // PC用テーブル行（レイアウト調整：右寄せなどを指定）
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.id}</td>
      <td style="text-align:left;"><strong>${row.name} 様</strong></td>
      <td>
        <button onclick="openModal('${row.id}', 'view')" class="opt-btn" style="background:#e0f2fe; color:#0369a1;">詳細・操作</button>
      </td>
      <td><span class="status-badge status-${safeStatus}">${row.status}</span></td>
      <td style="text-align:right; font-weight:bold;">${totalDisplay}円</td>
      <td>${row.shipping}</td>
      <td style="font-size:0.8rem;">${row.s_a>0?'S':''}${row.g_a>0?'般':''}</td>
    `;
    if(listBody) listBody.appendChild(tr);

    // スマホ用行
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
 * 詳細・編集・操作モーダル
 */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;

  const body = document.getElementById("modal-body");
  const modalTitle = document.getElementById("modal-title");
  
  if (mode === 'view') {
    modalTitle.innerText = "📋 予約詳細・一括操作";
    const isQR = p.shipping.includes("QR");
    
    body.innerHTML = `
      <div style="display:flex; gap:8px; margin-bottom:15px;">
        <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#38a169; color:white; padding:10px; border-radius:6px; border:none;">📞 電話</button>
        <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3182ce; color:white; padding:10px; border-radius:6px; border:none;">✉️ メール</button>
      </div>

      <div style="background:#f8fafc; padding:12px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:15px;">
        <div style="display:flex; justify-content:space-between;"><span>受付番号:</span> <strong>${p.id}</strong></div>
        <div style="display:flex; justify-content:space-between;"><span>お名前:</span> <strong>${p.name} 様</strong></div>
        <div style="display:flex; justify-content:space-between;"><span>合計金額:</span> <strong style="color:red;">${(Number(p.total)||0).toLocaleString()} 円</strong></div>
        <div style="display:flex; justify-content:space-between;"><span>受取方法:</span> <strong>${p.shipping}</strong></div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:15px;">
        <button onclick="updateStatus('${p.id}', '入金済み')" ${isQR && p.status==='入金済み' ? 'disabled style="background:#ccc;"' : 'style="background:#38a169; color:white;"'} class="action-btn">💰 入金確認</button>
        <button onclick="updateStatus('${p.id}', '完了')" style="background:#1e3a8a; color:white;" class="action-btn">🎟 発送/完了</button>
        <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white;" class="action-btn">✏️ 全データ修正</button>
        <button onclick="deleteOrder('${p.id}')" style="background:#e53e3e; color:white;" class="action-btn">🗑 キャンセル/削除</button>
      </div>
    `;
  } else {
    modalTitle.innerText = "✏️ 全データの修正";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:8px;">
        <label style="font-size:0.8rem;">名前</label><input type="text" id="edit-name" value="${p.name}">
        <label style="font-size:0.8rem;">電話</label><input type="tel" id="edit-tel" value="${p.tel}">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:5px;">
          <label>S大</label><input type="number" id="edit-sa" value="${p.s_a}">
          <label>S子</label><input type="number" id="edit-sc" value="${p.s_c}">
          <label>般大</label><input type="number" id="edit-ga" value="${p.g_a}">
          <label>般子</label><input type="number" id="edit-gc" value="${p.g_c}">
        </div>
        <label>ステータス</label>
        <select id="edit-status" style="padding:8px; border-radius:5px;">
          <option value="未入金" ${p.status==='未入金'?'selected':''}>未入金</option>
          <option value="入金済み" ${p.status==='入金済み'?'selected':''}>入金済み</option>
          <option value="完了" ${p.status==='完了'?'selected':''}>完了</option>
          <option value="キャンセル" ${p.status==='キャンセル'?'selected':''}>キャンセル</option>
        </select>
        <label>合計金額</label><input type="number" id="edit-total" value="${p.total}">
        <button onclick="saveFullEdit()" style="background:#1e3a8a; color:white; padding:12px; border-radius:8px; margin-top:10px; border:none; font-weight:bold;">💾 この内容で上書き保存</button>
      </div>
    `;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/**
 * データの操作関数
 */
async function updateStatus(id, status) {
  if(!confirm(`ステータスを「${status}」に変更しますか？`)) return;
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
  fetchData(); closeModal();
}

async function saveFullEdit() {
  const data = {
    type: "editData", id: selectedId,
    name: document.getElementById("edit-name").value,
    tel: document.getElementById("edit-tel").value,
    s_a: document.getElementById("edit-sa").value, s_c: document.getElementById("edit-sc").value,
    g_a: document.getElementById("edit-ga").value, g_c: document.getElementById("edit-gc").value,
    total: document.getElementById("edit-total").value,
    status: document.getElementById("edit-status").value
  };
  await fetch(url, { method: "POST", body: JSON.stringify(data) });
  alert("データを更新しました");
  fetchData(); closeModal();
}

async function deleteOrder(id) {
  if(!confirm("この予約をキャンセル（削除扱い）にしますか？")) return;
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" }) });
  fetchData(); closeModal();
}

/**
 * ページ切り替え
 */
function showPage(page) {
  const listPage = document.getElementById('page-list');
  const analysisPage = document.getElementById('page-analysis');
  if(page === 'list') {
    listPage.style.display = 'block'; analysisPage.style.display = 'none';
    document.getElementById('btn-list').classList.add('active');
    document.getElementById('btn-analysis').classList.remove('active');
  } else {
    listPage.style.display = 'none'; analysisPage.style.display = 'block';
    document.getElementById('btn-analysis').classList.add('active');
    document.getElementById('btn-list').classList.remove('active');
  }
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
window.onload = fetchData;