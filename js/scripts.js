// ====================================
// CPU SCHEDULING SIMULATOR
// Main JavaScript File
// ====================================

// Process colors for Gantt chart
const PROCESS_COLORS = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#ec4899', '#14b8a6', '#f97316', '#84cc16'
];

// ====================================
// DOM UTILITIES
// ====================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// ====================================
// THEME MANAGEMENT
// ====================================
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        const themeToggle = $('.theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggle());
        }
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', this.theme);
        localStorage.setItem('theme', this.theme);
    }
}

// ====================================
// NAVIGATION MANAGEMENT
// ====================================
class NavigationManager {
    constructor() {
        this.init();
    }

    init() {
        // Handle navigation clicks
        $$('.nav-link, .card-link, .back-link, [href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    this.navigateTo(href.substring(1));
                }
            });
        });

        // Handle mobile menu
        const mobileMenuBtn = $('.mobile-menu-btn');
        const navLinks = $('.nav-links');
        
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                const isOpen = navLinks.classList.toggle('open');
                mobileMenuBtn.setAttribute('aria-expanded', isOpen);
            });
        }

        // Handle initial hash
        if (window.location.hash) {
            this.navigateTo(window.location.hash.substring(1));
        }

        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            if (window.location.hash) {
                this.navigateTo(window.location.hash.substring(1));
            }
        });
    }

    navigateTo(sectionId) {
        // Update sections
        $$('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = $(`#${sectionId}`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update nav links
        $$('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${sectionId}`) {
                link.classList.add('active');
            }
        });

        // Close mobile menu
        $('.nav-links')?.classList.remove('open');
        $('.mobile-menu-btn')?.setAttribute('aria-expanded', 'false');

        // Update URL
        history.pushState(null, null, `#${sectionId}`);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// ====================================
