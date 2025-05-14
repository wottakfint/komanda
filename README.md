# 🏥 Проект Komanda

![Версия](https://img.shields.io/badge/версия-1.0.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-22.15-green)
![Express](https://img.shields.io/badge/Express-4.21.2-lightgrey)

Веб-приложение для учета и управления медицинскими картами и данными военнослужащих. Система позволяет эффективно организовать работу медицинского персонала, хранить и обрабатывать данные, а также быстро получать доступ к необходимой информации.

## 📋 Содержание

- [Возможности](#возможности)
- [Технологии](#технологии)
- [Структура проекта](#структура-проекта)
- [Установка и запуск](#установка-и-запуск)
- [API](#api)
- [Команда разработчиков](#команда-разработчиков)

## ✨ Возможности

- 👨‍⚕️ Создание и редактирование медицинских карт
- 🔍 Поиск военнослужащих по различным параметрам
- 📊 Статистика и отчеты по здоровью личного состава
- 🔐 Безопасное хранение и доступ к конфиденциальным данным
- 📱 Адаптивный интерфейс для работы на различных устройствах

## 🛠 Технологии

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js, Express.js
- **База данных**: MySQL
- **Аутентификация**: JWT
- **Безопасность**: bcrypt

<h2>📁 Структура проекта</h2>
<pre>
komanda/
├── node_modules/        <span style="color: #888;"><!-- Зависимости проекта --></span> -Зависимости проекта
├── public/              <span style="color: #888;"><!-- Статические файлы --></span> -Статические файлы
│   ├── css/             <span style="color: #888;"><!-- Стили --></span> Стили
│   │   └── styles.css
│   ├── img/             <span style="color: #888;"><!-- Изображения --></span> -Изображения
│   │   └── profile-placeholder.png
│   ├── js/              <span style="color: #888;"><!-- JavaScript файлы --></span> -JavaScript файлы
│   │   ├── login.js
│   │   ├── medcard.js
│   │   └── soldiers.js
│   └── index.html       <span style="color: #888;"><!-- Главная страница --></span> -Главная страница
├── views/               <span style="color: #888;"><!-- HTML-шаблоны --></span> -HTML-шаблоны
│   ├── medcard.html     <span style="color: #888;"><!-- Страница медкарты --></span> -Страница медкарты
│   └── soldiers.html    <span style="color: #888;"><!-- Страница со списком военнослужащих --></span> -Страница со списком военнослужащих
├── bd.env               <span style="color: #888;"><!-- Файл с переменными окружения для БД --></span> -Файл с переменными окружения для БД
├── package.json         <span style="color: #888;"><!-- Зависимости и настройки проекта --></span> -Зависимости и настройки проекта
├── package-lock.json    <span style="color: #888;"><!-- Фиксация версий зависимостей --></span> -Фиксация версий зависимостей
└── server.js            <span style="color: #888;"><!-- Основной файл сервера --></span> -Основной файл сервера
</pre>
## 🚀 Установка и запуск

### Предварительные требования

- Node.js (v22 или выше)
- MySQL (SQL SHELL)



1. Клонируйте репозиторий:

```bash
git clone https://github.com/username/komanda.git
cd komanda
```

2. Установите зависимости:
   
```bash
npm install
```

3. Создайте файл bd.env с настройками подключения к базе данных:
   
```bash
DB_CONNECTION=mongodb://localhost:27017/komanda
DB_USER=admin
DB_PASSWORD=password
```

4.Запустите сервер:

```bash
node server.js
```

5. Запустите приложение в браузере:

```bash
http://localhost:3000
```
## 📚 API

<table>
  <thead>
    <tr>
      <th>Метод</th>
      <th>Путь</th>
      <th>Описание</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td><code>/api/soldiers</code></td>
      <td>Получить список всех военнослужащих</td>
    </tr>
    <tr>
      <td>GET</td>
      <td><code>/api/soldiers/:id</code></td>
      <td>Получить данные конкретного военнослужащего</td>
    </tr>
    <tr>
      <td>POST</td>
      <td><code>/api/soldiers</code></td>
      <td>Добавить нового военнослужащего</td>
    </tr>
    <tr>
      <td>PUT</td>
      <td><code>/api/soldiers/:id</code></td>
      <td>Обновить данные военнослужащего</td>
    </tr>
    <tr>
      <td>DELETE</td>
      <td><code>/api/soldiers/:id</code></td>
      <td>Удалить военнослужащего</td>
    </tr>
    <tr>
      <td>GET</td>
      <td><code>/api/medcards</code></td>
      <td>Получить список всех медкарт</td>
    </tr>
    <tr>
      <td>GET</td>
      <td><code>/api/medcards/:id</code></td>
      <td>Получить конкретную медкарту</td>
    </tr>
    <tr>
      <td>POST</td>
      <td><code>/api/medcards</code></td>
      <td>Создать новую медкарту</td>
    </tr>
    <tr>
      <td>PUT</td>
      <td><code>/api/medcards/:id</code></td>
      <td>Обновить медкарту</td>
    </tr>
  </tbody>
</table>

## 👨‍💻 Команда разработчиков
- **Рогожин Максим** - _Backend-разработчик_ - [GitHub](https://github.com/wottakfint)
- **Сядаков Илья** - _Frontend-разработчик_ - [GitHub](https://github.com/deashii)

<p align="center">
  Сделано с ❤️ 
</p>

