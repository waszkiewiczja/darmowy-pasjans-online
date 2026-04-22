import { useState, useCallback } from "react";
import type { GameState, DragItem } from "./types";
import SeoArticle from "./SeoArticle";
import {
  createGame,
  drawFromStock,
  moveWasteToFoundation,
  moveWasteToTableau,
  moveTableauToFoundation,
  moveTableauToTableau,
  moveFoundationToTableau,
  autoMoveToFoundation,
} from "./gameLogic";
import { CardView, EmptyPile } from "./CardView";
import { useDragAndDrop } from "./useDragAndDrop";

export default function Board() {
  const [game, setGame] = useState<GameState>(createGame);
  const [selectedCard, setSelectedCard] = useState<DragItem | null>(null);
  const [showArticle, setShowArticle] = useState(false);

  const handleNewGame = () => {
    setGame(createGame());
    setSelectedCard(null);
  };

  const handleAutoMove = () => {
    let current = game;
    let result = autoMoveToFoundation(current);
    while (result) {
      current = result;
      result = autoMoveToFoundation(current);
    }
    if (current !== game) setGame(current);
  };

  const handleDrop = useCallback(
    (item: DragItem, targetType: string, targetIndex: number) => {
      setSelectedCard(null);
      let result: GameState | null = null;

      if (item.sourceType === "waste") {
        if (targetType === "foundation") {
          result = moveWasteToFoundation(game, targetIndex);
        } else if (targetType === "tableau") {
          result = moveWasteToTableau(game, targetIndex);
        }
      } else if (item.sourceType === "tableau") {
        if (targetType === "foundation") {
          result = moveTableauToFoundation(game, item.sourceIndex, targetIndex);
        } else if (targetType === "tableau") {
          result = moveTableauToTableau(
            game,
            item.sourceIndex,
            item.cardIndex,
            targetIndex,
          );
        }
      } else if (item.sourceType === "foundation") {
        if (targetType === "tableau") {
          result = moveFoundationToTableau(game, item.sourceIndex, targetIndex);
        }
      }

      if (result) setGame(result);
    },
    [game],
  );

  const { startDrag } = useDragAndDrop(handleDrop);

  const handleCardClick = (item: DragItem) => {
    if (selectedCard) {
      // Try to place selected card
      handleDrop(selectedCard, item.sourceType, item.sourceIndex);
      setSelectedCard(null);
    } else {
      setSelectedCard(item);
    }
  };

  const handleEmptyTableauClick = (idx: number) => {
    if (selectedCard) {
      handleDrop(selectedCard, "tableau", idx);
      setSelectedCard(null);
    }
  };

  const handleEmptyFoundationClick = (idx: number) => {
    if (selectedCard) {
      handleDrop(selectedCard, "foundation", idx);
      setSelectedCard(null);
    }
  };

  const handleDoubleClick = (item: DragItem) => {
    // Try auto-move to foundation
    if (item.sourceType === "waste") {
      for (let f = 0; f < 4; f++) {
        const result = moveWasteToFoundation(game, f);
        if (result) {
          setGame(result);
          return;
        }
      }
    } else if (item.sourceType === "tableau") {
      for (let f = 0; f < 4; f++) {
        const result = moveTableauToFoundation(game, item.sourceIndex, f);
        if (result) {
          setGame(result);
          return;
        }
      }
    }
  };

  const isSelected = (cardId: string) =>
    selectedCard?.cards.some((c) => c.id === cardId) ?? false;

  return (
    <div className="board">
      {/* Header */}
      <div className="board-header">
        <h1>
          <button
            className="gear-btn"
            onClick={() => setShowArticle(true)}
            aria-label="Informacje"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>{" "}
          Pasjans
        </h1>
        <div className="board-controls">
          <span className="move-counter">Ruchy: {game.moves}</span>
          <button className="btn" onClick={handleAutoMove}>
            Auto
          </button>
          <button className="btn btn-new" onClick={handleNewGame}>
            Nowa gra
          </button>
        </div>
      </div>

      {/* Top row: Stock, Waste, Foundations */}
      <div className="top-row">
        <div className="stock-waste">
          {/* Stock */}
          <div className="pile-slot">
            {game.stock.length > 0 ? (
              <CardView
                card={game.stock[game.stock.length - 1]}
                onClick={() => setGame(drawFromStock(game))}
                className="stock-card"
              />
            ) : (
              <EmptyPile
                label="↻"
                onClick={() => setGame(drawFromStock(game))}
                className="stock-empty"
              />
            )}
            {game.stock.length > 0 && (
              <span className="pile-count">{game.stock.length}</span>
            )}
          </div>

          {/* Waste */}
          <div className="pile-slot">
            {game.waste.length > 0 ? (
              <CardView
                card={game.waste[game.waste.length - 1]}
                onClick={() =>
                  handleCardClick({
                    cards: [game.waste[game.waste.length - 1]],
                    sourceType: "waste",
                    sourceIndex: 0,
                    cardIndex: game.waste.length - 1,
                  })
                }
                onDoubleClick={() =>
                  handleDoubleClick({
                    cards: [game.waste[game.waste.length - 1]],
                    sourceType: "waste",
                    sourceIndex: 0,
                    cardIndex: game.waste.length - 1,
                  })
                }
                onDragStart={(e, el) =>
                  startDrag(
                    e,
                    {
                      cards: [game.waste[game.waste.length - 1]],
                      sourceType: "waste",
                      sourceIndex: 0,
                      cardIndex: game.waste.length - 1,
                    },
                    el,
                  )
                }
                className={
                  isSelected(game.waste[game.waste.length - 1].id)
                    ? "selected"
                    : ""
                }
              />
            ) : (
              <EmptyPile className="waste-empty" />
            )}
          </div>
        </div>

        {/* Foundations */}
        <div className="foundations">
          {game.foundations.map((pile, fi) => (
            <div
              key={fi}
              className="pile-slot"
              data-drop-type="foundation"
              data-drop-index={fi}
            >
              {pile.length > 0 ? (
                <CardView
                  card={pile[pile.length - 1]}
                  onClick={() =>
                    handleCardClick({
                      cards: [pile[pile.length - 1]],
                      sourceType: "foundation",
                      sourceIndex: fi,
                      cardIndex: pile.length - 1,
                    })
                  }
                  onDragStart={(e, el) =>
                    startDrag(
                      e,
                      {
                        cards: [pile[pile.length - 1]],
                        sourceType: "foundation",
                        sourceIndex: fi,
                        cardIndex: pile.length - 1,
                      },
                      el,
                    )
                  }
                />
              ) : (
                <EmptyPile
                  label={["♠", "♥", "♦", "♣"][fi]}
                  dropType="foundation"
                  dropIndex={fi}
                  onClick={() => handleEmptyFoundationClick(fi)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="tableau">
        {game.tableau.map((pile, ti) => (
          <div
            key={ti}
            className="tableau-pile"
            data-drop-type="tableau"
            data-drop-index={ti}
          >
            {pile.length === 0 ? (
              <EmptyPile
                dropType="tableau"
                dropIndex={ti}
                onClick={() => handleEmptyTableauClick(ti)}
              />
            ) : (
              pile.map((card, ci) => (
                <CardView
                  key={card.id}
                  card={card}
                  style={{ top: `${ci * (card.faceUp ? 28 : 12)}px` }}
                  className={`tableau-card ${isSelected(card.id) ? "selected" : ""}`}
                  onClick={() => {
                    if (card.faceUp) {
                      handleCardClick({
                        cards: pile.slice(ci),
                        sourceType: "tableau",
                        sourceIndex: ti,
                        cardIndex: ci,
                      });
                    }
                  }}
                  onDoubleClick={() => {
                    if (card.faceUp && ci === pile.length - 1) {
                      handleDoubleClick({
                        cards: [card],
                        sourceType: "tableau",
                        sourceIndex: ti,
                        cardIndex: ci,
                      });
                    }
                  }}
                  onDragStart={
                    card.faceUp
                      ? (e, el) =>
                          startDrag(
                            e,
                            {
                              cards: pile.slice(ci),
                              sourceType: "tableau",
                              sourceIndex: ti,
                              cardIndex: ci,
                            },
                            el,
                          )
                      : undefined
                  }
                />
              ))
            )}
          </div>
        ))}
      </div>

      {/* SEO Article Modal */}
      {showArticle && (
        <div className="modal-overlay" onClick={() => setShowArticle(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowArticle(false)}
            >
              ×
            </button>
            <SeoArticle />
          </div>
        </div>
      )}

      {/* Win overlay */}
      {game.won && (
        <div className="win-overlay">
          <div className="win-dialog">
            <h2>🎉 Gratulacje!</h2>
            <p>Wygrałeś w {game.moves} ruchach!</p>
            <button className="btn btn-new" onClick={handleNewGame}>
              Nowa gra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