// TOAST NOTIFICATION SYSTEM
// ====================================
class ToastManager {
    static show(message, type = 'info', duration = 3000) {
        const container = $('#toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-message">${message}</span>
            <button class="toast-close" aria-label="Close notification">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
}

// ====================================
// SCHEDULING ALGORITHMS
// ====================================

class SchedulingAlgorithms {
    // First Come First Serve
    static fcfs(processes) {
        const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        const results = [];
        const ganttChart = [];
        let currentTime = 0;

        sortedProcesses.forEach(process => {
            // Handle idle time
            if (currentTime < process.arrivalTime) {
                ganttChart.push({
                    process: 'Idle',
                    start: currentTime,
                    end: process.arrivalTime
                });
                currentTime = process.arrivalTime;
            }

            const startTime = currentTime;
            const completionTime = startTime + process.burstTime;
            const turnaroundTime = completionTime - process.arrivalTime;
            const waitingTime = turnaroundTime - process.burstTime;
            const responseTime = startTime - process.arrivalTime;

            ganttChart.push({
                process: process.name,
                start: startTime,
                end: completionTime,
                color: process.color
            });

            results.push({
                ...process,
                startTime,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });

            currentTime = completionTime;
        });

        return { results, ganttChart };
    }

    // Shortest Job First (Non-Preemptive)
    static sjfNonPreemptive(processes) {
        const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        const results = [];
        const ganttChart = [];
        const remaining = [...sortedProcesses];
        let currentTime = 0;

        while (remaining.length > 0) {
            // Get available processes
            const available = remaining.filter(p => p.arrivalTime <= currentTime);

            if (available.length === 0) {
                const nextProcess = remaining.reduce((min, p) => 
                    p.arrivalTime < min.arrivalTime ? p : min
                );
                ganttChart.push({
                    process: 'Idle',
                    start: currentTime,
                    end: nextProcess.arrivalTime
                });
                currentTime = nextProcess.arrivalTime;
                continue;
            }

            // Select shortest job
            const selected = available.reduce((min, p) => 
                p.burstTime < min.burstTime ? p : min
            );

            const index = remaining.indexOf(selected);
            remaining.splice(index, 1);

            const startTime = currentTime;
            const completionTime = startTime + selected.burstTime;
            const turnaroundTime = completionTime - selected.arrivalTime;
            const waitingTime = turnaroundTime - selected.burstTime;
            const responseTime = startTime - selected.arrivalTime;

            ganttChart.push({
                process: selected.name,
                start: startTime,
                end: completionTime,
                color: selected.color
            });

            results.push({
                ...selected,
                startTime,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });

            currentTime = completionTime;
        }

        return { results, ganttChart };
    }

    // Shortest Job First (Preemptive - SRTF)
    static sjfPreemptive(processes) {
        const sortedProcesses = [...processes].map(p => ({
            ...p,
            remainingTime: p.burstTime,
            firstResponse: -1
        })).sort((a, b) => a.arrivalTime - b.arrivalTime);

        const results = [];
        const ganttChart = [];
        let currentTime = 0;
        let completed = 0;
        const n = sortedProcesses.length;

        while (completed < n) {
            // Get available processes with remaining time
            const available = sortedProcesses.filter(
                p => p.arrivalTime <= currentTime && p.remainingTime > 0
            );

            if (available.length === 0) {
                const nextProcess = sortedProcesses.find(p => p.remainingTime > 0);
                if (nextProcess) {
                    ganttChart.push({
                        process: 'Idle',
                        start: currentTime,
                        end: nextProcess.arrivalTime
                    });
                    currentTime = nextProcess.arrivalTime;
                }
                continue;
            }

            // Select process with shortest remaining time
            const selected = available.reduce((min, p) => 
                p.remainingTime < min.remainingTime ? p : min
            );

            // Track first response time
            if (selected.firstResponse === -1) {
                selected.firstResponse = currentTime;
            }

            // Find how long this process can run
            let runTime = 1;
            const nextArrival = sortedProcesses.find(
                p => p.arrivalTime > currentTime && p.remainingTime > 0
            );
            
            if (!nextArrival) {
                runTime = selected.remainingTime;
            } else {
                runTime = Math.min(
                    selected.remainingTime,
                    nextArrival.arrivalTime - currentTime
                );
            }

            // Merge with previous gantt block if same process
            const lastBlock = ganttChart[ganttChart.length - 1];
            if (lastBlock && lastBlock.process === selected.name && lastBlock.end === currentTime) {
                lastBlock.end = currentTime + runTime;
            } else {
                ganttChart.push({
                    process: selected.name,
                    start: currentTime,
                    end: currentTime + runTime,
                    color: selected.color
                });
            }

            currentTime += runTime;
            selected.remainingTime -= runTime;

            if (selected.remainingTime === 0) {
                completed++;
                const turnaroundTime = currentTime - selected.arrivalTime;
                const waitingTime = turnaroundTime - selected.burstTime;
                const responseTime = selected.firstResponse - selected.arrivalTime;

                results.push({
                    ...selected,
                    completionTime: currentTime,
                    turnaroundTime,
                    waitingTime,
                    responseTime
                });
            }
        }

        return { results, ganttChart };
    }

    // Priority Scheduling (Non-Preemptive)
    static priorityScheduling(processes, lowerIsHigher = true) {
        const sortedProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
        const results = [];
        const ganttChart = [];
        const remaining = [...sortedProcesses];
        let currentTime = 0;

        while (remaining.length > 0) {
            const available = remaining.filter(p => p.arrivalTime <= currentTime);

            if (available.length === 0) {
                const nextProcess = remaining.reduce((min, p) => 
                    p.arrivalTime < min.arrivalTime ? p : min
                );
                ganttChart.push({
                    process: 'Idle',
                    start: currentTime,
                    end: nextProcess.arrivalTime
                });
                currentTime = nextProcess.arrivalTime;
                continue;
            }

            // Select highest priority
            const selected = available.reduce((best, p) => {
                if (lowerIsHigher) {
                    return p.priority < best.priority ? p : best;
                } else {
                    return p.priority > best.priority ? p : best;
                }
            });

            const index = remaining.indexOf(selected);
            remaining.splice(index, 1);

            const startTime = currentTime;
            const completionTime = startTime + selected.burstTime;
            const turnaroundTime = completionTime - selected.arrivalTime;
            const waitingTime = turnaroundTime - selected.burstTime;
            const responseTime = startTime - selected.arrivalTime;

            ganttChart.push({
                process: selected.name,
                start: startTime,
                end: completionTime,
                color: selected.color
            });

            results.push({
                ...selected,
                startTime,
                completionTime,
                turnaroundTime,
                waitingTime,
                responseTime
            });

            currentTime = completionTime;
        }

        return { results, ganttChart };
    }

    // Round Robin
    static roundRobin(processes, quantum) {
        const sortedProcesses = [...processes].map(p => ({
            ...p,
            remainingTime: p.burstTime,
            firstResponse: -1
        })).sort((a, b) => a.arrivalTime - b.arrivalTime);

        const results = [];
        const ganttChart = [];
        const readyQueue = [];
        let currentTime = 0;
        let completed = 0;
        const n = sortedProcesses.length;
        let processIndex = 0;
        let contextSwitches = 0;

        // Add initial processes to queue
        while (processIndex < n && sortedProcesses[processIndex].arrivalTime <= currentTime) {
            readyQueue.push(sortedProcesses[processIndex]);
            processIndex++;
        }

        while (completed < n) {
            if (readyQueue.length === 0) {
                // No process available, idle time
                if (processIndex < n) {
                    const nextProcess = sortedProcesses[processIndex];
                    ganttChart.push({
                        process: 'Idle',
                        start: currentTime,
                        end: nextProcess.arrivalTime
                    });
                    currentTime = nextProcess.arrivalTime;
                    
                    while (processIndex < n && sortedProcesses[processIndex].arrivalTime <= currentTime) {
                        readyQueue.push(sortedProcesses[processIndex]);
                        processIndex++;
                    }
                }
                continue;
            }

            const current = readyQueue.shift();

            // Track first response time
            if (current.firstResponse === -1) {
                current.firstResponse = currentTime;
            }

            const runTime = Math.min(quantum, current.remainingTime);
            
            ganttChart.push({
                process: current.name,
                start: currentTime,
                end: currentTime + runTime,
                color: current.color
            });

            currentTime += runTime;
            current.remainingTime -= runTime;

            // Add newly arrived processes to queue
            while (processIndex < n && sortedProcesses[processIndex].arrivalTime <= currentTime) {
                readyQueue.push(sortedProcesses[processIndex]);
                processIndex++;
            }

            if (current.remainingTime > 0) {
                readyQueue.push(current);
                contextSwitches++;
            } else {
                completed++;
                const turnaroundTime = currentTime - current.arrivalTime;
                const waitingTime = turnaroundTime - current.burstTime;
                const responseTime = current.firstResponse - current.arrivalTime;

                results.push({
                    ...current,
                    completionTime: currentTime,
                    turnaroundTime,
                    waitingTime,
                    responseTime
                });
            }
        }

        return { results, ganttChart, contextSwitches };
    }
}

// ====================================
// PROCESS INPUT MANAGER
// ====================================
class ProcessInputManager {
    static generateInputFields(containerId, count, includePriority = false) {
        const container = $(`#${containerId}`);
        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const row = document.createElement('div');
            row.className = `process-input-row ${includePriority ? 'with-priority' : ''}`;
            row.innerHTML = `
                <span class="process-label" style="color: ${PROCESS_COLORS[i]}">P${i + 1}</span>
                <div class="form-group">
                    <label for="${containerId}-at-${i}">Arrival Time</label>
                    <input type="number" id="${containerId}-at-${i}" min="0" value="0" 
                           aria-label="Arrival time for process ${i + 1}">
                </div>
                <div class="form-group">
                    <label for="${containerId}-bt-${i}">Burst Time</label>
                    <input type="number" id="${containerId}-bt-${i}" min="1" value="${(i + 1) * 2}" 
                           aria-label="Burst time for process ${i + 1}">
                </div>
                ${includePriority ? `
                <div class="form-group">
                    <label for="${containerId}-pr-${i}">Priority</label>
                    <input type="number" id="${containerId}-pr-${i}" min="1" value="${count - i}" 
                           aria-label="Priority for process ${i + 1}">
                </div>
                ` : ''}
            `;
            container.appendChild(row);
        }
    }

    static getProcesses(containerId, count, includePriority = false) {
        const processes = [];
        
        for (let i = 0; i < count; i++) {
            const arrivalTime = parseInt($(`#${containerId}-at-${i}`).value) || 0;
            const burstTime = parseInt($(`#${containerId}-bt-${i}`).value) || 1;
            const priority = includePriority ? parseInt($(`#${containerId}-pr-${i}`).value) || 1 : 1;

            processes.push({
                name: `P${i + 1}`,
                arrivalTime,
                burstTime,
                priority,
                color: PROCESS_COLORS[i]
            });
        }

        return processes;
    }

    static loadSampleData(containerId, data, includePriority = false) {
        data.forEach((process, i) => {
            const atInput = $(`#${containerId}-at-${i}`);
            const btInput = $(`#${containerId}-bt-${i}`);
            const prInput = $(`#${containerId}-pr-${i}`);

            if (atInput) atInput.value = process.arrivalTime;
            if (btInput) btInput.value = process.burstTime;
            if (prInput && includePriority) prInput.value = process.priority;
        });
    }
}

// ====================================
// RESULTS DISPLAY MANAGER
// ====================================
class ResultsDisplayManager {
    static displayResults(prefix, results, ganttChart, contextSwitches = null) {
        // Show results section
        $(`#${prefix}-results`).classList.remove('hidden');

        // Render Gantt chart
        this.renderGanttChart(prefix, ganttChart);

        // Render table
        this.renderTable(prefix, results);

        // Calculate and display metrics
        this.displayMetrics(prefix, results, ganttChart, contextSwitches);
    }

