import type * as React from 'react';

type Glyph = React.ReactNode;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** filled = action (default) · brand = primary · tinted · gray · plain */
  variant?: 'filled' | 'brand' | 'tinted' | 'gray' | 'plain' | 'stamp' | 'glass' | 'glass-tint';
  /** botão redondo só com o glifo */
  icon?: boolean;
  /** glass: liga/desliga a refração (padrão ligada no Chrome/Edge) */
  refraction?: boolean;
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
export interface SegmentedControlProps { options: SegmentOption[]; value?: string; defaultValue?: string; onChange?: (value: string) => void; fullWidth?: boolean; glass?: boolean; 'aria-label'?: string; className?: string }
export declare function SegmentedControl(props: SegmentedControlProps): React.ReactElement;

export interface CardProps extends React.HTMLAttributes<HTMLElement> { variant?: 'raised' | 'panel' | 'elevated' | 'stamp'; title?: React.ReactNode; subtitle?: React.ReactNode; as?: keyof JSX.IntrinsicElements }
export declare function Card(props: CardProps): React.ReactElement;

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: React.ReactNode; label?: string; trailing?: React.ReactNode; hint?: React.ReactNode;
  tone?: 'default' | 'danger'; mono?: boolean; shape?: 'rect' | 'pill';
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

export interface TimelineStep { id?: string; name: string; description?: string; tone?: 'dns' | 'tcp' | 'tls' | 'request' | 'response' | 'ink'; start?: number; duration?: number }
export interface StepTimelineProps { steps: TimelineStep[]; total?: number; unit?: string; selected?: string | null; defaultSelected?: string | null; onSelect?: (id: string | null) => void; showTotal?: boolean; className?: string }
export declare function StepTimeline(props: StepTimelineProps): React.ReactElement;

export type TerminalLine = string | { kind?: 'cmd' | 'info' | 'out' | 'in' | 'body' | 'hint' | 'ok' | 'warn' | 'bad' | 'log'; text: string; dim?: boolean; prefix?: boolean };
export interface TerminalProps { lines: TerminalLine[]; title?: React.ReactNode; accessory?: React.ReactNode; height?: number | string; caret?: boolean; live?: boolean; autoScroll?: boolean; className?: string }
export declare function Terminal(props: TerminalProps): React.ReactElement;

export interface TutorBubbleProps { tone?: 'neutral' | 'success' | 'danger'; lead?: React.ReactNode; avatar?: React.ReactNode | null; className?: string; children?: React.ReactNode }
export declare function TutorBubble(props: TutorBubbleProps): React.ReactElement;

