const url = "https://script.google.com/macros/s/AKfycbznb1pfd74mU8lH-oVrKbJNg935KAPPtIjmGwMsuB3Zv5PoZwbRuH3rJcgj_ZhEDCy1PQ/exec"; 
              
let currentData = [];
let selectedId = "";
let masterPrices = {}; 

/** 1. データの取得と反映 */
async function fetchData() {
  const listDiv = document.getElementById("admin-list");
  if(listDiv) listDiv.innerHTML = "<p style='text-align:center; padding:30px; color:#94a3b8;'>最新データを取得中...</p>";
  
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

    let totalSales = 0; 
    let paidSales = 0;  
    currentData.forEach(p => {
      if (p.status !== "キャンセル") {
        const amount = Number(p.total) || 0;
        totalSales += amount;
        // 入金済み、完了、オキチケは「回収済み/確定」として計算
        if (["入金済み", "完了", "オキチケ", "入金完了"].includes(p.status)) {
          paidSales += amount;
        }
      }
    });

    const moneyEl = document.getElementById("stat-total-money");
    if(moneyEl) {
      moneyEl.innerHTML = `
        ${totalSales.toLocaleString()} 円
        <div style="font-size:0.7rem; color:#cbd5e1; font-weight:normal; margin-top:2px;">
          (内 ${paidSales.toLocaleString()} 円 回収・入金済)
        </div>
      `;
    }

    const ana = result.analysis;
    if (ana) {
      setVal("ana-child-orders", ana.with_child_count || 0);
      setVal("ana-takasaki", ana.region.gunma_takasaki || 0);
      setVal("ana-gunma", ana.region.gunma_other || 0);
      setVal("ana-outside", ana.region.out_of_pref || 0);
      setVal("ana-s-total", (Number(ana.area_details.s_area.adult) + Number(ana.area_details.s_area.child)) + " 名");
      setVal("ana-s-a", ana.area_details.s_area.adult || 0);
      setVal("ana-s-c", ana.area_details.s_area.child || 0);
      setVal("ana-g-total", (Number(ana.area_details.g_area.adult) + Number(ana.area_details.g_area.child)) + " 名");
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
    if(listDiv) listDiv.innerHTML = "<p style='color:red; text-align:center;'>通信エラーが発生しました</p>";
  }
}