    static renderGanttChart(prefix, ganttChart) {
        const ganttContainer = $(`#${prefix}-gantt`);
        const timelineContainer = $(`#${prefix}-timeline`);
        ganttContainer.innerHTML = '';
        timelineContainer.innerHTML = '';

        const totalTime = ganttChart[ganttChart.length - 1].end;
        const scale = 100 / totalTime;

        ganttChart.forEach((block, index) => {
            const width = (block.end - block.start) * scale;
            const ganttBlock = document.createElement('div');
            ganttBlock.className = `gantt-block ${block.process === 'Idle' ? 'idle' : ''}`;
            ganttBlock.style.width = `${width}%`;
            ganttBlock.style.background = block.color || 'var(--color-bg-secondary)';
            ganttBlock.textContent = block.process;
            ganttBlock.title = `${block.process}: ${block.start} - ${block.end}`;
            
            // Animation delay
            ganttBlock.style.animation = `fadeIn 0.3s ease ${index * 0.1}s both`;
            
            ganttContainer.appendChild(ganttBlock);
        });

        // Timeline markers
        const timeMarkers = [0];
        ganttChart.forEach(block => {
            if (!timeMarkers.includes(block.end)) {
                timeMarkers.push(block.end);
            }
        });

        timeMarkers.forEach((time, i) => {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            
            if (i === 0) {
                marker.style.width = '0';
            } else {
                const prevTime = timeMarkers[i - 1];
                marker.style.width = `${(time - prevTime) * scale}%`;
            }
            
            marker.textContent = time;
            timelineContainer.appendChild(marker);
        });
    }