export interface CalloutProps { tone?: 'success' | 'info' | 'danger' | 'neutral' | 'note' | 'tip' | 'warning'; title?: string; icon?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function Callout(props: CalloutProps): React.ReactElement;

export interface ListProps { title?: React.ReactNode; variant?: 'inset' | 'plain'; className?: string; children?: React.ReactNode }
export declare function List(props: ListProps): React.ReactElement;
export interface ListRowProps { title: React.ReactNode; subtitle?: React.ReactNode; detail?: React.ReactNode; leading?: React.ReactNode; current?: boolean; done?: boolean; expanded?: boolean; chevron?: boolean; href?: string; onClick?: () => void }
export declare function ListRow(props: ListRowProps): React.ReactElement;

export type ToolbarStep = string | { label: string; progress?: number };
export interface LessonToolbarProps { steps: ToolbarStep[]; current: number; onStep?: (index: number) => void; onBack?: () => void; hint?: React.ReactNode; canContinue?: boolean; onContinue?: () => void; continueLabel?: string; action?: React.ReactNode; floating?: boolean; collapseOnScroll?: boolean; collapsed?: boolean; 'aria-label'?: string; className?: string }
export declare function LessonToolbar(props: LessonToolbarProps): React.ReactElement;

/* ── Página ── */
export interface EyebrowProps { index?: string; className?: string; children?: React.ReactNode }
export declare function Eyebrow(props: EyebrowProps): React.ReactElement;
export interface SectionHeaderProps { title: React.ReactNode; index?: string; eyebrow?: React.ReactNode; subtitle?: React.ReactNode; id?: string; size?: 'md' | 'sm'; align?: 'start' | 'center'; as?: 'h1' | 'h2' | 'h3'; className?: string; children?: React.ReactNode }
export declare function SectionHeader(props: SectionHeaderProps): React.ReactElement;
export interface TextLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> { external?: boolean; quiet?: boolean; arrow?: React.ReactNode | null }
export declare function TextLink(props: TextLinkProps): React.ReactElement;
export interface StatusDotProps { tone?: 'success' | 'warning' | 'danger' | 'neutral'; live?: boolean; className?: string; children?: React.ReactNode }
export declare function StatusDot(props: StatusDotProps): React.ReactElement;
export interface LanguageSwitchProps { options?: string[]; value?: string; defaultValue?: string; onChange?: (code: string) => void; 'aria-label'?: string; className?: string }
export declare function LanguageSwitch(props: LanguageSwitchProps): React.ReactElement;
export interface SidebarItem { label: string; href: string; id?: string; index?: string; external?: boolean }
export interface SiteSidebarProps { identity: { name: string; role?: string; mark?: React.ReactNode; href?: string }; meta?: React.ReactNode; items: SidebarItem[]; current?: string; status?: React.ReactNode; 'aria-label'?: string; className?: string; children?: React.ReactNode }
export declare function SiteSidebar(props: SiteSidebarProps): React.ReactElement;

/* ── Conteúdo ── */
export interface Stat { value: React.ReactNode; label: React.ReactNode; href?: string; linkLabel?: string; external?: boolean }
export interface StatGroupProps { stats: Stat[]; note?: React.ReactNode; className?: string }
export declare function StatGroup(props: StatGroupProps): React.ReactElement;
export interface MetricStripProps { items: { value: React.ReactNode; label: React.ReactNode }[]; fullWidth?: boolean; className?: string }
export declare function MetricStrip(props: MetricStripProps): React.ReactElement;
export interface TagListProps { tags: string[]; size?: 'md' | 'sm'; mono?: boolean; 'aria-label'?: string; className?: string }
export declare function TagList(props: TagListProps): React.ReactElement;
export interface TimelineChapter { title: React.ReactNode; items?: React.ReactNode[]; index?: string }
export interface TimelineEntry { id?: string; index?: string; title: React.ReactNode; subtitle?: React.ReactNode; period?: string; location?: string; logo?: string | React.ReactNode; metrics?: MetricStripProps['items']; chapters?: TimelineChapter[]; footnote?: React.ReactNode }
export interface TimelineProps { entries: TimelineEntry[]; className?: string }
export declare function Timeline(props: TimelineProps): React.ReactElement;
export interface Project { title: string; type?: string; description?: React.ReactNode; tags?: string[]; href?: string; linkLabel?: string; index?: string }
export interface ProjectListProps { projects: Project[]; className?: string }
export declare function ProjectList(props: ProjectListProps): React.ReactElement;
export interface FAQProps { items: { question: React.ReactNode; answer: React.ReactNode; open?: boolean }[]; columns?: 1 | 2; className?: string }
export declare function FAQ(props: FAQProps): React.ReactElement;
export interface ProfileCardProps { name: string; role?: React.ReactNode; bio?: React.ReactNode; photo?: string; photoAlt?: string; initials?: string; stats?: { value: React.ReactNode; label: React.ReactNode }[]; className?: string; children?: React.ReactNode }
export declare function ProfileCard(props: ProfileCardProps): React.ReactElement;
export interface EmailCaptureProps { onSubmit?: (email: string) => boolean | Promise<boolean>; cta?: string; label?: string; placeholder?: string; note?: React.ReactNode; doneMessage?: React.ReactNode; errorMessage?: React.ReactNode; invalidMessage?: string; state?: 'idle' | 'loading' | 'done' | 'error'; className?: string }
export declare function EmailCapture(props: EmailCaptureProps): React.ReactElement;

/* ── Curso ── */
export type ProgressStatus = 'done' | 'next' | 'locked' | 'open';
export interface StateNodeProps { status?: ProgressStatus; label?: React.ReactNode }
export declare function StateNode(props: StateNodeProps): React.ReactElement;
export interface CurriculumChapter { title: React.ReactNode; lessons?: number; duration?: string; meta?: React.ReactNode; status?: ProgressStatus }
export interface CurriculumPart { title: React.ReactNode; description?: React.ReactNode; count?: React.ReactNode; chapters: CurriculumChapter[] }
export interface CurriculumTrackProps { parts: CurriculumPart[]; defaultOpen?: number[]; className?: string }
export declare function CurriculumTrack(props: CurriculumTrackProps): React.ReactElement;
export interface ChallengeStepperProps { steps: { title: React.ReactNode; description?: React.ReactNode }[]; current: number; nextLabel?: string; className?: string }
export declare function ChallengeStepper(props: ChallengeStepperProps): React.ReactElement;
export interface CodeFile { name: string; code: string; language?: 'python' | 'js' | 'bash' }
export interface CodeEditorProps { files: CodeFile[]; editable?: boolean; onRun?: (file: string, code: string) => void; running?: boolean; runLabel?: string; meta?: React.ReactNode; caption?: React.ReactNode; highlightLines?: number[]; maxHeight?: number | string; onChange?: (file: string, code: string) => void; allowTabOut?: boolean; className?: string }
export declare function CodeEditor(props: CodeEditorProps): React.ReactElement;
export interface BrowserFrameProps { url: string; secure?: boolean; actions?: React.ReactNode; caption?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function BrowserFrame(props: BrowserFrameProps): React.ReactElement;
export interface DataColumn { key: string; label: React.ReactNode; type?: string; align?: 'left' | 'right'; mono?: boolean; render?: (value: any, row: any) => React.ReactNode }
export interface DataTableProps { columns: DataColumn[]; rows: Record<string, any>[]; title?: React.ReactNode; count?: number | false; countLabel?: string; empty?: React.ReactNode; caption?: string; className?: string }
export declare function DataTable(props: DataTableProps): React.ReactElement;
export interface SkeletonProps { lines?: number; widths?: string[]; height?: number; label?: string; className?: string }
export declare function Skeleton(props: SkeletonProps): React.ReactElement;

/* ── Superfícies ── */
export interface LiquidGlassProps extends React.HTMLAttributes<HTMLElement> { variant?: 'regular' | 'clear' | 'tint'; shape?: 'rounded' | 'pill' | 'circle'; interactive?: boolean; legibility?: 'standard' | 'scrim'; refraction?: boolean; specular?: boolean; strength?: number; padded?: boolean; as?: keyof JSX.IntrinsicElements }
export declare function LiquidGlass(props: LiquidGlassProps): React.ReactElement;
export interface GlassPanelProps extends React.HTMLAttributes<HTMLElement> { tone?: 'light' | 'dark'; variant?: LiquidGlassProps['variant']; shape?: LiquidGlassProps['shape']; padding?: number | string; as?: keyof JSX.IntrinsicElements }
export declare function GlassPanel(props: GlassPanelProps): React.ReactElement;
export interface SheetProps { open: boolean; onClose?: () => void; title: React.ReactNode; actions?: React.ReactNode; inline?: boolean; material?: 'glass' | 'solid'; className?: string; children?: React.ReactNode }
export declare function Sheet(props: SheetProps): React.ReactElement | null;
export interface RevealProps { delay?: number; stagger?: boolean | number; as?: keyof JSX.IntrinsicElements; className?: string; children?: React.ReactNode }
export declare function Reveal(props: RevealProps): React.ReactElement;

/* ── Leitura ── */
export interface ReaderSettings { size: 0 | 1 | 2 | 3 | 4; family: 'serif' | 'sans'; width: 'narrow' | 'normal' | 'wide'; theme: 'auto' | 'light' | 'paper' | 'dark' }
export interface ReaderViewProps { title?: React.ReactNode; readingTime?: React.ReactNode; back?: React.ReactNode; lang?: string; settings?: ReaderSettings; defaultSettings?: Partial<ReaderSettings>; onSettingsChange?: (s: ReaderSettings) => void; persist?: boolean; toolbar?: boolean; floating?: boolean; collapseOnScroll?: boolean; className?: string; children?: React.ReactNode }
export declare function ReaderView(props: ReaderViewProps): React.ReactElement;
export interface ReaderControlsProps { value: Partial<ReaderSettings>; onChange: (s: ReaderSettings) => void; inline?: boolean; glass?: boolean; className?: string }
export declare function ReaderControls(props: ReaderControlsProps): React.ReactElement;
export interface ArticleLayoutProps { aside?: React.ReactNode; asideSide?: 'start' | 'end'; className?: string; children?: React.ReactNode }
export declare function ArticleLayout(props: ArticleLayoutProps): React.ReactElement;
export interface ArticleHeaderProps { title: React.ReactNode; eyebrow?: React.ReactNode; index?: string; lede?: React.ReactNode; author?: string; avatar?: string; date?: string; dateTime?: string; readingTime?: React.ReactNode; className?: string }
export declare function ArticleHeader(props: ArticleHeaderProps): React.ReactElement;
export interface ProseProps extends React.HTMLAttributes<HTMLElement> { html?: string; as?: keyof JSX.IntrinsicElements }
export declare function Prose(props: ProseProps): React.ReactElement;
export interface PullQuoteProps { cite?: React.ReactNode; className?: string; children?: React.ReactNode }
export declare function PullQuote(props: PullQuoteProps): React.ReactElement;
export interface SidenoteProps { n: number | string; children?: React.ReactNode }
export declare function Sidenote(props: SidenoteProps): React.ReactElement;
export interface TableOfContentsProps { items: { id: string; label: React.ReactNode; level?: 2 | 3 }[]; title?: string; variant?: 'sidebar' | 'mobile'; className?: string }
export declare function TableOfContents(props: TableOfContentsProps): React.ReactElement;
export interface ReadingProgressProps { value?: number; fixed?: boolean; height?: number; 'aria-label'?: string; className?: string }
export declare function ReadingProgress(props: ReadingProgressProps): React.ReactElement;

declare global {
  interface Window {
    Trilha: { Button: typeof Button; Badge: typeof Badge; Code: typeof Code; Takeaway: typeof Takeaway; Mark: typeof Mark; ProgressBar: typeof ProgressBar; SegmentedControl: typeof SegmentedControl; Card: typeof Card; TextField: typeof TextField; StepTimeline: typeof StepTimeline; Terminal: typeof Terminal; TutorBubble: typeof TutorBubble; Callout: typeof Callout; List: typeof List; ListRow: typeof ListRow; LessonToolbar: typeof LessonToolbar; Eyebrow: typeof Eyebrow; SectionHeader: typeof SectionHeader; TextLink: typeof TextLink; StatusDot: typeof StatusDot; LanguageSwitch: typeof LanguageSwitch; SiteSidebar: typeof SiteSidebar; StatGroup: typeof StatGroup; MetricStrip: typeof MetricStrip; TagList: typeof TagList; Timeline: typeof Timeline; ProjectList: typeof ProjectList; FAQ: typeof FAQ; ProfileCard: typeof ProfileCard; EmailCapture: typeof EmailCapture; StateNode: typeof StateNode; CurriculumTrack: typeof CurriculumTrack; ChallengeStepper: typeof ChallengeStepper; CodeEditor: typeof CodeEditor; BrowserFrame: typeof BrowserFrame; DataTable: typeof DataTable; Skeleton: typeof Skeleton; GlassPanel: typeof GlassPanel; LiquidGlass: typeof LiquidGlass; Sheet: typeof Sheet; Reveal: typeof Reveal; ReaderView: typeof ReaderView; ReaderControls: typeof ReaderControls; ArticleLayout: typeof ArticleLayout; ArticleHeader: typeof ArticleHeader; Prose: typeof Prose; PullQuote: typeof PullQuote; Sidenote: typeof Sidenote; TableOfContents: typeof TableOfContents; ReadingProgress: typeof ReadingProgress };
  }
}
