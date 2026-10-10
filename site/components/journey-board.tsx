'use client';

import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ChatIcon, ThumbsUpIcon, WarningIcon } from './icons';
import { numberToken } from './motion';

type Sentiment = 'positive' | 'negative';
type Card = { text: string; sentiment?: Sentiment };

// Same content as the demo's "Getting started" journey for Persona 1 (sample/), so the board and the demo agree.
const phases = [
  { id: 'discover', name: 'Discover', detail: 'First contact' },
  { id: 'sign-up', name: 'Sign up', detail: 'Creating an account' },
  { id: 'first-use', name: 'First use', detail: 'A first result' },
] as const;

type PhaseId = (typeof phases)[number]['id'];

const rows: { name: string; detail: string; cards: Record<PhaseId, Card> }[] = [
  {
    name: 'User actions',
    detail: 'What the persona does',
    cards: {
      discover: { text: 'Opens the product from a link and reads the home page.' },
      'sign-up': { text: 'Creates an account with an email address.' },
      'first-use': { text: 'Starts from an example and changes it.' },
    },
  },
  {
    name: 'Goals',
    detail: 'What they want to achieve',
    cards: {
      discover: { text: 'Understand what the product does.' },
      'sign-up': { text: 'Get in without friction.' },
      'first-use': { text: 'See a useful result quickly.' },
    },
  },
  {
    name: 'Pain points',
    detail: 'What gets in the way',
    cards: {
      discover: { text: 'Unsure whether it fits their need.', sentiment: 'negative' },
      'sign-up': { text: 'Too many fields before any value.', sentiment: 'negative' },
      'first-use': { text: 'An empty page with no hint of where to start.', sentiment: 'negative' },
    },
  },
  {
    name: 'Opportunities',
    detail: 'Ideas to try',
    cards: {
      discover: { text: 'Show a short example on the home page.', sentiment: 'positive' },
      'sign-up': { text: 'Ask only for what is needed now.', sentiment: 'positive' },
      'first-use': { text: 'Offer ready-made examples.', sentiment: 'positive' },
    },
  },
];

// The board's reference width is --board-width in landing.css.
// Under this scale the board reads as a picture and its controls are too small to target.
const interactiveScale = 0.6;

// Below its reference width the board is scaled as one picture, like the mobile canvas.
// The frame reserves the tallest unscaled height seen, so changing phase never moves the page.
function useFitScale() {
  const frame = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [tallest, setTallest] = useState(0);
  useEffect(() => {
    const frameElement = frame.current;
    const boardElement = board.current;
    if (!frameElement || !boardElement) return;
    const measure = () => {
      const applied = Number.parseFloat(getComputedStyle(boardElement).zoom) || 1;
      setScale(Math.min(1, frameElement.clientWidth / numberToken('board-width', 1184)));
      setTallest(previous => Math.max(previous, boardElement.getBoundingClientRect().height / applied));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(frameElement);
    observer.observe(boardElement);
    return () => observer.disconnect();
  }, []);
  return { frame, board, scale, minHeight: tallest ? tallest * scale : undefined };
}

export function JourneyBoard() {
  const [focused, setFocused] = useState<PhaseId>('sign-up');
  const { frame, board, scale, minHeight } = useFitScale();
  const compact = scale < interactiveScale;

  return (
    <div className="board-frame" ref={frame} style={{ minHeight }} data-reveal="">
      <div className="board" ref={board} style={scale < 1 ? { zoom: scale } : undefined}>
        <div className="board-header">
          <div className="board-title">
            <span className="board-title-icon"><ChatIcon /></span>
            <div>
              <p className="board-name">Getting started</p>
              <p className="board-detail">From the first visit to a first useful result.</p>
            </div>
          </div>
          <div className="board-personas" aria-label="Personas on this journey">
            <span className="persona-chip is-active"><span className="persona-code">P1</span>Persona 1</span>
            <span className="persona-chip"><span className="persona-code">P2</span>Persona 2</span>
          </div>
        </div>
        <table className="board-grid">
          <caption className="visually-hidden">Getting started journey for Persona 1. The {phases.find(phase => phase.id === focused)?.name} phase is in focus.{compact ? '' : ' Choose another phase to compare it.'}</caption>
          <thead>
            <tr>
              <th scope="col" className="board-corner">Journey sections</th>
              {phases.map(phase => (
                <th scope="col" key={phase.id} className={phase.id === focused ? 'is-focused' : undefined}>
                  <button type="button" className="phase-button" aria-pressed={phase.id === focused} disabled={compact} onClick={() => setFocused(phase.id)}>
                    <span className="phase-name">{phase.name}</span>
                    <span className="phase-detail">{phase.detail}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.name} style={{ '--i': index } as CSSProperties}>
                <th scope="row">
                  <span className="row-name">{row.name}</span>
                  <span className="row-detail">{row.detail}</span>
                </th>
                {phases.map(phase => {
                  const card = row.cards[phase.id];
                  const isFocused = phase.id === focused;
                  return (
                    <td key={phase.id} className={isFocused ? 'is-focused' : undefined}>
                      <div className="journey-card">
                        <p>{card.text}</p>
                        {isFocused && card.sentiment && (
                          <span className="sentiment">
                            {card.sentiment === 'positive' ? <ThumbsUpIcon /> : <WarningIcon />}
                            {card.sentiment === 'positive' ? 'Positive' : 'Negative'}
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
