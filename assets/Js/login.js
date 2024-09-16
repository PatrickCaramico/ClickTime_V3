// Função para exibir o alerta ao carregar a página, apenas no index.html
function exibirAlertaLogin() {
    // Verifica se a página atual é o index.html
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        alert("Para acessar o sistema, informe o login e senha ou clique no botão cadastrar.");
    }
}

// Função para cadastrar o usuário
function cadastrar() {
    const nome = document.getElementById('nome').value; // ID do nome
    const username = document.getElementById('username').value; // ID do nome de usuário
    const senha = document.getElementById('senha').value; // ID da senha

    // Verificar se os campos não estão vazios
    if (!nome || !username || !senha) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    // Criar objeto com os dados do usuário
    const usuario = {
        nome: nome,
        username: username,
        senha: senha
    };

    // Salvar o objeto no LocalStorage
    localStorage.setItem('usuario', JSON.stringify(usuario));

    // Exibir alerta de sucesso e redirecionar
    alert('Cadastro realizado com sucesso! Clique em \'OK\' e faça login.');
    window.location.href = './index.html'; // Redirecionar para index.html
}

// Função para realizar o login
function logar() {
    // Obter os valores digitados pelo usuário
    const username = document.getElementById('username').value;
    const senha = document.getElementById('senha').value;

    // Recuperar os dados do usuário armazenados no LocalStorage
    const usuarioArmazenado = JSON.parse(localStorage.getItem('usuario'));

    // Verificar se os dados estão corretos
    if (usuarioArmazenado) {
        if (usuarioArmazenado.username === username && usuarioArmazenado.senha === senha) {
            alert('Login realizado com sucesso!');
            window.location.href = 'tela_contagem examplo/sistema.html'; // Altere para a página que deseja redirecionar
        } else {
            alert('Usuário ou senha incorretos. Tente novamente.');
        }
    } else {
        alert('Nenhum usuário cadastrado. Por favor, cadastre-se primeiro.');
    }
}

// Função para exibir o nome do usuário na página sistema.html
function exibirNomeUsuario() {
    const usuarioArmazenado = JSON.parse(localStorage.getItem('usuario'));
    if (usuarioArmazenado) {
        document.getElementById('nome').innerText = `Welcome ${usuarioArmazenado.nome}`;
    }
}

// Chama as funções para exibir o alerta e o nome do usuário quando a página carregar
window.onload = function() {
    exibirAlertaLogin(); // Apenas será chamado no index.html
    exibirNomeUsuario();
};
