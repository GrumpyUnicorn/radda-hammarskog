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
        // Universal targets for all characters
        this.TARGET_OK = 10;
        this.TARGET_BLOMSTRANDE = 13;

        this.characterData = {
            'A': {
                task: "Tillsammans med Skandal-Tobbe väljer du att försöka driva kafé och restaurang i kommunal regi utan vinstintressen. Huset i Hammarskog förblir i kommunens ägo eftersom det är viktigt att politiker har stor kontroll.",
                bonusName: "Planekonomi",
                bonus: -2
            },
            'B': {
                task: "Tillsammans med Betong-Jerka väljer du att försöka hyra ut huset i Hammarskog till ett företag som kan få driva kafé där. Det fungerade inte på Skarholmen, men skam den som ger sig.",
                bonusName: "Blandekonomi",
                bonus: 0
            },
            'C': {
                task: "Tillsammans med Frihets-Tessan väljer vi att låta entreprenörer som kan besöksverksamhet och restaurang ta över huset i Hammarskog. Vi tror inte att kommunen ska driva kaféer och restauranger. Dels för att de inte ska använda skattepengar för att konkurrera med privata initiativ och dels för att de inte gör det bra.",
                bonusName: "Marknadsekonomi",
                bonus: 5
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
        this.charBonusName = document.getElementById('char-bonus-name');
        this.charBonusValue = document.getElementById('char-bonus-value');
        
        this.btnRoll = document.getElementById('btn-roll');
        this.diceDisplay = document.getElementById('dice-display');
        this.die1 = document.querySelector('#die-1 .die-val');
        this.die2 = document.querySelector('#die-2 .die-val');
        this.diceCalc = document.getElementById('dice-calc');
        
        this.rerollContainer = document.getElementById('reroll-container');
        this.btnReroll = document.getElementById('btn-reroll');
        this.btnNextScreen4 = document.getElementById('btn-next-screen-4');

        // Screen 4 Elements
        this.outcomeText = document.getElementById('outcome-text');
        this.btnReload = document.getElementById('btn-reload');
        this.scoreMarker = document.getElementById('score-marker');
        this.markerValue = document.getElementById('marker-value');
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

        // (Modifiers are now automatic per character, no checkboxes needed)

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
        
        // Set character bonus display
        this.charBonusName.textContent = charData.bonusName;
        const bonusPrefix = charData.bonus > 0 ? '+' : '';
        this.charBonusValue.textContent = `${bonusPrefix}${charData.bonus}`;
        
        // Set the modifier in state
        this.state.modifiers = charData.bonus;

        // Reset UI for replayability if needed
        this.diceDisplay.classList.remove('outcome-success', 'outcome-fail', 'extra-success');
        this.diceDisplay.classList.add('hidden');
        this.btnRoll.classList.remove('hidden');
        this.btnNextScreen4.classList.add('hidden');
        this.rerollContainer.classList.add('hidden');
    }

    // Modifiers are now set automatically in setupScreen3()

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
        
        // Evaluate against universal targets
        const total = roll + this.state.modifiers;
        this.state.isSuccess = total >= this.TARGET_OK;
        this.state.isExtraSuccess = total >= this.TARGET_BLOMSTRANDE;
        
        // Update UI
        if(this.die1) this.die1.textContent = d1;
        if(this.die2) this.die2.textContent = d2;
        
        const bonusPrefix = this.state.modifiers >= 0 ? '+' : '';
        let calcText = `Tärningar: ${d1} + ${d2} = ${roll}`;
        calcText += ` | ${charData.bonusName}: ${bonusPrefix}${this.state.modifiers}`;
        calcText += ` | Totalt: ${total}`;
        this.diceCalc.textContent = calcText;

        // Visual Feedback
        if (this.state.isExtraSuccess) {
            this.diceDisplay.classList.add('outcome-success', 'extra-success');
        } else if (this.state.isSuccess) {
            this.diceDisplay.classList.add('outcome-success');
        } else {
            this.diceDisplay.classList.add('outcome-fail');
        }

        // Logic for next steps — always proceed to outcome
        this.btnNextScreen4.classList.remove('hidden');
    }

    setupScreen4() {
        const char = this.state.selectedCharacter;
        const success = this.state.isSuccess;
        const extraSuccess = this.state.isExtraSuccess;
        const total = this.state.diceResult + this.state.modifiers;
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

        // Position the score marker on the scale
        // Clamp total to 0-17 range, then convert to percentage
        const clampedTotal = Math.max(0, Math.min(17, total));
        const percentage = (clampedTotal / 17) * 100;
        this.markerValue.textContent = total;

        // Reset marker to 0 first, then animate to position
        this.scoreMarker.style.transition = 'none';
        this.scoreMarker.style.left = '0%';
        // Force reflow to reset animation
        this.scoreMarker.offsetHeight;
        this.scoreMarker.style.transition = 'left 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
        setTimeout(() => {
            this.scoreMarker.style.left = percentage + '%';
        }, 200);
    }
}

/**
 * App Initialization
 */
class App {
    static init() {
        App.checkMobile();
        const state = new GameState();
        new UIController(state);
    }

    static checkMobile() {
        const isMobile = window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent);
        if (isMobile) {
            document.body.classList.add('mobile-device');
            console.log("Mobile device detected. Applying responsive layouts.");
        }
    }
}

// Boot up
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
