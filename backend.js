// --- Bulletproof Theme Toggle ---
const themeToggleBtn = document.getElementById('themeToggle');

let currentTheme = 'light';
try { currentTheme = localStorage.getItem('theme') || 'light'; } 
catch (e) { console.warn("Local storage blocked, defaulting to light mode."); }

if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️ Light';
} else {
    document.body.classList.remove('dark-mode');
    themeToggleBtn.textContent = '🌙 Dark';
}

themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    let isDark = document.body.classList.contains('dark-mode');
    themeToggleBtn.textContent = isDark ? '☀️ Light' : '🌙 Dark';
    try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch (e) {}
});

// --- DOM Elements ---
const numQuestionsInput = document.getElementById('numQuestions');
const showTimeInput = document.getElementById('showTime');
const blankTimeInput = document.getElementById('blankTime');
const totalTestsInput = document.getElementById('totalTests');
const minDigitsInput = document.getElementById('minDigits');
const maxDigitsInput = document.getElementById('maxDigits');
const testTypeSelector = document.getElementById('testType');

const timingSettingsColumn = document.getElementById('timingSettingsColumn');
const numQuestionsGroup = document.getElementById('numQuestionsGroup');

const totalTestsGroup = document.getElementById('totalTestsGroup');
const testProgressGroup = document.getElementById('testProgressGroup');
const testsCompletedDisplay = document.getElementById('testsCompletedDisplay');
const testsCorrectDisplay = document.getElementById('testsCorrectDisplay'); 
const testsFailedDisplay = document.getElementById('testsFailedDisplay'); 

const startBtn = document.getElementById('startBtn');
const cancelBtn = document.getElementById('cancelBtn'); 
const endSessionBtn = document.getElementById('endSessionBtn'); 
const nextTestBtn = document.getElementById('nextTestBtn'); 

const numberDisplay = document.getElementById('numberDisplay');
const answerArea = document.getElementById('answerArea');
const userAnswerInput = document.getElementById('userAnswer');
const submitBtn = document.getElementById('submitBtn');
const resultMessage = document.getElementById('resultMessage');
const equationPrefix = document.getElementById('equationPrefix'); 
const questionPrefix = document.getElementById('questionPrefix'); 

// --- State Variables ---
let totalTestsCount = 0;
let currentTestIndex = 0;
let correctTestsCount = 0; 
let failedTestsCount = 0; 
let questionsPerTest = 0;
let timeShow = 0;
let timeBlank = 0;

let currentSum = 0;
let currentQuestionIndex = 0;
let sessionStartTime = 0; // New: Tracker for avg time

let bufferTimer, flashHideTimer, flashNextTimer;

// --- Load/Save Settings ---
const SETTINGS_KEYS = ['numQuestions', 'showTime', 'blankTime', 'totalTests', 'minDigits', 'maxDigits', 'testType'];

function loadSavedSettings() {
    try {
        SETTINGS_KEYS.forEach(key => {
            const savedValue = localStorage.getItem('mmSetting_' + key);
            if (savedValue !== null) { document.getElementById(key).value = savedValue; }
        });
        testTypeSelector.dispatchEvent(new Event('change'));
    } catch (e) {}
}

function saveCurrentSettings() {
    try {
        SETTINGS_KEYS.forEach(key => {
            localStorage.setItem('mmSetting_' + key, document.getElementById(key).value);
        });
    } catch (e) {}
}

loadSavedSettings();

// --- Event Listeners ---
startBtn.addEventListener('click', startPracticeSession);
cancelBtn.addEventListener('click', cancelCurrentTest); 
endSessionBtn.addEventListener('click', forceEndSession); 
nextTestBtn.addEventListener('click', handleNextAction); 
submitBtn.addEventListener('click', checkAnswer);

userAnswerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') checkAnswer();
});

testTypeSelector.addEventListener('change', (e) => {
    const isMulti = (e.target.value === 'multiplication');
    numQuestionsInput.disabled = isMulti;
    showTimeInput.disabled = isMulti;
    blankTimeInput.disabled = isMulti;
    
    if (isMulti) {
        timingSettingsColumn.classList.add('hidden');
        numQuestionsGroup.classList.add('hidden');
    } else {
        timingSettingsColumn.classList.remove('hidden');
        numQuestionsGroup.classList.remove('hidden');
    }
});

// --- Functions ---

