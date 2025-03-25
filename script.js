console.log("script.js loaded successfully");
const data = {
    software: {
        White: { M: { M: 28, NB: 2 }, F: { F: 19, NB: 1 } },
        Asian: { M: { M: 14, NB: 1 }, F: { F: 9, NB: 1 } },
        Hispanic: { M: { M: 5, NB: 1 }, F: { F: 4, NB: 0 } },
        Black: { M: { M: 5, NB: 1 }, F: { F: 4, NB: 0 } },
        Other: { M: { M: 2, NB: 1 }, F: { F: 2, NB: 0 } }
    },
    finance: {
        White: { M: { M: 30, NB: 2 }, F: { F: 27, NB: 1 } },
        Asian: { M: { M: 7, NB: 1 }, F: { F: 6, NB: 1 } },
        Hispanic: { M: { M: 5, NB: 0 }, F: { F: 5, NB: 0 } },
        Black: { M: { M: 5, NB: 0 }, F: { F: 5, NB: 0 } },
        Other: { M: { M: 2, NB: 1 }, F: { F: 2, NB: 0 } }
    },
    teacher: {
        White: { M: { M: 19, NB: 1 }, F: { F: 48, NB: 2 } },
        Black: { M: { M: 3, NB: 0 }, F: { F: 7, NB: 0 } },
        Hispanic: { M: { M: 3, NB: 0 }, F: { F: 7, NB: 0 } },
        Asian: { M: { M: 2, NB: 0 }, F: { F: 3, NB: 0 } },
        Other: { M: { M: 2, NB: 0 }, F: { F: 3, NB: 0 } }
    },
    hr: {
        White: { M: { M: 14, NB: 1 }, F: { F: 48, NB: 2 } },
        Black: { M: { M: 4, NB: 0 }, F: { F: 11, NB: 0 } },
        Hispanic: { M: { M: 3, NB: 0 }, F: { F: 7, NB: 0 } },
        Asian: { M: { M: 2, NB: 0 }, F: { F: 3, NB: 0 } },
        Other: { M: { M: 2, NB: 0 }, F: { F: 3, NB: 0 } }
    }
};
const orientationSplit = { Hetero: 0.9, LGBTQ: 0.1 };
const colors = { White: '#FFFFFF', Asian: '#FFFF99', Black: '#000000', Hispanic: '#8B4513', Other: '#FFA500' };

let breakdownChart, resultsChart;
let candidates = [], companies = [], stepIndex = 0, hiringGrid = [], currentPool = [], allCandidates = [];

function updateBreakdown() {
    const profession = document.getElementById('profession').value;
    const breakdown = data[profession];
    const labels = Object.keys(breakdown);
    const values = labels.map(e => {
        const sexes = breakdown[e];
        return Object.values(sexes).reduce((sum, g) => sum + Object.values(g).reduce((s, v) => s + v, 0), 0);
    });

    if (breakdownChart) breakdownChart.destroy();
    breakdownChart = new Chart(document.getElementById('breakdownChart'), {
        type: 'pie',
        data: {
            labels,
            datasets: [{ data: values, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }]
        },
        options: {
            plugins: {
                datalabels: {
                    formatter: (value, ctx) => `${Math.round((value / values.reduce((a, b) => a + b)) * 100)}%`,
                    color: '#fff'
                }
            },
            onClick: (e, elements) => {
                if (elements.length) {
                    const index = elements[0].index;
                    showBreakdownDrilldown(labels[index], breakdown[labels[index]]);
                }
            }
        },
        plugins: [ChartDataLabels]
    });

    // Calculate column totals
    let totalMM = 0, totalMNB = 0, totalFF = 0, totalFNB = 0, grandTotal = 0;
    labels.forEach(e => {
        const s = breakdown[e];
        totalMM += s.M.M;
        totalMNB += s.M.NB;
        totalFF += s.F.F;
        totalFNB += s.F.NB;
        grandTotal += s.M.M + s.M.NB + s.F.F + s.F.NB;
    });

    document.getElementById('breakdownTable').innerHTML = `
        <table>
            <tr><th>Ethnicity</th><th>M/M</th><th>M/NB</th><th>F/F</th><th>F/NB</th><th>Total</th></tr>
            ${labels.map(e => {
                const s = breakdown[e];
                const total = Object.values(s).reduce((sum, g) => sum + Object.values(g).reduce((s, v) => s + v, 0), 0);
                return `<tr><td>${e}</td><td>${s.M.M}%</td><td>${s.M.NB}%</td><td>${s.F.F}%</td><td>${s.F.NB}%</td><td>${total}%</td></tr>`;
            }).join('')}
            <tr><td><strong>Total</strong></td><td><strong>${totalMM}%</strong></td><td><strong>${totalMNB}%</strong></td><td><strong>${totalFF}%</strong></td><td><strong>${totalFNB}%</strong></td><td><strong>${grandTotal}%</strong></td></tr>
        </table>`;
}

