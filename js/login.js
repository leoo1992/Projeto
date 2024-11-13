document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const uploadForm = document.getElementById("uploadForm");
  const alertContainer = document.getElementById("alertContainer");

  localStorage.removeItem("clienteId");

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

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const user = alasql(
      "SELECT * FROM usuarios WHERE nome_usuario = ? AND senha = ?",
      [username, password]
    );

    if (user.length > 0) {
      showAlert("Login bem-sucedido!", "success");
      localStorage.setItem("token", "token");
      setTimeout(() => {
        window.location.href = "clientes.html";
      }, 2010);
    } else {
      showAlert("Usuário ou senha incorretos!", "danger");
      loginForm.reset();
    }
  });

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const newUsername = document.getElementById("newUsername").value;
    const newPassword = document.getElementById("newPassword").value;
    const modalElement = document.getElementById("registerModal");
    const modal = bootstrap.Modal.getInstance(modalElement);

    const existingUser = alasql(
      "SELECT * FROM usuarios WHERE nome_usuario = ?",
      [newUsername]
    );

    if (existingUser.length > 0) {
      showAlert("Usuário já existe!", "warning");
      registerForm.reset();
    } else {
      alasql("INSERT INTO usuarios (nome_usuario, senha) VALUES (?, ?)", [
        newUsername,
        newPassword,
      ]);

      modal.hide();
      showAlert("Usuário cadastrado com sucesso!", "success");
    }
  });

  uploadForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const modalElement = document.getElementById("settingsModal");
    const modal = bootstrap.Modal.getInstance(modalElement);
    const fileInput = document.getElementById("databaseFile");
    const file = fileInput.files[0];
    const reader = new FileReader();

    if (!file) {
      modal.hide();
      showAlert("Por favor, selecione um arquivo válido.", "warning");
      return;
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith(".json")) {
      modal.hide();
      showAlert("Por favor, selecione um arquivo JSON.", "warning");
      return;
    }

    reader.onload = function () {
      const content = reader.result;

      if (content && content.trim().length > 0) {
        const data = JSON.parse(content);

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

        if (Array.isArray(data.usuarios)) {
          data.usuarios.forEach((user) => {
            if (user.nome && user.senha) {
              alasql(
                "INSERT INTO usuarios (nome_usuario, senha) VALUES (?, ?)",
                [user.nome, user.senha]
              );
            }
          });
        }

        if (Array.isArray(data.clientes)) {
          data.clientes.forEach((cliente) => {
            if (
              cliente.nome &&
              cliente.cpf &&
              cliente.data_nascimento &&
              cliente.telefone &&
              cliente.celular
            ) {
              alasql(
                "INSERT INTO clientes (nome, cpf, data_nascimento, telefone, celular) VALUES (?, ?, ?, ?, ?)",
                [
                  cliente.nome,
                  cliente.cpf,
                  cliente.data_nascimento,
                  cliente.telefone,
                  cliente.celular,
                ]
              );
            }
          });
        }

        if (Array.isArray(data.enderecos)) {
          data.enderecos.forEach((endereco) => {
            if (
              endereco.cep &&
              endereco.rua &&
              endereco.bairro &&
              endereco.cidade &&
              endereco.estado &&
              endereco.pais &&
              endereco.cliente_id !== undefined &&
              endereco.end_principal !== undefined
            ) {
              alasql(
                "INSERT INTO enderecos (cep, rua, bairro, cidade, estado, pais, cliente_id, end_principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [
                  endereco.cep,
                  endereco.rua,
                  endereco.bairro,
                  endereco.cidade,
                  endereco.estado,
                  endereco.pais,
                  endereco.cliente_id,
                  endereco.end_principal,
                ]
              );
            }
          });
        }
        modal.hide();
        showAlert("Banco de dados importado com sucesso!", "success");
      } else {
        modal.hide();
        showAlert("Arquivo vazio ou formato inválido.", "warning");
      }

      modal.hide();
    };

    reader.readAsText(file);
  });
});
