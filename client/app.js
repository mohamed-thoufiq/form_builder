// app.js
// In your JS files
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/forms'
    : 'https://your-live-backend-url.com/api/forms';

// DOM Elements
const createForm = document.getElementById('create-form');
const formsList = document.getElementById('forms-list');

// --- 1. FETCH & DISPLAY FORMS ---
async function fetchForms() {
  try {
    const response = await fetch(API_URL);
    const forms = await response.json();
    
    // Clear the loading text
    formsList.innerHTML = '';

    if (forms.length === 0) {
      formsList.innerHTML = '<p>No forms created yet.</p>';
      return;
    }

    // Render each form
    forms.forEach(form => {
      const formCard = document.createElement('div');
      formCard.className = 'form-card';
      formCard.innerHTML = `
        <div>
          <h3>${form.title}</h3>
          <p>${form.description || 'No description'}</p>
        </div>
        <button class="btn" onclick="viewForm('${form._id}')">Manage</button>
      `;
      formsList.appendChild(formCard);
    });
  } catch (error) {
    console.error('Error fetching forms:', error);
    formsList.innerHTML = '<p style="color: red;">Failed to load forms. Is the backend running?</p>';
  }
}

// --- 2. CREATE A NEW FORM ---
createForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // Prevent page from refreshing

  const title = document.getElementById('title').value;
  const description = document.getElementById('description').value;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title, description })
    });

    if (response.ok) {
      // Clear inputs
      createForm.reset();
      // Refresh the list to show the new form
      fetchForms();
    }
  } catch (error) {
    console.error('Error creating form:', error);
    alert('Failed to create form.');
  }
});
// --- 3. CLEAR ALL FORMS (DANGEROUS) ---
document.getElementById('clear-all-forms-btn').addEventListener('click', async () => {
    const secretCode = prompt('Type "DELETE" to confirm clearing all forms:');
    
    if (secretCode === 'DELETE') {
        try {
            const res = await fetch(`${API_URL}/all`, { method: 'DELETE' });
            if (res.ok) {
                alert('All forms have been cleared.');
                location.reload(); // Refresh the list
            }
        } catch (err) {
            console.error('Error clearing forms:', err);
        }
    }
});
// Placeholder for the next feature
function viewForm(formId) {
  window.location.href = `builder.html?id=${formId}`;
}

// Init: Fetch forms when the page loads
fetchForms();