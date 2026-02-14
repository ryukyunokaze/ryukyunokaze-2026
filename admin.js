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
    if(adminList) adminList.innerHTML = "<tr><td colspan='10' style='text-align:center; color:red;'>データ取得失敗</td></tr>";
  }
}

/**
 * テーブル ＆ スマホ用スリムリスト描画
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  const listPageContent = document.getElementById("page-list-content");

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
        <button onclick="openModal('${row.id}', 'view')" class="opt-btn">詳細</button>
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

function openModal(id, mode) {
  selectedId = id;
  const p = currentData.find(item => item.id === id);
  if (!p) return;
  document.getElementById("modal-body").innerHTML = `<p>${p.name}様の詳細データを表示中...</p>`;
  document.getElementById("detail-modal").style.display = "block";
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
function fetchDataTrigger() { fetchData(); }
window.onload = fetchData;