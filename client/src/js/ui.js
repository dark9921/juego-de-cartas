const enemyNameEl = document.getElementById("enemy-name");
const enemyHpEl = document.getElementById("enemy-hp");
const enemyElementEl = document.getElementById("enemy-element");
const playerHpEl = document.getElementById("player-hp");
const playerShieldEl = document.getElementById("player-shield");
const playerManaEl = document.getElementById("player-mana");
const playerElementEl = document.getElementById("player-element");
const playerHandEl = document.getElementById("player-hand");
const combatLogEl = document.getElementById("combat-log");

const playerBuffEl = document.getElementById("player-buff");
const deckCountEl = document.getElementById("deck-count");
const discardCountEl = document.getElementById("discard-count");

const btnStartFire = document.getElementById("btn-start-fire");
const btnStartWater = document.getElementById("btn-start-water");
const btnStartPlant = document.getElementById("btn-start-plant");
const btnEndTurn = document.getElementById("btn-end-turn");

let gameOver = true;

const TYPE_LABELS = {
    attack: "ATAQUE",
    spell: "HECHIZO",
    defense: "DEFENSA",
    heal: "CURACIÓN",
    mana: "MANÁ",
    buff: "POTENCIADOR"
};

const VALUE_LABELS = {
    attack: "Daño",
    spell: "Daño",
    defense: "Escudo",
    heal: "Curación",
    mana: "Maná",
    buff: "Bonus"
};

function getSpellHint(card) {
    if (card.type !== "spell" || !gameState.enemy.element) return "";
    const mod = getElementModifier(card.element, gameState.enemy.element);
    if (mod > 0) return `¡Fuerte! +${mod}`;
    if (mod < 0) return `Débil ${mod}`;
    return "";
}

function renderUI(message = "¡Elige tu mazo para comenzar!") {
    enemyNameEl.textContent = gameState.enemy.name || "Enemigo";
    enemyHpEl.textContent = `${gameState.enemy.hp} / ${gameState.enemy.maxHp}`;
    enemyElementEl.textContent = `Elemento: ${gameState.enemy.element || "-"}`;

    playerHpEl.textContent = `${gameState.player.hp} / ${gameState.player.maxHp}`;
    playerShieldEl.textContent = gameState.player.shield;
    playerManaEl.textContent = `${gameState.player.mana} / ${gameState.player.maxMana}`;
    playerElementEl.textContent = `Elemento: ${gameState.player.element}`;

    if (playerBuffEl) {
        playerBuffEl.textContent = gameState.buffNextAttack > 0
            ? `Bonus siguiente ataque: +${gameState.buffNextAttack}`
            : "";
    }
    if (deckCountEl) deckCountEl.textContent = `Mazo: ${gameState.deck.length}`;
    if (discardCountEl) discardCountEl.textContent = `Descarte: ${gameState.discardPile.length}`;

    combatLogEl.textContent = message;

    playerHandEl.innerHTML = "";
    gameState.hand.forEach((card, index) => {
        const cardDiv = document.createElement("div");
        const canAfford = gameState.player.mana >= card.cost;
        cardDiv.className = `card ${card.type}` + (canAfford ? "" : " disabled");

        const hint = getSpellHint(card);
        
        cardDiv.innerHTML = `
    <span class="card-cost">⚡ ${card.cost}</span>
    <h3>${card.name}</h3>
    <div class="card-img-container">
        ${card.image}
    </div>
    <p class="card-type">${TYPE_LABELS[card.type] || card.type.toUpperCase()} · ${card.element.toUpperCase()}</p>
    <p>${VALUE_LABELS[card.type] || "Valor"}: ${card.value}</p>
    ${hint ? `<p class="card-hint">${hint}</p>` : ""}
`;

        cardDiv.addEventListener("click", () => handlePlayCard(index));
        playerHandEl.appendChild(cardDiv);
    });
}

function handlePlayCard(index) {
    if (gameOver) return;

    const result = playCard(index);

    if (!result.ok) {
        renderUI(result.message);
        return;
    }

    if (result.status === "victoria") {
        finishGame(`${result.message}\n🎉 ¡VICTORIA! Has derrotado al enemigo.`, "victoria");
    } else {
        renderUI(`${result.message} Tu turno continúa.`);
    }
}

async function finishGame(message, resultType) {
    gameOver = true;
    btnEndTurn.disabled = true;

    const enemyName = gameState.enemy.name || "Enemigo desconocido";
    await saveMatchResult(resultType, enemyName);

    renderUI(message);
}

function handleStart(archetypeKey, label) {
    startCombat(archetypeKey);
    gameOver = false;
    btnEndTurn.disabled = false;
    renderUI(`Combate iniciado con Mazo de ${label} contra ${gameState.enemy.name}.`);
}

btnStartFire.addEventListener("click", () => handleStart("fuego", "Fuego"));
btnStartWater.addEventListener("click", () => handleStart("agua", "Agua"));
btnStartPlant.addEventListener("click", () => handleStart("planta", "Planta"));

btnEndTurn.addEventListener("click", () => {
    if (gameOver) return;

    btnEndTurn.disabled = true;
    const result = endPlayerTurn();

    if (result.status === "derrota") {
        finishGame(`${result.message}\n💀 DERROTA... Te has quedado sin vida.`, "derrota");
    } else if (result.status === "victoria") {
        finishGame(`${result.message}\n🎉 ¡VICTORIA!`, "victoria");
    } else {
        renderUI(`${result.message}\nEs tu turno.`);
        setTimeout(() => {
            if (!gameOver) btnEndTurn.disabled = false;
        }, 500);
    }
});

renderUI()