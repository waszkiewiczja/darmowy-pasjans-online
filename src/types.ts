export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Color = "red" | "black";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
  id: string;
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: Card[][]; // 4 piles
  tableau: Card[][]; // 7 piles
  moves: number;
  won: boolean;
}

export interface DragItem {
  cards: Card[];
  sourceType: "waste" | "tableau" | "foundation";
  sourceIndex: number;
  cardIndex: number;
}
