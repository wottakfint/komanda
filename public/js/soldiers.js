$(document).ready(function() {
    // Проверка авторизации
    if (!localStorage.getItem('user')) {
        window.location.href = '../index.html';
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    $('#userInfo').text(`${user.username} (${user.role})`);
	
	//.........
    //.........
	// Удалил индикатор загрузки
    //.........
	//.........
	
    // Загрузка списка военнослужащих
    loadSoldiers();
    
    // Обработка поиска при клике на кнопку
    $('#searchBtn').on('click', function() {
        const searchTerm = $('#searchInput').val().trim();
        if (searchTerm) {
            searchSoldiers(searchTerm);
        } else {
            loadSoldiers();
        }
    });
    
    // Поиск при нажатии Enter
    $('#searchInput').on('keypress', function(e) {
        if (e.which === 13) {
            $('#searchBtn').click();
        }
    });
    
    // Очистка поиска при очистке поля
    $('#searchInput').on('input', function() {
        if ($(this).val().trim() === '') {
            loadSoldiers();
        }
    });
    
    // Открытие модального окна для добавления нового бойца
    $('#addSoldierBtn').on('click', function() {
        $('#soldierForm')[0].reset();
        $('#soldierId').val('');
        $('#soldierModalTitle').text('Добавление военнослужащего');
        $('#soldierError').addClass('d-none');
        $('#soldierModal').modal('show');
    });
    
    // Сохранение данных бойца
        $('#saveSoldierBtn').on('click', function() {
        if (!$('#soldierForm')[0].checkValidity()) {
            $('#soldierForm')[0].reportValidity();
            return;
        }
        // Добавьте этот код после блока с существующими обработчиками событий
$('#calculateBmiBtn').on('click', function() {
    const height = $('#height').val() ? parseInt($('#height').val()) : null;
    const weight = $('#weight').val() ? parseInt($('#weight').val()) : null;
    
    if (height && weight) {
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        $('#bmi').val(bmi.toFixed(1));
    } else {
        alert('Введите рост и вес для расчета ИМТ');
    }
});

// Также можно автоматически пересчитывать ИМТ при изменении роста или веса
$('#height, #weight').on('input', function() {
    const height = $('#height').val() ? parseInt($('#height').val()) : null;
    const weight = $('#weight').val() ? parseInt($('#weight').val()) : null;
    
    if (height && weight) {
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);
        $('#bmi').val(bmi.toFixed(1));
    } else {
        $('#bmi').val('');
    }
});
        const soldierId = $('#soldierId').val();
        const isNew = !soldierId;
        
        // Показать спиннер
        $('#soldierBtnText').text(isNew ? 'Добавление...' : 'Сохранение...');
        $('#soldierSpinner').removeClass('d-none');
        $('#saveSoldierBtn').prop('disabled', true);
        $('#soldierError').addClass('d-none');
        
        // Получаем рост и вес
        const height = $('#height').val() ? parseInt($('#height').val()) : null;
        const weight = $('#weight').val() ? parseInt($('#weight').val()) : null;
        
        // Рассчитываем ИМТ, если есть рост и вес
        let bmi = null;
        if (height && weight) {
            const heightM = height / 100;
            bmi = weight / (heightM * heightM);
        }
        
        const soldierData = {
            full_name: $('#fullName').val(),
            personal_number: $('#personalNumber').val(),
            rank: $('#rank').val(),
            unit: $('#unit').val(),
            birth_date: $('#birthDate').val(),
            blood_type: $('#bloodType').val(),
            rhesus_factor: $('#rhFactor').val(),
            height: height,
            weight: weight,
            bmi: bmi, // Добавляем рассчитанный ИМТ
            fitness_category: $('#fitnessCategory').val(),
            emergency_contact: $('#emergencyContact').val(),
            emergency_phone: $('#emergencyPhone').val()
        };
        
        const url = isNew ? '/api/soldiers' : `/api/soldiers/${soldierId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(soldierData),
            success: function(response) {
                if (response.success) {
                    $('#soldierModal').modal('hide');
                    loadSoldiers();
                    
                    // Если это новый боец и требуется перейти к его медкарте
                    if (isNew && response.data && response.data.soldier_id) {
                        const goToMedcard = confirm('Военнослужащий успешно добавлен. Перейти к его медицинской карте?');
                        if (goToMedcard) {
                            window.location.href = `medcard.html?id=${response.data.soldier_id}`;
                        }
                    }
                } else {
                    showError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showError(errorMessage);
            },
            complete: function() {
                $('#soldierBtnText').text('Сохранить');
                $('#soldierSpinner').addClass('d-none');
                $('#saveSoldierBtn').prop('disabled', false);
            }
        });
    });
    
    // Выход из системы
    $('#logoutBtn').on('click', function() {
        $(this).html('<span class="spinner-border spinner-border-sm" role="status"></span> Выход...');
        $(this).prop('disabled', true);
        
        $.ajax({
            url: '/api/logout',
            method: 'POST',
            success: function() {
                localStorage.removeItem('user');
                window.location.href = '../index.html';
            },
            error: function() {
                alert('Ошибка при выходе из системы');
                localStorage.removeItem('user');
                window.location.href = '../index.html';
            }
        });
    });
    
    function loadSoldiers() {
        $('#loadingIndicator').removeClass('d-none');
        $('#soldiersTable').empty();
        $('#noResults').addClass('d-none');
        
        $.ajax({
            url: '/api/soldiers',
            method: 'GET',
            success: function(response) {
                $('#loadingIndicator').addClass('d-none');
                
                if (response.success) {
                    displaySoldiers(response.data);
                } else {
                    alert('Ошибка: ' + (response.message || 'Неизвестная ошибка при загрузке данных'));
                }
            },
            error: function(xhr) {
                $('#loadingIndicator').addClass('d-none');
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке данных';
                alert(errorMessage);
            }
        });
    }
    
    function searchSoldiers(term) {
        $('#loadingIndicator').removeClass('d-none');
        $('#soldiersTable').empty();
        $('#noResults').addClass('d-none');
        
        $.ajax({
            url: `/api/soldiers/search?term=${encodeURIComponent(term)}`,
            method: 'GET',
            success: function(response) {
                $('#loadingIndicator').addClass('d-none');
                
                if (response.success) {
                    displaySoldiers(response.data);
                } else {
                    alert('Ошибка: ' + (response.message || 'Неизвестная ошибка при поиске'));
                }
            },
            error: function(xhr) {
                $('#loadingIndicator').addClass('d-none');
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при поиске';
                alert(errorMessage);
            }
        });
    }
    
    function displaySoldiers(soldiers) {
        const tableBody = $('#soldiersTable');
        tableBody.empty();
        
        if (!soldiers || soldiers.length === 0) {
            $('#noResults').removeClass('d-none');
            return;
        }
        
        $('#noResults').addClass('d-none');
        
        soldiers.forEach(function(soldier, index) {
            // Проверяем, имеет ли солдат ID
            if (!soldier.soldier_id) {
                console.error('Ошибка: солдат без ID', soldier);
                return; // Пропускаем его
            }
            
            // Добавляем задержку для анимации
            const delay = index * 50;
            
            const healthStatusClass = getHealthStatusClass(soldier.health_status);
            const healthStatusText = getHealthStatusText(soldier.health_status);
            const formattedDate = formatDate(soldier.last_examination_date);
            
            // Используем явное преобразование ID к строке, чтобы избежать проблем с типами
            const soldierIdStr = String(soldier.soldier_id);
            
            const row = `
                <tr class="animate__animated animate__fadeIn" style="animation-delay: ${delay}ms">
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="ms-2">
                                <strong>${soldier.full_name || 'Без имени'}</strong>
                            </div>
                        </div>
                    </td>
                    <td>${soldier.personal_number || '-'}</td>
                    <td>${soldier.rank || '-'}</td>
                    <td>${soldier.unit || '-'}</td>
                    <td><span class="status-badge ${healthStatusClass}">${healthStatusText}</span></td>
                    <td>${formattedDate}</td>
                    <td class="text-center">
                        <div class="btn-group">
                            <a href="medcard.html?id=${soldierIdStr}" class="btn btn-sm btn-primary view-soldier-btn" data-id="${soldierIdStr}">
                                <i class="bi bi-file-medical me-1"></i> Медкарта
                            </a>
                            <button class="btn btn-sm btn-outline-primary edit-soldier-btn" data-id="${soldierIdStr}">
                                <i class="bi bi-pencil"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            tableBody.append(row);
        });
        
        // Добавляем отладочную информацию при клике на кнопки
        $('.view-soldier-btn').on('click', function(e) {
            const soldierId = $(this).data('id');
            console.log('Переход к медкарте солдата с ID:', soldierId);
            // Дополнительная проверка, что ID существует
            if (!soldierId) {
                e.preventDefault();
                alert('Ошибка: ID военнослужащего не указан');
            }
        });
        
        // Привязываем обработчик к кнопкам редактирования
        $('.edit-soldier-btn').on('click', function() {
            const soldierId = $(this).data('id');
            console.log('Редактирование солдата с ID:', soldierId);
            if (soldierId) {
                loadSoldierData(soldierId);
            } else {
                alert('Ошибка: ID военнослужащего не указан');
            }
        });
    }
    
    function loadSoldierData(soldierId) {
        $.ajax({
            url: `/api/soldiers/${soldierId}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    fillSoldierForm(response.data);
                } else {
                    alert('Ошибка: ' + (response.message || 'Неизвестная ошибка при загрузке данных военнослужащего'));
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке данных военнослужащего';
                alert(errorMessage);
            }
        });
    }
    
    function fillSoldierForm(soldier) {
        $('#soldierModalTitle').text('Редактирование данных военнослужащего');
        
        $('#soldierId').val(soldier.soldier_id);
        $('#fullName').val(soldier.full_name || '');
        $('#personalNumber').val(soldier.personal_number || '');
        $('#rank').val(soldier.rank || '');
        $('#unit').val(soldier.unit || '');
        $('#birthDate').val(formatDateForInput(soldier.birth_date) || '');
        $('#bloodType').val(soldier.blood_type || '');
        $('#rhFactor').val(soldier.rhesus_factor || '');
        $('#height').val(soldier.height || '');
        $('#weight').val(soldier.weight || '');
        $('#fitnessCategory').val(soldier.fitness_category || '');
        $('#emergencyContact').val(soldier.emergency_contact || '');
        $('#emergencyPhone').val(soldier.emergency_phone || '');
        
        $('#soldierError').addClass('d-none');
        $('#soldierModal').modal('show');
    }
    
    function showError(message) {
        $('#soldierError').text(message).removeClass('d-none');
    }
    
    function getHealthStatusClass(status) {
        if (!status) return '';
        
        switch (status.toLowerCase()) {
            case 'хорошее':
                return 'good';
            case 'удовлетворительное':
                return 'satisfactory';
            case 'неудовлетворительное':
                return 'bad';
            default:
                return '';
        }
    }
    
    function getHealthStatusText(status) {
        if (!status) return 'Не указан';
        return status;
    }
    
    function formatDate(dateString) {
        if (!dateString) return 'Не указана';
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }
    
});