/** 2. 注文一覧の描画 */
function renderList(data) {
  const listDiv = document.getElementById("admin-list");
  if(!listDiv) return;
  listDiv.innerHTML = "";
  data.forEach(row => {
    const statusClass = (row.status || "未入金").replace(/\s+/g, '');
    const item = document.createElement("div");
    item.className = "order-item";
    item.setAttribute("data-id", row.id); 
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

/** 3. 受付用名簿印刷 */
function printOrderList() {
  const listItems = document.querySelectorAll(".order-item");
  let rows = "";
  let count = 0;
  listItems.forEach(item => {
    if (item.style.display !== "none") {
      const id = item.getAttribute("data-id"); 
      const p = currentData.find(d => String(d.id) === String(id));
      if (p) {
        count++;
        let dArr = [];
        if (Number(p.s_a) > 0 || Number(p.s_c) > 0) dArr.push(`[S] 大${p.s_a}/子${p.s_c}`);
        if (Number(p.g_a) > 0 || Number(p.g_c) > 0) dArr.push(`[一般] 大${p.g_a}/子${p.g_c}`);
        rows += `<tr><td>${count}</td><td><b>${p.name}</b><br>ID:${p.id}</td><td>${p.shipping||'-'}</td><td>${dArr.join('<br>')}</td><td style="text-align:right;">${(Number(p.total)||0).toLocaleString()}円</td><td>${p.status}</td><td style="width:60px;"></td></tr>`;
      }
    }
  });
  const win = window.open('', '_blank');
  win.document.write(`<html><head><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #333;padding:5px;font-size:12px;}</style></head><body><h2>琉球の風 受付名簿</h2><table><thead><tr><th>No</th><th>名前</th><th>受取</th><th>内容</th><th>金額</th><th>状況</th><th>確認</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
  win.document.close();
  setTimeout(() => { win.print(); }, 500);
}

/** 4. 詳細モーダル */
function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => String(item.id) === String(id));
  if (!p) return;
  const body = document.getElementById("modal-body");

  if (mode === 'view') {
    let tHtml = "";
    if (Number(p.s_a) > 0) tHtml += `<div>S席 大人: ${p.s_a}枚</div>`;
    if (Number(p.s_c) > 0) tHtml += `<div>S席 子供: ${p.s_c}枚</div>`;
    if (Number(p.g_a) > 0) tHtml += `<div>一般 大人: ${p.g_a}枚</div>`;
    if (Number(p.g_c) > 0) tHtml += `<div>一般 子供: ${p.g_c}枚</div>`;

    const totalC = Number(p.s_a) + Number(p.s_c) + Number(p.g_a) + Number(p.g_c);
    let qrH = "";
    if (p.status !== "未入金" && p.status !== "キャンセル") {
      qrH += `<div style="background:#fff7ed; border:1px solid #ffedd5; padding:15px; border-radius:12px; margin-top:15px; text-align:center;">
                <div style="font-weight:bold; margin-bottom:10px;">入場用QR (${totalC}枚)</div>
                <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">`;
      for (let i = 1; i <= totalC; i++) {
        const bId = `${p.id}-${i}`;
        qrH += `<div style="text-align:center; background:#fff; padding:5px; border:1px solid #eee; width:80px;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${bId}" style="width:70px; height:70px;">
                  <div style="font-size:0.5rem;">${bId}</div>
                </div>`;
      }
      qrH += `</div></div>`;
    }

    body.innerHTML = `
      <div style="background:#1e3a8a; color:white; padding:20px; text-align:center; border-radius:15px 15px 0 0;">
        <h2 style="margin:0;">${p.name} 様</h2>
        <div>ID: ${p.id} / 状況: ${p.status}</div>
      </div>
      <div style="padding:20px;">
        <div style="display:flex; gap:10px; margin-bottom:15px;">
          <a href="tel:${p.tel}" style="flex:1; background:#10b981; color:white; padding:12px; border-radius:8px; text-align:center; text-decoration:none; font-weight:bold;">📞 電話</a>
          <a href="mailto:${p.email}" style="flex:1; background:#3b82f6; color:white; padding:12px; border-radius:8px; text-align:center; text-decoration:none; font-weight:bold;">✉️ メール</a>
        </div>
        <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #e2e8f0;">
          <strong>内容:</strong> ${tHtml}
          <div style="text-align:right; font-size:1.3rem; color:#e11d48; font-weight:bold;">合計 ${Number(p.total).toLocaleString()}円</div>
        </div>
        <div style="margin:15px 0; font-size:0.9rem;">📍 〒${p.zip||''} ${p.pref||''}${p.city||''}${p.rest||''}</div>
        <div style="padding:10px; border:1px solid #cbd5e1; border-radius:8px; font-size:0.85rem;">📝 ${p.remarks||'備考なし'}</div>
        ${qrH}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:20px;">
          <button onclick="handleStatusMail('${p.id}', 'PAYMENT')" style="background:#10b981; color:white; padding:14px; border-radius:10px; border:none; font-weight:bold;">入金完了</button>
          <button onclick="handleStatusMail('${p.id}', 'COMPLETE')" style="background:#1e3a8a; color:white; padding:14px; border-radius:10px; border:none; font-weight:bold;">発送完了</button>
          <button onclick="openModal('${p.id}', 'edit')" style="background:#f59e0b; color:white; padding:14px; border-radius:10px; border:none; font-weight:bold;">✏️ 編集</button>
          <button onclick="printTicket('${p.id}')" style="background:#000; color:white; padding:14px; border-radius:10px; border:none; font-weight:bold;">🎫 印刷</button>
        </div>
      </div>`;
  } else {
    body.innerHTML = `
      <div style="padding:20px;">
        <h3 style="margin-top:0;">注文編集</h3>
        <label>ステータス</label>
        <select id="edit-status" style="width:100%; padding:10px; margin-bottom:10px;">
          <option value="未入金" ${p.status==='未入金'?'selected':''}>未入金</option>
          <option value="入金済み" ${p.status==='入金済み'?'selected':''}>入金済み</option>
          <option value="完了" ${p.status==='完了'?'selected':''}>完了</option>
          <option value="オキチケ" ${p.status==='オキチケ'?'selected':''}>オキチケ</option>
          <option value="キャンセル" ${p.status==='キャンセル'?'selected':''}>キャンセル</option>
        </select>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <div><label>電話</label><input type="text" id="edit-tel" value="${p.tel||''}" style="width:100%;"></div>
          <div><label>メール</label><input type="text" id="edit-email" value="${p.email||''}" style="width:100%;"></div>
        </div>
        <label>受取方法</label>
        <select id="edit-shipping" style="width:100%; padding:10px; margin-bottom:10px;">
          <option value="郵送" ${p.shipping==='郵送'?'selected':''}>郵送</option>
          <option value="QRコード" ${p.shipping==='QRコード'?'selected':''}>QRコード</option>
          <option value="手渡し" ${p.shipping==='手渡し'?'selected':''}>手渡し</option>
        </select>
        <label>郵便番号</label><input type="text" id="edit-zip" value="${p.zip||''}" onblur="autoZip(this.value)" style="width:100%;">
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:10px 0;">
          <input type="text" id="edit-pref" value="${p.pref||''}" placeholder="県">
          <input type="text" id="edit-city" value="${p.city||''}" placeholder="市">
        </div>
        <input type="text" id="edit-rest" value="${p.rest||''}" placeholder="番地" style="width:100%; margin-bottom:15px;">
        <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:5px;">
          <div>大S<input type="number" id="edit-sa" value="${p.s_a}" oninput="reCalc()"></div>
          <div>子S<input type="number" id="edit-sc" value="${p.s_c}" oninput="reCalc()"></div>
          <div>大一<input type="number" id="edit-ga" value="${p.g_a}" oninput="reCalc()"></div>
          <div>子一<input type="number" id="edit-gc" value="${p.g_c}" oninput="reCalc()"></div>
        </div>
        <div style="margin-top:15px; font-weight:bold; text-align:right;">
          合計: <input type="number" id="edit-total" value="${p.total}" style="width:100px; color:red; font-size:1.2rem; text-align:right;">円
        </div>
        <textarea id="edit-remarks" style="width:100%; height:60px; margin-top:10px;">${p.remarks||''}</textarea>
        <button onclick="saveEdit()" style="width:100%; margin-top:20px; padding:15px; background:#1e3a8a; color:white; border:none; border-radius:10px; font-weight:bold;">💾 保存する</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/** 5. 個別チケット印刷（特大4枚・自動クローズ） */
async function printTicket(id) {
  const p = currentData.find(item => String(item.id) === String(id));
  if (!p) return;
  const btn = event.currentTarget;
  btn.innerText = "生成中..."; btn.disabled = true;

  const logoUrl = "https://ryukyunokaze.github.io/ryukyunokaze-2026/logo.png"; 
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise((res) => {
    const f = new FileReader(); f.onloadend = () => res(f.result); f.readAsDataURL(b);
  }));

  try {
    const logoData = await toDataURL(logoUrl);
    let tList = [];
    if (Number(p.s_a) > 0) for(let i=0; i<p.s_a; i++) tList.push("Sエリア (大人)");
    if (Number(p.s_c) > 0) for(let i=0; i<p.s_c; i++) tList.push("Sエリア (子供)");
    if (Number(p.g_a) > 0) for(let i=0; i<p.g_a; i++) tList.push("一般エリア (大人)");
    if (Number(p.g_c) > 0) for(let i=0; i<p.g_c; i++) tList.push("一般エリア (子供)");

    let tHtml = "";
    for (let i = 0; i < tList.length; i++) {
      const type = tList[i];
      const bId = `${p.id}-${i + 1}`;
      const qD = await toDataURL(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${bId}`);
      tHtml += `
        <div style="display:flex; border:1.5mm solid #000; margin-bottom:5mm; height:68mm; width:100%; page-break-inside:avoid; font-family:sans-serif; -webkit-print-color-adjust: exact;">
          <div style="flex:3; padding:20px; border-right:1.2mm dashed #000; display:flex; flex-direction:column; justify-content:center;">
            <img src="${logoData}" style="width:60px; float:left; margin-right:15px;">
            <h1 style="font-size:28px; margin:0; color:#1e3a8a;">琉球の風 2026</h1>
            <div style="font-size:12px; margin-top:10px; color:#666;">SERIAL: ${bId}</div>
            <div style="font-size:24px; font-weight:bold; margin-top:5px;">【 ${type} 】</div>
          </div>
          <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
            <img src="${qD}" style="width:130px; height:130px;">
            <div style="font-size:10px; font-weight:bold; margin-top:5px;">${type}</div>
          </div>
        </div>`;
    }
    const pW = window.open('', '_blank');
    pW.document.write('<html><head><style>@page{size:A4 portrait;margin:8mm;}body{margin:0;}</style></head><body>' + tHtml + '<script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script></body></html>');
    pW.document.close();
  } catch (e) { alert("印刷エラー"); } finally { btn.innerText = "🎫 チケット印刷"; btn.disabled = false; }
}

