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
 * テーブル描画（中央寄せレイアウト調整）
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  const listPageContent = document.getElementById("page-list-content");

  if(listBody) listBody.innerHTML = "";
  if(listPageContent) listPageContent.innerHTML = ""; 

  data.forEach(row => {
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');
    
    // PC用（中央に寄せるためのパディング調整を想定）
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="width:80px;">${row.id}</td>
      <td style="text-align:left; min-width:150px;"><strong>${row.name} 様</strong></td>
      <td style="width:120px;">
        <button onclick="openModal('${row.id}', 'view')" class="opt-btn" style="background:#e0f2fe; color:#0369a1; border:1px solid #bae6fd;">詳細・操作</button>
      </td>
      <td style="width:100px;"><span class="status-badge status-${safeStatus}">${row.status}</span></td>
      <td style="text-align:right; font-weight:bold; width:120px;">${totalDisplay}円</td>
      <td style="width:100px;">${row.shipping}</td>
      <td style="font-size:0.8rem; width:80px;">${row.s_a>0?'S':''}${row.g_a>0?'般':''}</td>
    `;
    if(listBody) listBody.appendChild(tr);

    // スマホ用
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
 * 詳細・編集モーダル
 */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;

  const body = document.getElementById("modal-body");
  const modalTitle = document.getElementById("modal-title");
  
  // 内訳の作成（0の場合は表示しない）
  let breakdown = "";
  if(p.s_a > 0) breakdown += `<div>S大人: ${p.s_a}枚</div>`;
  if(p.s_c > 0) breakdown += `<div>S子供: ${p.s_c}枚</div>`;
  if(p.g_a > 0) breakdown += `<div>一般大人: ${p.g_a}枚</div>`;
  if(p.g_c > 0) breakdown += `<div>一般子供: ${p.g_c}枚</div>`;

  if (mode === 'view') {
    modalTitle.innerText = "📋 予約詳細";
    const isQR = p.shipping.includes("QR");

    body.innerHTML = `
      <div style="display:flex; gap:8px; margin-bottom:15px;">
        <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#38a169; color:white; padding:10px; border-radius:6px; border:none;">📞 電話</button>
        <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3182ce; color:white; padding:10px; border-radius:6px; border:none;">✉️ メール</button>
      </div>

      <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0; line-height:1.6; font-size:0.95rem;">
        <div><strong>ID:</strong> ${p.id} / <strong>名前:</strong> ${p.name} 様</div>
        <hr style="border:0; border-top:1px solid #e2e8f0; margin:10px 0;">
        <div><strong>住所:</strong> 〒${p.zip || '---'}<br>${p.pref || ''}${p.city || ''}${p.rest || ''}</div>
        <div><strong>電話:</strong> ${p.tel}</div>
        <div><strong>メール:</strong> ${p.email}</div>
        <hr style="border:0; border-top:1px solid #e2e8f0; margin:10px 0;">
        <div style="color:#1e3a8a;"><strong>【注文内容】</strong><br>${breakdown}</div>
        <div style="text-align:right; font-size:1.2rem; color:#e53e3e; font-weight:bold; margin-top:10px;">合計: ${(Number(p.total)||0).toLocaleString()} 円</div>
        <div style="font-size:0.85rem; color:#64748b; margin-top:5px;">備考: ${p.remarks || 'なし'}</div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:15px;">
        <button onclick="updateStatus('${p.id}', '入金済み')" ${isQR && p.status==='入金済み' ? 'disabled style="background:#cbd5e0; color:#94a3b8;"' : 'style="background:#38a169; color:white;"'} class="action-btn">💰 入金確認</button>
        <button onclick="updateStatus('${p.id}', '完了')" style="background:#1e3a8a; color:white;" class="action-btn">🎟 発送/完了</button>
        <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white;" class="action-btn">✏️ 編集</button>
        <button onclick="deleteOrder('${p.id}')" style="background:#e53e3e; color:white;" class="action-btn">🗑 キャンセル</button>
      </div>
    `;
  } else {
    modalTitle.innerText = "✏️ 登録情報の編集";
    body.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left; max-height:70vh; overflow-y:auto; padding-right:5px;">
        <div style="background:#f1f5f9; padding:8px; border-radius:5px; font-weight:bold;">ID: ${p.id} / ${p.name} 様 (変更不可)</div>
        
        <div style="display:grid; grid-template-columns:100px 1fr; gap:10px; align-items:center;">
          <label>郵便番号</label>
          <input type="text" id="edit-zip" value="${p.zip || ''}" placeholder="1234567" onblur="autoZip(this.value)" style="padding:8px; border:1px solid #cbd5e0;">
          
          <label>住所(都道)</label><input type="text" id="edit-pref" value="${p.pref || ''}" style="padding:8px; border:1px solid #cbd5e0;">
          <label>住所(市区)</label><input type="text" id="edit-city" value="${p.city || ''}" style="padding:8px; border:1px solid #cbd5e0;">
          <label>住所(番地)</label><input type="text" id="edit-rest" value="${p.rest || ''}" style="padding:8px; border:1px solid #cbd5e0;">
          
          <label>電話番号</label><input type="tel" id="edit-tel" value="${p.tel || ''}" style="padding:8px; border:1px solid #cbd5e0;">
          <label>メール</label><input type="email" id="edit-email" value="${p.email || ''}" style="padding:8px; border:1px solid #cbd5e0;">
          
          <label>S大枚数</label><input type="number" id="edit-sa" value="${p.s_a}" oninput="reCalc()" style="padding:8px; border:1px solid #cbd5e0;">
          <label>S子枚数</label><input type="number" id="edit-sc" value="${p.s_c}" oninput="reCalc()" style="padding:8px; border:1px solid #cbd5e0;">
          <label>般大枚数</label><input type="number" id="edit-ga" value="${p.g_a}" oninput="reCalc()" style="padding:8px; border:1px solid #cbd5e0;">
          <label>般子枚数</label><input type="number" id="edit-gc" value="${p.g_c}" oninput="reCalc()" style="padding:8px; border:1px solid #cbd5e0;">
          
          <label>合計金額</label><input type="number" id="edit-total" value="${p.total}" style="padding:8px; background:#f8fafc; border:1px solid #cbd5e0;" readonly>
          
          <label>ステータス</label>
          <select id="edit-status" style="padding:8px; border:1px solid #cbd5e0;">
            <option value="未入金" ${p.status==='未入金'?'selected':''}>未入金</option>
            <option value="入金済み" ${p.status==='入金済み'?'selected':''}>入金済み</option>
            <option value="完了" ${p.status==='完了'?'selected':''}>完了</option>
            <option value="キャンセル" ${p.status==='キャンセル'?'selected':''}>キャンセル</option>
          </select>
        </div>
        
        <label>備考</label>
        <textarea id="edit-remarks" style="height:60px; padding:8px; border:1px solid #cbd5e0;">${p.remarks || ''}</textarea>
        
        <button onclick="saveFullEdit()" style="background:#1e3a8a; color:white; padding:15px; border-radius:8px; margin-top:10px; border:none; font-weight:bold; cursor:pointer;">💾 この内容で保存する</button>
      </div>
    `;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/**
 * 郵便番号からの自動入力
 */
async function autoZip(zip) {
  if (zip.length >= 7) {
    const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const data = await res.json();
    if (data.results) {
      document.getElementById("edit-pref").value = data.results[0].address1;
      document.getElementById("edit-city").value = data.results[0].address2 + data.results[0].address3;
    }
  }
}

/**
 * 枚数変更時の自動再計算
 */
function reCalc() {
  const sa = Number(document.getElementById("edit-sa").value) || 0;
  const sc = Number(document.getElementById("edit-sc").value) || 0;
  const ga = Number(document.getElementById("edit-ga").value) || 0;
  const gc = Number(document.getElementById("edit-gc").value) || 0;
  // 単価設定：Sエリア 3500円 / 一般 1500円 (必要に応じて修正してください)
  const total = (sa * 3500) + (sc * 3500) + (ga * 1500) + (gc * 1500);
  document.getElementById("edit-total").value = total;
}

/**
 * データの保存・操作
 */
async function saveFullEdit() {
  if(!confirm("内容を保存しますか？")) return;
  const data = {
    type: "editData", id: selectedId,
    zip: document.getElementById("edit-zip").value,
    pref: document.getElementById("edit-pref").value,
    city: document.getElementById("edit-city").value,
    rest: document.getElementById("edit-rest").value,
    tel: document.getElementById("edit-tel").value,
    email: document.getElementById("edit-email").value,
    s_a: document.getElementById("edit-sa").value, s_c: document.getElementById("edit-sc").value,
    g_a: document.getElementById("edit-ga").value, g_c: document.getElementById("edit-gc").value,
    total: document.getElementById("edit-total").value,
    status: document.getElementById("edit-status").value,
    remarks: document.getElementById("edit-remarks").value
  };
  await fetch(url, { method: "POST", body: JSON.stringify(data) });
  alert("データを更新しました");
  fetchData(); closeModal();
}

async function updateStatus(id, status) {
  if(!confirm(`ステータスを「${status}」に変更しますか？`)) return;
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
  fetchData(); closeModal();
}

async function deleteOrder(id) {
  if(!confirm("この予約をキャンセル扱いにしますか？")) return;
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" }) });
  fetchData(); closeModal();
}

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