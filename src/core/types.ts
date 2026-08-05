/**
 * Core type definitions for Cardcraft.
 * All modules import from here — single source of truth for data shapes.
 */

/** Individual word style (bold, italic, color, etc.) */
export interface WordStyle {
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  fontSize?: number | string;
  color?: string;
}

/** Section-level style (applies to entire field like title, text, etc.) */
export interface SectionStyle {
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  fontSize?: number;
}

/** A single card in the project */
export interface Card {
  id: string;
  title: string;
  subtitle: string;
  text: string;
  listItems: string;
  footer: string;
  cta: string;
  colors: Record<string, string>;
  wordStyles: Record<string, WordStyle>;
  sectionStyles: Record<string, SectionStyle>;
  theme?: string;
}

/** Snapshot for undo/redo history */
export interface Snapshot {
  cards: Card[];
  theme: string;
  format: string;
}

/** Theme group structure for dropdown rendering */
export interface ThemeGroup {
  label: string;
  themes: { value: string; label: string }[];
}

/** Editor field configuration */
export interface EditorField {
  key: 'title' | 'subtitle' | 'text' | 'listItems' | 'footer' | 'cta';
  label: string;
  multiline: boolean;
  maxlength: number;
}

/** Modal field configuration */
export interface ModalField {
  key: string;
  label: string;
  defaultSize: number;
  hasStyleControls: boolean;
}

/** Field configuration for preview rendering (order, tag, container) */
export interface FieldConfig {
  tag: string;
  cls: string;
  container: 'top' | 'bottom';
  order: number;
}

/** Action types for the centralized state manager */
export type ActionType =
  | 'ADD_CARD'
  | 'DELETE_CARD'
  | 'DUPLICATE_CARD'
  | 'MOVE_CARD'
  | 'UPDATE_CARD_FIELD'
  | 'SET_CARD_THEME'
  | 'SET_CARD_COLORS'
  | 'SET_CARD_SECTION_STYLES'
  | 'SET_CARD_WORD_STYLES'
  | 'DELETE_CARD_WORD_STYLE'
  | 'SET_GLOBAL_THEME'
  | 'SET_FORMAT'
  | 'SET_GRADIENT_ANGLE'
  | 'SET_SHOW_CARD_NUMBERS'
  | 'SET_SHOW_PROGRESS_BAR'
  | 'SET_PROGRESS_BAR_STYLE'
  | 'SET_LIST_STYLE'
  | 'SET_CHAR_LIMIT'
  | 'RESTORE_SNAPSHOT'
  | 'CLEAR_ALL';

/** Action interface for state manager */
export interface Action {
  type: ActionType;
  payload?: unknown;
}
