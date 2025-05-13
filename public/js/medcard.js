$(document).ready(function() {
    // Проверка авторизации
    if (!localStorage.getItem('user')) {
        window.location.href = '../index.html';
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user'));
    $('#userInfo').text(`${user.username} (${user.role})`);
    
    // Получение ID военнослужащего из URL
    const urlParams = new URLSearchParams(window.location.search);
    const soldierId = urlParams.get('id');
    
    if (!soldierId) {
        alert('Не указан ID военнослужащего');
        window.location.href = 'soldiers.html';
        return;
    }
    
    // Хранилище для данных солдата, чтобы иметь доступ во всем скрипте
    let soldierData = null;
    
    // Загрузка данных медкарты
    loadMedicalCard(soldierId);
    
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
    
    // Обработка открытия модальных окон для добавления данных
    $('.add-condition-btn').on('click', function() {
        $('#conditionForm')[0].reset();
        $('#conditionId').val('');
        $('#conditionModalTitle').text('Добавление заболевания/травмы');
        $('#conditionError').addClass('d-none');
        $('#conditionModal').modal('show');
    });
    
    $('.add-allergy-btn').on('click', function() {
        $('#allergyForm')[0].reset();
        $('#allergyId').val('');
        $('#allergyModalTitle').text('Добавление аллергии');
        $('#allergyError').addClass('d-none');
        $('#allergyModal').modal('show');
    });
    
    $('.add-medication-btn').on('click', function() {
        $('#medicationForm')[0].reset();
        $('#medicationId').val('');
        $('#medicationModalTitle').text('Добавление лекарства');
        $('#medicationError').addClass('d-none');
        $('#medicationModal').modal('show');
    });
    
    $('.add-vaccination-btn').on('click', function() {
        $('#vaccinationForm')[0].reset();
        $('#vaccinationId').val('');
        $('#vaccinationModalTitle').text('Добавление вакцинации');
        $('#vaccinationError').addClass('d-none');
        $('#vaccinationModal').modal('show');
    });
    
    $('.add-document-btn').on('click', function() {
        $('#documentForm')[0].reset();
        $('#documentId').val('');
        $('#documentModalTitle').text('Загрузка документа');
        $('#documentError').addClass('d-none');
        $('#documentModal').modal('show');
    });
    
    // Сохранение заболевания/травмы
    $('#saveConditionBtn').on('click', function() {
        if (!$('#conditionForm')[0].checkValidity()) {
            $('#conditionForm')[0].reportValidity();
            return;
        }
        
        const conditionId = $('#conditionId').val();
        const isNew = !conditionId;
        
        // Показать спиннер
        $('#conditionBtnText').text(isNew ? 'Добавление...' : 'Сохранение...');
        $('#conditionSpinner').removeClass('d-none');
        $('#saveConditionBtn').prop('disabled', true);
        $('#conditionError').addClass('d-none');
        
        const conditionData = {
            soldier_id: soldierId,
            condition_type: $('#conditionType').val(),
            description: $('#conditionDescription').val(),
            start_date: $('#conditionStartDate').val(),
            end_date: $('#conditionEndDate').val() || null
        };
        
        const url = isNew ? '/api/conditions' : `/api/conditions/${conditionId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(conditionData),
            success: function(response) {
                if (response.success) {
                    $('#conditionModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showConditionError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showConditionError(errorMessage);
            },
            complete: function() {
                $('#conditionBtnText').text('Сохранить');
                $('#conditionSpinner').addClass('d-none');
                $('#saveConditionBtn').prop('disabled', false);
            }
        });
    });
    
    // Сохранение аллергии
    $('#saveAllergyBtn').on('click', function() {
        if (!$('#allergyForm')[0].checkValidity()) {
            $('#allergyForm')[0].reportValidity();
            return;
        }
        
        const allergyId = $('#allergyId').val();
        const isNew = !allergyId;
        
        // Показать спиннер
        $('#allergyBtnText').text(isNew ? 'Добавление...' : 'Сохранение...');
        $('#allergySpinner').removeClass('d-none');
        $('#saveAllergyBtn').prop('disabled', true);
        $('#allergyError').addClass('d-none');
        
        const allergyData = {
            soldier_id: soldierId,
            allergy_type: $('#allergyType').val(),
            description: $('#allergyDescription').val(),
            severity: $('#allergySeverity').val(),
            recommendations: $('#allergyRecommendations').val()
        };
        
        const url = isNew ? '/api/allergies' : `/api/allergies/${allergyId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(allergyData),
            success: function(response) {
                if (response.success) {
                    $('#allergyModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showAllergyError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showAllergyError(errorMessage);
            },
            complete: function() {
                $('#allergyBtnText').text('Сохранить');
                $('#allergySpinner').addClass('d-none');
                $('#saveAllergyBtn').prop('disabled', false);
            }
        });
    });
    
    // Сохранение лекарства
    $('#saveMedicationBtn').on('click', function() {
        if (!$('#medicationForm')[0].checkValidity()) {
            $('#medicationForm')[0].reportValidity();
            return;
        }
        
        const medicationId = $('#medicationId').val();
        const isNew = !medicationId;
        
        // Показать спиннер
        $('#medicationBtnText').text(isNew ? 'Добавление...' : 'Сохранение...');
        $('#medicationSpinner').removeClass('d-none');
        $('#saveMedicationBtn').prop('disabled', true);
        $('#medicationError').addClass('d-none');
        
        const medicationData = {
            soldier_id: soldierId,
            medication_name: $('#medicationName').val(),
            dosage: $('#medicationDosage').val(),
            frequency: $('#medicationFrequency').val(),
            start_date: $('#medicationStartDate').val(),
            end_date: $('#medicationEndDate').val() || null,
            notes: $('#medicationNotes').val()
        };
        
        const url = isNew ? '/api/medications' : `/api/medications/${medicationId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(medicationData),
            success: function(response) {
                if (response.success) {
                    $('#medicationModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showMedicationError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showMedicationError(errorMessage);
            },
            complete: function() {
                $('#medicationBtnText').text('Сохранить');
                $('#medicationSpinner').addClass('d-none');
                $('#saveMedicationBtn').prop('disabled', false);
            }
        });
    });
    
    // Сохранение вакцинации
    $('#saveVaccinationBtn').on('click', function() {
        if (!$('#vaccinationForm')[0].checkValidity()) {
            $('#vaccinationForm')[0].reportValidity();
            return;
        }
        
        const vaccinationId = $('#vaccinationId').val();
        const isNew = !vaccinationId;
        
        // Показать спиннер
        $('#vaccinationBtnText').text(isNew ? 'Добавление...' : 'Сохранение...');
        $('#vaccinationSpinner').removeClass('d-none');
        $('#saveVaccinationBtn').prop('disabled', true);
        $('#vaccinationError').addClass('d-none');
        
        const vaccinationData = {
            soldier_id: soldierId,
            vaccine_name: $('#vaccineName').val(),
            vaccination_date: $('#vaccinationDate').val(),
            expiration_date: $('#vaccineExpirationDate').val() || null,
            batch_number: $('#vaccineBatchNumber').val(),
            notes: $('#vaccineNotes').val()
        };
        
        const url = isNew ? '/api/vaccinations' : `/api/vaccinations/${vaccinationId}`;
        const method = isNew ? 'POST' : 'PUT';
        
        $.ajax({
            url: url,
            method: method,
            contentType: 'application/json',
            data: JSON.stringify(vaccinationData),
            success: function(response) {
                if (response.success) {
                    $('#vaccinationModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showVaccinationError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showVaccinationError(errorMessage);
            },
            complete: function() {
                $('#vaccinationBtnText').text('Сохранить');
                $('#vaccinationSpinner').addClass('d-none');
                $('#saveVaccinationBtn').prop('disabled', false);
            }
        });
    });
    
    // Загрузка документа
    $('#saveDocumentBtn').on('click', function() {
        if (!$('#documentForm')[0].checkValidity()) {
            $('#documentForm')[0].reportValidity();
            return;
        }
        
        // Показать спиннер
        $('#documentBtnText').text('Загрузка...');
        $('#documentSpinner').removeClass('d-none');
        $('#saveDocumentBtn').prop('disabled', true);
        $('#documentError').addClass('d-none');
        
        const formData = new FormData();
        formData.append('soldier_id', soldierId);
        formData.append('document_type', $('#documentType').val());
        formData.append('document_name', $('#documentName').val());
        formData.append('file', $('#documentFile')[0].files[0]);
        
        $.ajax({
            url: '/api/documents',
            method: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            success: function(response) {
                if (response.success) {
                    $('#documentModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showDocumentError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showDocumentError(errorMessage);
            },
            complete: function() {
                $('#documentBtnText').text('Загрузить');
                $('#documentSpinner').addClass('d-none');
                $('#saveDocumentBtn').prop('disabled', false);
            }
        });
    });
    
    // Обработка обновления категории годности
    $('#editFitnessBtn').on('click', function() {
        if (soldierData) {
            $('#fitnessCategorySelect').val(soldierData.fitness_category || '');
            $('#fitnessError').addClass('d-none');
            $('#fitnessModal').modal('show');
        } else {
            alert('Данные военнослужащего не загружены');
        }
    });

    $('#saveFitnessBtn').on('click', function() {
        if (!$('#fitnessForm')[0].checkValidity()) {
            $('#fitnessForm')[0].reportValidity();
            return;
        }
        
        // Показать спиннер
        $('#fitnessBtnText').text('Сохранение...');
        $('#fitnessSpinner').removeClass('d-none');
        $('#saveFitnessBtn').prop('disabled', true);
        $('#fitnessError').addClass('d-none');
        
        const fitnessData = {
            fitness_category: $('#fitnessCategorySelect').val()
        };
        
        $.ajax({
            url: `/api/medrecords/${soldierId}/fitness`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(fitnessData),
            success: function(response) {
                if (response.success) {
                    $('#fitnessModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showFitnessError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showFitnessError(errorMessage);
            },
            complete: function() {
                $('#fitnessBtnText').text('Сохранить');
                $('#fitnessSpinner').addClass('d-none');
                $('#saveFitnessBtn').prop('disabled', false);
            }
        });
    });

    function showFitnessError(message) {
        $('#fitnessError').text(message).removeClass('d-none');
    }

    // Обработка обновления статуса здоровья
    $('#editHealthBtn').on('click', function() {
        if (soldierData) {
            $('#healthStatusSelect').val(soldierData.health_status || '');
            $('#healthError').addClass('d-none');
            $('#healthModal').modal('show');
        } else {
            alert('Данные военнослужащего не загружены');
        }
    });

    $('#saveHealthBtn').on('click', function() {
        if (!$('#healthForm')[0].checkValidity()) {
            $('#healthForm')[0].reportValidity();
            return;
        }
        
        // Показать спиннер
        $('#healthBtnText').text('Сохранение...');
        $('#healthSpinner').removeClass('d-none');
        $('#saveHealthBtn').prop('disabled', true);
        $('#healthError').addClass('d-none');
        
        const healthData = {
            health_status: $('#healthStatusSelect').val()
        };
        
        $.ajax({
            url: `/api/medrecords/${soldierId}/status`,
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(healthData),
            success: function(response) {
                if (response.success) {
                    $('#healthModal').modal('hide');
                    loadMedicalCard(soldierId);
                } else {
                    showHealthError(response.message || 'Неизвестная ошибка');
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                showHealthError(errorMessage);
            },
            complete: function() {
                $('#healthBtnText').text('Сохранить');
                $('#healthSpinner').addClass('d-none');
                $('#saveHealthBtn').prop('disabled', false);
            }
        });
    });

    function showHealthError(message) {
        $('#healthError').text(message).removeClass('d-none');
    }
    
    // Функция показа модального окна подтверждения удаления
    function showDeleteConfirm(type, id, typeName) {
        $('#deleteItemType').val(type);
        $('#deleteItemId').val(id);
        $('#deleteConfirmText').text(`Вы действительно хотите удалить этот ${typeName}?`);
        $('#deleteConfirmModal').modal('show');
    }

    // Обработчик кнопки подтверждения удаления
    $('#confirmDeleteBtn').on('click', function() {
        const type = $('#deleteItemType').val();
        const id = $('#deleteItemId').val();
        
        // Показать спиннер
        $('#deleteBtnText').text('Удаление...');
        $('#deleteSpinner').removeClass('d-none');
        $('#confirmDeleteBtn').prop('disabled', true);
        
        // Определяем URL для разных типов объектов
        let url;
        switch (type) {
            case 'condition':
                url = `/api/conditions/${id}`;
                break;
            case 'allergy':
                url = `/api/allergies/${id}`;
                break;
            case 'medication':
                url = `/api/medications/${id}`;
                break;
            case 'vaccination':
                url = `/api/vaccinations/${id}`;
                break;
            case 'document':
                url = `/api/documents/${id}`;
                break;
            default:
                console.error('Неизвестный тип объекта для удаления');
                return;
        }
        
        // Выполняем запрос на удаление
        $.ajax({
            url: url,
            method: 'DELETE',
            success: function(response) {
                if (response.success) {
                    $('#deleteConfirmModal').modal('hide');
                    // Перезагружаем данные
                    loadMedicalCard(soldierId);
                } else {
                    alert(response.message || 'Ошибка при удалении');
                }
            },
            error: function(xhr) {
                console.error('Ошибка при удалении:', xhr);
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка соединения с сервером';
                alert(`Ошибка при удалении: ${errorMessage}`);
            },
            complete: function() {
                // Сбрасываем состояние кнопки
                $('#deleteBtnText').text('Удалить');
                $('#deleteSpinner').addClass('d-none');
                $('#confirmDeleteBtn').prop('disabled', false);
            }
        });
    });
    
    function loadMedicalCard(id) {
        // Показываем индикатор загрузки или заглушки
        $('.info-value').text('Загрузка...');
        
        $.ajax({
            url: `/api/medcard/${id}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    displayMedicalCard(response.data);
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке медкарты';
                alert(errorMessage);
                window.location.href = 'soldiers.html';
            }
        });
    }
    
    function displayMedicalCard(data) {
        soldierData = data.soldier; // Сохраняем данные для использования в других функциях
        
        // Заголовок и основная информация
        $('#soldierName').text(`${soldierData.full_name} | ${soldierData.rank}`);
        $('#personalNumber').text(soldierData.personal_number || 'Не указан');
        $('#birthDate').text(formatDate(soldierData.birth_date) || 'Не указана');
        $('#unit').text(soldierData.unit || 'Не указано');
        $('#rank').text(soldierData.rank || 'Не указано');
        
        // Медицинская информация
        $('#bloodType').text(
            soldierData.blood_type ? 
            `${soldierData.blood_type}${soldierData.rhesus_factor ? ' ' + soldierData.rhesus_factor : ''}` : 
            'Не указана'
        );
        
        $('#heightWeight').text(
            (soldierData.height && soldierData.weight) ? 
            `${soldierData.height} см / ${soldierData.weight} кг / ИМТ: ${calculateBMI(soldierData.height, soldierData.weight).toFixed(1)}` : 
            'Не указаны'
        );
        
        // Добавляем данные о категории годности и дате последнего осмотра
        $('#fitnessCategory').text(soldierData.fitness_category || 'Не указана');
        $('#lastExam').text(formatDate(soldierData.last_examination_date) || 'Не указана');
        
        // Добавляем данные о статусе здоровья
        $('#healthStatus').text(soldierData.health_status || 'Не указан');
        
        $('#emergencyContact').text(
            soldierData.emergency_contact ? 
            `${soldierData.emergency_contact}${soldierData.emergency_phone ? ' (' + soldierData.emergency_phone + ')' : ''}` : 
            'Не указан'
        );
        
        // Если есть фото
        if (soldierData.photo_path) {
            $('#profilePhoto').attr('src', soldierData.photo_path);
        } else {
            $('#profilePhoto').attr('src', '/img/profile-placeholder.png');
        }
        
        // Заболевания и травмы
        displayConditions(data.conditions);
        
        // Аллергии
        displayAllergies(data.allergies);
        
        // Лекарства
        displayMedications(data.medications);
        
        // Вакцинации
        displayVaccinations(data.vaccinations);
        
        // Документы
        displayDocuments(data.documents);
    }
    
    // Функции отображения данных в таблицах
    function displayConditions(conditions) {
        const conditionsTable = $('#conditionsTable');
        conditionsTable.empty();
        
        if (!conditions || conditions.length === 0) {
            conditionsTable.append('<tr><td colspan="6" class="text-center py-3">Нет данных</td></tr>');
        } else {
            conditions.forEach(function(condition, index) {
                const delay = index * 50;
                const typeClass = getConditionTypeClass(condition.condition_type);
                const typeText = getConditionTypeText(condition.condition_type);
                
                const row = `
                    <tr class="animate__animated animate__fadeIn" style="animation-delay: ${delay}ms">
                        <td><span class="condition-type ${typeClass}">${typeText}</span></td>
                        <td>${condition.description || '-'}</td>
                        <td>${formatDate(condition.start_date) || '-'}</td>
                        <td>${condition.end_date ? formatDate(condition.end_date) : '<span class="badge bg-warning text-dark">Активно</span>'}</td>
                        <td>${condition.doctor_name || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger delete-condition" data-id="${condition.condition_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                
                conditionsTable.append(row);
            });
            
            // Привязываем обработчик к кнопкам удаления
            $('.delete-condition').on('click', function() {
                const id = $(this).data('id');
                showDeleteConfirm('condition', id, 'заболевание/травму');
            });
        }
    }
    
    function displayAllergies(allergies) {
        const allergiesTable = $('#allergiesTable');
        allergiesTable.empty();
        
        if (!allergies || allergies.length === 0) {
            allergiesTable.append('<tr><td colspan="5" class="text-center py-3">Нет данных</td></tr>');
        } else {
            allergies.forEach(function(allergy, index) {
                const delay = index * 50;
                const severityClass = getAllergySeverityClass(allergy.severity);
                const severityText = getAllergySeverityText(allergy.severity);
                
                const row = `
                    <tr class="animate__animated animate__fadeIn" style="animation-delay: ${delay}ms">
                        <td>${getAllergyTypeText(allergy.allergy_type)}</td>
                        <td>${allergy.description || '-'}</td>
                        <td><span class="severity ${severityClass}">${severityText}</span></td>
                        <td>${allergy.recommendations || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger delete-allergy" data-id="${allergy.allergy_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                
                allergiesTable.append(row);
            });
            
            // Привязываем обработчик к кнопкам удаления
            $('.delete-allergy').on('click', function() {
                const id = $(this).data('id');
                showDeleteConfirm('allergy', id, 'аллергию');
            });
        }
    }
    
    function displayMedications(medications) {
        const medicationsTable = $('#medicationsTable');
        medicationsTable.empty();
        
        if (!medications || medications.length === 0) {
            medicationsTable.append('<tr><td colspan="8" class="text-center py-3">Нет данных</td></tr>');
        } else {
            medications.forEach(function(medication, index) {
                const delay = index * 50;
                const isActive = !medication.end_date || new Date(medication.end_date) >= new Date();
                const rowClass = isActive ? 'table-success' : '';
                
                const row = `
                    <tr class="${rowClass} animate__animated animate__fadeIn" style="animation-delay: ${delay}ms">
                        <td>${medication.medication_name || '-'}</td>
                        <td>${medication.dosage || '-'}</td>
                        <td>${medication.frequency || '-'}</td>
                        <td>${formatDate(medication.start_date) || '-'}</td>
                        <td>${medication.end_date ? formatDate(medication.end_date) : '<span class="badge bg-info">Постоянно</span>'}</td>
                        <td>${medication.prescribed_by || '-'}</td>
                        <td>${medication.notes || '-'}</td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger delete-medication" data-id="${medication.medication_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                
                medicationsTable.append(row);
            });
            
            // Привязываем обработчик к кнопкам удаления
            $('.delete-medication').on('click', function() {
                const id = $(this).data('id');
                showDeleteConfirm('medication', id, 'лекарство');
            });
        }
    }
    
    function displayVaccinations(vaccinations) {
        const vaccinationsTable = $('#vaccinationsTable');
        vaccinationsTable.empty();
        
        if (!vaccinations || vaccinations.length === 0) {
            vaccinationsTable.append('<tr><td colspan="7" class="text-center py-3">Нет данных</td></tr>');
        } else {
            vaccinations.forEach(function(vaccination, index) {
                const delay = index * 50;
                const isValid = vaccination.expiration_date ? new Date(vaccination.expiration_date) >= new Date() : true;
                const rowClass = isValid ? '' : 'table-warning';
                
                const row = `
                    <tr class="${rowClass} animate__animated animate__fadeIn" style="animation-delay: ${delay}ms">
                        <td>${vaccination.vaccine_name || '-'}</td>
                        <td>${formatDate(vaccination.vaccination_date) || '-'}</td>
                        <td>${formatDate(vaccination.expiration_date) || 'Бессрочно'}</td>
                        <td>${vaccination.doctor_name || '-'}</td>
                        <td>${vaccination.batch_number || '-'}</td>
                        <td>${vaccination.notes || '-'}</td>
                        <td class="text-center">
<button class="btn btn-sm btn-outline-danger delete-vaccination" data-id="${vaccination.vaccination_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                
                vaccinationsTable.append(row);
            });
            
            // Привязываем обработчик к кнопкам удаления
            $('.delete-vaccination').on('click', function() {
                const id = $(this).data('id');
                showDeleteConfirm('vaccination', id, 'вакцинацию');
            });
        }
    }
    
    function displayDocuments(documents) {
        const documentsTable = $('#documentsTable');
        documentsTable.empty();
        
        if (!documents || documents.length === 0) {
            documentsTable.append('<tr><td colspan="6" class="text-center py-3">Нет данных</td></tr>');
        } else {
            documents.forEach(function(document, index) {
                const delay = index * 50;
                
                const row = `
                    <tr class="animate__animated animate__fadeIn" style="animation-delay: ${delay}ms">
                        <td>${document.document_type || '-'}</td>
                        <td>${document.document_name || '-'}</td>
                        <td>${formatDate(document.upload_date) || '-'}</td>
                        <td>${document.uploader_name || '-'}</td>
                        <td>
                            <a href="${document.file_path}" class="btn btn-sm btn-primary" target="_blank">
                                <i class="bi bi-eye me-1"></i> Просмотр
                            </a>
                        </td>
                        <td class="text-center">
                            <button class="btn btn-sm btn-outline-danger delete-document" data-id="${document.document_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
                
                documentsTable.append(row);
            });
            
            // Привязываем обработчик к кнопкам удаления
            $('.delete-document').on('click', function() {
                const id = $(this).data('id');
                showDeleteConfirm('document', id, 'документ');
            });
        }
    }
    
    // Функции загрузки данных для редактирования
    function loadConditionData(conditionId) {
        $.ajax({
            url: `/api/conditions/${conditionId}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    fillConditionForm(response.data);
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке данных';
                alert(errorMessage);
            }
        });
    }
    
    function loadAllergyData(allergyId) {
        $.ajax({
            url: `/api/allergies/${allergyId}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    fillAllergyForm(response.data);
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке данных';
                alert(errorMessage);
            }
        });
    }
    
    function loadMedicationData(medicationId) {
        $.ajax({
            url: `/api/medications/${medicationId}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    fillMedicationForm(response.data);
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке данных';
                alert(errorMessage);
            }
        });
    }
    
    function loadVaccinationData(vaccinationId) {
        $.ajax({
            url: `/api/vaccinations/${vaccinationId}`,
            method: 'GET',
            success: function(response) {
                if (response.success) {
                    fillVaccinationForm(response.data);
                }
            },
            error: function(xhr) {
                const errorMessage = xhr.responseJSON ? xhr.responseJSON.message : 'Ошибка при загрузке данных';
                alert(errorMessage);
            }
        });
    }
    
    // Функции заполнения форм для редактирования
    function fillConditionForm(condition) {
        $('#conditionModalTitle').text('Редактирование заболевания/травмы');
        
        $('#conditionId').val(condition.condition_id);
        $('#conditionType').val(condition.condition_type);
        $('#conditionDescription').val(condition.description);
        $('#conditionStartDate').val(formatDateForInput(condition.start_date));
        $('#conditionEndDate').val(formatDateForInput(condition.end_date));
        
        $('#conditionError').addClass('d-none');
        $('#conditionModal').modal('show');
    }
    
    function fillAllergyForm(allergy) {
        $('#allergyModalTitle').text('Редактирование аллергии');
        
        $('#allergyId').val(allergy.allergy_id);
        $('#allergyType').val(allergy.allergy_type);
        $('#allergyDescription').val(allergy.description);
        $('#allergySeverity').val(allergy.severity);
        $('#allergyRecommendations').val(allergy.recommendations);
        
        $('#allergyError').addClass('d-none');
        $('#allergyModal').modal('show');
    }
    
    function fillMedicationForm(medication) {
        $('#medicationModalTitle').text('Редактирование лекарства');
        
        $('#medicationId').val(medication.medication_id);
        $('#medicationName').val(medication.medication_name);
        $('#medicationDosage').val(medication.dosage);
        $('#medicationFrequency').val(medication.frequency);
        $('#medicationStartDate').val(formatDateForInput(medication.start_date));
        $('#medicationEndDate').val(formatDateForInput(medication.end_date));
        $('#medicationNotes').val(medication.notes);
        
        $('#medicationError').addClass('d-none');
        $('#medicationModal').modal('show');
    }
    
    function fillVaccinationForm(vaccination) {
        $('#vaccinationModalTitle').text('Редактирование вакцинации');
        
        $('#vaccinationId').val(vaccination.vaccination_id);
        $('#vaccineName').val(vaccination.vaccine_name);
        $('#vaccinationDate').val(formatDateForInput(vaccination.vaccination_date));
        $('#vaccineExpirationDate').val(formatDateForInput(vaccination.expiration_date));
        $('#vaccineBatchNumber').val(vaccination.batch_number);
        $('#vaccineNotes').val(vaccination.notes);
        
        $('#vaccinationError').addClass('d-none');
        $('#vaccinationModal').modal('show');
    }
    
    // Вспомогательные функции отображения ошибок
    function showConditionError(message) {
        $('#conditionError').text(message).removeClass('d-none');
    }
    
    function showAllergyError(message) {
        $('#allergyError').text(message).removeClass('d-none');
    }
    
    function showMedicationError(message) {
        $('#medicationError').text(message).removeClass('d-none');
    }
    
    function showVaccinationError(message) {
        $('#vaccinationError').text(message).removeClass('d-none');
    }
    
    function showDocumentError(message) {
        $('#documentError').text(message).removeClass('d-none');
    }
    
    // Вспомогательные функции
    function formatDate(dateString) {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU');
    }
    
    function formatDateForInput(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }
    
    function calculateBMI(height, weight) {
        if (!height || !weight) return 0;
        // Рост в метрах
        const heightM = height / 100;
        return weight / (heightM * heightM);
    }
    
    function getConditionTypeClass(type) {
        if (!type) return '';
        
        switch (type.toLowerCase()) {
            case 'chronic':
            case 'хроническое':
                return 'chronic';
            case 'acute':
            case 'острое':
                return 'acute';
            case 'injury':
            case 'травма':
                return 'injury';
            default:
                return '';
        }
    }
    
    function getConditionTypeText(type) {
        if (!type) return 'Неизвестно';
        
        switch (type.toLowerCase()) {
            case 'chronic':
                return 'Хроническое';
            case 'acute':
                return 'Острое';
            case 'injury':
                return 'Травма';
            default:
                return type;
        }
    }
    
    function getAllergySeverityClass(severity) {
        if (!severity) return '';
        
        switch (severity.toLowerCase()) {
            case 'low':
            case 'низкая':
                return 'low';
            case 'medium':
            case 'средняя':
                return 'medium';
            case 'high':
            case 'высокая':
                return 'high';
            case 'critical':
            case 'критическая':
                return 'critical';
            default:
                return '';
        }
    }
    
    function getAllergySeverityText(severity) {
        if (!severity) return 'Не указана';
        
        switch (severity.toLowerCase()) {
            case 'low':
                return 'Низкая';
            case 'medium':
                return 'Средняя';
            case 'high':
                return 'Высокая';
            case 'critical':
                return 'Критическая';
            default:
                return severity;
        }
    }
    
    function getAllergyTypeText(type) {
        if (!type) return 'Не указано';
        
        switch (type.toLowerCase()) {
            case 'medication':
            case 'лекарства':
                return 'Лекарства';
            case 'food':
            case 'пищевая':
                return 'Пищевая';
            case 'other':
            case 'прочее':
                return 'Прочее';
            default:
                return type;
        }
    }
});