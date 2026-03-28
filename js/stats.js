// --- Analytics & Statistics Dashboard ---

let charts = {};

async function renderDashboard() {
    const token = sessionStorage.getItem('endo_token');
    if (!token) {
        document.getElementById('stats-view').innerHTML = '<div style="padding: 20px; text-align: center;">Por favor inicie sesión para ver estadísticas.</div>';
        return;
    }

    try {
        console.log("Fetching studies from:", `${CONFIG.API_BASE_URL}/studies`);
        const res = await fetch(`${CONFIG.API_BASE_URL}/studies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const studies = await res.json();
        console.log("Studies received:", studies);
        
        if (!studies || studies.length === 0) {
            console.warn("No studies found in database.");
            document.getElementById('stats-view').innerHTML = `
                <div class="view-header" style="margin-bottom: 20px;">
                    <h2><i class="fa-solid fa-chart-line"></i> Dashboard Clínico</h2>
                </div>
                <div class="card" style="padding: 50px; text-align: center; color: var(--text-muted);">
                    <i class="fa-solid fa-database" style="font-size: 3rem; margin-bottom: 20px; opacity: 0.3;"></i>
                    <p>No se encontraron estudios en la base de datos para generar estadísticas.</p>
                </div>`;
            return;
        }

        processAndRenderStats(studies);
    } catch (e) {
        console.error("Error fetching stats:", e);
    }
}

function processAndRenderStats(studies) {
    destroyExistingCharts();

    const qualityData = { 'Adecuada': 0, 'Inadecuada': 0, 'Excelente/Buena': 0 };
    const demoData = { 'Masculino': 0, 'Femenino': 0, 'Otro': 0, 'Sin especificar': 0 };
    const monthCounts = {};
    const therapeuticData = { biopsias: 0, polipectomias: 0, otrosTer: 0 };
    
    // Diagnoses frequency maps
    const overallDiag = {};
    const regionalDiag = { 'Esófago': {}, 'Estómago': {}, 'Duodeno': {}, 'Yeyuno': {} };

    studies.forEach(s => {
        // Quality (Preparation) - Matching UI options
        const prep = (s.clinical?.preparacion || '').toLowerCase();
        if (prep.includes('excelente') || prep.includes('buena') || prep.includes('bueno')) qualityData['Excelente/Buena']++;
        else if (prep.includes('adecuada') || prep.includes('adecuado')) qualityData['Adecuada']++;
        else if (prep.includes('inadecuada') || prep.includes('inadecuado') || prep.includes('mala')) qualityData['Inadecuada']++;
        else qualityData['Adecuada']++; // Default if not matched

        // Demographics Detection with Fallbacks
        const pat = s.patient || {};
        let sex = (pat.sexo || '').toLowerCase().trim();
        
        // Final fallback: try to find sex in the raw study object if patient is empty
        if (!sex && s.patient_sexo) sex = String(s.patient_sexo).toLowerCase().trim();
        
        console.log(`[STATS DEBUG] Aggregating Patient: ${pat.nombre || 'Anon'}, Sex Found: "${sex}"`);

        // Emergency Fallback: If sex is still empty, look at the name for hints (e.g., User typing "Juan Lopez m" or "Don Juan")
        if (!sex && pat.nombre) {
            const nameLower = pat.nombre.toLowerCase().trim();
            // Match suffix m/f or (m)/(f)
            if (nameLower.endsWith(' m') || nameLower.endsWith('(m)') || nameLower.includes(' masc')) sex = 'masculino';
            else if (nameLower.endsWith(' f') || nameLower.endsWith('(f)') || nameLower.includes(' fem')) sex = 'femenino';
            
            // Match common titles (Don, Sr, Doña, Sra, Dr, Dra)
            const titlesMale = ['don ', 'sr ', 'sr. ', 'dr ', 'dr. '];
            const titlesFemale = ['doña ', 'sra ', 'sra. ', 'dra ', 'dra. '];
            if (!sex) {
                if (titlesMale.some(t => nameLower.startsWith(t))) sex = 'masculino';
                else if (titlesFemale.some(t => nameLower.startsWith(t))) sex = 'femenino';
            }
            if (sex) console.log(`[STATS DEBUG] Recovered Sex from name for: ${pat.nombre} -> ${sex}`);
        }

        if (sex === 'masculino' || sex === 'm' || sex.startsWith('m')) {
            demoData['Masculino']++;
        } else if (sex === 'femenino' || sex === 'f' || sex.startsWith('f')) {
            demoData['Femenino']++;
        } else if (sex === 'otro' || sex.startsWith('o')) {
            demoData['Otro']++;
        } else if (sex) {
            demoData['Otro']++; // Catch-all for non-empty but unknown values
        } else {
            demoData['Sin especificar']++;
            debugTable.push({ name: pat.nombre || 'N/A', raw_sex: pat.sexo || 'N/A', detected: 'Sin especificar' });
        }
    });

    console.log("[STATS] Resulting Data:", demoData);
    console.group("Demographics Debug Table");
    console.table(debugTable);
    console.groupEnd();

    state.studies.forEach(s => {
        // Activity (Month-Year)
        const dateObj = new Date(s.date);
        const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;

        // Therapeutics
        const procs = s.procedimientos || [];
        procs.forEach(p => {
            if (!p) return;
            const txt = (p.description || p.desc || '').toLowerCase();
            if (txt.includes('biopsia')) therapeuticData.biopsias++;
            else if (txt.includes('polipectom')) therapeuticData.polipectomias++;
            else if (txt.trim()) therapeuticData.otrosTer++;
        });

        // Diagnoses Parsing
        const rawDiags = s.diagnoses || s.metadata?.diagFinal || '';
        const diags = rawDiags.split('\n');
        diags.forEach(d => {
            let raw = d.trim();
            if (!raw) return;
            
            if (raw.startsWith('- ')) raw = raw.substring(2).trim();
            if (raw.endsWith('.')) raw = raw.slice(0, -1).trim();
            
            const parts = raw.split(':');
            const region = parts[0].trim();
            const diagDetails = parts.length > 1 ? parts.slice(1).join(':').trim() : raw;
            
            let coreDiag = diagDetails.split('(')[0].trim();
            overallDiag[coreDiag] = (overallDiag[coreDiag] || 0) + 1;
            
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
        
        const cancerInMap = entries.find(([k]) => cancerKeywords.some(kw => k.toLowerCase().includes(kw)));
        const cancerInTop = topEntries.find(([k]) => cancerKeywords.some(kw => k.toLowerCase().includes(kw)));
        
        if (cancerInMap && !cancerInTop) {
            topEntries.pop();
            topEntries.push(cancerInMap);
        }
        
        return topEntries;
    }

    const topOverall = getTopNWithCancer(overallDiag, 10);
    const sortedMonths = Object.keys(monthCounts).sort();

    // -- Render Tables --
    renderStatsTable('qualityTable', qualityData, studies.length);
    renderStatsTable('demographicsTable', demoData, studies.length);
    
    // For diagnoses, we pass a slightly different structure
    const diagTableData = {};
    topOverall.forEach(([k, v]) => diagTableData[k] = v);
    renderStatsTable('overallDiagnosesTable', diagTableData, studies.length);

    // -- Render Charts --
    const ctxQual = document.getElementById('qualityChart');
    charts.qual = new Chart(ctxQual, {
        type: 'doughnut',
        data: {
            labels: Object.keys(qualityData),
            datasets: [{
                data: Object.values(qualityData),
                backgroundColor: ['#3b82f6', '#ef4444', '#10b981']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxDemo = document.getElementById('demographicsChart');
    const demoColors = ['#3b82f6', '#f43f5e', '#fbbf24', '#94a3b8']; // Blue, Pink, Yellow, Gray
    charts.demo = new Chart(ctxDemo, {
        type: 'pie',
        data: {
            labels: Object.keys(demoData),
            datasets: [{
                data: Object.values(demoData),
                backgroundColor: Object.keys(demoData).map((_, i) => demoColors[i % demoColors.length])
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
                label: `${region} - ${tr[0]}`,
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

function renderStatsTable(containerId, data, total) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    let html = `<table class="stats-table">
        <thead>
            <tr>
                <th>Categoría</th>
                <th class="count-cell">N</th>
                <th class="percent-cell">%</th>
            </tr>
        </thead>
        <tbody>`;
    
    Object.entries(data).forEach(([key, value]) => {
        const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        html += `<tr>
            <td>${key}</td>
            <td class="count-cell">${value}</td>
            <td class="percent-cell">${pct}%</td>
        </tr>`;
    });
    
    html += `</tbody></table>`;
    container.innerHTML = html;
}
