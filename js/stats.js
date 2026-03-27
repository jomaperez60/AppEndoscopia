// --- Analytics & Statistics Dashboard ---

let charts = {};

async function renderDashboard() {
    const token = sessionStorage.getItem('endo_token');
    if (!token) {
        document.getElementById('stats-view').innerHTML = '<div style="padding: 20px; text-align: center;">Por favor inicie sesión para ver estadísticas.</div>';
        return;
    }

    try {
        const res = await fetch('https://endohn.netlify.app/studies', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const studies = await res.json();
        
        if (studies.length === 0) return;

        processAndRenderStats(studies);
    } catch (e) {
        console.error("Error fetching stats:", e);
    }
}

function processAndRenderStats(studies) {
    destroyExistingCharts();

    const qualityData = { excelente: 0, adecuada: 0, inadecuada: 0 };
    const demoData = { m: 0, f: 0 };
    const monthCounts = {};
    const therapeuticData = { biopsias: 0, polipectomias: 0, otrosTer: 0 };
    
    // Diagnoses frequency maps
    const overallDiag = {};
    const regionalDiag = { 'Esófago': {}, 'Estómago': {}, 'Duodeno': {}, 'Yeyuno': {} };

    studies.forEach(s => {
        // Quality
        const prep = (s.clinical?.preparacion || '').toLowerCase();
        if (prep === 'excelente') qualityData.excelente++;
        else if (prep === 'adecuada' || prep === 'buena') qualityData.adecuada++;
        else if (prep === 'inadecuada' || prep === 'mala') qualityData.inadecuada++;

        // Demographics
        const sex = (s.patient?.sexo || '').toLowerCase();
        if (sex.startsWith('m')) demoData.m++;
        else if (sex.startsWith('f')) demoData.f++;

        // Activity (Month-Year)
        const dateObj = new Date(s.date);
        const monthKey = \`\${dateObj.getFullYear()}-\${String(dateObj.getMonth() + 1).padStart(2, '0')}\`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

        // Therapeutics
        const procs = s.procedimientos || [];
        procs.forEach(p => {
            const txt = p.desc.toLowerCase();
            if (txt.includes('biopsia')) therapeuticData.biopsias++;
            else if (txt.includes('polipectom')) therapeuticData.polipectomias++;
            else therapeuticData.otrosTer++;
        });

        // Diagnoses Parsing
        const diags = (s.diagnoses || '').split('\\n');
        diags.forEach(d => {
            const raw = d.trim();
            if (!raw) return;
            
            // e.g. "Estómago: Normal"
            const parts = raw.split(':');
            const region = parts[0].trim();
            const diagDetails = parts.length > 1 ? parts.slice(1).join(':').trim() : raw;
            
            // Extract the core diagnosis before any '(' attributes to keep it clean for stats
            let coreDiag = diagDetails.split('(')[0].trim();
            
            // Tally overall
            overallDiag[coreDiag] = (overallDiag[coreDiag] || 0) + 1;
            
            // Tally regional
            if (regionalDiag[region] !== undefined) {
                regionalDiag[region][coreDiag] = (regionalDiag[region][coreDiag] || 0) + 1;
            }
        });
    });

    // Helper to sort and force Malignancy
    function getTopNWithCancer(freqMap, limit) {
        let entries = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
        
        let topEntries = entries.slice(0, limit);
        const cancerKeywords = ['cáncer', 'cancer', 'maligno', 'maligna', 'adenocarcinoma', 'neoplasia'];
        
        // Find if cancer exists in the overall frequency map but NOT in the top limit
        const cancerInMap = entries.find(([k]) => cancerKeywords.some(kw => k.toLowerCase().includes(kw)));
        const cancerInTop = topEntries.find(([k]) => cancerKeywords.some(kw => k.toLowerCase().includes(kw)));
        
        if (cancerInMap && !cancerInTop) {
            topEntries.pop(); // Remove the last one
            topEntries.push(cancerInMap); // Push cancer at the end of the top list
        }
        
        return topEntries;
    }

    const topOverall = getTopNWithCancer(overallDiag, 10);
    
    // Sort monthKeys
    const sortedMonths = Object.keys(monthCounts).sort();

    // -- Render Charts --
    const ctxQual = document.getElementById('qualityChart');
    charts.qual = new Chart(ctxQual, {
        type: 'doughnut',
        data: {
            labels: ['Excelente', 'Adecuada', 'Inadecuada'],
            datasets: [{
                data: [qualityData.excelente, qualityData.adecuada, qualityData.inadecuada],
                backgroundColor: ['#10b981', '#3b82f6', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxDemo = document.getElementById('demographicsChart');
    charts.demo = new Chart(ctxDemo, {
        type: 'pie',
        data: {
            labels: ['Masculino', 'Femenino'],
            datasets: [{
                data: [demoData.m, demoData.f],
                backgroundColor: ['#3b82f6', '#f43f5e']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxAct = document.getElementById('activityChart');
    charts.act = new Chart(ctxAct, {
        type: 'line',
        data: {
            labels: sortedMonths,
            datasets: [{
                label: 'Estudios por Mes',
                data: sortedMonths.map(m => monthCounts[m]),
                borderColor: '#8b5cf6',
                tension: 0.3,
                fill: true,
                backgroundColor: 'rgba(139, 92, 246, 0.2)'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxTher = document.getElementById('therapeuticsChart');
    charts.ther = new Chart(ctxTher, {
        type: 'bar',
        data: {
            labels: ['Biopsias', 'Polipectomías', 'Otras Terapias'],
            datasets: [{
                label: 'Volumen',
                data: [therapeuticData.biopsias, therapeuticData.polipectomias, therapeuticData.otrosTer],
                backgroundColor: ['#f59e0b', '#10b981', '#6366f1']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxOverall = document.getElementById('overallDiagnosesChart');
    charts.overall = new Chart(ctxOverall, {
        type: 'bar',
        data: {
            labels: topOverall.map(e => e[0].length > 30 ? e[0].substring(0,30)+'...' : e[0]),
            datasets: [{
                label: 'Frecuencia Total',
                data: topOverall.map(e => e[1]),
                backgroundColor: '#3b82f6'
            }]
        },
        options: { 
            indexAxis: 'y', 
            responsive: true, 
            maintainAspectRatio: false 
        }
    });

    // Prepare dataset for regional
    const datasetsRegional = [];
    const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b'];
    let c = 0;
    
    // We will list the top diagnoses across all regions on the Y axis, 
    // but the graph might be cleaner if we use Region as X axis and the top 5 diags as stacks/bars.
    // Instead of grouped, let's do independent horizontal bars for the top 5 per region.
    // Actually, a simple horizontal bar chart listing "Esófago: Esofagitis", "Duodeno: Normal", etc. is easiest to read.
    const combinedRegional = [];
    ['Esófago', 'Estómago', 'Duodeno', 'Yeyuno'].forEach(region => {
        const topReg = getTopNWithCancer(regionalDiag[region], 5);
        topReg.forEach(tr => {
            combinedRegional.push({
                label: \`\${region} - \${tr[0]}\`,
                val: tr[1],
                color: colors[c]
            });
        });
        c++;
    });

    const ctxReg = document.getElementById('regionalDiagnosesChart');
    charts.reg = new Chart(ctxReg, {
        type: 'bar',
        data: {
            labels: combinedRegional.map(e => e.label.length > 35 ? e.label.substring(0,35)+'...' : e.label),
            datasets: [{
                label: 'Frecuencia (Top 5 por Región)',
                data: combinedRegional.map(e => e.val),
                backgroundColor: combinedRegional.map(e => e.color)
            }]
        },
        options: { 
            indexAxis: 'y', 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function destroyExistingCharts() {
    Object.keys(charts).forEach(key => {
        if(charts[key]) charts[key].destroy();
    });
}
