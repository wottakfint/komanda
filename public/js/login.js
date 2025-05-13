$(document).ready(function() {
    // Проверка авторизации
    if (localStorage.getItem('user')) {
        window.location.href = 'views/soldiers.html';
    }
    
    // Анимация входа
    $('.card-login').addClass('animate__animated animate__fadeInUp');
    
    // Обработка формы входа
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        
        // Скрыть предыдущие ошибки
        $('#loginError').addClass('d-none');
        
        // Показать спиннер
        $('#loginSpinner').removeClass('d-none');
        $('#loginButtonText').text('Вход...');
        
        // Отправка запроса
        $.ajax({
            url: '/api/login',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ username, password }),
            success: function(response) {
                if (response.success) {
                    localStorage.setItem('user', JSON.stringify(response.user));
                    
                    // Анимация успешного входа
                    $('#loginForm').hide();
                    $('.card-login').append('<div class="text-center py-4 animate__animated animate__fadeIn"><i class="bi bi-check-circle text-success" style="font-size: 3rem;"></i><h4 class="mt-3">Вход выполнен успешно!</h4><p class="text-muted">Перенаправление...</p></div>');
                    
                    setTimeout(function() {
                        window.location.href = 'views/soldiers.html';
                    }, 1000);
                } else {
                    showError('Ошибка авторизации');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при подключении к серверу';
                showError(errorMessage);
            },
            complete: function() {
                // Скрыть спиннер
                $('#loginSpinner').addClass('d-none');
                $('#loginButtonText').text('Войти в систему');
            }
        });
    });
    
    function showError(message) {
        $('#loginError').text(message)
            .removeClass('d-none')
            .addClass('animate__animated animate__headShake');
            
        setTimeout(function() {
            $('#loginError').removeClass('animate__headShake');
        }, 1000);
    }
});