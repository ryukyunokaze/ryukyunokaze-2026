// =========================================
// 1. 基本設定
// =========================================
const url = "https://script.google.com/macros/s/AKfycbxZIEYGp-b-ksXsj3WoxuuoITSRHMTcSsVvb_2g-xwR4PICpZ77ek4TiwYXUcQ3dn99fA/exec"; 

// 設定データを保持するグローバル変数
let masterPrices = {};

// 🌟 ページ読み込み時に設定を取得（単価・振込先）
async function loadConfig() {
  try {
    const response = await fetch(`${url}?type=getConfig`);
    masterPrices = await response.json();
    
    // 振込先案内を表示（Step4用）
    const bankArea = document.getElementById("bank-info-content");
    if(bankArea) {
      bankArea.innerText = masterPrices.bank_info || "管理画面の『単価設定』で振込先を入力してください。";
    }
    
    // 画面上の単価表示もシートに合わせる
    if(document.getElementById("price-sa-display")) document.getElementById("price-sa-display").innerText = (masterPrices.s_a_price || 3500).toLocaleString() + "円";
    if(document.getElementById("price-ga-display")) document.getElementById("price-ga-display").innerText = (masterPrices.g_a_price || 1500).toLocaleString() + "円";
    
    console.log("設定を読み込みました", masterPrices);
  } catch (e) {
    console.error("設定読み込みエラー:", e);
    const bankArea = document.getElementById("bank-info-content");
    if (bankArea) bankArea.innerText = "振込先情報の取得に失敗しました。";
  }
}

// ページ読み込み完了時に実行
window.addEventListener('load', loadConfig);


// =========================================
// 2. 枚数計算ロジック (calc)
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

  // 当日加算判定
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
// 3. 画面遷移（Step1 ↔ Step2）
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
// 4. ステップ2 → ステップ3 (最終確認) 
// =========================================
function confirmOrder() {
  const name = document.getElementById("name").value;
  const tel = document.getElementById("tel").value;
  const email = document.getElementById("email").value;
  
  // 性別と年代の取得
  const genderEl = document.querySelector('select[name="gender"]');
  const ageEl = document.querySelector('select[name="age"]');
  const gender = genderEl ? genderEl.value : "";
  const age = ageEl ? ageEl.value : "";

  if (!name || !tel || !email || !gender || !age) {
    alert("必須項目（お名前・性別・年代・電話番号・メールアドレス）をすべて入力してください。");
    return;
  }

  // --- 確認画面への反映 ---
  if (document.getElementById("conf-name")) document.getElementById("conf-name").innerText = name;
  if (document.getElementById("conf-gender")) document.getElementById("conf-gender").innerText = gender;
  if (document.getElementById("conf-age")) document.getElementById("conf-age").innerText = age;
  if (document.getElementById("conf-tel")) document.getElementById("conf-tel").innerText = tel;
  if (document.getElementById("conf-email")) document.getElementById("conf-email").innerText = email;
  
  const zip = document.getElementById("zip").value;
  const pref = document.getElementById("pref").value;
  const city = document.getElementById("city").value;
  const rest = document.getElementById("rest").value;
  if (document.getElementById("conf-address")) {
    document.getElementById("conf-address").innerText = `〒${zip} ${pref}${city}${rest}`;
  }
  
  const shipping = document.getElementById("shipping").value;
  if (document.getElementById("conf-shipping")) document.getElementById("conf-shipping").innerText = shipping;

  const remarks = document.getElementById("remarks").value;
  if (document.getElementById("conf-remarks")) {
    document.getElementById("conf-remarks").innerText = remarks || "特になし";
  }

  // 枚数詳細のテキスト作成
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

  // 画面切り替え
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
// 5. 注文確定（GASへ送信）
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
    age: document.querySelector('select[name="age"]').value,
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