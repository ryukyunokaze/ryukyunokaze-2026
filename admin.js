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
      setVal("ana-takasaki", ana.region.gunma_takasaki || 0);
      setVal("ana-gunma", ana.region.gunma_other || 0);
      setVal("ana-outside", ana.region.out_of_pref || 0);
      setVal("ana-child-orders", ana.with_child_count || 0);
      setVal("ana-s-a", ana.area_details.s_area.adult || 0);
      setVal("ana-s-c", ana.area_details.s_area.child || 0);
      setVal("ana-g-a", ana.area_details.g_area.adult || 0);
      setVal("ana-g-c", ana.area_details.g_area.child || 0);
      setVal("ana-s-money", (ana.area_details.s_area.amount || 0).toLocaleString());
      setVal("ana-g-money", (ana.area_details.g_area.amount || 0).toLocaleString());
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
        <div style="font-weight:bold;">${row.name} 様</div>
      </div>
      <div style="text-align:right;">
        <span class="status-badge status-${statusClass}">${row.status}</span>
        <div style="font-weight:bold; color:#1e3a8a; font-size:0.9rem;">${(Number(row.total)||0).toLocaleString()}円</div>
      </div>
    `;
    listDiv.appendChild(item);
  });
}

/**
 * 🌟 メール起動 ＆ ステータス更新
 */
async function handleStatusMail(id, action) {
  const p = currentData.find(item => item.id === id);
  if (!p || !p.email) return alert("メールアドレスが登録されていません。");

  const status = (action === 'PAYMENT') ? "入金済み" : "完了";
  const now = new Date().toLocaleString("ja-JP");
  
  if(!confirm(status + " に更新してメール画面を起動しますか？")) return;

  // 1. 先にメーラーを起動（ブラウザのブロックを防ぐため）
  let subject = (action === 'PAYMENT') ? "【入金確認】琉球の風 2026 受領のお知らせ" : "【重要】琉球の風 2026 チケット発送のご案内";
  let body = `${p.name} 様\n\nお世話になっております。琉球の風 事務局です。\n${status}の処理が完了いたしました。\n\n${p.shipping.includes("QR") ? "▼QRコード表示はこちら\nhttps://ryukyunokaze.github.io/ryukyunokaze-2026/qr.html?id="+p.id : "郵送にてお届けいたしますので、到着まで少々お待ちください。"}\n\n当日お会いできるのを楽しみにしております。`;
  
  const mailtoUrl = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // 安全なメーラー起動
  const a = document.createElement('a');
  a.href = mailtoUrl;
  a.click();

  // 2. その後、GAS側のステータスを更新
  try {
    await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status, date: now }) });
    fetchData(); 
    closeModal();
  } catch (e) {
    alert("ステータス更新に失敗しました。手動で更新してください。");
  }
}

function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;
  const body = document.getElementById("modal-body");

  / 🌟 GitHub PagesのURL（QR表示ページの場所）
  const mySiteUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026"; 
  const userQrUrl = `${mySiteUrl}/qr.html?id=${p.id}`;
  
  const headerHtml = `
    <div style="padding:12px; background:#f8fafc; border-radius:10px; border-bottom:2px solid #e2e8f0; margin-bottom:15px;">
      <div style="font-size:0.7rem; color:#94a3b8;">${p.id}</div>
      <div style="font-size:1.1rem; font-weight:bold;">${p.name} 様</div>
    </div>
  `;

  if (mode === 'view') {
    const isQR = (p.shipping || "").includes("QR");
    let breakdown = "";
    if(p.s_a > 0) breakdown += `<li>S 大人: ${p.s_a}枚</li>`;
    if(p.s_c > 0) breakdown += `<li>S 子供: ${p.s_c}名</li>`;
    if(p.g_a > 0) breakdown += `<li>一般 大人: ${p.g_a}枚</li>`;
    if(p.g_c > 0) breakdown += `<li>一般 子供: ${p.g_c}名</li>`;

    body.innerHTML = `
      ${headerHtml}
      <div style="font-size:0.85rem; line-height:1.6;">
        <div style="display:flex; gap:8px; margin-bottom:15px;">
          <button onclick="location.href='tel:${p.tel}'" style="flex:1; background:#10b981; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold;">📞 電話</button>
          <button onclick="location.href='mailto:${p.email}'" style="flex:1; background:#3b82f6; color:white; padding:10px; border:none; border-radius:8px; font-weight:bold;">✉️ メール</button>
        </div>

        <div style="background:#f1f5f9; padding:10px; border-radius:8px; margin-bottom:10px;">
          <div>受付: ${p.timestamp || '---'}</div>
          <div>入金: ${p.paid_at || '未'} / 発送: ${p.sent_at || '未'}</div>
          <hr style="border:none; border-top:1px dashed #ccc;">
          <div>住所: 〒${p.zip||''} ${p.pref||''}${p.city||''}${p.rest||''}</div>
        </div>

        <div style="background:#fff; border:1px solid #e2e8f0; padding:10px; border-radius:8px;">
          <div style="font-weight:bold; color:#1e3a8a;">内訳 (${p.shipping})</div>
          <ul style="margin:5px 0;">${breakdown}</ul>
          <div style="text-align:right; font-weight:bold; color:#ef4444; font-size:1.1rem;">合計: ${(Number(p.total)||0).toLocaleString()} 円</div>
        </div>

        ${p.status === "入金済み" || p.status === "完了" ? `
          <div style="background:#fffbeb; border:1px solid #fcd34d; padding:10px; border-radius:8px; text-align:center; margin-bottom:10px;">
            <div style="font-size:0.7rem; font-weight:bold; color:#b45309; margin-bottom:5px;">お客様用QRコード（確認用）</div>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${p.id}" style="width:100px; height:100px; border:4px solid #fff;">
            <div style="font-size:0.6rem; color:#666; margin-top:5px; word-break:break-all;">
              URL: <a href="${userQrUrl}" target="_blank">${userQrUrl}</a>
            </div>
          </div>
        ` : `<p style="text-align:center; color:#94a3b8; font-size:0.8rem;">※入金後にQRコードが表示されます</p>`}

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:15px;">
          <button onclick="handleStatusMail('${p.id}', 'PAYMENT')" style="background:#10b981; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">入金＆メール</button>
          <button onclick="handleStatusMail('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">完了＆メール</button>
          <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">✏️ 編集</button>
          <button onclick="printTicket('${p.id}')" style="background:#000; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold;">🖨️ 印刷用</button>
        </div>
      </div>
    `;
  } else {
    // 編集画面（チケット枚数ラベルを明確化）
    body.innerHTML = `
      ${headerHtml}
      <div style="display:flex; flex-direction:column; gap:12px; max-height:60vh; overflow-y:auto; padding:5px;">
        <input type="text" id="edit-zip" value="${p.zip||''}" onblur="autoZip(this.value)" placeholder="郵便番号" style="padding:10px;">
        <input type="text" id="edit-pref" value="${p.pref||''}" placeholder="都道府県" style="padding:10px;">
        <input type="text" id="edit-city" value="${p.city||''}" placeholder="市区町村" style="padding:10px;">
        <input type="text" id="edit-rest" value="${p.rest||''}" placeholder="番地・建物" style="padding:10px;">
        <div style="background:#f8fafc; padding:10px; border-radius:8px; border:1px solid #e2e8f0;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div><label style="font-size:0.6rem;">S 大人</label><input type="number" id="edit-sa" value="${p.s_a}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.6rem;">S 子供</label><input type="number" id="edit-sc" value="${p.s_c}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.7rem;">一般 大人</label><input type="number" id="edit-ga" value="${p.g_a}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
            <div><label style="font-size:0.7rem;">一般 子供</label><input type="number" id="edit-gc" value="${p.g_c}" oninput="reCalc()" style="width:100%; padding:8px;"></div>
          </div>
          <div style="text-align:right; margin-top:8px; font-weight:bold; color:red;">合計: <span id="display-total">${(Number(p.total)||0).toLocaleString()}</span>円</div>
          <input type="hidden" id="edit-total" value="${p.total}">
        </div>
        <textarea id="edit-remarks" placeholder="備考" style="height:80px; padding:10px;">${p.remarks||''}</textarea>
        <button onclick="saveEdit()" style="background:#1e3a8a; color:white; padding:15px; border-radius:8px; font-weight:bold; border:none;">💾 保存</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

// 共通機能
function printTicket(id) {
  const p = currentData.find(item => item.id === id);
  document.getElementById("print-content").innerHTML = `
    <h2>【琉球の風 2026】 受領証</h2>
    <p>受付番号: ${p.id} / お名前: ${p.name} 様</p>
    <p>内容: S大人${p.s_a}枚 S子供${p.s_c}名 / 一般大人${p.g_a}枚 一般子供${p.g_c}名</p>
    <p>受取方法: ${p.shipping}</p>
    <h3 style="text-align:right;">合計金額: ${Number(p.total).toLocaleString()} 円</h3>
  `;
  window.print();
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

async function updateStatus(id, s) { if(confirm(s + " に更新しますか？")) { await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: s }) }); fetchData(); closeModal(); } }
async function deleteOrder(id) { if(confirm("削除しますか？")) { await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" }) }); fetchData(); closeModal(); } }

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
window.onload = fetchData;