function showBreakdownDrilldown(ethnicity, details) {
    document.getElementById('breakdownDrilldown').style.display = 'block';
    document.getElementById('breakdownDrilldownTitle').innerText = ethnicity;
    document.getElementById('breakdownDrilldownContent').innerHTML = `
        Male/Male: ${details.M.M}%, Male/Non-binary: ${details.M.NB}%<br>
        Female/Female: ${details.F.F}%, Female/Non-binary: ${details.F.NB}%<br>
        Hetero: ${Math.round((details.M.M + details.M.NB + details.F.F + details.F.NB) * orientationSplit.Hetero)}%,
        LGBTQ+: ${Math.round((details.M.M + details.M.NB + details.F.F + details.F.NB) * orientationSplit.LGBTQ)}%
    `;
}

function toggleEditBreakdown() {
    const editDiv = document.getElementById('editBreakdown');
    editDiv.style.display = editDiv.style.display === 'none' ? 'block' : 'none';
    if (editDiv.style.display === 'block') {
        const profession = document.getElementById('profession').value;
        const breakdown = data[profession];
        document.getElementById('editTable').innerHTML = `
            <table>
                <tr><th>Ethnicity</th><th>M/M</th><th>M/NB</th><th>F/F</th><th>F/NB</th></tr>
                ${Object.keys(breakdown).map(e => `
                    <tr>
                        <td>${e}</td>
                        <td><input type="number" id="${e}-M-M" value="${breakdown[e].M.M}" min="0" max="100"></td>
                        <td><input type="number" id="${e}-M-NB" value="${breakdown[e].M.NB}" min="0" max="100"></td>
                        <td><input type="number" id="${e}-F-F" value="${breakdown[e].F.F}" min="0" max="100"></td>
                        <td><input type="number" id="${e}-F-NB" value="${breakdown[e].F.NB}" min="0" max="100"></td>
                    </tr>`).join('')}
            </table>`;
    }
}

function saveBreakdown() {
    const profession = document.getElementById('profession').value;
    const breakdown = data[profession];
    for (let e in breakdown) {
        breakdown[e].M.M = parseInt(document.getElementById(`${e}-M-M`).value);
        breakdown[e].M.NB = parseInt(document.getElementById(`${e}-M-NB`).value);
        breakdown[e].F.F = parseInt(document.getElementById(`${e}-F-F`).value);
        breakdown[e].F.NB = parseInt(document.getElementById(`${e}-F-NB`).value);
    }
    updateBreakdown();
    generateCandidates();
    document.getElementById('editBreakdown').style.display = 'none';
}

function generateCandidates() {
    candidates = [];
    const profession = document.getElementById('profession').value;
    const breakdown = data[profession];
    const totalCandidates = parseInt(document.getElementById('totalCandidates').value);
    let totalPercent = 0;
    for (let e in breakdown) {
        totalPercent += breakdown[e].M.M + breakdown[e].M.NB + breakdown[e].F.F + breakdown[e].F.NB;
    }
    const scale = totalCandidates / totalPercent;

    for (let ethnicity in breakdown) {
        const sexes = breakdown[ethnicity];
        for (let sex in sexes) {
            const genders = sexes[sex];
            for (let gender in genders) {
                const count = Math.round(genders[gender] * scale);
                for (let i = 0; i < count; i++) {
                    const rank = Math.floor(Math.random() * 100) + 1;
                    candidates.push({
                        id: `${ethnicity}-${sex}-${gender}-${i}`,
                        rank,
                        ethnicity,
                        sex,
                        gender,
                        orientation: Math.random() < orientationSplit.LGBTQ ? 'LGBTQ' : 'Hetero',
                        minority: ethnicity !== 'White' || sex === 'F' || gender === 'NB' || Math.random() < orientationSplit.LGBTQ,
                        selected: false
                    });
                }
            }
        }
    }
    candidates.sort((a, b) => b.rank - a.rank);
    allCandidates = [...candidates];
    currentPool = [...candidates];
    updateCandidatesGrid();
}