function startPracticeSession() {
    questionsPerTest = parseInt(numQuestionsInput.value);
    timeShow = parseInt(showTimeInput.value);
    timeBlank = parseInt(blankTimeInput.value);
    totalTestsCount = parseInt(totalTestsInput.value);
    let minDig = parseInt(minDigitsInput.value);
    let maxDig = parseInt(maxDigitsInput.value);

    if (!totalTestsCount || !minDig || !maxDig) {
        alert("Please ensure core settings have valid numbers."); return;
    }
    if (minDig > maxDig) {
        alert("Min digits cannot be greater than max digits."); return;
    }

    saveCurrentSettings();

    currentTestIndex = 0;
    correctTestsCount = 0;
    failedTestsCount = 0; 
    sessionStartTime = Date.now(); // Start clock for the session

    totalTestsGroup.classList.add('hidden');
    testProgressGroup.classList.remove('hidden');
    startBtn.classList.add('hidden');
    
    updateProgressDisplay();
    toggleSettingsInputs(true);

    runSingleTest();
}

function runSingleTest() {
    currentSum = 0;
    currentQuestionIndex = 0;
    
    answerArea.classList.add('hidden');
    nextTestBtn.classList.add('hidden'); 
    
    // Clear input and strip away any previous red/green borders
    userAnswerInput.value = '';
    userAnswerInput.classList.remove('input-correct', 'input-wrong');
    resultMessage.textContent = '';
    
    userAnswerInput.disabled = false;
    submitBtn.disabled = false;
    endSessionBtn.classList.remove('hidden');

    if (testTypeSelector.value === 'multiplication') {
        // --- MULTIPLICATION LOGIC ---
        cancelBtn.classList.add('hidden'); 

        let minDig = parseInt(minDigitsInput.value);
        let maxDig = parseInt(maxDigitsInput.value);
        let minNum = minDig === 1 ? 2 : Math.pow(10, minDig - 1); 
        let maxNum = Math.pow(10, maxDig) - 1;
        
        let n1 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        let n2 = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        
        currentSum = n1 * n2;
        
        numberDisplay.classList.add('hidden');
        questionPrefix.textContent = `Q${currentTestIndex + 1}: `;
        questionPrefix.classList.remove('hidden');
        equationPrefix.textContent = `${n1} × ${n2} =`;
        equationPrefix.classList.remove('hidden');
        
        answerArea.classList.remove('hidden');
        userAnswerInput.focus();

    } else {
        // --- FLASH ADDITION/SUBTRACTION LOGIC ---
        cancelBtn.classList.remove('hidden');
        cancelBtn.disabled = false;

        equationPrefix.classList.add('hidden');
        questionPrefix.classList.add('hidden');
        
        numberDisplay.textContent = "Get Ready...";
        numberDisplay.classList.remove('hidden');

        bufferTimer = setTimeout(flashNextNumber, 1500);
    }
}

function flashNextNumber() {
    if (currentQuestionIndex >= questionsPerTest) {
        finishFlashing(); return;
    }

    let minDig = parseInt(minDigitsInput.value);
    let maxDig = parseInt(maxDigitsInput.value);
    let minNum = minDig === 1 ? 1 : Math.pow(10, minDig - 1);
    let maxNum = Math.pow(10, maxDig) - 1;
    let isSubtraction = false;
    
    if (testTypeSelector.value === "flash-add-sub") {
        isSubtraction = (currentQuestionIndex > 0) && (Math.random() > 0.5);
        if (isSubtraction && currentSum < minNum) { isSubtraction = false; }
    }
    
    let displayString = "";
    let num;

    if (currentQuestionIndex === 0) {
        num = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
        currentSum += num; displayString = num.toString();
    } else {
        if (isSubtraction) {
            let actualMax = Math.min(currentSum, maxNum);
            num = Math.floor(Math.random() * (actualMax - minNum + 1)) + minNum;
            currentSum -= num; displayString = "- " + num;
        } else {
            num = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
            currentSum += num; displayString = "+ " + num;
        }
    }

    numberDisplay.textContent = displayString;

    flashHideTimer = setTimeout(() => {
        numberDisplay.textContent = ""; 
        currentQuestionIndex++;
        flashNextTimer = setTimeout(flashNextNumber, timeBlank);
    }, timeShow);
}

function finishFlashing() {
    numberDisplay.classList.add('hidden');
    answerArea.classList.remove('hidden');
    userAnswerInput.focus();
}

