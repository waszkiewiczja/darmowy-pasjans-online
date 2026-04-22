import type { Card, Suit, Rank, Color, GameState } from "./types";

const SUITS: Suit[] = ["hearts", "diamonds", "clubs", "spades"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

export function getColor(suit: Suit): Color {
  return suit === "hearts" || suit === "diamonds" ? "red" : "black";
}

export function getRankValue(rank: Rank): number {
  const idx = RANKS.indexOf(rank);
  return idx + 1;
}

export function getSuitSymbol(suit: Suit): string {
  const symbols: Record<Suit, string> = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };
  return symbols[suit];
}

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: false, id: `${rank}-${suit}` });
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createGame(): GameState {
  const deck = shuffle(createDeck());
  const tableau: Card[][] = [];
  let idx = 0;

  for (let col = 0; col < 7; col++) {
    const pile: Card[] = [];
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx] };
      card.faceUp = row === col;
      pile.push(card);
      idx++;
    }
    tableau.push(pile);
  }

  const stock = deck.slice(idx).map((c) => ({ ...c, faceUp: false }));

  return {
    stock,
    waste: [],
    foundations: [[], [], [], []],
    tableau,
    moves: 0,
    won: false,
  };
}

export function canPlaceOnTableau(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) {
    return card.rank === "K";
  }
  const topCard = pile[pile.length - 1];
  if (!topCard.faceUp) return false;
  const diffColor = getColor(card.suit) !== getColor(topCard.suit);
  const oneBelow = getRankValue(topCard.rank) - getRankValue(card.rank) === 1;
  return diffColor && oneBelow;
}

export function canPlaceOnFoundation(card: Card, pile: Card[]): boolean {
  if (pile.length === 0) {
    return card.rank === "A";
  }
  const topCard = pile[pile.length - 1];
  return (
    card.suit === topCard.suit &&
    getRankValue(card.rank) - getRankValue(topCard.rank) === 1
  );
}

export function drawFromStock(state: GameState): GameState {
  const newState = cloneState(state);
  if (newState.stock.length === 0) {
    // Reset: move waste back to stock
    newState.stock = newState.waste
      .reverse()
      .map((c) => ({ ...c, faceUp: false }));
    newState.waste = [];
  } else {
    const card = newState.stock.pop()!;
    card.faceUp = true;
    newState.waste.push(card);
  }
  newState.moves++;
  return newState;
}

export function moveWasteToFoundation(
  state: GameState,
  foundationIdx: number,
): GameState | null {
  if (state.waste.length === 0) return null;
  const card = state.waste[state.waste.length - 1];
  if (!canPlaceOnFoundation(card, state.foundations[foundationIdx]))
    return null;

  const newState = cloneState(state);
  const moved = newState.waste.pop()!;
  newState.foundations[foundationIdx].push(moved);
  newState.moves++;
  newState.won = checkWin(newState);
  return newState;
}

export function moveWasteToTableau(
  state: GameState,
  tableauIdx: number,
): GameState | null {
  if (state.waste.length === 0) return null;
  const card = state.waste[state.waste.length - 1];
  if (!canPlaceOnTableau(card, state.tableau[tableauIdx])) return null;

  const newState = cloneState(state);
  const moved = newState.waste.pop()!;
  newState.tableau[tableauIdx].push(moved);
  newState.moves++;
  return newState;
}

export function moveTableauToFoundation(
  state: GameState,
  tableauIdx: number,
  foundationIdx: number,
): GameState | null {
  const pile = state.tableau[tableauIdx];
  if (pile.length === 0) return null;
  const card = pile[pile.length - 1];
  if (!card.faceUp) return null;
  if (!canPlaceOnFoundation(card, state.foundations[foundationIdx]))
    return null;

  const newState = cloneState(state);
  const moved = newState.tableau[tableauIdx].pop()!;
  newState.foundations[foundationIdx].push(moved);
  flipTopCard(newState.tableau[tableauIdx]);
  newState.moves++;
  newState.won = checkWin(newState);
  return newState;
}

export function moveTableauToTableau(
  state: GameState,
  fromIdx: number,
  cardIdx: number,
  toIdx: number,
): GameState | null {
  const fromPile = state.tableau[fromIdx];
  if (fromPile.length === 0 || cardIdx < 0 || cardIdx >= fromPile.length)
    return null;
  const card = fromPile[cardIdx];
  if (!card.faceUp) return null;
  if (!canPlaceOnTableau(card, state.tableau[toIdx])) return null;

  const newState = cloneState(state);
  const cardsToMove = newState.tableau[fromIdx].splice(cardIdx);
  newState.tableau[toIdx].push(...cardsToMove);
  flipTopCard(newState.tableau[fromIdx]);
  newState.moves++;
  return newState;
}

export function moveFoundationToTableau(
  state: GameState,
  foundationIdx: number,
  tableauIdx: number,
): GameState | null {
  const pile = state.foundations[foundationIdx];
  if (pile.length === 0) return null;
  const card = pile[pile.length - 1];
  if (!canPlaceOnTableau(card, state.tableau[tableauIdx])) return null;

  const newState = cloneState(state);
  const moved = newState.foundations[foundationIdx].pop()!;
  newState.tableau[tableauIdx].push(moved);
  newState.moves++;
  return newState;
}

export function autoMoveToFoundation(state: GameState): GameState | null {
  // Try waste
  for (let f = 0; f < 4; f++) {
    const result = moveWasteToFoundation(state, f);
    if (result) return result;
  }
  // Try tableau
  for (let t = 0; t < 7; t++) {
    for (let f = 0; f < 4; f++) {
      const result = moveTableauToFoundation(state, t, f);
      if (result) return result;
    }
  }
  return null;
}

function flipTopCard(pile: Card[]) {
  if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
    pile[pile.length - 1].faceUp = true;
  }
}

function checkWin(state: GameState): boolean {
  return state.foundations.every((f) => f.length === 13);
}

function cloneState(state: GameState): GameState {
  return {
    stock: state.stock.map((c) => ({ ...c })),
    waste: state.waste.map((c) => ({ ...c })),
    foundations: state.foundations.map((f) => f.map((c) => ({ ...c }))),
    tableau: state.tableau.map((t) => t.map((c) => ({ ...c }))),
    moves: state.moves,
    won: state.won,
  };
}
