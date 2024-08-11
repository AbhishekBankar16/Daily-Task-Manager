document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const taskDate = document.getElementById('task-date');
    const prioritySelect = document.getElementById('priority-select');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const reminderTime = document.getElementById('reminder-time');
    const setReminderBtn = document.getElementById('set-reminder-btn');
    const reminderLabel = document.getElementById('reminder-label');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const exportBtn = document.getElementById('export-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const container = document.querySelector('.container');

    let db;

    // Open or create the database
    const request = indexedDB.open('TaskDatabase', 1);

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        const objectStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('date', 'date', { unique: false });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        renderTasks();
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };

    function addTask() {
        const task = taskInput.value.trim();
        const date = taskDate.value;
        const priority = prioritySelect.value;
        if (task && date) {
            const transaction = db.transaction(['tasks'], 'readwrite');
            const objectStore = transaction.objectStore('tasks');
            const request = objectStore.add({ task, date, priority, status: 'not done' });

            request.onsuccess = function() {
                taskInput.value = '';
                renderTasks();
            };

            request.onerror = function(event) {
                console.error('Error adding task:', event.target.errorCode);
            };
        } else {
            alert('Please enter a task and select a date.');
        }
    }

    function renderTasks() {
        const transaction = db.transaction(['tasks'], 'readonly');
        const objectStore = transaction.objectStore('tasks');
        const request = objectStore.getAll();

        request.onsuccess = function(event) {
            taskList.innerHTML = '';
            event.target.result.forEach(task => {
                const li = document.createElement('li');
                li.textContent = `${task.task} (${task.priority})`;
                li.classList.add(task.status === 'done' ? 'done' : 'not-done');
                
                li.addEventListener('click', () => markDone(task));

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deleteTask(task.id);
                });

                li.appendChild(deleteBtn);
                taskList.appendChild(li);
            });
        };

        request.onerror = function(event) {
            console.error('Error fetching tasks:', event.target.errorCode);
        };
    }

    function markDone(task) {
        task.status = 'done';
        const transaction = db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        const request = objectStore.put(task);

        request.onsuccess = function() {
            renderTasks();
        };

        request.onerror = function(event) {
            console.error('Error updating task:', event.target.errorCode);
        };
    }

    function deleteTask(id) {
        const transaction = db.transaction(['tasks'], 'readwrite');
        const objectStore = transaction.objectStore('tasks');
        const request = objectStore.delete(id);

        request.onsuccess = function() {
            renderTasks();
        };

        request.onerror = function(event) {
            console.error('Error deleting task:', event.target.errorCode);
        };
    }

    addTaskBtn.addEventListener('click', addTask);

    darkModeToggle.addEventListener('change', () => {
        container.classList.toggle('dark-mode');
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./serviceworker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });
        });
    }
});
