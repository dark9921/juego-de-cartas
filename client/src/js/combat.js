// ============================================================
//  ESTADO GLOBAL
// ============================================================
const MAX_HAND = 6;          // máximo de cartas en mano
const MAX_MANA = 5;
const DECK_SIZE = 24;
const MAX_COPIES = 3;
const ELEMENT_BONUS = 4;
const START_HAND = 4;        // cartas al empezar el combate
const CARDS_PER_TURN = 2;    // cartas que se roban al terminar turno
const START_MANA = 3;

const gameState = {
    player: {
        maxHp: 60,
        hp: 60,
        shield: 0,
        mana: START_MANA,
        maxMana: MAX_MANA,
        element: "fuego"
    },
    enemy: {
        name: "",
        maxHp: 50,
        hp: 50,
        shield: 0,
        element: "agua",
        attackPower: 8,   // ataque normal (neutro)
        spellPower: 5     // hechizo elemental (con modificador)
    },
    deck: [],
    hand: [],
    discardPile: [],
    buffNextAttack: 0,
    nextCardId: 1
};

// ============================================================
//  GENERADOR DE ICONOS PIXEL ART (SVG PURO)
// ============================================================
function generatePixelIcon(type, color = "#ffffff") {
    let body = '';

    switch (type) {
        case 'attack':
            body = `<rect x="7" y="2" width="2" height="10" fill="${color}"/><rect x="5" y="11" width="6" height="2" fill="${color}"/><rect x="7" y="13" width="2" height="2" fill="#888888"/>`;
            break;
        case 'spell':
            body = `<rect x="7" y="2" width="2" height="4" fill="${color}"/><rect x="5" y="5" width="6" height="2" fill="${color}"/><rect x="7" y="7" width="2" height="4" fill="${color}"/><rect x="5" y="10" width="6" height="2" fill="${color}"/><rect x="7" y="12" width="2" height="2" fill="${color}"/>`;
            break;
        case 'defense':
            body = `<rect x="3" y="3" width="10" height="2" fill="${color}"/><rect x="3" y="5" width="10" height="6" fill="${color}"/><rect x="5" y="11" width="6" height="2" fill="${color}"/><rect x="7" y="13" width="2" height="1" fill="${color}"/>`;
            break;
        case 'heal':
            body = `<rect x="4" y="4" width="3" height="3" fill="${color}"/><rect x="9" y="4" width="3" height="3" fill="${color}"/><rect x="3" y="6" width="10" height="4" fill="${color}"/><rect x="4" y="10" width="8" height="2" fill="${color}"/><rect x="6" y="12" width="4" height="2" fill="${color}"/>`;
            break;
        case 'mana':
            body = `<rect x="6" y="3" width="4" height="2" fill="${color}"/><rect x="4" y="5" width="8" height="6" fill="${color}"/><rect x="6" y="11" width="4" height="2" fill="${color}"/>`;
            break;
        case 'buff':
            body = `<rect x="6" y="2" width="4" height="6" fill="${color}"/><rect x="3" y="8" width="10" height="2" fill="${color}"/><rect x="5" y="10" width="6" height="2" fill="${color}"/><rect x="7" y="12" width="2" height="2" fill="${color}"/>`;
            break;
        default:
            body = `<rect x="7" y="7" width="2" height="2" fill="${color}"/>`;
    }

    // Devuelve la etiqueta SVG completa lista para renderizar en HTML
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="32" height="32" style="image-rendering: pixelated;">${body}</svg>`;
}

// ============================================================
//  ELEMENTOS
// ============================================================
const ELEMENT_BEATS = {
    fuego: "planta",
    planta: "agua",
    agua: "fuego"
};

function getElementModifier(attackerElement, defenderElement) {
    if (ELEMENT_BEATS[attackerElement] === defenderElement) return ELEMENT_BONUS;
    if (ELEMENT_BEATS[defenderElement] === attackerElement) return -ELEMENT_BONUS;
    return 0;
}

function calculateSpellDamage(baseValue, attackerElement, defenderElement) {
    const total = baseValue + getElementModifier(attackerElement, defenderElement);
    return total < 0 ? 0 : total;
}

// ============================================================
//  PRESETS DE MAZOS
// ============================================================
function commonCards() {
    return [
        { name: "Subida de Maná", type: "mana", value: 2, cost: 0, element: "neutro", image: generatePixelIcon('mana', '#2980b9') },
        { name: "Poción Sanadora", type: "heal", value: 3, cost: 0, element: "neutro", image: generatePixelIcon('heal', '#27ae60') },
        { name: "Poción de Fuerza", type: "buff", value: 4, cost: 0, element: "neutro", image: generatePixelIcon('buff', '#d4a017') }
    ];
}

const deckPresets = {
    fuego: {
        element: "fuego",
        cards: [
            { name: "Tajo Ardiente", type: "attack", value: 6, cost: 1, element: "neutro", image: generatePixelIcon('attack', '#c0392b') },
            { name: "Espada Pesada", type: "attack", value: 10, cost: 2, element: "neutro", image: generatePixelIcon('attack', '#c0392b') },
            { name: "Chispa", type: "spell", value: 5, cost: 1, element: "fuego", image: generatePixelIcon('spell', '#8e44ad') },
            { name: "Bola de Fuego", type: "spell", value: 9, cost: 2, element: "fuego", image: generatePixelIcon('spell', '#8e44ad') },
            { name: "Escudo Térmico", type: "defense", value: 6, cost: 1, element: "fuego", image: generatePixelIcon('defense', '#5d6d7e') },
            ...commonCards()
        ]
    },
    agua: {
        element: "agua",
        cards: [
            { name: "Golpe de Remo", type: "attack", value: 6, cost: 1, element: "neutro", image: generatePixelIcon('attack', '#c0392b') },
            { name: "Lanza de Coral", type: "attack", value: 10, cost: 2, element: "neutro", image: generatePixelIcon('attack', '#c0392b') },
            { name: "Chorro de Agua", type: "spell", value: 5, cost: 1, element: "agua", image: generatePixelIcon('spell', '#8e44ad') },
            { name: "Marea Furiosa", type: "spell", value: 9, cost: 2, element: "agua", image: generatePixelIcon('spell', '#8e44ad') },
            { name: "Escudo de Hielo", type: "defense", value: 7, cost: 1, element: "agua", image: generatePixelIcon('defense', '#5d6d7e') },
            ...commonCards()
        ]
    },
    planta: {
        element: "planta",
        cards: [
            { name: "Golpe de Raíz", type: "attack", value: 6, cost: 1, element: "neutro", image: generatePixelIcon('attack', '#c0392b') },
            { name: "Hacha de Roble", type: "attack", value: 10, cost: 2, element: "neutro", image: generatePixelIcon('attack', '#c0392b') },
            { name: "Látigo Liana", type: "spell", value: 5, cost: 1, element: "planta", image: generatePixelIcon('spell', '#8e44ad') },
            { name: "Tormenta de Hojas", type: "spell", value: 9, cost: 2, element: "planta", image: generatePixelIcon('spell', '#8e44ad') },
            { name: "Barrera de Espinas", type: "defense", value: 8, cost: 1, element: "planta", image: generatePixelIcon('defense', '#5d6d7e') },
            ...commonCards()
        ]
    }
};

const enemiesList = [
    { name: "Limo Acuático", maxHp: 40, element: "agua", attackPower: 5, spellPower: 4 },
    { name: "Treant Salvaje", maxHp: 65, element: "planta", attackPower: 4, spellPower: 4 },
    { name: "Diablillo de Magma", maxHp: 50, element: "fuego", attackPower: 6, spellPower: 5 }
];

// ============================================================
//  CONSTRUCCIÓN Y BARAJADO DEL MAZO
// ============================================================
function createCardId() {
    const id = "c" + gameState.nextCardId;
    gameState.nextCardId += 1;
    return id;
}

function buildDeck(archetypeKey) {
    const preset = deckPresets[archetypeKey] || deckPresets.fuego;
    gameState.player.element = preset.element;

    const newDeck = [];
    let cardIndex = 0;

    while (cardIndex < preset.cards.length && newDeck.length < DECK_SIZE) {
        const template = preset.cards[cardIndex];
        let copies = 0;

        while (copies < MAX_COPIES && newDeck.length < DECK_SIZE) {
            newDeck.push({ ...template, uniqueId: createCardId() });
            copies++;
        }
        cardIndex++;
    }

    gameState.deck = newDeck;
}

function shuffleDeck() {
    let i = gameState.deck.length - 1;
    while (i > 0) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = gameState.deck[i];
        gameState.deck[i] = gameState.deck[j];
        gameState.deck[j] = temp;
        i--;
    }
}

// ============================================================
//  INICIO DE COMBATE Y TURNOS
// ============================================================
function startCombat(archetypeKey = "fuego") {
    buildDeck(archetypeKey);
    shuffleDeck();

    const randomEnemy = enemiesList[Math.floor(Math.random() * enemiesList.length)];
    gameState.enemy.name = randomEnemy.name;
    gameState.enemy.maxHp = randomEnemy.maxHp;
    gameState.enemy.hp = randomEnemy.maxHp;
    gameState.enemy.shield = 0;
    gameState.enemy.element = randomEnemy.element;
    gameState.enemy.attackPower = randomEnemy.attackPower;
    gameState.enemy.spellPower = randomEnemy.spellPower;

    gameState.player.hp = gameState.player.maxHp;
    gameState.player.shield = 0;
    gameState.player.mana = START_MANA;
    gameState.hand = [];
    gameState.discardPile = [];
    gameState.buffNextAttack = 0;

    startPlayerTurn(true);
}

function startPlayerTurn(isFirstTurn = false) {
    if (!isFirstTurn && gameState.player.mana < gameState.player.maxMana) {
        gameState.player.mana += 1;
    }
    gameState.player.shield = 0;

    if (isFirstTurn) {
        drawCards(START_HAND);
    } else {
        drawCards(CARDS_PER_TURN);
    }
}

function drawCards(amount) {
    for (let i = 0; i < amount; i++) {
        if (gameState.hand.length >= MAX_HAND) return;

        if (gameState.deck.length === 0) {
            if (gameState.discardPile.length === 0) return;
            gameState.deck = [...gameState.discardPile];
            gameState.discardPile = [];
            shuffleDeck();
        }

        gameState.hand.push(gameState.deck.pop());
    }
}

// ============================================================
//  JUGAR CARTAS
// ============================================================
function playCard(indexInHand) {
    const card = gameState.hand[indexInHand];
    if (!card) {
        return { ok: false, message: "Carta no válida.", status: "continua" };
    }

    if (gameState.player.mana < card.cost) {
        return { ok: false, message: "No tienes suficiente maná.", status: "continua" };
    }

    gameState.player.mana -= card.cost;
    let message = "";

    if (card.type === "attack") {
        const dmg = card.value + gameState.buffNextAttack;
        gameState.buffNextAttack = 0;
        gameState.enemy.hp -= dmg;
        message = card.name + " inflige " + dmg + " de daño.";

    } else if (card.type === "spell") {
        const base = card.value + gameState.buffNextAttack;
        gameState.buffNextAttack = 0;
        const mod = getElementModifier(card.element, gameState.enemy.element);
        const dmg = calculateSpellDamage(base, card.element, gameState.enemy.element);
        gameState.enemy.hp -= dmg;

        let extra = "";
        if (mod > 0) extra = " (¡fuerte! +" + mod + ")";
        if (mod < 0) extra = " (débil, " + mod + ")";
        message = card.name + " inflige " + dmg + " de daño" + extra + ".";

    } else if (card.type === "defense") {
        gameState.player.shield += card.value;
        message = card.name + " te da " + card.value + " de escudo.";

    } else if (card.type === "heal") {
        gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + card.value);
        message = card.name + " cura " + card.value + " PV.";

    } else if (card.type === "mana") {
        gameState.player.mana = Math.min(gameState.player.maxMana, gameState.player.mana + card.value);
        message = card.name + " te da " + card.value + " de maná.";

    } else if (card.type === "buff") {
        gameState.buffNextAttack += card.value;
        message = card.name + ": +" + card.value + " al siguiente ataque o hechizo.";
    }

    if (gameState.enemy.hp < 0) gameState.enemy.hp = 0;

    gameState.hand.splice(indexInHand, 1);
    gameState.discardPile.push(card);

    const status = gameState.enemy.hp <= 0 ? "victoria" : "continua";
    return { ok: true, message: message, status: status };
}

// ============================================================
//  FIN DE TURNO
// ============================================================
function endPlayerTurn() {
    if (gameState.enemy.hp <= 0) {
        return { status: "victoria", message: "El enemigo ya está derrotado." };
    }

    const normalDmg = gameState.enemy.attackPower;
    const mod = getElementModifier(gameState.enemy.element, gameState.player.element);
    const spellDmg = calculateSpellDamage(
        gameState.enemy.spellPower,
        gameState.enemy.element,
        gameState.player.element
    );

    const totalDmg = normalDmg + spellDmg;
    let netDmg = totalDmg - gameState.player.shield;
    if (netDmg < 0) netDmg = 0;

    gameState.player.hp -= netDmg;
    if (gameState.player.hp < 0) gameState.player.hp = 0;

    let extra = "";
    if (mod > 0) extra = " (hechizo fuerte +" + mod + ")";
    if (mod < 0) extra = " (hechizo débil " + mod + ")";
    const message = gameState.enemy.name + " ataca: " + normalDmg + " normal + " + spellDmg +
        " de hechizo" + extra + ". Recibes " + netDmg + " tras el escudo.";

    if (gameState.player.hp <= 0) {
        return { status: "derrota", message: message };
    }

    startPlayerTurn(false);
    return { status: "continua", message: message };
}