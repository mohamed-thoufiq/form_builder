const IS_LOCAL =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

const API_URL = IS_LOCAL
    ? 'http://localhost:5000/api/forms'
    : 'https://form-builder-api-irp2.onrender.com/api/forms';

const SOCKET_URL = IS_LOCAL
    ? 'http://localhost:5000'
    : 'https://form-builder-api-irp2.onrender.com';

const socket = io(SOCKET_URL);;

const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

if (!formId) {
  document.body.innerHTML = '<h2 style="text-align:center; margin-top:50px;">Form not found.</h2>';
}

const publicTitle = document.getElementById('public-title');
const publicDescription = document.getElementById('public-description');
const questionsContainer = document.getElementById('public-questions-container');
const publicForm = document.getElementById('public-form');
const successMessage = document.getElementById('success-message');
const submitBtn = document.getElementById('submit-btn');

let currentFormQuestions = [];

// --- 1. FETCH AND RENDER THE PUBLIC FORM ---
async function loadPublicForm() {
  try {
    const response = await fetch(`${API_URL}/${formId}`);
    const form = await response.json();

    publicTitle.textContent = form.title;
    publicDescription.textContent = form.description || '';
    currentFormQuestions = form.questions;

    renderPublicQuestions(form.questions);
  } catch (error) {
    console.error('Error loading form:', error);
    publicTitle.textContent = 'Error loading form';
  }
}

function renderPublicQuestions(questions) {
  questionsContainer.innerHTML = '';

  questions.forEach((q, index) => {
    const qDiv = document.createElement('div');
    qDiv.className = 'card';
    qDiv.style.marginBottom = '1rem';

    const requiredStar = q.required ? '<span style="color: red;">*</span>' : '';
    let inputHTML = '';

    // Notice we use name="${q._id}" so we can easily grab the answer later!
    if (q.type === 'short') {
      inputHTML = `<input type="text" name="${q._id}" ${q.required ? 'required' : ''} placeholder="Your answer">`;
    } 
    else if (q.type === 'paragraph') {
      inputHTML = `<textarea name="${q._id}" ${q.required ? 'required' : ''} placeholder="Your answer" rows="3"></textarea>`;
    } 
    else if (q.type === 'mcq') {
      q.options.forEach(opt => {
        inputHTML += `
          <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <input type="radio" id="${q._id}-${opt}" name="${q._id}" value="${opt}" ${q.required ? 'required' : ''} style="width: auto;">
            <label for="${q._id}-${opt}" style="margin: 0; font-weight: normal;">${opt}</label>
          </div>
        `;
      });
    } 
    else if (q.type === 'checkbox') {
      q.options.forEach(opt => {
        inputHTML += `
          <div style="margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem;">
            <input type="checkbox" id="${q._id}-${opt}" name="${q._id}" value="${opt}" style="width: auto;">
            <label for="${q._id}-${opt}" style="margin: 0; font-weight: normal;">${opt}</label>
          </div>
        `;
      });
    }

    qDiv.innerHTML = `
      <h3 style="margin-top: 0; margin-bottom: 1rem;">${q.label} ${requiredStar}</h3>
      ${inputHTML}
    `;
    questionsContainer.appendChild(qDiv);
  });
}

// --- 2. HANDLE SUBMISSION ---
publicForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.textContent = 'Submitting...';
  submitBtn.disabled = true;

  // FormData makes it easy to grab all values from a form
  const formData = new FormData(publicForm);
  const answers = [];

  // Format the answers to match our Backend Schema: [{ questionId, value }]
  currentFormQuestions.forEach(q => {
    let value;
    
    if (q.type === 'checkbox') {
      // Checkboxes can have multiple answers, so we get all of them as an array
      value = formData.getAll(q._id); 
    } else {
      value = formData.get(q._id);
    }

    // Only add to array if an answer was provided (important for non-required fields)
    if (value && value.length > 0) {
      answers.push({
        questionId: q._id,
        value: value
      });
    }
  });

  try {
    const response = await fetch(`${API_URL}/${formId}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });

    if (response.ok) {
      // Hide form, show success message
      publicForm.style.display = 'none';
      successMessage.style.display = 'block';
    } else {
      alert('Failed to submit form. Please try again.');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    alert('An error occurred.');
  } finally {
    submitBtn.textContent = 'Submit Response';
    submitBtn.disabled = false;
  }
});
// We need to format the answers to match our Backend Schema: [{ questionId, value }]
  document.getElementById('clear-form-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all your answers?')) {
        const formElement = document.getElementById('public-form'); // Ensure this ID matches your <form> tag
        formElement.reset();
        
        // Optional: Scroll to top after clearing
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
});

// Init
loadPublicForm();
