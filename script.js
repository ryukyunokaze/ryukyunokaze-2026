// =========================================
// 1. 基本設定
// =========================================
// 🌟 GASの最新デプロイURLに書き換えてください
const url = "https://script.google.com/macros/s/AKfycbwRARc7UT_Pkhrih9qKajrxS8TWUbZ_k5lTQjWaxtRLFoX8L6GkWunLE8vSJrWfWxPmcQ/exec"; 

let masterPrices = {};

// ページ読み込み時に設定を取得
async function loadConfig() {
  try {
    const response = await fetch(`${url}?type=getConfig`);
    masterPrices = await response.json();
    
    // 単価表示を画面に反映
    const saPrice = Number(masterPrices.s_a_price) || 3500;
    const gaPrice = Number(masterPrices.g_a_price) || 1500;

    if(document.getElementById("price-sa-display")) {
      document.getElementById("price-sa-display").innerText = saPrice.toLocaleString() + "円";
    }
    if(document.getElementById("price-ga-display")) {
      document.getElementById("price-ga-display").innerText = gaPrice.toLocaleString() + "円";
    }
    
    // 振込先案内を完了画面にセット
    const bankArea = document.getElementById("bank-info-content");
    if(bankArea) bankArea.innerText = masterPrices.bank_info || "お振込先は別途ご案内します。";

    console.log("設定読み込み完了", masterPrices);
    calc(); 
  } catch (e) {
    console.error("設定取得失敗:", e);
  }
}

window.addEventListener('load', loadConfig);

// =========================================
// 2. 枚数計算ロジック（単価連動）
// =========================================
function calc() {
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;

  const saP = Number(masterPrices.s_a_price) || 3500;
  const scP = Number(masterPrices.s_c_price) || 0;
  const gaP = Number(masterPrices.g_a_price) || 1500;
  const gcP = Number(masterPrices.g_c_price) || 0;

  const now = new Date();
  const perfDate = masterPrices.event_date ? new Date(masterPrices.event_date) : new Date("2026-10-18");
  const doorFee = (now >= perfDate) ? (Number(masterPrices.door_ticket_fee) || 500) : 0;

  const total = (sa * (saP + doorFee)) + (sc * (scP + doorFee)) + 
                (ga * (gaP + doorFee)) + (gc * (gcP + doorFee));

  const display = document.getElementById("totalDisplay");
  if (display) display.innerText = total.toLocaleString();
}

// =========================================
// 3. 画面遷移ロジック（ここを消すと形が崩れます）
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
}

function confirmOrder() {
  const name = document.getElementById("name").value;
  const tel = document.getElementById("tel").value;
  const email = document.getElementById("email").value;
  const gender = document.querySelector('select[name="gender"]').value;
  const age = document.querySelector('select[name="age"]').value;

  if (!name || !tel || !email || !gender || !age) {
    alert("必須項目をすべて入力してください。");
    return;
  }

  // 確認画面への反映
  document.getElementById("conf-name").innerText = name;
  document.getElementById("conf-gender").innerText = gender;
  document.getElementById("conf-age").innerText = age;
  document.getElementById("conf-tel").innerText = tel;
  document.getElementById("conf-email").innerText = email;
  
  const zip = document.getElementById("zip").value;
  const pref = document.getElementById("pref").value;
  const city = document.getElementById("city").value;
  const rest = document.getElementById("rest").value;
  document.getElementById("conf-address").innerText = `〒${zip} ${pref}${city}${rest}`;
  
  document.getElementById("conf-shipping").innerText = document.getElementById("shipping").value;
  document.getElementById("conf-remarks").innerText = document.getElementById("remarks").value || "特になし";

  // 枚数詳細の作成
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;
  
  let ticketHtml = "";
  if (sa > 0) ticketHtml += `Sエリア 大人：${sa}枚<br>`;
  if (sc > 0) ticketHtml += `Sエリア 小学生以下：${sc}名<br>`;
  if (ga > 0) ticketHtml += `一般エリア 大人：${ga}枚<br>`;
  if (gc > 0) ticketHtml += `一般エリア 小学生以下：${gc}名<br>`;
  
  const ticketDisplay = document.getElementById("conf-ticket-details");
  if (ticketDisplay) ticketDisplay.innerHTML = ticketHtml;

  document.getElementById("conf-total").innerText = document.getElementById("totalDisplay").innerText;

  document.getElementById("step2").style.display = "none";
  document.getElementById("step3").style.display = "block";
  window.scrollTo(0, 0);
}

function goToStep2Back() {
  document.getElementById("step3").style.display = "none";
  document.getElementById("step2").style.display = "block";
}

// =========================================
// 4. 注文確定（GASへ送信）
// =========================================
async function submitOrder() {
  const btn = document.querySelector(".submit-btn-final");
  btn.disabled = true;
  btn.innerText = "送信中...";

  const data = {
    type: "addOrder",
    name: document.getElementById("name").value,
    tel: document.getElementById("tel").value,
    email: document.getElementById("email").value,
    zip: document.getElementById("zip").value,
    pref: document.getElementById("pref").value,
    city: document.getElementById("city").value,
    rest: document.getElementById("rest").value,
    s_a: document.getElementById("s_a").value,
    s_c: document.getElementById("s_c").value,
    g_a: document.getElementById("g_a").value,
    g_c: document.getElementById("g_c").value,
    total: document.getElementById("totalDisplay").innerText.replace(/,/g, ''),
    shipping: document.getElementById("shipping").value,
    remarks: document.getElementById("remarks").value,
    gender: document.querySelector('select[name="gender"]').value,
    age: document.querySelector('select[name="age"]').value,
    salesType: "オンライン予約"
  };

  try {
    // 🌟 mode: "no-cors" を消し、レスポンスを正しく受け取る
    const res = await fetch(url, { 
      method: "POST", 
      body: JSON.stringify(data) 
    });
    const result = await res.json();

    if (result.result === "success") {
      document.getElementById("step3").style.display = "none";
      document.getElementById("step4").style.display = "block";
      window.scrollTo(0, 0);
    } else { 
      throw new Error(); 
    }
  } catch (e) {
    console.error("送信エラー:", e);
    alert("エラーが発生しました。時間を置いて再度お試しください。");
    btn.disabled = false;
    btn.innerText = "🚀 注文を確定する";
  }
}