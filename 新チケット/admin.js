const url = "hhttps://script.google.com/macros/s/AKfycbzvtrfO5PcT8VVgRblaVB_xmcSIIBLT_eX3L9xTCXd-7a_HIP-4w5vz4CK-F8QjXroOdw/exec"; 
let currentData = [];
let selectedId = "";

/**
 * 起動時にパスワードを確認してからデータを取得
 */
window.onload = () => {
  // 🌟 パスワード入力ダイアログを表示
  const password = prompt("管理者パスワードを入力してください");

  // 🌟 パスワードが一致する場合のみ実行（例: mabui2026）
  if (password === "000000") { 
    fetchData(); 
  } else {
    // 一致しない場合は警告を出して画面を白紙にする
    alert("パスワードが正しくありません。アクセスを拒否しました。");
    document.body.innerHTML = `
      <div style="text-align:center; margin-top:100px; font-family:sans-serif;">
        <h1>🔒 Access Denied</h1>
        <p>正しいパスワードを入力してページを再読み込みしてください。</p>
        <button onclick="location.reload()" style="padding:10px 20px; cursor:pointer;">再試行</button>
      </div>`;
  }
};

// 起動時にデータを取得
window.onload = () => fetchData();

/**
 * データの取得と反映
 */
async function fetchData() {
  const adminList = document.getElementById("admin-list");
  if(adminList) adminList.innerHTML = "<tr><td colspan='8' style='text-align:center;'>データ読み込み中...</td></tr>";

  try {
    const response = await fetch(`${url}?type=getAdmin`);
    const result = await response.json();
    
    currentData = result.orders.reverse(); 
    const stats = result.stats;

    document.getElementById("stat-total-orders").innerText = stats.total_orders;
    document.getElementById("stat-total-persons").innerText = stats.total_persons;
    document.getElementById("stat-total-money").innerText = stats.total_money.toLocaleString();
    document.getElementById("stat-paid-money").innerText = stats.paid_money.toLocaleString();
    const ana = result.analysis;


    // 🌟 IDが存在する場合のみ代入（エラー防止）
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if(el) el.innerText = val;
    };

    // 🌟 トップの統計カードを更新（IDがなくてもエラーにならない書き方）
    setVal("stat-total-orders", stats.total_orders);
    setVal("stat-total-persons", stats.total_persons);
    setVal("stat-total-money", stats.total_money.toLocaleString());
    setVal("stat-paid-money", stats.paid_money.toLocaleString());

    // 🌟 エリアごとの内訳（既存の表示も維持）
    setVal("stat-sa", `大:${stats.s_a}/子:${stats.s_c}`);
    setVal("stat-ga", `大:${stats.g_a}/子:${stats.g_c}`);
    
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
    if(adminList) adminList.innerHTML = "<tr><td colspan='8' style='text-align:center; color:red;'>データ取得失敗。</td></tr>";
  }
}

// 🌟 重複していた showPage は1つにまとめ、末尾の余計なコードは削除してください
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
 * テーブル描画
 */
