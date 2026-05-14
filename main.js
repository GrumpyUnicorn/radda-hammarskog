/**
 * GameState: Manages the global state of the game
 */
class GameState {
    constructor() {
        this.currentScreen = 1;
        this.selectedCharacter = null; // 'A', 'B', or 'C'
        this.modifiers = 0;
        this.diceResult = 0;
        this.isSuccess = false;
        this.isExtraSuccess = false;
    }

    reset() {
        this.currentScreen = 1;
        this.selectedCharacter = null;
        this.modifiers = 0;
        this.diceResult = 0;
        this.isSuccess = false;
        this.isExtraSuccess = false;
    }
}

/**
 * GameLogic: Handles pure logic operations (dice rolling, evaluations)
 */
const GameLogic = {
    rollDice: () => {
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        return d1 + d2;
    },
    
    evaluateResult: (state, target, stretchTarget = null) => {
        const total = state.diceResult + state.modifiers;
        state.isSuccess = total >= target;
        state.isExtraSuccess = stretchTarget !== null ? total >= stretchTarget : false;
        return state;
    }
};

/**
 * UIController: Handles all DOM manipulation and event listeners
 */
class UIController {
    constructor(state) {
        this.state = state;
        this.characterData = {
            'A': {
                task: "Tillsammans med Skandal-Tobbe väljer du att försöka driva kafé och restaurang i kommunal regi utan vinstintressen. Huset i Hammarskog förblir i kommunens ägo eftersom det är viktigt att politiker har stor kontroll.",
                target: 12,
                stretch: null,
                hasModifiers: true
            },
            'B': {
                task: "Tillsammans med Betong-Jerka väljer du att försöka hyra ut huset i Hammarskog till ett företag som kan få driva kafé där. Det fungerade inte på Skarholmen, men skam den som ger sig.",
                target: 10,
                stretch: null,
                hasModifiers: false
            },
            'C': {
                task: "Tillsammans med Frihets-Tessan väljer vi att låta entreprenörer som kan besöksverksamhet och restaurang ta över huset i Hammarskog. Vi tror inte att kommunen ska driva kaféer och restauranger. Dels för att de inte ska använda skattepengar för att konkurrera med privata initiativ och dels för att de inte gör det bra.",
                target: 5,
                stretch: 8,
                hasModifiers: false
            }
        };
        this.isRolling = false;
        this.cacheDOM();
        this.bindEvents();
    }

    cacheDOM() {
        // Screens
        this.screens = {
            1: document.getElementById('screen-1'),
            2: document.getElementById('screen-2'),
            3: document.getElementById('screen-3'),
            4: document.getElementById('screen-4')
        };
        
        // Screen 1 & 2 Elements
        this.btnStart = document.getElementById('btn-start');
        this.cards = document.querySelectorAll('.card');
        this.btnNextScreen3 = document.getElementById('btn-next-screen-3');

        // Screen 3 Elements
        this.taskTitle = document.getElementById('task-title');
        this.taskDesc = document.getElementById('task-desc');
        this.targetNumber = document.getElementById('target-number');
        this.modifiersContainer = document.getElementById('modifiers-container');
        this.modCheckboxes = document.querySelectorAll('.modifier-checkbox input');
        
        this.btnRoll = document.getElementById('btn-roll');
        this.diceDisplay = document.getElementById('dice-display');
        this.die1 = document.querySelector('#die-1 .die-val');
        this.die2 = document.querySelector('#die-2 .die-val');
        this.diceCalc = document.getElementById('dice-calc');
        this.diceArea = document.querySelector('.dice-display'); // Using dice-display as the area now
        
        this.rerollContainer = document.getElementById('reroll-container');
        this.btnReroll = document.getElementById('btn-reroll');
        this.btnNextScreen4 = document.getElementById('btn-next-screen-4');

        // Screen 4 Elements
        this.outcomeText = document.getElementById('outcome-text');
        this.btnReload = document.getElementById('btn-reload');
    }