function runSimulation() {
    const hiresPer = parseInt(document.getElementById('hiresPer').value);
    const totalCompanies = parseInt(document.getElementById('companies').value);
    const speed = parseInt(document.getElementById('speed').value);
    const alternate = document.getElementById('alternateSelection').checked;
    generateCandidates();

    const meritCompanies = Math.floor(totalCompanies / 2);
    const deiCompanies = totalCompanies - meritCompanies;
    companies = [];
    hiringGrid = Array(hiresPer).fill().map(() => Array(totalCompanies).fill(null));
    stepIndex = 0;

    const meritList = [];
    const deiList = [];
    for (let i = 0; i < meritCompanies; i++) {
        meritList.push({ type: 'Merit', id: `M${i+1}`, hires: [], minorityCount: 0 });
    }
    for (let i = 0; i < deiCompanies; i++) {
        deiList.push({ type: 'DEI', id: `D${i+1}`, hires: [], minorityCount: 0 });
    }

    if (alternate) {
        const maxLen = Math.max(meritCompanies, deiCompanies);
        for (let i = 0; i < maxLen; i++) {
            if (i < meritCompanies) companies.push(meritList[i]);
            if (i < deiCompanies) companies.push(deiList[i]);
        }
    } else {
        companies = [...meritList, ...deiList];
    }

    currentPool = [...allCandidates];
    let step = 0;
    const totalSteps = hiresPer * companies.length;

    function processStep() {
        if (step >= totalSteps) {
            companies.forEach(co => {
                co.avgRank = co.hires.length ? co.hires.reduce((sum, h) => sum + h.rank, 0) / co.hires.length : 0;
            });
            setTimeout(() => displayResults(), 1000);
            return;
        }

        const round = Math.floor(step / companies.length);
        const companyIdx = step % companies.length;
        const company = companies[companyIdx];
        let selected;

        if (company.type === 'Merit') {
            selected = currentPool.find(c => !c.selected);
            if (selected) selected.selected = true;
        } else {
            const minorityTarget = hiresPer / 2;
            if (company.minorityCount < minorityTarget && currentPool.some(c => c.minority && !c.selected)) {
                selected = currentPool.filter(c => c.minority && !c.selected)[0];
                if (selected) {
                    selected.selected = true;
                    company.minorityCount++;
                }
            } else {
                selected = currentPool.find(c => !c.selected);
                if (selected) selected.selected = true;
            }
        }

        if (selected) {
            company.hires.push(selected);
            hiringGrid[round][companyIdx] = selected;
            currentPool = currentPool.map(c => c.id === selected.id ? { ...c, selected: true } : c);
        }

        displayStep(round, companyIdx);
        step++;
        if (speed === 0) {
            processStep();
        } else if (speed === 4) {
            document.getElementById('stepBtn').style.display = 'inline';
        } else {
            setTimeout(processStep, [0, 1000, 2000, 3000][speed]);
        }
    }

    processStep();
}

function stepSimulation() {
    const hiresPer = parseInt(document.getElementById('hiresPer').value);
    const totalSteps = hiresPer * companies.length;
    if (stepIndex < totalSteps) {
        const round = Math.floor(stepIndex / companies.length);
        const companyIdx = stepIndex % companies.length;
        const company = companies[companyIdx];
        let selected;

        if (company.type === 'Merit') {
            selected = currentPool.find(c => !c.selected);
            if (selected) selected.selected = true;
        } else {
            const minorityTarget = hiresPer / 2;
            if (company.minorityCount < minorityTarget && currentPool.some(c => c.minority && !c.selected)) {
                selected = currentPool.filter(c => c.minority && !c.selected)[0];
                if (selected) {
                    selected.selected = true;
                    company.minorityCount++;
                }
            } else {
                selected = currentPool.find(c => !c.selected);
                if (selected) selected.selected = true;
            }
        }

        if (selected) {
            company.hires.push(selected);
            hiringGrid[round][companyIdx] = selected;
            currentPool = currentPool.map(c => c.id === selected.id ? { ...c, selected: true } : c);
        }

        displayStep(round, companyIdx);
        stepIndex++;
    } else {
        companies.forEach(co => {
            co.avgRank = co.hires.length ? co.hires.reduce((sum, h) => sum + h.rank, 0) / co.hires.length : 0;
        });
        document.getElementById('stepBtn').style.display = 'none';
        displayResults();
    }
}

function displayStep(round, companyIdx) {
    updateGrid(round, companyIdx);
    updateCandidatesGrid();
    document.getElementById('results').style.display = 'block';
}

