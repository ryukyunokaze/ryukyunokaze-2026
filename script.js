// =========================================
// 1. 基本設定
// =========================================
// 🌟 修正：最新のデプロイURLに貼り替えてください
const url = "https://script.google.com/macros/s/AKfycbwRARc7UT_Pkhrih9qKajrxS8TWUbZ_k5lTQjWaxtRLFoX8L6GkWunLE8vSJrWfWxPmcQ/exec"; 

let masterPrices = {};

async function loadConfig() {
  try {
    const response = await fetch(`${url}?type=getConfig`);
    masterPrices = await response.json();
    
    // 振込先案内を表示
    const bankArea = document.getElementById("bank-info-content");
    if(bankArea) {
      bankArea.innerText = masterPrices.bank_info || "管理画面で設定してください。";
    }
    
    // 🌟 単価表示をスプレッドシートの値に更新
    // 万が一取得失敗した時のためにデフォルト値を設定しています
    const saPrice = Number(masterPrices.s_a_price) || 3500;
    const gaPrice = Number(masterPrices.g_a_price) || 1500;

    if(document.getElementById("price-sa-display")) {
      document.getElementById("price-sa-display").innerText = saPrice.toLocaleString() + "円";
    }
    if(document.getElementById("price-ga-display")) {
      document.getElementById("price-ga-display").innerText = gaPrice.toLocaleString() + "円";
    }
    
    console.log("最新の設定を反映しました", masterPrices);
    
    // 🌟 金額表示が変わった後に一度計算を走らせる
    calc(); 
  } catch (e) {
    console.error("設定読み込みエラー:", e);
  }
}

window.addEventListener('load', loadConfig);

// =========================================
// 2. 枚数計算ロジック
// =========================================
function calc() {
  const saCount = Number(document.getElementById("s_a").value) || 0;
  const scCount = Number(document.getElementById("s_c").value) || 0;
  const gaCount = Number(document.getElementById("g_a").value) || 0;
  const gcCount = Number(document.getElementById("g_c").value) || 0;

  // 🌟 masterPrices から取得。なければデフォルト。
  const saPrice = Number(masterPrices.s_a_price) || 3500;
  const scPrice = Number(masterPrices.s_c_price) || 0;
  const gaPrice = Number(masterPrices.g_a_price) || 1500;
  const gcPrice = Number(masterPrices.g_c_price) || 0;

  // 当日加算金の判定
  const now = new Date();
  const perfDate = masterPrices.event_date ? new Date(masterPrices.event_date) : new Date("2026-10-18");
  const addPrice = (now >= perfDate) ? (Number(masterPrices.door_ticket_fee) || 500) : 0; 

  // 合計計算
  const total = (saCount * (saPrice + addPrice)) + 
                (scCount * (scPrice + addPrice)) + // 小学生以下も加算する場合
                (gaCount * (gaPrice + addPrice)) + 
                (gcCount * (gcPrice + addPrice));

  const display = document.getElementById("totalDisplay");
  if (display) display.innerText = total.toLocaleString();
}

// =========================================
// 3. 画面遷移
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


  // 🌟 枚数詳細を復活させる
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
// 5. 注文確定（GASへ送信）
// =========================================
async function submitOrder() {
  const btn = document.querySelector(".submit-btn-final");
  if (btn) {
    btn.disabled = true;
    btn.innerText = "送信中...";
  }

  const data = {
    type: "addOrder", // 🌟 GAS側の data.type === "addOrder" と一致
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
    gender: document.getElementById("gender").value,
    age: document.getElementById("age").value,
    salesType: "オンライン予約"
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      // mode: "no-cors" は削除します 🌟
      // 代わりに headers を指定して、GAS側が正しく受け取れるようにします
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: JSON.stringify(data)
    });
    
    // GAS側で createJsonResponse を使っているため、正常に応答を受け取れます
    const result = await response.json(); 

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
  }
}