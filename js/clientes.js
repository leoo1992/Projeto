document.addEventListener("DOMContentLoaded", () => {
  const formularioCliente = document.getElementById("formularioCliente");
  const clientTableBody = document.getElementById("corpoTabelaClientes");
  const hoje = new Date().toISOString().split("T")[0];
  const cpfInput = document.getElementById("cpfCliente");
  const telefoneInput = document.getElementById("telefoneCliente");
  const celularInput = document.getElementById("celularCliente");
  const alertContainer = document.getElementById("alertContainer");
  const sairBtn = document.getElementById("sair-btn");
  const downloadBtn = document.getElementById("download-btn");

  localStorage.removeItem("clienteId");

  const token = localStorage.getItem("token");

  if (!token || token !== "token") {
    showAlert("Efetue login primeiro !");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  }

  alasql(`
    CREATE localStorage DATABASE IF NOT EXISTS agrosysdb;
    ATTACH localStorage DATABASE agrosysdb;
    USE agrosysdb;
  `);

  alasql(
    "CREATE TABLE IF NOT EXISTS usuarios (id INT AUTO_INCREMENT PRIMARY KEY, nome_usuario STRING, senha STRING)"
  );
  alasql(
    "CREATE TABLE IF NOT EXISTS clientes (id INT AUTO_INCREMENT PRIMARY KEY, nome STRING, cpf STRING, data_nascimento DATE, telefone STRING, celular STRING)"
  );
  alasql(
    "CREATE TABLE IF NOT EXISTS enderecos (id INT AUTO_INCREMENT PRIMARY KEY, cep STRING, rua STRING, bairro STRING, cidade STRING, estado STRING, pais STRING, cliente_id INT, end_principal BOOLEAN)"
  );

  function showAlert(message, type = "danger") {
    alertContainer.innerHTML = "";

    const alert = document.createElement("div");
    alert.classList.add("alert", `alert-${type}`, "text-sm", "font-sm");
    alert.setAttribute("role", "alert");
    alert.innerHTML = `${message}
     <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>`;
    alertContainer.appendChild(alert);
    setTimeout(() => {
      alert.remove();
    }, 2000);
  }

  document.getElementById("dataNascimentoCliente").max = hoje;

  sairBtn.addEventListener("click", function () {
    localStorage.removeItem("token");
    window.location.href = "/index.html";
  });

  cpfInput.addEventListener("input", function () {
    let cpf = cpfInput.value.replace(/\D/g, "");
    cpf = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    cpfInput.value = cpf;
  });

  telefoneInput.addEventListener("input", function () {
    let telefone = telefoneInput.value.replace(/\D/g, "");
    telefone = telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    telefoneInput.value = telefone;
  });

  celularInput.addEventListener("input", function () {
    let celular = celularInput.value.replace(/\D/g, "");
    celular = celular.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    celularInput.value = celular;
  });

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }

    let soma = 0;
    let resto;

    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) {
      return false;
    }

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.charAt(10));
  }

  function loadClients() {
    const clientes = alasql("SELECT * FROM clientes");

    function handleSelectClient(clienteId) {
      localStorage.removeItem("clienteId");
      localStorage.setItem("clienteId", clienteId);
      window.location.href = "enderecos.html";
    }

    clientTableBody.innerHTML = "";
    clientes.forEach((cliente) => {
      const row = document.createElement("tr");
      row.classList.add("align-middle");
      row.innerHTML = `
        <td class="text-sm px-2 small text-nowrap">${cliente.id}</td>
        <td class="text-sm px-2 small text-nowrap">${cliente.nome}</td>
        <td class="text-sm px-2 small text-nowrap">${cliente.cpf}</td>
        <td class="text-sm px-2 small text-nowrap">${cliente.data_nascimento}</td>
        <td class="text-sm px-2 small text-nowrap">${cliente.telefone}</td>
        <td class="text-sm px-2 small text-nowrap">${cliente.celular}</td>
        <td class="px-2 text-nowrap d-flex justify-content-center text-nowrap ">
          <button id="btn-selecionar" class="btn-selecionar p-2">
            Selecionar
          </button>
        </td>
      `;
      clientTableBody.appendChild(row);

      const selectButton = row.querySelector(".btn-selecionar");
      selectButton.addEventListener("click", () =>
        handleSelectClient(cliente.id)
      );
    });
  }

  formularioCliente.addEventListener("submit", (e) => {
    e.preventDefault();
    const nome = document.getElementById("nomeCliente").value;
    const cpf = document.getElementById("cpfCliente").value;
    const dataNascimentoInvertida = document
      .getElementById("dataNascimentoCliente")
      .value.split("-");
    const dataNascimento = `${dataNascimentoInvertida[2]}/${dataNascimentoInvertida[1]}/${dataNascimentoInvertida[0]}`;
    const telefone = document.getElementById("telefoneCliente").value;
    const celular = document.getElementById("celularCliente").value;
    const modalElement = document.getElementById("adicionarClienteModal");
    const modal = bootstrap.Modal.getInstance(modalElement);

    if (!validarCPF(cpf)) {
      showAlert("CPF inválido!", "warning");
      return;
    }

    const existeCliente = alasql("SELECT * FROM clientes WHERE cpf = ?", [cpf]);

    if (existeCliente.length > 0) {
      showAlert("CPF já cadastrado!", "warning");
    } else {
      alasql(
        "INSERT INTO clientes (nome, cpf, data_nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?)",
        [nome, cpf, dataNascimento, telefone, celular]
      );
      formularioCliente.reset();
      loadClients();
      modal.hide();
      showAlert("Cliente cadastrado com sucesso!", "success");
    }
  });

  downloadBtn.addEventListener("click", (e) => {
    e.preventDefault();

    const usuarios = alasql("SELECT * FROM usuarios");
    const clientes = alasql("SELECT * FROM clientes");
    const enderecos = alasql("SELECT * FROM enderecos");

    const data = {
      usuarios: usuarios,
      clientes: clientes,
      enderecos: enderecos,
    };

    const jsonContent = JSON.stringify(data, null, 2);

    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "agrosysdb_backup.json";
    a.click();

    URL.revokeObjectURL(url);
  });

  loadClients();
});