    static renderTable(prefix, results) {
        const tbody = $(`#${prefix}-table tbody`);
        tbody.innerHTML = '';

        const sortedResults = [...results].sort((a, b) => {
            const numA = parseInt(a.name.substring(1));
            const numB = parseInt(b.name.substring(1));
            return numA - numB;
        });

        sortedResults.forEach((process, index) => {
            const row = document.createElement('tr');
            row.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
            
            let cells = `
                <td><span style="color: ${process.color}; font-weight: 600;">${process.name}</span></td>
                <td>${process.arrivalTime}</td>
                <td>${process.burstTime}</td>
            `;

            // Add priority column if exists
            if (process.priority !== undefined && prefix === 'priority') {
                cells += `<td>${process.priority}</td>`;
            }

            cells += `
                <td>${process.completionTime}</td>
                <td>${process.turnaroundTime}</td>
                <td>${process.waitingTime}</td>
                <td>${process.responseTime}</td>
            `;

            row.innerHTML = cells;
            tbody.appendChild(row);
        });
    }

    static displayMetrics(prefix, results, ganttChart, contextSwitches = null) {
        const n = results.length;
        const totalTime = ganttChart[ganttChart.length - 1].end;
        const firstArrival = Math.min(...results.map(r => r.arrivalTime));
        
        const avgTAT = results.reduce((sum, r) => sum + r.turnaroundTime, 0) / n;
        const avgWT = results.reduce((sum, r) => sum + r.waitingTime, 0) / n;
        const avgRT = results.reduce((sum, r) => sum + r.responseTime, 0) / n;
        
        const idleTime = ganttChart.filter(b => b.process === 'Idle')
            .reduce((sum, b) => sum + (b.end - b.start), 0);
        const cpuUtil = ((totalTime - idleTime) / totalTime * 100);
        const throughput = n / totalTime;

        $(`#${prefix}-avg-tat`).textContent = avgTAT.toFixed(2);
        $(`#${prefix}-avg-wt`).textContent = avgWT.toFixed(2);
        $(`#${prefix}-avg-rt`).textContent = avgRT.toFixed(2);
        $(`#${prefix}-cpu-util`).textContent = `${cpuUtil.toFixed(1)}%`;
        
        if (prefix === 'rr' && contextSwitches !== null) {
            $(`#${prefix}-context-switches`).textContent = contextSwitches;
        } else if ($(`#${prefix}-throughput`)) {
            $(`#${prefix}-throughput`).textContent = `${throughput.toFixed(3)}/unit`;
        }
    }
}

// ====================================
// ALGORITHM CONTROLLERS
// ====================================

// FCFS Controller
class FCFSController {
    constructor() {
        this.processCount = 4;
        this.init();
    }

