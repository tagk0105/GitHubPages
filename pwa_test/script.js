(function () {
    const dbName = 'todoDatabase';
    const storeName = 'tasks';
    let db;

    // IndexedDB への接続を開く
    const request = indexedDB.open(dbName, 1);

    // データベースのスキーマを定義 (初回またはバージョンアップ時のみ実行)
    request.onupgradeneeded = function (event) {
        db = event.target.result;
        const objectStore = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false }); // name プロパティのインデックス
        console.log('データベースのスキーマが作成されました');
    };

    // データベース接続成功
    request.onsuccess = function (event) {
        db = event.target.result;
        console.log('データベースに接続しました');
        displayTasks(); // 初期表示
    };

    // データベース接続失敗
    request.onerror = function (event) {
        console.error('データベース接続エラー:', event.target.errorCode);
    };

    // タスク追加フォームの処理
    const addTaskForm = document.getElementById('addTaskForm');
    addTaskForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const taskName = document.getElementById('taskName').value;
        addTask(taskName);
        addTaskForm.reset();
    });

    // タスクを追加 (Create)
    function addTask(name) {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const task = { name: name };
        const addRequest = objectStore.add(task);

        addRequest.onsuccess = function (event) {
            console.log('タスクを追加しました (ID:', event.target.result, ')');
            displayTasks();
        };

        addRequest.onerror = function (event) {
            console.error('タスク追加エラー:', event.target.errorCode);
        };
    }

    // タスクを一覧表示 (Read)
    function displayTasks() {
        const taskList = document.getElementById('taskList');
        taskList.innerHTML = ''; // リストをクリア

        const transaction = db.transaction([storeName], 'readonly');
        const objectStore = transaction.objectStore(storeName);
        const getAllRequest = objectStore.getAll();

        getAllRequest.onsuccess = function (event) {
            const tasks = event.target.result;
            tasks.forEach(task => {
                const listItem = document.createElement('li');
                listItem.textContent = `${task.name} (ID: ${task.id})`;

                const updateButton = document.createElement('button');
                updateButton.textContent = '更新';
                updateButton.addEventListener('click', () => updateTaskName(task.id, prompt('新しいタスク名を入力してください', task.name)));

                const deleteButton = document.createElement('button');
                deleteButton.textContent = '削除';
                deleteButton.addEventListener('click', () => deleteTask(task.id));

                listItem.appendChild(updateButton);
                listItem.appendChild(deleteButton);
                taskList.appendChild(listItem);
            });
        };

        getAllRequest.onerror = function (event) {
            console.error('タスク一覧表示エラー:', event.target.errorCode);
        };
    }

    // タスク名を更新 (Update)
    function updateTaskName(id, newName) {
        if (newName === null || newName.trim() === '') {
            return;
        }

        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const getRequest = objectStore.get(id);

        getRequest.onsuccess = function (event) {
            const task = event.target.result;
            if (task) {
                task.name = newName;
                const updateRequest = objectStore.put(task);

                updateRequest.onsuccess = function (event) {
                    console.log('タスクを更新しました (ID:', id, ')');
                    displayTasks();
                };

                updateRequest.onerror = function (event) {
                    console.error('タスク更新エラー:', event.target.errorCode);
                };
            } else {
                console.log('更新対象のタスクが見つかりません (ID:', id, ')');
            }
        };

        getRequest.onerror = function (event) {
            console.error('タスク取得エラー (更新):', event.target.errorCode);
        };
    }

    // タスクを削除 (Delete)
    function deleteTask(id) {
        const transaction = db.transaction([storeName], 'readwrite');
        const objectStore = transaction.objectStore(storeName);
        const deleteRequest = objectStore.delete(id);

        deleteRequest.onsuccess = function (event) {
            console.log('タスクを削除しました (ID:', id, ')');
            displayTasks();
        };

        deleteRequest.onerror = function (event) {
            console.error('タスク削除エラー:', event.target.errorCode);
        };
    }
})();