// =====================
// DADOS
// =====================
let apostas = JSON.parse(localStorage.getItem("apostas")) || [];

// =====================
// ELEMENTOS
// =====================
const form = document.getElementById("formAposta");
const saldoEl = document.getElementById("saldo");
const roiEl = document.getElementById("roi");
const winrateEl = document.getElementById("winrate");

// =====================
// SALVAR
// =====================
function salvarDados() {
  localStorage.setItem("apostas", JSON.stringify(apostas));
}

// =====================
// ADICIONAR APOSTA
// =====================
if (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const valor = parseFloat(document.getElementById("valor").value);
    const odd = parseFloat(document.getElementById("odd").value);
    const resultado = document.getElementById("resultado").value;

    if (isNaN(valor) || isNaN(odd) || valor <= 0 || odd <= 0) {
      alert("Preencha os dados corretamente");
      return;
    }

    const lucro = resultado === "win"
      ? valor * (odd - 1)
      : -valor;

    apostas.push({ valor, odd, resultado, lucro });

    salvarDados();
    atualizarTudo();
    form.reset();
  });
}

// =====================
// REMOVER
// =====================
function removerAposta(index) {
  apostas.splice(index, 1);
  salvarDados();
  atualizarTudo();
}

// =====================
// TABELA
// =====================
function atualizarTabela() {
  const tabela = document.getElementById("tabelaApostas");
  if (!tabela) return;

  const filtroEl = document.getElementById("filtroResultado");
  const filtro = filtroEl ? filtroEl.value : "all";

  tabela.innerHTML = "";

  apostas
    .filter(a => filtro === "all" || a.resultado === filtro)
    .forEach((a, index) => {
      const linha = document.createElement("tr");

      linha.innerHTML = `
        <td>${index + 1}</td>
        <td>R$ ${a.valor.toFixed(2)}</td>
        <td>${a.odd}</td>
        <td class="${a.resultado}">${a.resultado.toUpperCase()}</td>
        <td class="${a.lucro >= 0 ? "win" : "loss"}">
          R$ ${a.lucro.toFixed(2)}
        </td>
        <td>
          <button class="btn-delete" onclick="removerAposta(${index})">X</button>
        </td>
      `;

      tabela.appendChild(linha);
    });
}

// =====================
// MÉTRICAS
// =====================
function atualizarMetricas() {
  let saldo = 0;
  let investido = 0;
  let wins = 0;

  apostas.forEach(a => {
    saldo += a.lucro;
    investido += a.valor;
    if (a.resultado === "win") wins++;
  });

  const total = apostas.length;

  const roi = investido > 0 ? (saldo / investido) * 100 : 0;
  const winrate = total > 0 ? (wins / total) * 100 : 0;

  if (saldoEl) saldoEl.textContent = `R$ ${saldo.toFixed(2)}`;
  if (roiEl) roiEl.textContent = `${roi.toFixed(1)}%`;
  if (winrateEl) winrateEl.textContent = `${winrate.toFixed(1)}%`;
}

// =====================
// GRÁFICO
// =====================
let chart;

function atualizarGrafico() {
  const canvas = document.getElementById("grafico");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  let banca = 0;
  const dados = apostas.map(a => {
    banca += a.lucro;
    return banca;
  });

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: dados.map((_, i) => i + 1),
      datasets: [{
        label: "Banca",
        data: dados,
        borderWidth: 2,
        tension: 0.3
      }]
    }
  });
}

// =====================
// SCORE
// =====================
function calcularScore() {
  if (apostas.length < 5) return { score: 0, nivel: "Iniciante" };

  let saldo = 0, investido = 0, wins = 0;

  apostas.forEach(a => {
    saldo += a.lucro;
    investido += a.valor;
    if (a.resultado === "win") wins++;
  });

  const roi = investido > 0 ? (saldo / investido) * 100 : 0;
  const winrate = (wins / apostas.length) * 100;

  const score = Math.max(0, Math.min(100, (roi + winrate) / 2));

  let nivel = "Iniciante";
  if (score >= 70) nivel = "Avançado";
  else if (score >= 50) nivel = "Intermediário";

  return { score: Math.round(score), nivel };
}

function atualizarScore() {
  const elScore = document.getElementById("score");
  const elNivel = document.getElementById("nivel");

  if (!elScore || !elNivel) return;

  const { score, nivel } = calcularScore();

  elScore.textContent = score;
  elNivel.textContent = nivel;
}

// =====================
// INSIGHTS (CARDS)
// =====================
function atualizarInsights() {
  const lista = document.getElementById("listaInsights");
  const badge = document.getElementById("badgeInsights");

  if (!lista || !badge) return;

  lista.innerHTML = "";
  let total = 0;

  function card(t, d, s) {
    const div = document.createElement("div");
    div.className = "insight-card";
    div.innerHTML = `
      <div class="insight-title">${t}</div>
      <div class="insight-main">${d}</div>
      <div class="insight-stats">${s}</div>
    `;
    return div;
  }

  if (apostas.length < 3) {
    lista.appendChild(card("📊 Dados insuficientes", "Adicione mais apostas", "mínimo: 3"));
    badge.textContent = "(1)";
    return;
  }

  const alta = apostas.filter(a => a.odd >= 2.0);
  const lucroAlta = alta.reduce((acc, a) => acc + a.lucro, 0);

  if (lucroAlta < 0) {
    lista.appendChild(card("❌ Atenção", "Odds altas", `Prejuízo: R$ ${lucroAlta.toFixed(2)}`));
    total++;
  }

  if (alta.length > apostas.length * 0.5) {
    lista.appendChild(card("⚠️ Comportamento", "Muitas odds altas", "Mais de 50%"));
    total++;
  }

  badge.textContent = `(${total})`;
}

// =====================
// FILTRO
// =====================
const filtro = document.getElementById("filtroResultado");
if (filtro) {
  filtro.addEventListener("change", atualizarTabela);
}

// =====================
// ABAS
// =====================
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    const aba = item.dataset.aba;

    document.querySelectorAll(".aba").forEach(sec => sec.classList.add("hidden"));
    document.getElementById(aba).classList.remove("hidden");
  });
});

// =====================
// ATUALIZAR TUDO
// =====================
function atualizarTudo() {
  atualizarTabela();
  atualizarMetricas();
  atualizarGrafico();
  atualizarInsights();
  atualizarScore();
}

// =====================
// INICIAR
// =====================
atualizarTudo();