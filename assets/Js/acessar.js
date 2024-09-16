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