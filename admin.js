const url = "https://script.google.com/macros/s/AKfycbxQi_NtTx-33KDrUkC8jG9AAnh4zXfxerPzC-PJqhhGB46j3fw_YPhChbBTBG9PJV4cwg/exec"; 
let currentData = [];
let selectedId = "";

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
      setVal("ana-takasaki", ana.region.gunma_takasaki);
      setVal("ana-gunma", ana.region.gunma_other);
      setVal("ana-outside", ana.region.out_of_pref);
      setVal("ana-child-orders", ana.with_child_count);
      setVal("ana-s-a", ana.area_details.s_area.adult);
      setVal("ana-s-c", ana.area_details.s_area.child);
      setVal("ana-g-a", ana.area_details.g_area.adult);
      setVal("ana-g-c", ana.area_details.g_area.child);
    }
    renderList(currentData);
  } catch (e) { console.error(e); }
}

function renderList(data) {
  const listDiv = document.getElementById("admin-list");
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

function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;
  const body = document.getElementById("modal-body");
  
  // 共通ヘッダー（ID小さく、名前太字）
  const headerHtml = `
    <div style="padding: 12px; background: #f8fafc; border-radius: 10px; border-bottom: 2px solid #e2e8f0; margin-bottom: 15px;">
        <div style="font-size: 0.7rem; color: #94a3b8;">${p.id}</div>
        <div style="font-size: 1.1rem; font-weight: bold; color: #1e293b;">${p.name} 様</div>
    </div>
  `;

  if (mode === 'view') {
    let breakdown = "";
    if(p.s_a > 0) breakdown += `<li>S席 大人: ${p.s_a}枚</li>`;
    if(p.s_c > 0) breakdown += `<li>S席 子供: ${p.s_c}枚</li>`;
    if(p.g_a > 0) breakdown += `<li>一般 大人: ${p.g_a}枚</li>`;
    if(p.g_c > 0) breakdown += `<li>一般 子供: ${p.g_c}枚</li>`;

    body.innerHTML = `
      ${headerHtml}
      <div style="font-size:0.85rem; line-height:1.6;">
        <div style="display:flex; gap:10px; margin-bottom:15px;">
          <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#10b981; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">📞 電話する</button>
          <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3b82f6; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">✉️ メールする</button>
        </div>
        <div style="background:#f1f5f9; padding:10px; border-radius:8px;">
          <div><strong>住所:</strong> 〒${p.zip||''} ${p.pref||''}${p.city||''}${p.rest||''}</div>
          <hr style="border:none; border-top:1px dashed #cbd5e0; margin:8px 0;">
          <div style="font-weight:bold; color:#1e3a8a;">【注文内訳】</div>
          <ul style="margin:5px 0; padding-left:20px;">${breakdown}</ul>
          <div style="text-align:right; font-size:1.1rem; color:#ef4444; font-weight:bold;">合計: ${(Number(p.total)||0).toLocaleString()} 円</div>
        </div>
        <div style="margin-top:10px; padding:8px; background:#fffbeb; border-radius:5px; border:1px solid #fde68a;">備考: ${p.remarks || 'なし'}</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:20px;">
        <button onclick="updateStatus('${p.id}', '入金済み')" style="background:#10b981; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">💰 入金確認</button>
        <button onclick="updateStatus('${p.id}', '完了')" style="background:#1e3a8a; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">🎟 発送/完了</button>
        <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">✏️ 編集</button>
        <button onclick="deleteOrder('${p.id}')" style="background:#ef4444; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">🗑 削除</button>
      </div>
    `;
  } else {
    body.innerHTML = `
      ${headerHtml}
      <div style="display:flex; flex-direction:column; gap:12px; max-height:70vh; overflow-y:auto; padding:5px;">
        <div>
          <label style="font-size:0.7rem; color:#64748b;">郵便番号・住所</label>
          <input type="text" id="edit-zip" value="${p.zip||''}" onblur="autoZip(this.value)" placeholder="郵便番号" style="width:100%; padding:8px; margin-bottom:5px;">
          <input type="text" id="edit-pref" value="${p.pref||''}" placeholder="都道府県" style="width:100%; padding:8px; margin-bottom:5px;">
          <input type="text" id="edit-city" value="${p.city||''}" placeholder="市区町村" style="width:100%; padding:8px; margin-bottom:5px;">
          <input type="text" id="edit-rest" value="${p.rest||''}" placeholder="番地・建物" style="width:100%; padding:8px;">
        </div>
        
        <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
          <div style="font-weight:bold; font-size:0.8rem; margin-bottom:10px; color:#1e3a8a;">🎟 チケット枚数入力</div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div><label style="font-size:0.7rem;">Sエリア 大人</label><input type="number" id="edit-sa" value="${p.s_a}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.7rem;">Sエリア 子供</label><input type="number" id="edit-sc" value="${p.s_c}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.7rem;">一般エリア 大人</label><input type="number" id="edit-ga" value="${p.g_a}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.7rem;">一般エリア 子供</label><input type="number" id="edit-gc" value="${p.g_c}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
          </div>
          <div style="margin-top:10px; text-align:right; font-weight:bold;">合計金額: <span id="display-total" style="color:red;">${(Number(p.total)||0).toLocaleString()}</span> 円</div>
          <input type="hidden" id="edit-total" value="${p.total}">
        </div>

        <div>
          <label style="font-size:0.7rem; color:#64748b;">備考欄 (広め)</label>
          <textarea id="edit-remarks" style="width:100%; height:120px; padding:10px; border:1px solid #cbd5e0; border-radius:5px; box-sizing:border-box;">${p.remarks||''}</textarea>
        </div>

        <select id="edit-status" style="padding:10px; border-radius:5px;">
          <option value="未入金" ${p.status==='未入金'?'selected':''}>未入金</option>
          <option value="入金済み" ${p.status==='入金済み'?'selected':''}>入金済み</option>
          <option value="完了" ${p.status==='完了'?'selected':''}>完了</option>
          <option value="キャンセル" ${p.status==='キャンセル'?'selected':''}>キャンセル</option>
        </select>

        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:15px; border-radius:8px; font-weight:bold; border:none; cursor:pointer;">💾 保存する</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

// 金額再計算
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

async function updateStatus(id, s) { if(confirm(s + " に更新しますか？")) { await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: s }) }); fetchData(); closeModal(); } }
async function deleteOrder(id) { if(confirm("削除しますか？")) { await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" }) }); fetchData(); closeModal(); } }
async function saveEdit() {
  const d = {
    type: "editData", id: selectedId, zip: document.getElementById("edit-zip").value, pref: document.getElementById("edit-pref").value, city: document.getElementById("edit-city").value, rest: document.getElementById("edit-rest").value, tel: document.getElementById("edit-tel").value, email: document.getElementById("edit-email").value, s_a: document.getElementById("edit-sa").value, s_c: document.getElementById("edit-sc").value, g_a: document.getElementById("edit-ga").value, g_c: document.getElementById("edit-gc").value, total: document.getElementById("edit-total").value, status: document.getElementById("edit-status").value, remarks: document.getElementById("edit-remarks").value
  };
  await fetch(url, { method: "POST", body: JSON.stringify(d) });
  fetchData(); closeModal();
}
function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
window.onload = fetchData;