let pieChart = null;

document.addEventListener('DOMContentLoaded', () => {
  loadData();
  // Update data every 5 seconds instead of every second
  setInterval(loadData, 5000);
});

async function loadData() {
  try {
    const result = await chrome.storage.local.get(['timeData']);
    const timeData = result.timeData || {};
    const today = new Date().toDateString();
    const todayData = timeData[today] || {};

    // Calculate total time
    const totalTime = Object.values(todayData).reduce((sum, time) => sum + time, 0);
    document.getElementById('totalTime').textContent = formatTime(totalTime);

    // Update website list
    const websiteList = document.getElementById('websiteList');
    websiteList.innerHTML = ''; // Clear existing content

    if (Object.keys(todayData).length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="3" class="no-data">No websites tracked yet</td>';
      websiteList.appendChild(row);
      return;
    }

    // Add table headers if not present
    if (!document.querySelector('thead')) {
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr>
          <th>Website</th>
          <th>Time Spent</th>
          <th>Percentage</th>
        </tr>
      `;
      websiteList.parentElement.insertBefore(thead, websiteList);
    }

    // Sort and display websites
    Object.entries(todayData)
      .sort(([, a], [, b]) => b - a)
      .forEach(([domain, time]) => {
        const percentage = ((time / totalTime) * 100).toFixed(1);
        const row = document.createElement('tr');
        row.innerHTML = `
          <td class="website-url">${domain}</td>
          <td class="time-spent">${formatTime(time)}</td>
          <td class="percentage">${percentage}%</td>
        `;
        websiteList.appendChild(row);
      });

    // Update pie chart
    updatePieChart(todayData);
  } catch (error) {
    console.error('Error loading data:', error);
    websiteList.innerHTML = '<tr><td colspan="3" class="error">Error loading data</td></tr>';
  }
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function updatePieChart(data) {
  const ctx = document.getElementById('pieChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (pieChart) {
    pieChart.destroy();
  }

  const labels = Object.keys(data);
  const values = Object.values(data);
  const colors = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58',
    '#AB47BC', '#00ACC1', '#FF7043', '#9E9E9E'
  ];

  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12
          }
        }
      }
    }
  });
}