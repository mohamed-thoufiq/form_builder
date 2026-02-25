document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 BUILDER.JS: DRAG & DROP FULLY INTEGRATED!");

    // In your JS files
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/forms'
    : 'https://your-live-backend-url.com/api/forms';
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');

    if (!formId) {
        window.location.href = 'index.html';
        return;
    }

    const elements = {
        formTitle: document.getElementById('form-title'),
        questionsList: document.getElementById('questions-list'),
        addQuestionForm: document.getElementById('add-question-form'),
        saveStatusEl: document.getElementById('save-status'),
        previewBtn: document.getElementById('preview-btn'),
        dashboardBtn: document.getElementById('dashboard-btn'),
        qTypeSelect: document.getElementById('q-type'),       // <-- Add this
        optionsGroup: document.getElementById('options-group'),
        shareBtn: document.getElementById('share-btn')
    };
/* ================================
   NAVIGATION BUTTONS
=================================*/
if (elements.previewBtn) {
    elements.previewBtn.addEventListener('click', () => {
        // Opens the public-facing form in a new tab
        window.open(`form.html?id=${formId}`, '_blank');
    });
}

if (elements.dashboardBtn) {
    elements.dashboardBtn.addEventListener('click', () => {
        // Opens the response dashboard in a new tab
        window.open(`dashboard.html?id=${formId}`, '_blank');
    });
}
    /* ================================
       STATUS HELPER
    =================================*/
    function setSaveStatus(status) {
        if (!elements.saveStatusEl) return;

        const config = {
            typing: { text: '✍️ Typing...', color: '#6b7280' },
            saving: { text: '🔄 Saving...', color: '#f59e0b' },
            saved: { text: '✓ Saved', color: '#10b981' },
            reordering: { text: '📦 Reordering...', color: '#4f46e5' },
            error: { text: '❌ Error', color: '#ef4444' }
        };

        const state = config[status];
        if (!state) return;

        elements.saveStatusEl.style.display = 'block';
        elements.saveStatusEl.style.opacity = '1';
        elements.saveStatusEl.textContent = state.text;
        elements.saveStatusEl.style.color = state.color;

        if (status === 'saved') {
            setTimeout(() => {
                elements.saveStatusEl.style.opacity = '0';
            }, 2000);
        }
    }

    /* ================================
       DEBOUNCE QUESTION LABEL SAVE
    =================================*/
    let labelTimeout;
    function debounceLabelSave(questionId, newLabel) {
        setSaveStatus('typing');
        clearTimeout(labelTimeout);

        labelTimeout = setTimeout(async () => {
            try {
                setSaveStatus('saving');
                await fetch(`${API_URL}/${formId}/questions/${questionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ label: newLabel })
                });
                setSaveStatus('saved');
            } catch {
                setSaveStatus('error');
            }
        }, 800);
    }

    /* ================================
       DEBOUNCE OPTION SAVE
    =================================*/
    let optionTimeout;
    function debounceOptionSave(qId, optIndex, newValue) {
        setSaveStatus('typing');
        clearTimeout(optionTimeout);

        optionTimeout = setTimeout(async () => {
            try {
                setSaveStatus('saving');
                await fetch(`${API_URL}/${formId}/questions/${qId}/options`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index: optIndex, value: newValue })
                });
                setSaveStatus('saved');
            } catch {
                setSaveStatus('error');
            }
        }, 800);
    }

    /* ================================
       DRAG REORDER LOGIC
    =================================*/
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.draggable-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    async function saveNewOrder() {
        const newOrderIds = [...elements.questionsList.querySelectorAll('.draggable-card')]
            .map(card => card.dataset.id);

        try {
            setSaveStatus('reordering');
            await fetch(`${API_URL}/${formId}/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionIds: newOrderIds })
            });
            setSaveStatus('saved');
            fetchFormDetails();
        } catch {
            setSaveStatus('error');
        }
    }

    /* ================================
       RENDER QUESTIONS
    =================================*/
    function renderQuestions(questions) {
        elements.questionsList.innerHTML = '';

        questions.forEach((q, index) => {
            const card = document.createElement('div');
            card.className = 'card draggable-card';
            card.draggable = true;
            card.dataset.id = q._id;

            let contentHtml = '';

            if (q.type === 'mcq' || q.type === 'checkbox') {
                const inputType = q.type === 'mcq' ? 'radio' : 'checkbox';

                q.options.forEach((opt, optIndex) => {
                    contentHtml += `
                        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
                            <input type="${inputType}" disabled>
                            <input type="text"
                                class="option-edit"
                                data-q-id="${q._id}"
                                data-opt-index="${optIndex}"
                                value="${opt}">
                            <button class="remove-opt-btn"
                                data-q-id="${q._id}"
                                data-opt-index="${optIndex}">✕</button>
                        </div>
                    `;
                });

                contentHtml += `
                    <button class="add-opt-btn" data-q-id="${q._id}">
                        + Add Option
                    </button>
                `;
            } else {
                contentHtml = `
                    <div style="margin-top:1rem;opacity:0.5;">
                        <input type="text" disabled placeholder="Text response">
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="cursor:grab;text-align:center;">⠿</div>
                <div style="display:flex;justify-content:space-between;">
                    <div style="display:flex;gap:0.5rem;width:80%;">
                        <span><b>${index + 1}.</b></span>
                        <input type="text"
                            class="inline-edit"
                            data-id="${q._id}"
                            value="${q.label}">
                    </div>
                    <button class="delete-q-btn" data-id="${q._id}">Delete</button>
                </div>
                <div>${contentHtml}</div>
            `;

            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => {
                card.classList.remove('dragging');
                saveNewOrder();
            });

            elements.questionsList.appendChild(card);
        });
    }
    /* ================================
   SHARE FORM LOGIC
=================================*/
if (elements.shareBtn) {
    elements.shareBtn.addEventListener('click', () => {
        // Construct the full public URL
        const publicUrl = `${window.location.origin}/form.html?id=${formId}`;
        
        // Use the Clipboard API
        navigator.clipboard.writeText(publicUrl).then(() => {
            // Visual feedback on the button
            const originalText = elements.shareBtn.textContent;
            elements.shareBtn.textContent = '✅ Copied!';
            elements.shareBtn.style.background = '#10b981'; // Turn green
            
            setSaveStatus('saved'); // Optional: use your existing status helper
            
            // Revert back after 2 seconds
            setTimeout(() => {
                elements.shareBtn.textContent = originalText;
                elements.shareBtn.style.background = '#6366f1';
            }, 2000);
        }).catch(err => {
            console.error('Could not copy text: ', err);
            alert('Failed to copy link. Here it is: ' + publicUrl);
        });
    });
}

    /* ================================
       EVENT DELEGATION
    =================================*/
    elements.questionsList.addEventListener('input', (e) => {
        if (e.target.classList.contains('inline-edit')) {
            debounceLabelSave(e.target.dataset.id, e.target.value);
        }

        if (e.target.classList.contains('option-edit')) {
            debounceOptionSave(
                e.target.dataset.qId,
                e.target.dataset.optIndex,
                e.target.value
            );
        }
    });

    /* ================================
   EVENT DELEGATION (CLICKS)
=================================*/
elements.questionsList.addEventListener('click', async (e) => {
    // 1. Handle Question Deletion
    if (e.target.classList.contains('delete-q-btn')) {
        if (confirm('Delete question?')) {
            await fetch(`${API_URL}/${formId}/questions/${e.target.dataset.id}`, {
                method: 'DELETE'
            });
            fetchFormDetails();
        }
    }

    // 2. Handle ADD OPTION (The fix!)
    if (e.target.classList.contains('add-opt-btn')) {
        const qId = e.target.dataset.qId;
        try {
            setSaveStatus('saving');
            // This calls the POST route we added to the backend
            const response = await fetch(`${API_URL}/${formId}/questions/${qId}/options`, {
                method: 'POST'
            });
            
            if (response.ok) {
                setSaveStatus('saved');
                fetchFormDetails(); // Refresh to show the "New Option" input
            }
        } catch (err) {
            console.error("Failed to add option:", err);
            setSaveStatus('error');
        }
    }

    // 3. Handle Remove Option
    if (e.target.classList.contains('remove-opt-btn')) {
        const qId = e.target.dataset.qId;
        const optIndex = e.target.dataset.optIndex;
        await fetch(`${API_URL}/${formId}/questions/${qId}/options/${optIndex}`, {
            method: 'DELETE'
        });
        fetchFormDetails();
    }
});

    elements.questionsList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (!dragging) return;

        const afterElement = getDragAfterElement(elements.questionsList, e.clientY);
        if (!afterElement) {
            elements.questionsList.appendChild(dragging);
        } else {
            elements.questionsList.insertBefore(dragging, afterElement);
        }
    });

    /* ================================
       ADD QUESTION
    =================================*/
    elements.addQuestionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const type = document.getElementById('q-type').value;
        const label = document.getElementById('q-label').value;

        const defaultOptions =
            (type === 'mcq' || type === 'checkbox') ? ['Option 1'] : [];

        await fetch(`${API_URL}/${formId}/questions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, label, options: defaultOptions })
        });

        elements.addQuestionForm.reset();
        fetchFormDetails();
    });

    /* ================================
       FETCH FORM
    =================================*/
    async function fetchFormDetails() {
        const res = await fetch(`${API_URL}/${formId}`);
        const form = await res.json();
        elements.formTitle.textContent = form.title;
        renderQuestions(form.questions);
    }

    fetchFormDetails();
});