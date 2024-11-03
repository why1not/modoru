const { VK } = require('vk-io');
const { google } = require('googleapis');

const vk = new VK({
    token: 'vk1.a.S-i7zCoVgyHjB1D8KmyJ7rxx_kX0UNyRHSwXWbUXEVCah6C61qz2U2YB--k__L2ZF5i62GH439DajMvmDf6YidJLN-MeOZ6pgfDvmaS9SLtOi3u2fxx2EhfuyQCAUycYbFzaqtS39oImZB1vqJsBq30zcJwi4-gF1lFoiC0pVs1g-wEPBUzW0a0ce-mclKvc4cdL2Pj0wZjudzjTFeUOfw'
});

const sheets = google.sheets('v4');
const apiKey = 'AIzaSyBipCKTS4-g1jvv-vpmAvyo-MunhprXqwg';
const spreadsheetId = '1P5TKoZa058hT_zECqjCLhWxovMCA4HsEtP9oYXpp_VY';
const range = 'ТТХ!A:V';  // Диапазон данных

// Словарь синонимов
const synonyms = {
    "ак-103": ["ак103", "ак-103", "ак 103"],
    "ак-47": ["ак47", "ак-47", "ак 47"],
    "скорпион": ["скorpion", "скорпион", "ск-orpion"],
    // Добавьте другие синонимы по мере необходимости
};

// Переменная для хранения предложенных вариантов
let suggestedWeapons = [];

// Функция для транслитерации
function transliterate(text) {
    const translitMap = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
        'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
        'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
        'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    };
    
    return text.split('').map(char => translitMap[char] || char).join('');
}

// Функция для очистки строки
function cleanString(str) {
    return str.toLowerCase().replace(/[^a-zа-яё0-9]/g, '').trim();
}

// Функция для получения названия оружия
async function getWeaponStats(weaponName) {
    if (!weaponName) {
        return 'Пожалуйста, укажите название оружия.';
    }

    const cleanedWeaponName = cleanString(weaponName);
    const transliteratedWeaponName = transliterate(cleanedWeaponName);

    try {
        const response = await sheets.spreadsheets.values.get({
            key: apiKey,
            spreadsheetId: spreadsheetId,
            range: range,
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) {
            return 'Не удалось получить данные о оружии. Пожалуйста, проверьте соединение или настройки таблицы.';
        }

        suggestedWeapons = []; // Сброс предложений

        for (let row of rows) {
            const weaponInRow = cleanString(row[0]);
            const transliteratedRowWeapon = transliterate(weaponInRow);

            // Проверка на синонимы
            if (synonyms[weaponInRow]) {
                for (let synonym of synonyms[weaponInRow]) {
                    if (transliteratedRowWeapon.includes(transliteratedWeaponName) || weaponInRow.includes(cleanedWeaponName)) {
                        suggestedWeapons.push(row);
                    }
                }
            }   else if (transliteratedRowWeapon.includes(transliteratedWeaponName) || weaponInRow.includes(cleanedWeaponName)) {
                suggestedWeapons.push(row);
            }
        }

        if (suggestedWeapons.length === 0) {
            return 'Оружие не найдено. Пожалуйста, проверьте правильность написания названия.';
        } else {
            let message = 'Найдены несколько вариантов оружия:\n';
            suggestedWeapons.forEach((row, index) => {
                message += `${index + 1}. Название оружия: ${row[0]}\n`;
            });
            return message + 'Введите номер, чтобы получить информацию о выбранном оружии.';
        }
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        return 'Произошла ошибка при попытке получить данные о оружии. Пожалуйста, попробуйте позже.';
    }
}

// Функция для получения информации об оружии по номеру
async function getWeaponInfoByIndex(index) {
    console.log(`Получение информации для индекса: ${index}`); // Отладка
    if (index < 1 || index > suggestedWeapons.length) {
        console.log('Неверный номер.'); // Отладка
        return 'Неверный номер. Пожалуйста, введите корректный номер.';
    }

    const row = suggestedWeapons[index - 1]; // Индексы в массиве начинаются с 0
    console.log('Данные оружия:', row); // Отладка

    const weaponInfo = `
==========================
🎯Название оружия: ${row[0]}
==========================
Серия: ${row[1]}
Тип оружия: ${row[2]}
Тип урона: ${row[3]}
Урон сток: ${row[4]}
Урон фулл: ${row[5]}
Обойма сток: ${row[6]}
Обойма фулл: ${row[7]}
Запас ст: ${row[8]}
Запас фл: ${row[9]}
Темп: ${row[10]}
Дальность: ${row[11]}
Перезарядка: ${row[12]}
Стоимость: ${row[13]}
Фулл урон: ${row[16]}
Фулл обойма: ${row[17]}
Фулл запас: ${row[18]}
Базовое оружие: ${row[19]}
==========================
ID предмета(1): ${row[20]}
ID предмета(2): ${row[21]}
==========================`;

    const weaponImageUrl = row[14]; // Предполагаем, что URL фотографии находится в ячейке O (индекс 14)

    return { weaponInfo, weaponImageUrl };
}
let waitingForWeaponSelection = false; // Переменная состояния

vk.updates.on('message_new', async (context, next) => {
    const message = context.text.toLowerCase();

    // Проверка на наличие ключевых слов "стат" или "ттх"
    const weaponNameMatch = message.match(/(?:стат|ттх) (\S+)/i);
    const numberMatch = message.match(/^(\d+)$/); // Проверка на номер

    // Если бот ожидает выбора оружия
    if (waitingForWeaponSelection) {
        console.log('Ожидание выбора оружия...'); // Отладка
        if (numberMatch) {
            const index = parseInt(numberMatch[1], 10);
            console.log(`Введённый номер: ${index}`); // Отладка
            const { weaponInfo, weaponImageUrl } = await getWeaponInfoByIndex(index);
            
            await context.send(weaponInfo);
            if (weaponImageUrl) {
                await context.send({ attachment: weaponImageUrl }); // Отправка изображения
            }
            
            waitingForWeaponSelection = false; // Сбрасываем состояние после вывода информации
            console.log('Состояние сброшено.'); // Отладка
        } else {
            await context.send('Пожалуйста, введите корректный номер для получения информации об оружии.');
        }
    } else if (weaponNameMatch) {
        const stats = await getWeaponStats(weaponNameMatch[1]);
        if (stats.includes('Найдены несколько вариантов оружия')) {
            waitingForWeaponSelection = true; // Устанавливаем состояние ожидания выбора оружия
            console.log('Состояние ожидания выбора установлено.'); // Отладка
        }
        await context.send(stats);
    } else {
        // Игнорируем все остальные сообщения, если не в состоянии ожидания
        return; // Не обрабатываем остальные сообщения
    }

    await next();
});


// Обработчик для остановки выполнения программы
process.stdin.on('data', (data) => {
    const input = data.toString().trim();
    if (input === 'stop') {
        console.log('Остановка программы...');
        vk.updates.stop(); // Остановка обновлений VK
        process.exit(0);   // Завершение процесса
    }
});

vk.updates.start().catch(console.error);