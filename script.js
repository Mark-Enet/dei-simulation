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

let breakdownChart, resultsChart;
let candidates = [], companies = [], stepIndex = 0, hiringGrid = [];

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

    document.getElementById('breakdownTable').innerHTML = `
        <table>
            <tr><th>Ethnicity</th><th>M/M</th><th>M/NB</th><th>F/F</th><th>F/NB</th><th>Total</th></tr>
            ${labels.map(e => {
                const s = breakdown[e];
                const total = Object.values(s).reduce((sum, g) => sum + Object.values(g).reduce((s, v) => s + v, 0), 0);
                return `<tr><td>${e}</td><td>${s.M.M}%</td><td>${s.M.NB}%</td><td>${s.F.F}%</td><td>${s.F.NB}%</td><td>${total}%</td></tr>`;
            }).join('')}
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

function generateCandidates() {
    candidates = [];
    const profession = document.getElementById('profession').value;
    const breakdown = data[profession];
    for (let ethnicity in breakdown) {
        const sexes = breakdown[ethnicity];
        for (let sex in sexes) {
            const genders = sexes[sex];
            for (let gender in genders) {
                const count = Math.round(genders[gender]);
                for (let i = 0; i < count; i++) {
                    const rank = Math.floor(Math.random() * 100) + 1; // 100 best, 1 worst
                    candidates.push({
                        id: `${ethnicity}-${sex}-${gender}-${i}`,
                        rank,
                        ethnicity,
                        sex,
                        gender,
                        orientation: Math.random() < orientationSplit.LGBTQ ? 'LGBTQ' : 'Hetero',
                        minority: ethnicity !== 'White' || sex === 'F' || gender === 'NB' || Math.random() < orientationSplit.LGBTQ
                    });
                }
            }
        }
    }
    candidates.sort((a, b) => b.rank - a.rank); // Best rank first
}

function runSimulation() {
    const hiresPer = parseInt(document.getElementById('hiresPer').value);
    const totalCompanies = parseInt(document.getElementById('companies').value);
    const speed = parseInt(document.getElementById('speed').value);
    generateCandidates();

    const meritCompanies = Math.floor(totalCompanies / 2);
    const deiCompanies = totalCompanies - meritCompanies;
    companies = [];
    hiringGrid = Array(hiresPer).fill().map(() => Array(totalCompanies).fill(null));
    stepIndex = 0;

    for (let i = 0; i < meritCompanies; i++) {
        companies.push({ type: 'Merit', id: `M${i+1}`, hires: [], minorityCount: 0 });
    }
    for (let i = 0; i < deiCompanies; i++) {
        companies.push({ type: 'DEI', id: `D${i+1}`, hires: [], minorityCount: 0 });
    }

    let pool = [...candidates];
    for (let round = 0; round < hiresPer; round++) {
        for (let i = 0; i < companies.length; i++) {
            const company = companies[i];
            let selected;
            if (company.type === 'Merit') {
                selected = pool.shift();
            } else {
                const minorityTarget = hiresPer / 2;
                if (company.minorityCount < minorityTarget && pool.some(c => c.minority)) {
                    selected = pool.filter(c => c.minority).shift();
                    pool = pool.filter(c => c !== selected);
                    company.minorityCount++;
                } else {
                    selected = pool.shift();
                }
            }
            if (selected) {
                company.hires.push(selected);
                hiringGrid[round][i] = selected;
            }
        }
    }

    companies.forEach(co => {
        co.avgRank = co.hires.length ? co.hires.reduce((sum, h) => sum + h.rank, 0) / co.hires.length : 0;
    });

    if (speed === 0) {
        displayResults(pool);
    } else if (speed === 3) {
        document.getElementById('stepBtn').style.display = 'inline';
        stepSimulation(pool);
    } else {
        let delay = [0, 500, 1000, 2000][speed];
        const totalSteps = hiresPer * companies.length;
        let step = 0;
        const interval = setInterval(() => {
            if (step >= totalSteps) {
                clearInterval(interval);
                displayResults(pool);
            } else {
                const round = Math.floor(step / companies.length);
                const companyIdx = step % companies.length;
                displayStep(round, companyIdx, pool);
                step++;
            }
        }, delay);
    }
}

function stepSimulation(pool) {
    const totalSteps = parseInt(document.getElementById('hiresPer').value) * companies.length;
    if (stepIndex < totalSteps) {
        const round = Math.floor(stepIndex / companies.length);
        const companyIdx = stepIndex % companies.length;
        displayStep(round, companyIdx, pool);
        stepIndex++;
    } else {
        document.getElementById('stepBtn').style.display = 'none';
        displayResults(pool);
    }
}

function displayStep(round, companyIdx, pool) {
    updateGrid(round, companyIdx);
    updateRemainingCandidates(pool);
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

function updateRemainingCandidates(pool) {
    document.getElementById('remainingCandidates').innerHTML = `
        <table>
            <tr><th>ID</th><th>Rank</th></tr>
            ${pool.slice(0, 10).map(c => `<tr><td>${c.id}</td><td>${c.rank}</td></tr>`).join('')}${pool.length > 10 ? '<tr><td colspan="2">...and more</td></tr>' : ''}
        </table>`;
}

function displayResults(pool) {
    updateGrid(parseInt(document.getElementById('hiresPer').value) - 1, companies.length - 1);
    updateRemainingCandidates(pool);

    if (resultsChart) resultsChart.destroy();
    const maxRank = Math.max(...companies.map(co => co.avgRank)) + 1;
    resultsChart = new Chart(document.getElementById('resultsChart'), {
        type: 'bar',
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

updateBreakdown(); // Initial load