    init() {
        // Generate initial fields
        ProcessInputManager.generateInputFields('fcfs-process-inputs', this.processCount);

        // Event listeners
        $('#fcfs-generate-btn').addEventListener('click', () => {
            this.processCount = parseInt($('#fcfs-process-count').value) || 4;
            ProcessInputManager.generateInputFields('fcfs-process-inputs', this.processCount);
            $('#fcfs-results').classList.add('hidden');
        });

        $('#fcfs-simulate-btn').addEventListener('click', () => this.simulate());

        $('#fcfs-sample-btn').addEventListener('click', () => {
            this.loadSampleData();
        });

        $('#fcfs-clear-btn').addEventListener('click', () => {
            ProcessInputManager.generateInputFields('fcfs-process-inputs', this.processCount);
            $('#fcfs-results').classList.add('hidden');
        });
    }

    simulate() {
        try {
            const processes = ProcessInputManager.getProcesses('fcfs-process-inputs', this.processCount);
            const { results, ganttChart } = SchedulingAlgorithms.fcfs(processes);
            ResultsDisplayManager.displayResults('fcfs', results, ganttChart);
            ToastManager.show('FCFS simulation completed!', 'success');
        } catch (error) {
            ToastManager.show('Error running simulation. Please check your inputs.', 'error');
            console.error(error);
        }
    }