/** 6. 補助関数（メール・再計算・住所・保存） */
async function handleStatusMail(id, action) {
  const p = currentData.find(item => String(item.id) === String(id));
  if (!p) return;
  const status = (action === 'PAYMENT') ? "入金済み" : "完了";
  if(!confirm(status + " に更新してメールを起動しますか？")) return;

  const getV = (k) => {
    if (!masterPrices) return "";
    const nK = k.toLowerCase().replace(/_/g, '');
    const fK = Object.keys(masterPrices).find(x => x.toLowerCase().replace(/_/g, '').replace(/\s+/g, '') === nK);
    return fK ? masterPrices[fK] : "";
  };
  
  const repl = (t) => {
    if (!t) return "";
    return String(t).replace(/{event_title}/g, getV("event_title")).replace(/{name}/g, p.name).replace(/{event_date}/g, getV("event_date")).replace(/{event_venue}/g, getV("event_venue")).replace(/{mail_signature}/g, getV("mail_signature"));
  };

  let sub = "", body = "";
  if (action === 'PAYMENT') {
    sub = repl(getV("mail_pay_sub")); body = repl(getV("mail_pay_body"));
  } else {
    const isQR = p.shipping && p.shipping.includes("QR");
    const mUrl = window.location.origin + window.location.pathname.replace("admin.html", "");
    if (isQR) {
      sub = repl(getV("mail_sent_sub_qr")); 
      body = repl(getV("mail_sent_body_qr")) + `\n\n入場用URL:\n${mUrl.endsWith('/')?mUrl:mUrl+'/'}qr.html?id=${p.id}`;
    } else {
      sub = repl(getV("mail_sent_sub_post")); body = repl(getV("mail_sent_body_post"));
    }
  }
  window.location.href = `mailto:${p.email}?subject=${encodeURIComponent(sub)}&body=${encodeURIComponent(body + "\n\n" + getV("mail_signature"))}`;

  try {
    await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: status }) });
    fetchData(); closeModal();
  } catch (e) { console.error(e); }
}