    bindEvents() {
        // Screen 1 -> 2
        this.btnStart.addEventListener('click', () => this.transitionToScreen(2));

        // Screen 2 Character Selection
        this.cards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Remove selected class from all
                this.cards.forEach(c => c.classList.remove('selected'));
                // Add selected class to clicked
                const targetCard = e.currentTarget;
                targetCard.classList.add('selected');
                
                // Update state
                this.state.selectedCharacter = targetCard.dataset.char;
                
                // Enable Next button
                this.btnNextScreen3.classList.remove('disabled');
                this.btnNextScreen3.disabled = false;
            });
        });

        // Screen 2 -> 3
        this.btnNextScreen3.addEventListener('click', () => {
            this.applyTheme(this.state.selectedCharacter);
            this.setupScreen3();
            this.transitionToScreen(3);
        });

        // Screen 3 Modifiers
        this.modCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.calculateModifiers());
        });

        // Screen 3 Roll Dice
        this.btnRoll.addEventListener('click', () => this.handleDiceRoll());
        this.btnReroll.addEventListener('click', () => this.handleDiceRoll());

        // Screen 3 -> 4
        this.btnNextScreen4.addEventListener('click', () => {
            this.setupScreen4();
            this.transitionToScreen(4);
        });

        // Screen 4 Reload
        this.btnReload.addEventListener('click', () => window.location.reload());
    }

    transitionToScreen(screenNumber) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('visible');
            screen.classList.add('hidden');
        });
        
        // Show target screen
        this.screens[screenNumber].classList.remove('hidden');
        this.screens[screenNumber].classList.add('visible');
        this.state.currentScreen = screenNumber;
    }

    applyTheme(char) {
        document.body.setAttribute('data-theme', char);
    }

    setupScreen3() {
        const charData = this.characterData[this.state.selectedCharacter];
        
        this.taskDesc.textContent = charData.task;
        this.targetNumber.textContent = charData.target;
        
        if (charData.hasModifiers) {
            this.modifiersContainer.classList.remove('hidden');
        } else {
            this.modifiersContainer.classList.add('hidden');
        }

        // Reset UI for replayability if needed
        this.diceArea.classList.remove('outcome-success', 'outcome-fail', 'extra-success');
        this.diceDisplay.classList.add('hidden');
        this.btnRoll.classList.remove('hidden');
        this.btnNextScreen4.classList.add('hidden');
        this.rerollContainer.classList.add('hidden');
        
        // Reset checkboxes
        this.modCheckboxes.forEach(cb => cb.checked = false);
        this.calculateModifiers();
    }

    calculateModifiers() {
        let total = 0;
        this.modCheckboxes.forEach(cb => {
            if (cb.checked) {
                total += parseInt(cb.value);
            }
        });
        this.state.modifiers = total;
    }

    handleDiceRoll() {
        if (this.isRolling) return;
        this.isRolling = true;
        
        this.btnRoll.classList.add('hidden');
        this.rerollContainer.classList.add('hidden');
        this.diceDisplay.classList.remove('hidden');
        this.diceDisplay.classList.add('rolling');
        this.diceDisplay.classList.remove('outcome-success', 'outcome-fail', 'extra-success');
        this.btnNextScreen4.classList.add('hidden');

        // Animation
        let ticks = 0;
        const maxTicks = 20; // Approx 1 second at 50ms interval
        const interval = setInterval(() => {
            if(this.die1) this.die1.textContent = Math.floor(Math.random() * 6) + 1;
            if(this.die2) this.die2.textContent = Math.floor(Math.random() * 6) + 1;
            ticks++;
            if (ticks >= maxTicks) {
                clearInterval(interval);
                this.finalizeDiceRoll();
            }
        }, 50);
    }

    finalizeDiceRoll() {
        this.isRolling = false;
        this.diceDisplay.classList.remove('rolling');
        
        // Get Roll
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const roll = d1 + d2;
        this.state.diceResult = roll;
        const charData = this.characterData[this.state.selectedCharacter];
        
        // Evaluate
        GameLogic.evaluateResult(this.state, charData.target, charData.stretch);
        
        const total = roll + this.state.modifiers;
        
        // Update UI
        if(this.die1) this.die1.textContent = d1;
        if(this.die2) this.die2.textContent = d2;
        
        let calcText = `Tärningar: ${d1} + ${d2} = ${roll}`;
        if (this.state.modifiers > 0) calcText += ` | + Bonus: ${this.state.modifiers}`;
        calcText += ` | Totalt: ${total} (Mål: ${charData.target})`;
        this.diceCalc.textContent = calcText;

        // Visual Feedback
        if (this.state.isSuccess) {
            this.diceDisplay.classList.add('outcome-success');
            if (this.state.isExtraSuccess) {
                this.diceDisplay.classList.add('extra-success');
            }
        } else {
            this.diceDisplay.classList.add('outcome-fail');
        }

        // Logic for next steps
        if (this.state.selectedCharacter === 'C' && !this.state.isSuccess) {
            // Infinite Reroll Mechanic for C
            this.rerollContainer.classList.remove('hidden');
        } else {
            this.btnNextScreen4.classList.remove('hidden');
        }
    }

    setupScreen4() {
        const char = this.state.selectedCharacter;
        const success = this.state.isSuccess;
        const extraSuccess = this.state.isExtraSuccess;
        let text = "";

        if (char === 'A' && !success) {
            text = "Ingen kommer längre till Hammarskog. Det är oftast stängt. Ibland serveras billigt, men bränt kaffe medan personalen tittar på sina telefoner.";
        } else if (char === 'B' && !success) {
            text = "Likt på Skarholmen så gör resturangfamiljen sitt bästa, men kommunen låter bygganden förfalla och tillslut funkar det inte längre.";
        } else if ((char === 'A' || char === 'B') && success) {
            text = "Hammarskog är öppet dagtid i veckorna och vissa lördagar 10-14. Det kommer lite folk ibland och det hela rullar på. Ibland får kommunpampar låna stället för privata fester.";
        } else if (char === 'C' && success && !extraSuccess) {
            text = "Hammarskog är öppet på helger och ibland i veckorna. Det hela rullar på.";
        } else if (char === 'C' && extraSuccess) {
            text = "Hammarskog blomstrar. Lokal mat serveras i samarbete med närliggande gårdar. Guideböcker och influencers rekommenderar en resa. Övernattningsmöjligheter planeras. Vandringspaket med smörgåsar och frukt säljs till vandrare. Kaffet är jättegott.";
        } else if (char === 'C' && !success) {
            // Fallback (shouldn't happen since C is forced to reroll until success, but just in case)
            text = "Entreprenören misslyckades. Ladda om för att försöka igen.";
        }

        this.outcomeText.textContent = text;
    }
}

/**
 * App Initialization
 */
class App {
    static init() {
        const state = new GameState();
        new UIController(state);
    }
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
