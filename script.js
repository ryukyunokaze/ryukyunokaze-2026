// =========================================
// 1. 基本設定
// =========================================
const url = "https://script.google.com/macros/s/AKfycbxZJoEMBnzVsVQ5GncxOvymwIV5HYXupUQtKKM5DEZqw9Ge5dkZTxnSdJOOQY3W35Rk3g/exec"; 

// 設定データを保持する変数
let masterPrices = {};

// ページ読み込み時に設定（単価・振込先）を取得 🌟新機能
async function loadConfig() {
  try {
    const response = await fetch(`${url}?type=getConfig`);
    masterPrices = await response.json();
    
    // 振込先案内を表示（Step4）
    if(document.getElementById("bank-info-content")) {
      document.getElementById("bank-info-content").innerText = masterPrices.bank_info || "設定シートを確認してください";
    }
    
    // 画面上の単価表示を更新
    if(document.getElementById("price-sa-display")) document.getElementById("price-sa-display").innerText = (masterPrices.s_a_price || 3500).toLocaleString() + "円";
    if(document.getElementById("price-ga-display")) document.getElementById("price-ga-display").innerText = (masterPrices.g_a_price || 1500).toLocaleString() + "円";
    
    console.log("設定を読み込みました", masterPrices);
  } catch (e) {
    console.error("設定読み込みエラー:", e);
  }
}
window.onload = loadConfig;

// =========================================
// 2. 枚数計算ロジック (calc) 🌟単価設定を参照
// =========================================
function calc() {
  const saCount = Number(document.getElementById("s_a").value) || 0;
  const scCount = Number(document.getElementById("s_c").value) || 0;
  const gaCount = Number(document.getElementById("g_a").value) || 0;
  const gcCount = Number(document.getElementById("g_c").value) || 0;

  // 設定シートの単価、なければデフォルト値を使用
  const saPrice = masterPrices.s_a_price || 3500;
  const scPrice = masterPrices.s_c_price || 0;
  const gaPrice = masterPrices.g_a_price || 1500;
  const gcPrice = masterPrices.g_c_price || 0;

  // 当日加算 (+500円) の判定
  const now = new Date();
  const perfDate = masterPrices.event_date ? new Date(masterPrices.event_date) : new Date("2026-06-01");
  const addPrice = (now >= perfDate) ? (masterPrices.door_ticket_fee || 500) : 0; 

  // 金額計算
  const total = (saCount * (saPrice + addPrice)) + 
                (scCount * scPrice) + 
                (gaCount * (gaPrice + addPrice)) + 
                (gcCount * gcPrice);

  const display = document.getElementById("totalDisplay");
  if (display) {
    display.innerText = total.toLocaleString();
  }
}

// =========================================
// ステップ1 → ステップ2 (次へ進む)
// =========================================
function goToStep2() {
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;

  if (sa + sc + ga + gc === 0) {
    alert("枚数を選択してください。");
    return;
  }

  document.getElementById("step1").style.display = "none";
  document.getElementById("step2").style.display = "block";
  window.scrollTo(0, 0);
}

function goToStep1Back() {
  document.getElementById("step1").style.display = "block";
  document.getElementById("step2").style.display = "none";
  window.scrollTo(0, 0);
}

// =========================================
// 4. ステップ2 → ステップ3 (最終確認) 🌟性別・年代取得
// =========================================
function confirmOrder() {
  const name = document.getElementById("name").value;
  const tel = document.getElementById("tel").value;
  const email = document.getElementById("email").value;
  
  // 性別と年代の取得（プルダウン）
  const gender = document.querySelector('select[name="gender"]').value;
  const age = document.querySelector('select[name="age"]').value;

  if (!name || !tel || !email || !gender || !age) {
    alert("必須項目（お名前・性別・年代・電話番号・メールアドレス）をすべて入力してください。");
    return;
  }

  const zip = document.getElementById("zip").value;
  const pref = document.getElementById("pref").value;
  const city = document.getElementById("city").value;
  const rest = document.getElementById("rest").value;
  const shipping = document.getElementById("shipping").value;
  const remarks = document.getElementById("remarks").value;

  // 確認画面へセット
  if (document.getElementById("conf-name")) document.getElementById("conf-name").innerText = name;
  if (document.getElementById("conf-tel")) document.getElementById("conf-tel").innerText = tel;
  if (document.getElementById("conf-email")) document.getElementById("conf-email").innerText = email;
  if (document.getElementById("conf-shipping")) document.getElementById("conf-shipping").innerText = shipping;
  if (document.getElementById("conf-address")) document.getElementById("conf-address").innerText = `〒${zip} ${pref}${city}${rest}`;
  if (document.getElementById("conf-remarks")) document.getElementById("conf-remarks").innerText = remarks || "特になし";

  // 枚数詳細
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;
  let ticketHtml = "";
  if (sa > 0) ticketHtml += `Sエリア 大人：${sa}枚<br>`;
  if (sc > 0) ticketHtml += `Sエリア 小学生以下：${sc}名<br>`;
  if (ga > 0) ticketHtml += `一般エリア 大人：${ga}枚<br>`;
  if (gc > 0) ticketHtml += `一般エリア 小学生以下：${gc}名<br>`;
  if (document.getElementById("conf-ticket-details")) document.getElementById("conf-ticket-details").innerHTML = ticketHtml;

  const total = document.getElementById("totalDisplay").innerText;
  if (document.getElementById("conf-total")) document.getElementById("conf-total").innerText = total;

  document.getElementById("step2").style.display = "none";
  document.getElementById("step3").style.display = "block";
  window.scrollTo(0, 0);
}

function goToStep2Back() {
  document.getElementById("step3").style.display = "none";
  document.getElementById("step2").style.display = "block";
  window.scrollTo(0, 0);
}

// =========================================
// 5. 注文確定（GASへ送信） 🌟性別・年代をデータに追加
// =========================================
async function submitOrder() {
  const btn = document.querySelector(".submit-btn-final");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "送信中...";
  }

  const data = {
    type: "submitForm",
    name: document.getElementById("name").value,
    tel: document.getElementById("tel").value,
    email: document.getElementById("email").value,
    zip: document.getElementById("zip").value,
    pref: document.getElementById("pref").value,
    city: document.getElementById("city").value,
    rest: document.getElementById("rest").value,
    remarks: document.getElementById("remarks").value,
    s_a: document.getElementById("s_a").value,
    s_c: document.getElementById("s_c").value,
    g_a: document.getElementById("g_a").value,
    g_c: document.getElementById("g_c").value,
    total: document.getElementById("totalDisplay").innerText.replace(/,/g, ''),
    shipping: document.getElementById("shipping").value,
    gender: document.querySelector('select[name="gender"]').value,
    age: document.querySelector('select[name="age"]').value, // 🌟 カンマ漏れ修正
    salesType: "オンライン予約"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.result === "success") {
      document.getElementById("step3").style.display = "none";
      document.getElementById("step4").style.display = "block";
      window.scrollTo(0, 0);
    } else {
      throw new Error("サーバーエラー");
    }
  } catch (e) {
    alert("送信中にエラーが発生しました。インターネット接続を確認し、もう一度お試しください。");
    if (btn) {
      btn.disabled = false;
      btn.innerText = "🚀 注文を確定する";
    }
  }
}