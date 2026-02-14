// =========================================
// 1. 基本設定（あなたのGASのURLをここに貼る）
// =========================================
const url = "https://script.google.com/macros/s/AKfycbw4P4RJS16Uw5OPQ0DHt89p9gojyM8f87B14KNGAEokPoYAePDn9sKdF7ivkFww6v6KUw/exec"; 

// 公演日（当日料金判定用：必要に応じて日付を調整してください）
const PERFORMANCE_DATE = new Date("2026-06-01T00:00:00");

// =========================================
// 2. 枚数計算ロジック (calc)
// =========================================
function calc() {
  const saCount = Number(document.getElementById("s_a").value) || 0;
  const scCount = Number(document.getElementById("s_c").value) || 0;
  const gaCount = Number(document.getElementById("g_a").value) || 0;
  const gcCount = Number(document.getElementById("g_c").value) || 0;

  // 当日加算 (+500円) の判定
  const now = new Date();
  const addPrice = (now >= PERFORMANCE_DATE) ? 500 : 0; 

  // 金額計算（大人にのみ加算、子供は0円固定）
  const total = (saCount * (3500 + addPrice)) + 
                (scCount * 0) + 
                (gaCount * (1500 + addPrice)) + 
                (gcCount * 0);

  // 表示の更新
  const display = document.getElementById("totalDisplay");
  if (display) {
    display.innerText = total.toLocaleString();
  }
}


// =========================================
// ステップ1 → ステップ2 (次へ進む)
// =========================================
function goToStep2() {
  console.log("goToStep2 が呼び出されました");

  // 入力値の取得
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;

  if (sa + sc + ga + gc === 0) {
    alert("枚数を選択してください。");
    return;
  }

  // ★各関数の中で、操作したいIDを都度定義するのが最も確実です
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");

  if (step1 && step2) {
    step1.style.display = "none";  // 枚数選択を隠す
    step2.style.display = "block"; // 入力画面を出す
    window.scrollTo(0, 0);
  }
} // ← ここで確実に goToStep2 を閉じます

// =========================================
// ステップ2 → ステップ1 (戻る)
// =========================================
function goToStep1Back() {
  console.log("goToStep1Back が呼び出されました");
  
  // ★戻る関数の中でも、改めてIDを定義（取得）します
  const step1 = document.getElementById("step1");
  const step2 = document.getElementById("step2");

  if (step1 && step2) {
    step1.style.display = "block"; // 枚数選択を表示する
    step2.style.display = "none";  // 入力画面を隠す
    window.scrollTo(0, 0);
  } else {
    console.error("ステップ1または2のIDが見つかりません。");
  }
}
// =========================================
// 4. ステップ2 → ステップ3 (情報入力から最終確認へ)
// =========================================
function confirmOrder() {
  console.log("confirmOrder が呼び出されました");

  const name = document.getElementById("name").value;
  const tel = document.getElementById("tel").value;
  const email = document.getElementById("email").value;
  const zip = document.getElementById("zip").value;
  const pref = document.getElementById("pref").value;
  const city = document.getElementById("city").value;
  const rest = document.getElementById("rest").value;
  const shipping= document.getElementById("shipping").value;
　const remarks = document.getElementById("remarks").value;
  // 必須チェック
  if (!name || !tel || !email) {
    alert("お名前、電話番号、メールアドレスは必須入力です。");
    return;
  }

  // --- 値のセット ---
  if (document.getElementById("conf-name")) document.getElementById("conf-name").innerText = name;
  if (document.getElementById("conf-tel")) document.getElementById("conf-tel").innerText = tel;
  if (document.getElementById("conf-email")) document.getElementById("conf-email").innerText = email;
  if (document.getElementById("conf-shipping")) document.getElementById("conf-shipping").innerText = shipping;
  if (document.getElementById("conf-address")) {
    document.getElementById("conf-address").innerText = `〒${zip} ${pref}${city}${rest}`;
  }
  if (document.getElementById("conf-remarks")) {
    document.getElementById("conf-remarks").innerText = remarks || "特になし";
  }

  // 枚数詳細のテキスト作成（以前のコードを活用）
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;
  let ticketHtml = "";
  if (sa > 0) ticketHtml += `Sエリア 大人：${sa}枚<br>`;
  if (sc > 0) ticketHtml += `Sエリア 小学生以下：${sc}名<br>`;
  if (ga > 0) ticketHtml += `一般エリア 大人：${ga}枚<br>`;
  if (gc > 0) ticketHtml += `一般エリア 小学生以下：${gc}名<br>`;

  if (document.getElementById("conf-ticket-details")) {
    document.getElementById("conf-ticket-details").innerHTML = ticketHtml;
  }

  const total = document.getElementById("totalDisplay").innerText;
  if (document.getElementById("conf-total")) document.getElementById("conf-total").innerText = total;

  // --- 画面切り替え ---
  document.getElementById("step2").style.display = "none";
  document.getElementById("step3").style.display = "block";
  window.scrollTo(0, 0);
}

// 【戻る処理】ステップ3（確認画面）からステップ2（入力画面）へ戻る
function goToStep2Back() {
  console.log("goToStep2Back が呼び出されました");
  
  const step2 = document.getElementById("step2");
  const step3 = document.getElementById("step3");

  if (step2 && step3) {
    step3.style.display = "none";  // 確認画面を隠す
    step2.style.display = "block"; // 入力画面を出す
    window.scrollTo(0, 0);         // 画面トップへ移動
  } else {
    console.error("画面が見つかりません（ID: step2 または step3）");
  }
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
    type: "submitForm", // GAS側の処理名に合わせてください
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
    salesType: "オンライン予約"
  };

  try {
    // 2. GASへ送信
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.result === "success") {
      // 3. 送信成功：完了画面（ステップ4）へ
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