    loadSampleData() {
        this.processCount = 4;
        $('#fcfs-process-count').value = 4;
        ProcessInputManager.generateInputFields('fcfs-process-inputs', 4);
        
        const sampleData = [
            { arrivalTime: 0, burstTime: 5 },
            { arrivalTime: 1, burstTime: 3 },
            { arrivalTime: 2, burstTime: 8 },
            { arrivalTime: 3, burstTime: 6 }
        ];
        
        ProcessInputManager.loadSampleData('fcfs-process-inputs', sampleData);
        ToastManager.show('Sample data loaded!', 'info');
    }
}

// SJF Controller
class SJFController {
    constructor() {
        this.processCount = 4;
        this.init();
    }

    init() {
        ProcessInputManager.generateInputFields('sjf-process-inputs', this.processCount);

        $('#sjf-generate-btn').addEventListener('click', () => {
            this.processCount = parseInt($('#sjf-process-count').value) || 4;
            ProcessInputManager.generateInputFields('sjf-process-inputs', this.processCount);
            $('#sjf-results').classList.add('hidden');
        });

        $('#sjf-simulate-btn').addEventListener('click', () => this.simulate());

        $('#sjf-sample-btn').addEventListener('click', () => this.loadSampleData());

        $('#sjf-clear-btn').addEventListener('click', () => {
            ProcessInputManager.generateInputFields('sjf-process-inputs', this.processCount);
            $('#sjf-results').classList.add('hidden');
        });
    }

    simulate() {
        try {
            const processes = ProcessInputManager.getProcesses('sjf-process-inputs', this.processCount);
            const isPreemptive = $('input[name="sjf-mode"]:checked').value === 'preemptive';
            
            let result;
            if (isPreemptive) {
                result = SchedulingAlgorithms.sjfPreemptive(processes);
            } else {
                result = SchedulingAlgorithms.sjfNonPreemptive(processes);
            }
            
            ResultsDisplayManager.displayResults('sjf', result.results, result.ganttChart);
            ToastManager.show(`SJF ${isPreemptive ? '(Preemptive)' : '(Non-Preemptive)'} simulation completed!`, 'success');
        } catch (error) {
            ToastManager.show('Error running simulation. Please check your inputs.', 'error');
            console.error(error);
        }
    }

    loadSampleData() {
        this.processCount = 4;
        $('#sjf-process-count').value = 4;
        ProcessInputManager.generateInputFields('sjf-process-inputs', 4);
        
        const sampleData = [
            { arrivalTime: 0, burstTime: 6 },
            { arrivalTime: 1, burstTime: 8 },
            { arrivalTime: 2, burstTime: 7 },
            { arrivalTime: 3, burstTime: 3 }
        ];
        
        ProcessInputManager.loadSampleData('sjf-process-inputs', sampleData);
        ToastManager.show('Sample data loaded!', 'info');
    }
}

// Priority Controller
class PriorityController {
    constructor() {
        this.processCount = 4;
        this.init();
    }

    init() {
        ProcessInputManager.generateInputFields('priority-process-inputs', this.processCount, true);

        $('#priority-generate-btn').addEventListener('click', () => {
            this.processCount = parseInt($('#priority-process-count').value) || 4;
            ProcessInputManager.generateInputFields('priority-process-inputs', this.processCount, true);
            $('#priority-results').classList.add('hidden');
        });

        $('#priority-simulate-btn').addEventListener('click', () => this.simulate());

        $('#priority-sample-btn').addEventListener('click', () => this.loadSampleData());

        $('#priority-clear-btn').addEventListener('click', () => {
            ProcessInputManager.generateInputFields('priority-process-inputs', this.processCount, true);
            $('#priority-results').classList.add('hidden');
        });
    }