function reCalc() {
  const sa = parseInt(document.getElementById('edit-sa').value) || 0;
  const sc = parseInt(document.getElementById('edit-sc').value) || 0;
  const ga = parseInt(document.getElementById('edit-ga').value) || 0;
  const gc = parseInt(document.getElementById('edit-gc').value) || 0;
  let total = (sa * (Number(masterPrices.s_a_price)||8000)) + (sc * (Number(masterPrices.s_c_price)||4000)) + (ga * (Number(masterPrices.g_a_price)||6000)) + (gc * (Number(masterPrices.g_c_price)||3000));
  const today = new Date(); today.setHours(0,0,0,0);
  if (today >= new Date(masterPrices.event_date)) total += (sa + ga) * (Number(masterPrices.door_ticket_fee) || 500);
  document.getElementById('edit-total').value = total;
}

async function autoZip(z) {
  if (z.length >= 7) {
    const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${z.replace(/-/g,'')}`);
    const d = await r.json();
    if (d.results) { 
      document.getElementById("edit-pref").value = d.results[0].address1; 
      document.getElementById("edit-city").value = d.results[0].address2 + d.results[0].address3; 
    }
  }
}

async function saveEdit() {
  const d = {
    type: "editData", id: selectedId,
    status: document.getElementById("edit-status").value,
    tel: document.getElementById("edit-tel").value,
    email: document.getElementById("edit-email").value,
    zip: document.getElementById("edit-zip").value,
    pref: document.getElementById("edit-pref").value,
    city: document.getElementById("edit-city").value,
    rest: document.getElementById("edit-rest").value,
    shipping: document.getElementById("edit-shipping").value, // 🌟 抜け修正：受取方法
    s_a: document.getElementById("edit-sa").value,
    s_c: document.getElementById("edit-sc").value,
    g_a: document.getElementById("edit-ga").value,
    g_c: document.getElementById("edit-gc").value,
    total: document.getElementById("edit-total").value,
    remarks: document.getElementById("edit-remarks").value
  };
  const res = await fetch(url, { method: "POST", body: JSON.stringify(d) }).then(r => r.json());
  if (res.result === "success") { alert("更新完了"); fetchData(); closeModal(); }
}

function filterTable() {
  const q = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll(".order-item").forEach(item => { 
    item.style.display = item.innerText.toLowerCase().includes(q) ? "flex" : "none"; 
  });
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
function showPage(p) {
  document.getElementById('page-list').style.display = (p==='list')?'block':'none';
  document.getElementById('page-analysis').style.display = (p==='analysis')?'block':'none';
}
window.onload = fetchData;