function updateGrid(round, companyIdx) {
    const grid = document.getElementById('hiringGrid');
    if (round === 0 && companyIdx === 0) {
        grid.innerHTML = `
            <table>
                <tr><th>Round</th>${companies.map(co => `<th>${co.id}</th>`).join('')}</tr>
                ${hiringGrid.map((row, r) => `
                    <tr><td>${r + 1}</td>${row.map((cell, c) => `
                        <td${cell ? ` onclick="showResultsDrilldown('${companies[c].id} Round ${r + 1}', ${JSON.stringify(cell)})"` : ''}>
                            ${cell ? `${cell.id} (${cell.rank})` : '-'}
                        </td>`).join('')}
                    </tr>`).join('')}
            </table>`;
    } else if (hiringGrid[round][companyIdx]) {
        const cell = grid.querySelector(`tr:nth-child(${round + 2}) td:nth-child(${companyIdx + 2})`);
        cell.innerHTML = `${hiringGrid[round][companyIdx].id} (${hiringGrid[round][companyIdx].rank})`;
        cell.onclick = () => showResultsDrilldown(`${companies[companyIdx].id} Round ${round + 1}`, hiringGrid[round][companyIdx]);
    }
}

function updateCandidatesGrid() {
    const grid = document.getElementById('candidatesGrid');
    const total = parseInt(document.getElementById('totalCandidates').value);
    const rows = Math.ceil(total / 10);
    grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    grid.innerHTML = Array(rows * 10).fill().map((_, i) => {
        const candidate = allCandidates[i];
        if (!candidate) return '<div></div>';
        const label = `${candidate.sex}/${candidate.gender}`;
        const bgColor = candidate.selected ? '#808080' : colors[candidate.ethnicity];
        const textColor = bgColor === '#000000' ? '#CCCCCC' : '#000000';
        const tooltip = `ID: ${candidate.id}, Rank: ${candidate.rank}, Ethnicity: ${candidate.ethnicity}, Sex: ${candidate.sex}, Gender: ${candidate.gender}, Orientation: ${candidate.orientation}`;
        return `<div style="background-color:${bgColor};color:${textColor};" data-tooltip="${tooltip}" ${!candidate.selected ? `onclick="showResultsDrilldown('${candidate.id}', ${JSON.stringify(candidate)})"` : ''}>${label}</div>`;
    }).join('');
    const available = allCandidates.filter(c => !c.selected).length;
    document.getElementById('candidateCounter').innerText = `${available}/${total}`;
}

function displayResults() {
    updateGrid(parseInt(document.getElementById('hiresPer').value) - 1, companies.length - 1);
    updateCandidatesGrid();

    if (resultsChart) resultsChart.destroy();
    const maxRank = Math.max(...companies.map(co => co.avgRank)) + 1;
    resultsChart = new Chart(document.getElementById('resultsChart'), {
        type: 'pie',
        data: {
            labels: companies.map(co => co.id),
            datasets: [{ label: 'Avg Rank', data: companies.map(co => co.avgRank), backgroundColor: companies.map(co => co.type === 'Merit' ? '#36A2EB' : '#FF6384') }]
        },
        options: {
            scales: { y: { beginAtZero: true, max: maxRank } },
            onClick: (e, elements) => {
                if (elements.length) {
                    const index = elements[0].index;
                    showResultsDrilldown(companies[index].id, companies[index]);
                }
            }
        }
    });

    document.getElementById('resultsTable').innerHTML = `
        <table>
            <tr><th>Company</th><th>Avg Rank</th></tr>
            ${companies.map(co => `<tr><td>${co.id}</td><td>${co.avgRank.toFixed(2)}</td></tr>`).join('')}
        </table>`;
    document.getElementById('results').style.display = 'block';
    document.getElementById('stepBtn').style.display = 'none';
}

function showResultsDrilldown(title, data) {
    document.getElementById('resultsDrilldown').style.display = 'block';
    document.getElementById('resultsDrilldownTitle').innerText = title;
    if (data.hires) {
        document.getElementById('resultsDrilldownContent').innerHTML = `
            <table>
                <tr><th>ID</th><th>Rank</th><th>Ethnicity</th><th>Sex</th><th>Gender</th><th>Orientation</th></tr>
                ${data.hires.map(h => `<tr><td>${h.id}</td><td>${h.rank}</td><td>${h.ethnicity}</td><td>${h.sex}</td><td>${h.gender}</td><td>${h.orientation}</td></tr>`).join('')}
            </table>`;
    } else {
        document.getElementById('resultsDrilldownContent').innerHTML = `
            ID: ${data.id}, Rank: ${data.rank}<br>
            Ethnicity: ${data.ethnicity}, Sex: ${data.sex}, Gender: ${data.gender}, Orientation: ${data.orientation}
        `;
    }
}

updateBreakdown();
generateCandidates();