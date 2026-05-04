// =====================
// STATUS PRO
// =====================
let usuarioPro = localStorage.getItem("pro") === "true";

// =====================
// DADOS
// =====================
let apostas = JSON.parse(localStorage.getItem("apostas")) || [];

// =====================
// ELEMENTOS
// =====================
let form, saldoEl, roiEl, winrateEl;

// =====================
// SALVAR
// =====================
function salvarDados() {
  localStorage.setItem("apostas", JSON.stringify(apostas));
}

// =====================
// ADICIONAR APOSTA
// =====================
function initForm() {
  const form = document.getElementById("formAposta");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // 🔒 BLOQUEIO PRO (limite grátis)
      if (!usuarioPro && apostas.length >= 3) {
        alert("🔒 Limite grátis atingido (3 apostas). Ative o PRO.");
        irParaPagamento();
        return;
      }

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

  const filtro = document.getElementById("filtroResultado")?.value || "all";

  tabela.innerHTML = "";

  apostas
    .filter(a => filtro === "all" || a.resultado === filtro)
    .forEach((a, index) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${index + 1}</td>
        <td>R$ ${a.valor.toFixed(2)}</td>
        <td>${a.odd}</td>
        <td class="${a.resultado}">${a.resultado.toUpperCase()}</td>
        <td class="${a.lucro >= 0 ? "win" : "loss"}">
          R$ ${a.lucro.toFixed(2)}
        </td>
        <td>
          <button onclick="removerAposta(${index})">X</button>
        </td>
      `;

      tabela.appendChild(tr);
    });
}

// =====================
// MÉTRICAS
// =====================
function atualizarMetricas() {
  saldoEl = document.getElementById("saldo");
  roiEl = document.getElementById("roi");
  winrateEl = document.getElementById("winrate");

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
function atualizarScore() {
  const elScore = document.getElementById("score");
  const elNivel = document.getElementById("nivel");

  if (!elScore || !elNivel) return;

  if (apostas.length < 5) {
    elScore.textContent = 0;
    elNivel.textContent = "Iniciante";
    return;
  }

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

  elScore.textContent = Math.round(score);
  elNivel.textContent = nivel;
}

// =====================
// INSIGHTS (AGORA FUNCIONA 100%)
// =====================
function atualizarInsights() {
  const lista = document.getElementById("listaInsights");
  const badge = document.getElementById("badgeInsights");

  if (!lista || !badge) return;

  lista.innerHTML = "";

  // 🔒 BLOQUEIO PRO (PRIORIDADE TOTAL)
  if (!usuarioPro) {
    lista.innerHTML = `
      <div class="insight-card lock">
        <h3>🔒 Insights PRO</h3>
        <p>Descubra onde você perde dinheiro nas apostas</p>

       <button onclick="irParaPagamento()" class="btn-pro">
  💰 Comprar acesso
</button>

<button onclick="ativarPro()" class="btn-pro" style="margin-top:10px;">
  🔑 Já comprei? Ativar PRO
</button>
      </div>
    `;
    badge.textContent = "(1)";
    return;
  }

  // 👇 só entra aqui se for PRO
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

  badge.textContent = `(${total})`;
}

// =====================
// EXPORTAR CSV
// =====================
function exportarCSV() {
  if (!usuarioPro) {
    alert("🔒 Disponível apenas no plano PRO");
    return;
  }

  const linhas = [["Valor", "Odd", "Resultado", "Lucro"]];

  apostas.forEach(a => {
    linhas.push([a.valor, a.odd, a.resultado, a.lucro]);
  });

  const csv = linhas.map(l => l.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "apostas.csv";
  a.click();
}

// =====================
// PAGAMENTO
// =====================
function irParaPagamento() {
  alert("Pague via PIX e envie o comprovante no WhatsApp para liberar o PRO");
  window.open("https://wa.me/19971295263");
}

// =====================
// ATIVAR PRO
// =====================
// =====================
// ATIVAR PRO (CORRETO)
// =====================
function ativarPro() {
  let codigo = prompt("Digite seu código PRO");

  if (!codigo) return;

  if (codigo === "VIP123") {
    localStorage.setItem("pro", "true");
    alert("Plano PRO ativado!");
    location.reload();
  } else {
    alert("Código inválido");
  }
}

// deixa global (pra funcionar no botão)
window.ativarPro = ativarPro;
// =====================
// ABAS
// =====================
function initAbas() {
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {

      // ativa menu
      document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      const aba = item.getAttribute("data-aba");

      // esconde todas
      document.querySelectorAll(".aba").forEach(sec => {
        sec.classList.add("hidden");
      });

      // mostra a clicada
      document.getElementById(aba).classList.remove("hidden");
    });
  });
}
// =====================
// INICIAR (CORRIGIDO)
// =====================
window.onload = function () {
  initForm();
  initAbas();
  atualizarTudo();
};

// =====================
// UPDATE GERAL
// =====================
function atualizarTudo() {
  atualizarTabela();
  atualizarMetricas();
  atualizarGrafico();
  atualizarInsights();
  atualizarScore();
}