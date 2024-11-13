document.addEventListener("DOMContentLoaded", () => {
  const enderecoForm = document.getElementById("enderecoForm");
  const voltarBtn = document.getElementById("voltar-btn");
  const alertContainer = document.getElementById("alertContainer");
  const enderecoCEP = document.getElementById("enderecoCEP");
  const enderecoBairro = document.getElementById("enderecoBairro");
  const enderecoCidade = document.getElementById("enderecoCidade");
  const enderecoEstado = document.getElementById("enderecoEstado");
  const enderecoPais = document.getElementById("enderecoPais");

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

  enderecoCEP.addEventListener("input", function () {
    let cep = this.value.replace(/\D/g, "");
    cep = cep.replace(/(\d{5})(\d{1,3})/, "$1-$2");

    this.value = cep;
  });

  function retiraNumeros() {
    this.value = this.value.replace(/[0-9]/g, "");
  }

  enderecoBairro.addEventListener("input", retiraNumeros);
  enderecoCidade.addEventListener("input", retiraNumeros);
  enderecoEstado.addEventListener("input", retiraNumeros);
  enderecoPais.addEventListener("input", retiraNumeros);

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

  function loadEnderecos(clienteId = null) {
    const enderecoTableBody = document.getElementById("enderecoTableBody");
    let query = "SELECT * FROM enderecos";

    if (clienteId) {
      query += ` WHERE cliente_id = ${clienteId}`;
    }

    const enderecos = alasql(query);
    enderecoTableBody.innerHTML = "";
    enderecos.forEach((endereco) => {
      const row = document.createElement("tr");
      row.classList.add("align-middle");
      row.innerHTML = `
        <td class="text-sm px-2 small text-nowrap">${endereco.cliente_id}</td>
        <td class="text-sm px-2 small text-nowrap">${endereco.cep}</td>
        <td class="text-sm px-2 small text-nowrap">${endereco.rua}</td>
        <td class="text-sm px-2 small text-nowrap">${endereco.bairro}</td>
        <td class="text-sm px-2 small text-nowrap">${endereco.cidade}</td>
        <td class="text-sm px-2 small text-nowrap">${endereco.estado}</td>
        <td class="text-sm px-2 small text-nowrap">${endereco.pais}</td>
        <td class="px-2 text-nowrap d-flex justify-content-center text-nowrap input-group-lg ">
          <input
            type="checkbox"
            class="form-check-input endereco-principal my-1"
            id="enderecoPrincipal${endereco.id}"
            name="enderecoPrincipal"
            data-endereco-id="${endereco.id}"
            ${endereco.end_principal ? "checked" : ""}
          />
        </td>
      `;
      enderecoTableBody.appendChild(row);

      const checkbox = document.getElementById(
        `enderecoPrincipal${endereco.id}`
      );
      checkbox.addEventListener("change", (e) => {
        const allCheckboxes = document.querySelectorAll(
          'input[name="enderecoPrincipal"]'
        );

        allCheckboxes.forEach((checkbox) => {
          if (checkbox !== e.target) {
            checkbox.checked = false;
            updateEnderecoPrincipal(
              checkbox.getAttribute("data-endereco-id"),
              false
            );
          }
        });

        const enderecoId = e.target.getAttribute("data-endereco-id");
        updateEnderecoPrincipal(enderecoId, e.target.checked);
      });
    });
  }

  function updateEnderecoPrincipal(enderecoId, isPrincipal) {
    const clienteId = localStorage.getItem("clienteId");

    if (isPrincipal) {
      alasql(
        "UPDATE enderecos SET end_principal = false WHERE cliente_id = ? AND id != ?",
        [parseInt(clienteId), parseInt(enderecoId)]
      );
    } else {
      alasql(
        "UPDATE enderecos SET end_principal = true WHERE cliente_id = ? AND id != ?",
        [parseInt(clienteId), parseInt(enderecoId)]
      );
    }
  }

  const clienteId = localStorage.getItem("clienteId");
  const token = localStorage.getItem("token");

  if (clienteId) {
    loadEnderecos(clienteId);
  } else {
    showAlert("Selecione um cliente !");
    setTimeout(() => {
      window.location.href = "clientes.html";
    }, 500);
  }

  if (!token || token !== "token") {
    showAlert("Efetue login primeiro !");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 500);
  }

  enderecoForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const cep = document.getElementById("enderecoCEP").value;
    const rua = document.getElementById("enderecoRua").value;
    const bairro = document.getElementById("enderecoBairro").value;
    const cidade = document.getElementById("enderecoCidade").value;
    const estado = document.getElementById("enderecoEstado").value;
    const pais = document.getElementById("enderecoPais").value;
    const cliente_id = localStorage.getItem("clienteId");
    const modalElement = document.getElementById("addEnderecoModal");
    const modal = bootstrap.Modal.getInstance(modalElement);
    let isPrincipal = false;

    if (!cliente_id) {
      enderecoForm.reset();
      modal.hide();
      showAlert("Selecione um cliente !");
      setTimeout(() => {
        window.location.href = "clientes.html";
      }, 500);
      return;
    }

    const enderecoPrincipalExistente = alasql(
      "SELECT * FROM enderecos WHERE cliente_id = ? AND end_principal = true",
      [parseInt(cliente_id)]
    );

    if (enderecoPrincipalExistente.length === 0) {
      isPrincipal = true;
    }

    alasql(
      "INSERT INTO enderecos (cep, rua, bairro, cidade, estado, pais, cliente_id, end_principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [cep, rua, bairro, cidade, estado, pais, cliente_id, isPrincipal]
    );

    enderecoForm.reset();
    modal.hide();
    loadEnderecos(cliente_id);
    showAlert("Endereço cadastrado com sucesso!", "success");
  });

  voltarBtn.addEventListener("click", () => {
    window.location.href = "clientes.html";
  });
});