    simulate() {
        try {
            const processes = ProcessInputManager.getProcesses('priority-process-inputs', this.processCount, true);
            const lowerIsHigher = $('input[name="priority-order"]:checked').value === 'lower';
            
            const { results, ganttChart } = SchedulingAlgorithms.priorityScheduling(processes, lowerIsHigher);
            ResultsDisplayManager.displayResults('priority', results, ganttChart);
            ToastManager.show('Priority scheduling simulation completed!', 'success');
        } catch (error) {
            ToastManager.show('Error running simulation. Please check your inputs.', 'error');
            console.error(error);
        }
    }

    loadSampleData() {
        this.processCount = 4;
        $('#priority-process-count').value = 4;
        ProcessInputManager.generateInputFields('priority-process-inputs', 4, true);
        
        const sampleData = [
            { arrivalTime: 0, burstTime: 5, priority: 3 },
            { arrivalTime: 1, burstTime: 3, priority: 1 },
            { arrivalTime: 2, burstTime: 8, priority: 2 },
            { arrivalTime: 3, burstTime: 6, priority: 4 }
        ];
        
        ProcessInputManager.loadSampleData('priority-process-inputs', sampleData, true);
        ToastManager.show('Sample data loaded!', 'info');
    }
}

// Round Robin Controller
class RoundRobinController {
    constructor() {
        this.processCount = 4;
        this.quantum = 2;
        this.init();
    }

    init() {
        ProcessInputManager.generateInputFields('rr-process-inputs', this.processCount);

        $('#rr-generate-btn').addEventListener('click', () => {
            this.processCount = parseInt($('#rr-process-count').value) || 4;
            this.quantum = parseInt($('#rr-quantum').value) || 2;
            ProcessInputManager.generateInputFields('rr-process-inputs', this.processCount);
            $('#rr-results').classList.add('hidden');
        });

        $('#rr-simulate-btn').addEventListener('click', () => this.simulate());

        $('#rr-sample-btn').addEventListener('click', () => this.loadSampleData());

        $('#rr-clear-btn').addEventListener('click', () => {
            ProcessInputManager.generateInputFields('rr-process-inputs', this.processCount);
            $('#rr-results').classList.add('hidden');
        });
    }

    simulate() {
        try {
            const processes = ProcessInputManager.getProcesses('rr-process-inputs', this.processCount);
            const quantum = parseInt($('#rr-quantum').value) || 2;
            
            const { results, ganttChart, contextSwitches } = SchedulingAlgorithms.roundRobin(processes, quantum);
            ResultsDisplayManager.displayResults('rr', results, ganttChart, contextSwitches);
            ToastManager.show(`Round Robin (Quantum=${quantum}) simulation completed!`, 'success');
        } catch (error) {
            ToastManager.show('Error running simulation. Please check your inputs.', 'error');
            console.error(error);
        }
    }

    loadSampleData() {
        this.processCount = 4;
        $('#rr-process-count').value = 4;
        $('#rr-quantum').value = 2;
        ProcessInputManager.generateInputFields('rr-process-inputs', 4);
        
        const sampleData = [
            { arrivalTime: 0, burstTime: 5 },
            { arrivalTime: 1, burstTime: 4 },
            { arrivalTime: 2, burstTime: 2 },
            { arrivalTime: 3, burstTime: 1 }
        ];
        
        ProcessInputManager.loadSampleData('rr-process-inputs', sampleData);
        ToastManager.show('Sample data loaded!', 'info');
    }
}

// ====================================
// APPLICATION INITIALIZATION
// ====================================
document.addEventListener('DOMContentLoaded', () => {
    // Initialize managers
    new ThemeManager();
    new NavigationManager();

    // Initialize controllers
    new FCFSController();
    new SJFController();
    new PriorityController();
    new RoundRobinController();

    // Welcome toast
    setTimeout(() => {
        ToastManager.show('Welcome to CPU Scheduling Simulator!', 'info');
    }, 500);
});