function renderTable(data) {
  const listBody = document.getElementById("admin-list");
  listBody.innerHTML = "";
  
  data.forEach(row => {
    // 🌟 枚数内訳の整理（0枚は表示しない）
    let sAreaParts = [];
    if (Number(row.s_a) > 0) sAreaParts.push(`大人 ${row.s_a}枚`);
    if (Number(row.s_c) > 0) sAreaParts.push(`子供 ${row.s_c}名`);
    
    let gAreaParts = [];
    if (Number(row.g_a) > 0) gAreaParts.push(`大人 ${row.g_a}枚`);
    if (Number(row.g_c) > 0) gAreaParts.push(`子供 ${row.g_c}名`);

    // 表示用のテキスト組み立て
    let displayLines = [];
    if (sAreaParts.length > 0) displayLines.push(`【 Ｓ 】 ${sAreaParts.join(' ')}`);
    if (gAreaParts.length > 0) displayLines.push(`【一般】 ${gAreaParts.join(' ')}`);
    
    const countsDisplay = displayLines.join('<br>') || "---";
    const totalDisplay = (Number(row.total) || 0).toLocaleString();
    const safeStatus = (row.status || "未設定").replace(/\s+/g, '').replace(/[()]/g, '');

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td class="print-only"></td> 
      <td>${row.id || '---'}</td>
      <td><strong>${row.name || '名前なし'}</strong></td>
      
      <td class="no-print" style="min-width: 180px;">
        <div style="display: flex; gap: 4px;">
          <button onclick="openModal('${row.id}', 'view')" class="opt-btn" style="padding: 8px 6px;background-color: rgb(235, 253, 247);">詳細</button>
          <button onclick="openModal('${row.id}', 'edit')" class="opt-btn" style="padding: 8px 6px; background-color: #d6e5ff;">編集</button>
          <button onclick="quickCancel('${row.id}')" class="opt-btn btn-del" style="padding: 8px 6px;background-color: #ffdde7;">キャンセル</button>
        </div>
      </td>

      <td><span class="status-badge status-${safeStatus}">${row.status || '未設定'}</span></td>
      <td class="no-print">${row.shipping || '---'}</td>
      <td class="print-only" style="font-weight: bold; text-align: right;">${totalDisplay}</td>
      <td class="no-print">${row.salesType || '---'}</td>
      <td style="font-size: 0.85rem; line-height: 1.4;">${countsDisplay}</td>
    `;
    listBody.appendChild(tr);
  });
}

/**
 * 注文詳細の表示（デザイン維持・データ修正版）
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
    if (sa > 0) ticketRows += `<div class="ticket-line"><span>S大</span><span>${sa} 枚</span></div>`;
    if (sc > 0) ticketRows += `<div class="ticket-line"><span>S子</span><span>${sc} 名</span></div>`;
    if (ga > 0) ticketRows += `<div class="ticket-line"><span>般大</span><span>${ga} 枚</span></div>`;
    if (gc > 0) ticketRows += `<div class="ticket-line"><span>般子</span><span>${gc} 名</span></div>`;

    // 🌟 あなたが送ってくれたHTML構造をベースに、変数を正しく流し込み
    body.innerHTML = `
      <div class="view-container">
        <div class="contact-button-row" style="display:flex; gap:10px; margin-bottom:20px;">
          <button onclick="location.href='tel:${p.tel || ''}'" class="action-btn tel-btn" style="flex:1; background:#38a169; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">📞 電話をかける</button>
          <button onclick="location.href='mailto:${p.email || ''}'" class="action-btn mail-btn" style="flex:1; background:#3182ce; color:white; padding:12px; border:none; border-radius:8px; font-weight:bold; cursor:pointer;">✉️ メールを送る</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
          <button onclick="handleNotifyAction('${p.id}', 'PAYMENT')" class="action-btn" style="background:#38a169; color:white; padding:12px; border-radius:8px; font-weight:bold; border:none; cursor:pointer;">
            💰 入金確認メール ＆ ステータス更新
          </button>
          <button onclick="handleNotifyAction('${p.id}', 'COMPLETE')" class="btn-save-final" style="background:#1e3a8a; width:100%; color:white; padding:15px; border-radius:10px; font-weight:bold; cursor:pointer; border:none;">
            ${(p.shipping || "").includes("QR") ? "🎟 QRコード案内メールを起動" : "🚚 発送連絡メールを起動"}
          </button>
        </div>

        <div class="history-grid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:10px; background:#f0f4f8; padding:12px; border-radius:8px; margin-bottom:15px; font-size:11px;">
          <div><strong>受付日</strong><br>${p.timestamp || '---'}</div>
          <div><strong>入金日</strong><br>${p.paymentDate || '---'}</div>
          <div><strong>完了日</strong><br>${p.shippingDate || '---'}</div>
        </div>

        <div class="info-split" style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
          <div style="border:1px solid #e2e8f0; padding:10px; border-radius:8px;">
            <h5 style="margin:0 0 5px; color:#64748b; font-size:10px;">👤 購入者</h5>
            <p style="margin:0; font-weight:bold; font-size:14px;">${p.name || '名前なし'} 様</p>
            <p style="margin:5px 0 0; font-size:12px; color:#1e3a8a;">✉️ ${p.email || 'メール未登録'}</p>
            <p style="margin:2px 0 0; font-size:12px;">📞 ${p.tel || '電話未登録'}</p>
          </div>
          <div style="border:1px solid #e2e8f0; padding:10px; border-radius:8px;">
            <h5 style="margin:0 0 5px; color:#64748b; font-size:10px;">📍 配送先</h5>
            <p style="margin:0; font-size:12px;">〒${p.zip || '---'}</p>
            <p style="margin:2px 0 0; font-size:12px;">${(p.pref || '') + (p.city || '') + (p.rest || '') || '住所未登録'}</p>
          </div>
        </div>

        <div style="background:#f8fafc; padding:15px; border-radius:10px; border:1px solid #cbd5e0;">
          <h5 style="margin:0 0 10px; font-size:12px;">🎟 注文内訳 (受取: ${p.shipping || '---'})</h5>
          ${ticketRows || '<p>なし</p>'}
          <div style="text-align:right; margin-top:10px; font-weight:bold; font-size:18px; color:#e53e3e;">
            合計：${(Number(p.total) || 0).toLocaleString()} 円
          </div>
        </div>

        <div class="qr-display-area" style="margin-top:20px;">
          <h5 style="margin:0 0 10px; font-size:12px;">🎟 発行QRコード</h5>
          <div class="qr-flex-container" style="display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
            ${generateQRHtml(p.id, totalCount)}
          </div>
        </div>
      </div>`;
  } else {
    // 編集モードのデザイン維持
    document.getElementById("modal-title").innerText = "✏️ 注文内容の編集";
    body.innerHTML = `
      <div class="edit-form-modern">
        <div class="edit-section">
          <h5 class="section-title">基本情報</h5>
          <div class="input-grid">
            <div class="form-group full"><label>お名前</label><input type="text" id="edit-name" value="${p.name || ''}"></div>
            <div class="form-group"><label>電話番号</label><input type="tel" id="edit-tel" value="${p.tel || ''}"></div>
            <div class="form-group"><label>メールアドレス</label><input type="email" id="edit-email" value="${p.email || ''}"></div>
          </div>
        </div>
        <div class="edit-section">
          <h5 class="section-title">配送先住所</h5>
          <div class="input-grid">
            <div class="form-group mini"><label>郵便番号</label><input type="text" id="edit-zip" value="${p.zip || ''}"></div>
            <div class="form-group"><label>都道府県</label><input type="text" id="edit-pref" value="${p.pref || ''}"></div>
            <div class="form-group"><label>市区町村・番地</label><input type="text" id="edit-city" value="${p.city || ''}"></div>
            <div class="form-group"><label>建物名・部屋番号</label><input type="text" id="edit-rest" value="${p.rest || ''}"></div>
          </div>
        </div>
        <div class="edit-section highlight-section">
          <h5 class="section-title">枚数・金額調整</h5>
          <div class="ticket-calc-grid">
            <div class="calc-item"><label>S大</label><input type="number" id="edit-sa" value="${sa}" oninput="reCalcTotal()"></div>
            <div class="calc-item"><label>S子</label><input type="number" id="edit-sc" value="${sc}" oninput="reCalcTotal()"></div>
            <div class="calc-item"><label>般大</label><input type="number" id="edit-ga" value="${ga}" oninput="reCalcTotal()"></div>
            <div class="calc-item"><label>般子</label><input type="number" id="edit-gc" value="${gc}" oninput="reCalcTotal()"></div>
          </div>
          <div class="total-result">合計：<input type="number" id="edit-total" value="${p.total || 0}" readonly> 円</div>
        </div>
        <button onclick="saveEdit()" class="btn-save-final">💾 変更を保存する</button>
      </div>`;
  }
  document.getElementById("detail-modal").style.display = "block";
}

/**
 * 🌟 処理入れ替え版：先にステータスを更新し、完了後にメールを起動する
 */
async function handleNotifyAction(id, type) {
  const p = currentData.find(item => item.id === id);
  if (!p || !p.email) return alert("メールアドレスが取得できません。");

  let nextStatus = (type === 'PAYMENT') ? "入金済み(未発送)" : "完了";
  
  // 1. 🌟 先にGASへ更新リクエストを送る（awaitで完了を待つ）
  try {
    // ボタンを一時的に無効化（二重送信防止）
    const btn = event.target;
    if(btn) btn.disabled = true;

    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ type: "updateStatus", id: id, status: nextStatus })
    });
    
    if (response.ok) {
      // 2. 🌟 更新が成功したことを確認してからメール文面を作成
      let subject = (type === 'PAYMENT') ? "【入金確認】代金のお支払いを確認いたしました" : "【重要】チケットQRコードのご送付";
      
      // GitHubにqr.htmlを置く前提のURL
      let body = `${p.name} 様\n\nご入金を確認し、ステータスを「${nextStatus}」に更新しました。\n\n▼チケット表示URL\nhttps://kid-isa.github.io/ticket/qr.html?id=${p.id}`;

      const mailtoLink = `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      // 3. 🌟 最後にメールソフトを起動
      // window.open(mailtoLink, '_self'); だと今のページが遷移しようとするため
      // 隠しリンク方式で確実に「アプリだけ」を呼び出す
      const a = document.createElement('a');
      a.href = mailtoLink;
      a.click();

      // 4. 🌟 画面を最新状態に更新
      alert(`ステータスを「${nextStatus}」に更新し、メールを起動しました。`);
      fetchData(); 
      closeModal();
    }
  } catch (e) {
    console.error("更新エラー:", e);
    alert("ステータス更新に失敗しました。ネット環境を確認してください。");
  } finally {
    if(event.target) event.target.disabled = false;
  }
}
/**
 * 以下の補助関数は既存のものを維持
 */
async function saveEdit() {
  if(!confirm("変更を保存しますか？")) return;
  const data = {
    type: "editData", id: selectedId,
    name: document.getElementById("edit-name").value,
    tel: document.getElementById("edit-tel").value,
    email: document.getElementById("edit-email").value,
    zip: document.getElementById("edit-zip").value, pref: document.getElementById("edit-pref").value,
    city: document.getElementById("edit-city").value, rest: document.getElementById("edit-rest").value, 
    s_a: document.getElementById("edit-sa").value, s_c: document.getElementById("edit-sc").value,
    g_a: document.getElementById("edit-ga").value, g_c: document.getElementById("edit-gc").value,
    total: document.getElementById("edit-total").value
  };
  try {
    await fetch(url, { method: "POST", body: JSON.stringify(data) });
    alert("保存が完了しました"); 
    closeModal(); fetchData();
  } catch (e) {
    alert("エラー: " + e);
  }
}

function reCalcTotal() {
  const sa = Number(document.getElementById("edit-sa").value) || 0;
  const ga = Number(document.getElementById("edit-ga").value) || 0;
  document.getElementById("edit-total").value = (sa * 3500) + (ga * 1500); 
}

function generateQRHtml(id, count) {
  let html = "";
  for (let i = 1; i <= count; i++) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${id}-${i}`;
    html += `<div class="qr-item"><img src="${qrUrl}"><br><span>${i}/${count}</span></div>`;
  }
  return html || "<p>枚数0です</p>";
}

function filterTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  document.querySelectorAll("#admin-list tr").forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(query) ? "" : "none";
  });
}

