function initNavbar() {
    const accountType = localStorage.getItem('accountType');
    const dashboardLink = document.getElementById('navDashboard');

    if (!dashboardLink) return; // If page might not have this navbar
    if (accountType === 'individual') dashboardLink.href = 'dashboard-individual.html';
    else if (accountType === 'small_business') dashboardLink.href = 'dashboard-business.html';
    else if (accountType === 'enterprise') dashboardLink.href = 'dashboard-enterprise.html';
}

initNavbar();