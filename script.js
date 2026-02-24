// 🌟 GASのURLをセットしてください
const url = "https://script.google.com/macros/s/AKfycbxhfCJidSnbDO9osjCl7DqOni9SIff68Frv-HuI7IRaHBzdZVpPnnL2gI9MoBH1L9VWFA/exec"; 
let masterPrices = {};

// ページ読み込み時の設定取得
// script.js 内の該当箇所
// script.js 内の該当箇所を修正
async function loadConfig() {
  try {
    const res = await fetch(`${url}?type=getConfig`);
    const masterPrices = await res.json();
    
    // 🌟 修正ポイント：masterPrices.mail_bank_info を読み込むように変更
    const bankEl = document.getElementById("bank-info-content");
    if (bankEl && masterPrices.mail_bank_info) {
      bankEl.innerText = masterPrices.mail_bank_info;
    } else if (bankEl && masterPrices.bank_info) {
      // 念のため、どちらの名前でも動くようにしておきます
      bankEl.innerText = masterPrices.bank_info;
    }
    
    // 単価の反映（ここもスプレッドシートの項目名と一致しているか確認してください）
    if (document.getElementById("price-sa-display")) {
      document.getElementById("price-sa-display").innerText = (masterPrices.s_a_price || 3500).toLocaleString() + "円";
    }
    if (document.getElementById("price-ga-display")) {
      document.getElementById("price-ga-display").innerText = (masterPrices.g_a_price || 1500).toLocaleString() + "円";
    }
    
    calc(); 
  } catch (e) {
    console.error("設定読み込みエラー:", e);
  }
}

// 計算処理
function calc() {
  const sa = Number(document.getElementById("s_a").value) || 0;
  const sc = Number(document.getElementById("s_c").value) || 0;
  const ga = Number(document.getElementById("g_a").value) || 0;
  const gc = Number(document.getElementById("g_c").value) || 0;
  
  const total = (sa * (masterPrices.s_a_price || 3500)) + (sc * (masterPrices.s_c_price || 0)) + 
                (ga * (masterPrices.g_a_price || 1500)) + (gc * (masterPrices.g_c_price || 0));
  document.getElementById("totalDisplay").innerText = total.toLocaleString();
}

// 画面遷移
function goToStep2() {
  if(document.getElementById("totalDisplay").innerText === "0") return alert("枚数を選択してください");
  document.getElementById("step1").style.display = "none";
  document.getElementById("step2").style.display = "block";
  window.scrollTo(0,0);
}

function goToStep1Back() {
  document.getElementById("step1").style.display = "block";
  document.getElementById("step2").style.display = "none";
}

function confirmOrder() {
  // 入力値の取得
  const name = document.getElementById("name").value;
  const tel = document.getElementById("tel").value;
  const email = document.getElementById("email").value;
  const gender = document.querySelector('select[name="gender"]').value;
  const age = document.querySelector('select[name="age"]').value;

  // 🌟 必須チェック
  if (!name || !tel || !email || !gender || !age) {
    alert("必須項目（名前・性別・年代・電話・メール）をすべて入力してください。");
    return;
  }

  // 🌟 確認画面（Step3）へのデータ代入（IDエラーを防ぐ）
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setVal("conf-name", name);
  setVal("conf-gender", gender);
  setVal("conf-age", age);
  setVal("conf-tel", tel);
  setVal("conf-email", email);
  
  const address = `〒${document.getElementById("zip").value} ${document.getElementById("pref").value}${document.getElementById("city").value}${document.getElementById("rest").value}`;
  setVal("conf-address", address);
  
  setVal("conf-shipping", document.getElementById("shipping").value);
  setVal("conf-remarks", document.getElementById("remarks").value || "特になし");
  setVal("conf-total", document.getElementById("totalDisplay").innerText + " 円");

  // 枚数詳細の作成
  let details = "";
  const sa = document.getElementById("s_a").value;
  const sc = document.getElementById("s_c").value;
  const ga = document.getElementById("g_a").value;
  const gc = document.getElementById("g_c").value;
  if(sa > 0) details += `Sエリア 大人：${sa}枚<br>`;
  if(sc > 0) details += `Sエリア 子供：${sc}名<br>`;
  if(ga > 0) details += `一般エリア 大人：${ga}枚<br>`;
  if(gc > 0) details += `一般エリア 子供：${gc}名<br>`;
  
  const detailsEl = document.getElementById("conf-ticket-details");
  if(detailsEl) detailsEl.innerHTML = details;

  // 🌟 画面切り替え（ここが動かない原因をすべて潰しました）
  document.getElementById("step2").style.display = "none";
  document.getElementById("step3").style.display = "block";
  window.scrollTo(0,0);
}

function goToStep2Back() {
  document.getElementById("step3").style.display = "none";
  document.getElementById("step2").style.display = "block";
}

// 送信処理
async function submitOrder() {
  const btn = document.querySelector(".submit-btn-final");
  btn.disabled = true; btn.innerText = "送信中...";
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
    age: document.querySelector('select[name="age"]').value
  };
  try {
    const res = await fetch(url, { method: "POST", body: JSON.stringify(data) });
    const result = await res.json();
    if(result.result === "success") {
      // 🌟 追加：現在の合計金額を完了画面のデカ文字部分にもコピーする
      document.getElementById("finalTotalDisplay").innerText = document.getElementById("totalDisplay").innerText;
      document.getElementById("step3").style.display = "none";
      document.getElementById("step4").style.display = "block";
    }
  } catch(e) { alert("送信エラー"); btn.disabled = false; btn.innerText = "注文確定"; }
}

window.addEventListener('load', loadConfig);