// In your JS files
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/forms'
    : 'https://form-builder-api-irp2.onrender.com/api/forms';
    
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : 'https://form-builder-api-irp2.onrender.com';


    

const urlParams = new URLSearchParams(window.location.search);
const formId = urlParams.get('id');

if (!formId) window.location.href = 'index.html';

const dashTitle = document.getElementById('dash-title');
const totalResponsesEl = document.getElementById('total-responses');
const analyticsContainer = document.getElementById('analytics-container');

document.getElementById('download-csv').addEventListener('click', () => {
    // Simply pointing the window to the export route triggers the download
    window.location.href = `http://localhost:5000/api/forms/${formId}/export`;
});
let currentForm = null;
let allResponses = [];

// --- 1. INITIALIZE REAL-TIME WEBSOCKETS ---
// Connect to the backend server

// Update the socket initialization
const socket = io(SOCKET_URL);

// Join the specific room for this form so we only get relevant updates
socket.emit('join-form-room', formId);

// Listen for the event we set up in the Node.js controller!
socket.on('new-response', (newResponse) => {
  console.log('Real-time response received!', newResponse);
  
  // Add the new response to our local array
  allResponses.push(newResponse);
  
  // Re-render the dashboard instantly!
  renderDashboard();
  
  // Flash the counter green to show an update happened
  totalResponsesEl.parentElement.style.backgroundColor = '#d1fae5';
  setTimeout(() => {
    totalResponsesEl.parentElement.style.backgroundColor = 'white';
  }, 500);
});

// --- 2. FETCH DATA ---
async function loadDashboardData() {
  try {
    // Fetch form structure
    const formRes = await fetch(`${API_URL}/${formId}`);
    currentForm = await formRes.json();
    dashTitle.textContent = currentForm.title;

    // Fetch all existing responses
    const responsesRes = await fetch(`${API_URL}/${formId}/responses`);
    allResponses = await responsesRes.json();

    renderDashboard();
  } catch (error) {
    console.error('Error loading dashboard:', error);
    analyticsContainer.innerHTML = '<p style="color:red;">Error loading data.</p>';
  }
}

// --- 3. CALCULATE ANALYTICS & RENDER ---
function renderDashboard() {
  totalResponsesEl.textContent = allResponses.length;
  analyticsContainer.innerHTML = '';

  if (allResponses.length === 0) {
    analyticsContainer.innerHTML = '<div class="card"><p>No responses yet. Waiting for data...</p></div>';
    return;
  }

  // Loop through every question in the form to build its analytics block
  currentForm.questions.forEach((question, index) => {
    const qCard = document.createElement('div');
    qCard.className = 'card';
    qCard.style.marginBottom = '1.5rem';

    let html = `<h3>${index + 1}. ${question.label}</h3>`;

    // Calculate stats for Multiple Choice or Checkboxes
    if (question.type === 'mcq' || question.type === 'checkbox') {
    const labels = question.options;
    const dataValues = labels.map(opt => {
        // Find how many people chose this specific option
        return allResponses.filter(r => {
            const ans = r.answers.find(a => a.questionId === question._id);
            return ans && (Array.isArray(ans.value) ? ans.value.includes(opt) : ans.value === opt);
        }).length;
    });

    // Add a canvas for the chart
    html += `<div style="max-width: 300px; margin: 20px auto;"><canvas id="chart-${question._id}"></canvas></div>`;
    
    // We need to initialize the chart AFTER the HTML is added to the DOM
    setTimeout(() => {
        const ctx = document.getElementById(`chart-${question._id}`).getContext('2d');
        new Chart(ctx, {
            type: 'pie', // You can change this to 'bar' or 'doughnut'
            data: {
                labels: labels,
                datasets: [{
                    label: '# of Votes',
                    data: dataValues,
                    backgroundColor: [
                        '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'
                    ]
                }]
            },
            options: { responsive: true }
        });
    }, 0);
}
    // Handle text-based questions (just list the recent answers)
    else {
      html += `<ul style="margin-top: 1rem; padding-left: 1.2rem; color: #4b5563;">`;
      let answersCount = 0;
      
      allResponses.forEach(response => {
        const answerObj = response.answers.find(a => a.questionId === question._id);
        if (answerObj && answerObj.value) {
          html += `<li style="margin-bottom: 0.5rem; background: #f9fafb; padding: 0.5rem; border-radius: 4px;">${answerObj.value}</li>`;
          answersCount++;
        }
      });

      if (answersCount === 0) html += `<li>No answers provided yet.</li>`;
      html += `</ul>`;
    }

    qCard.innerHTML = html;
    analyticsContainer.appendChild(qCard);
  });
}

// Init
loadDashboardData();