function closeModal() { document.getElementById("detail-modal").style.display = "none"; }
async function quickCancel(id) {
  if(!confirm("この注文を「キャンセル」しますか？\n（データは削除されず、一覧に残ります）")) return;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ type: "updateStatus", id: id, status: "キャンセル" })
    });
    if (response.ok) {
      alert("ステータスをキャンセルに更新しました。");
      fetchData(); // 再読み込み
    }
  } catch (e) {
    alert("通信エラーが発生しました。");
  }
}
async function handleStatusChange(id, newStatus) {
  await fetch(url, { method: "POST", body: JSON.stringify({ type: "updateStatus", id: id, status: newStatus }) });
  fetchData(); 
}
function printList() { window.print(); }

/**
 * 🌟 ページの表示切り替え
 */
function showPage(page) {
  const listPage = document.getElementById('page-list');
  const analysisPage = document.getElementById('page-analysis');
  const btnList = document.getElementById('btn-list');
  const btnAna = document.getElementById('btn-analysis');

  if (page === 'list') {
    listPage.style.display = 'block';
    analysisPage.style.display = 'none';
    // ボタンの色調整
    btnList.style.background = '#1e3a8a'; btnList.style.color = 'white';
    btnAna.style.background = '#edf2f7'; btnAna.style.color = '#1a202c';
  } else {
    listPage.style.display = 'none';
    analysisPage.style.display = 'block';
    // ボタンの色調整
    btnAna.style.background = '#805ad5'; btnAna.style.color = 'white';
    btnList.style.background = '#edf2f7'; btnList.style.color = '#1a202c';
  }
}