function checkAnswer() {
    if (userAnswerInput.value.trim() === '') return;
    let userAnswer = parseInt(userAnswerInput.value);

    // Reset visual feedback classes
    userAnswerInput.classList.remove('input-correct', 'input-wrong');

    if (testTypeSelector.value === 'multiplication') {
        // MULTIPLICATION BEHAVIOR
        if (userAnswer === currentSum) {
            userAnswerInput.classList.add('input-correct');
            correctTestsCount++; 
            
            // Tiny 150ms delay just to see the green, then instantly jump to next
            setTimeout(() => {
                userAnswerInput.classList.remove('input-correct');
                finalizeTestRound();
            }, 150);
        } else {
            userAnswerInput.classList.add('input-wrong');
            userAnswerInput.value = ''; // Empty out immediately
            failedTestsCount++; 
            updateProgressDisplay();
            // User is trapped here until they input the correct answer.
        }
    } else {
        // FLASH ADDITION/SUBTRACTION BEHAVIOR
        if (userAnswer === currentSum) {
            resultMessage.textContent = "Correct! ✅";
            resultMessage.style.color = "#10b981"; 
            correctTestsCount++; 
        } else {
            resultMessage.textContent = `Wrong! ❌ The correct answer was ${currentSum}.`;
            resultMessage.style.color = "#ef4444"; 
            failedTestsCount++; 
        }
        finalizeTestRound();
    }
}

function cancelCurrentTest() {
    clearTimeout(bufferTimer);
    clearTimeout(flashHideTimer);
    clearTimeout(flashNextTimer);

    answerArea.classList.add('hidden');
    numberDisplay.classList.remove('hidden');

    failedTestsCount++;
    resultMessage.textContent = "Test Canceled ❌";
    resultMessage.style.color = "#ef4444";

    finalizeTestRound();
}

function forceEndSession() {
    clearTimeout(bufferTimer); clearTimeout(flashHideTimer); clearTimeout(flashNextTimer);
    
    answerArea.classList.add('hidden');
    equationPrefix.classList.add('hidden');
    questionPrefix.classList.add('hidden');
    numberDisplay.classList.add('hidden');
    
    cancelBtn.classList.add('hidden');
    endSessionBtn.classList.add('hidden');
    nextTestBtn.classList.add('hidden');

    resultMessage.textContent = "Session Ended Early 🛑";
    resultMessage.style.color = "#ef4444";

    setTimeout(endPracticeSession, 1500);
}

function finalizeTestRound() {
    currentTestIndex++;
    updateProgressDisplay();
    cancelBtn.classList.add('hidden'); 

    if (testTypeSelector.value === 'multiplication') {
        // Instantly generate the next question
        if (currentTestIndex < totalTestsCount) {
            runSingleTest();
        } else {
            endPracticeSession();
        }
    } else {
        // Flash mode waits for you to review and click 'Next'
        answerArea.classList.add('hidden');
        if (currentTestIndex < totalTestsCount) {
            nextTestBtn.textContent = "Next Test";
        } else {
            nextTestBtn.textContent = "Finish Session";
        }
        nextTestBtn.classList.remove('hidden');
    }
}

function handleNextAction() {
    if (currentTestIndex < totalTestsCount) {
        runSingleTest();
    } else {
        endPracticeSession();
    }
}

function updateProgressDisplay() {
    testsCompletedDisplay.textContent = `${currentTestIndex} / ${totalTestsCount}`;
    testsCorrectDisplay.textContent = correctTestsCount;
    testsFailedDisplay.textContent = failedTestsCount;
}

function endPracticeSession() {
    numberDisplay.classList.remove('hidden');
    resultMessage.textContent = "";

    // Generate Dynamic Summary
    if (testTypeSelector.value === 'multiplication') {
        let timeSpent = Date.now() - sessionStartTime;
        let validTests = currentTestIndex > 0 ? currentTestIndex : 1; 
        let avgTime = (timeSpent / 1000) / validTests;
        
        numberDisplay.innerHTML = `Session Complete! 🎉<br><span style="font-size: 32px; color: var(--text-secondary); display: block; margin-top: 15px;">Avg. Time: ${avgTime.toFixed(2)}s / question</span>`;
    } else {
        numberDisplay.innerHTML = `Session Complete! 🎉<br><span style="font-size: 32px; color: var(--text-secondary); display: block; margin-top: 15px;">Correct: <span style="color: #10b981;">${correctTestsCount}</span> | Wrong: <span style="color: #ef4444;">${failedTestsCount}</span></span>`;
    }
    
    equationPrefix.classList.add('hidden');
    questionPrefix.classList.add('hidden');
    
    nextTestBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');
    endSessionBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    
    toggleSettingsInputs(false);

    totalTestsGroup.classList.remove('hidden');
    testProgressGroup.classList.add('hidden');
}

function toggleSettingsInputs(isDisabled) {
    const isMulti = (testTypeSelector.value === 'multiplication');
    
    numQuestionsInput.disabled = isDisabled || isMulti;
    showTimeInput.disabled = isDisabled || isMulti;
    blankTimeInput.disabled = isDisabled || isMulti;
    
    totalTestsInput.disabled = isDisabled;
    minDigitsInput.disabled = isDisabled;
    maxDigitsInput.disabled = isDisabled;
    testTypeSelector.disabled = isDisabled;
}