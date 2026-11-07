import type * as React from 'react';

type Glyph = React.ReactNode;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** filled = action (default) · brand = primary · tinted · gray · plain */
  variant?: 'filled' | 'brand' | 'tinted' | 'gray' | 'plain';
  size?: 'sm' | 'md' | 'lg';
  leading?: Glyph;
  trailing?: Glyph;
  fullWidth?: boolean;
}
export declare function Button(props: ButtonProps): React.ReactElement;

export interface BadgeProps { tone?: 'neutral' | 'brand' | 'ink' | 'highlight'; className?: string; children?: React.ReactNode }
export declare function Badge(props: BadgeProps): React.ReactElement;

export interface CodeProps { className?: string; children?: React.ReactNode }
export declare function Code(props: CodeProps): React.ReactElement;

export interface TakeawayProps { align?: 'center' | 'start'; className?: string; children?: React.ReactNode }
export declare function Takeaway(props: TakeawayProps): React.ReactElement;
export interface MarkProps { children?: React.ReactNode }
export declare function Mark(props: MarkProps): React.ReactElement;

export interface ProgressBarProps { value: number; tone?: 'ink' | 'brand'; label?: React.ReactNode; showValue?: boolean; 'aria-label'?: string; className?: string }
export declare function ProgressBar(props: ProgressBarProps): React.ReactElement;

export type SegmentOption = string | { value: string; label: React.ReactNode; disabled?: boolean };
export interface SegmentedControlProps { options: SegmentOption[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; fullWidth?: boolean; 'aria-label'?: string; className?: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;

export interface CardProps extends React.HTMLAttributes<HTMLElement> { variant?: 'raised' | 'panel' | 'elevated'; title?: React.ReactNode; subtitle?: React.ReactNode; as?: keyof JSX.IntrinsicElements }
export declare function Card(props: CardProps): React.ReactElement;

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode; label?: string; trailing?: React.ReactNode; hint?: React.ReactNode;
  tone?: 'default' | 'danger'; mono?: boolean; shape?: 'rect' | 'pill';
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface TimelineStep { id?: string; name: string; description?: string; tone?: 'dns' | 'tcp' | 'tls' | 'request' | 'response' | 'ink'; start?: number; duration?: number }
export interface StepTimelineProps { steps: TimelineStep[]; total?: number; unit?: string; selected?: string | null; defaultSelected?: string | null; onSelect?: (id: string | null) => void; showTotal?: boolean; className?: string }
export declare function StepTimeline(props: StepTimelineProps): React.ReactElement;

export type TerminalLine = string | { kind?: 'cmd' | 'info' | 'out' | 'in' | 'body' | 'hint'; text: string; dim?: boolean; prefix?: boolean };
export interface TerminalProps { lines: TerminalLine[]; title?: React.ReactNode; accessory?: React.ReactNode; height?: number | string; caret?: boolean; live?: boolean; autoScroll?: boolean; className?: string }
export declare function Terminal(props: TerminalProps): React.ReactElement;

export interface TutorBubbleProps { tone?: 'neutral' | 'success' | 'danger'; lead?: React.ReactNode; avatar?: React.ReactNode | null; className?: string; children?: React.ReactNode }
export declare function TutorBubble(props: TutorBubbleProps): React.ReactElement;

export interface CalloutProps { tone?: 'success' | 'info' | 'danger' | 'neutral'; title?: string; icon?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Callout(props: CalloutProps): React.ReactElement;

export interface ListProps { title?: React.ReactNode; variant?: 'inset' | 'plain'; className?: string; children?: React.ReactNode }
export declare function List(props: ListProps): React.ReactElement;
export interface ListRowProps { title: React.ReactNode; subtitle?: React.ReactNode; detail?: React.ReactNode; leading?: React.ReactNode; current?: boolean; done?: boolean; expanded?: boolean; chevron?: boolean; href?: string; onClick?: () => void }
export declare function ListRow(props: ListRowProps): React.ReactElement;

export type ToolbarStep = string | { label: string; progress?: number };
export interface LessonToolbarProps { steps: ToolbarStep[]; current: number; onStep?: (index: number) => void; onBack?: () => void; hint?: React.ReactNode; canContinue?: boolean; onContinue?: () => void; continueLabel?: string; action?: React.ReactNode; 'aria-label'?: string; className?: string }
export declare function LessonToolbar(props: LessonToolbarProps): React.ReactElement;

declare global {
  interface Window {
    Trilha: { Button: typeof Button; Badge: typeof Badge; Code: typeof Code; Takeaway: typeof Takeaway; Mark: typeof Mark; ProgressBar: typeof ProgressBar; SegmentedControl: typeof SegmentedControl; Card: typeof Card; TextField: typeof TextField; StepTimeline: typeof StepTimeline; Terminal: typeof Terminal; TutorBubble: typeof TutorBubble; Callout: typeof Callout; List: typeof List; ListRow: typeof ListRow; LessonToolbar: typeof LessonToolbar };
  }
}
