import { useEffect, useMemo, useRef, useState } from 'react';
import { glossary } from '../../data/glossary';
import type { GlossaryTerm } from '../../data/glossary';

interface Props {
  svg: string; // the chart's SVG source
  idPrefix: string; // keeps the ids in each chart from colliding once they're inline
  minWidth: number;
}

interface Tip {
  term: GlossaryTerm;
  left: number;
  top?: number; // below the box
  bottom?: number; // above the box, when there's no room below
  fill: string;
  stroke: string;
  color: string;
}

const TIP_WIDTH = 320;
const TIP_MARGIN = 8;
const TIP_ROOM = 220; // room to leave below a box before the tooltip moves above it

// Every "Table.Column=Value" reference in the glossary, in lower case.
const termsByRef = new Map<string, GlossaryTerm[]>();
for (const term of glossary) {
  for (const ref of term.udm) {
    if (!ref.includes('=')) continue;
    const key = ref.toLowerCase();
    termsByRef.set(key, [...(termsByRef.get(key) ?? []), term]);
  }
}

// A box's table and column come from the labels of the lane it sits in, and its value comes from
// its own label. scripts/check_glossary.py follows the same lookup and fails if a box has no term.
function findTerm(record: string, column: string, label: string): GlossaryTerm | undefined {
  const key = `${record}.${column}=${label.replace(/ /g, '_')}`.toLowerCase();
  let terms = termsByRef.get(key);
  if (!terms) {
    // A shortened label, such as "Conditional" for Conditional_Approval.
    const longer = [...termsByRef.keys()].find((ref) => ref.startsWith(`${key}_`));
    terms = longer ? termsByRef.get(longer) : undefined;
  }
  if (!terms) return undefined;
  // Prefer the status's own term over a broader one that also cites it.
  return terms.find((t) => t.term.toLowerCase().startsWith(label.toLowerCase())) ?? terms[0];
}

function lastAtOrAbove(labels: { y: number; text: string }[], y: number, reach: number) {
  return labels.filter((l) => l.y - reach <= y).pop()?.text ?? '';
}

export default function StatusChart({ svg, idPrefix, minWidth }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  const html = useMemo(
    () =>
      svg
        .replace(/\bid="([^"]+)"/g, `id="${idPrefix}-$1"`)
        .replace(/url\(#([^)]+)\)/g, `url(#${idPrefix}-$1)`)
        .replace(/aria-labelledby="([^"]+)"/, (_, ids: string) =>
          `aria-labelledby="${ids.split(' ').map((id) => `${idPrefix}-${id}`).join(' ')}"`,
        ),
    [svg, idPrefix],
  );

  useEffect(() => {
    // Inserted here, not by React, so a re-render can't undo the changes below.
    const holder = container.current;
    if (!holder) return;
    holder.innerHTML = html;
    const root = holder.querySelector('svg');
    if (!root) return;
    // role="img" would hide the boxes from screen readers.
    root.setAttribute('role', 'group');
    root.removeAttribute('width');
    root.removeAttribute('height');
    root.style.cssText = `display:block;width:100%;min-width:${minWidth}px;height:auto`;

    const texts = [...root.querySelectorAll('text')];
    const read = (t: SVGTextElement) => ({ y: Number(t.getAttribute('y')), text: t.textContent ?? '' });
    const columns = texts.filter((t) => t.getAttribute('font-family')?.includes('Menlo')).map(read);
    const records = texts
      .filter((t) => t.getAttribute('font-size') === '12' && t.getAttribute('fill') === '#64748b')
      .map(read);

    const show = (box: SVGGElement, term: GlossaryTerm) => {
      const r = box.getBoundingClientRect();
      const shape = box.querySelector('rect');
      const fill = shape?.getAttribute('fill') ?? '';
      const stroke = shape?.getAttribute('stroke') ?? '';
      // A two-color box, such as Withdrawn, fills with a gradient a tooltip can't use, so the
      // tooltip takes the gradient's first color.
      const solid = (paint: string) => {
        const id = paint.match(/^url\(#([^)]+)\)$/)?.[1];
        return id ? root.querySelector(`[id="${id}"] stop`)?.getAttribute('stop-color') ?? '#ffffff' : paint;
      };
      const colors = {
        fill: solid(fill),
        stroke: solid(stroke),
        color: box.querySelector('text')?.getAttribute('fill') ?? '#1e293b',
      };
      const left = Math.max(TIP_MARGIN, Math.min(r.left, window.innerWidth - Math.min(TIP_WIDTH, window.innerWidth - 2 * TIP_MARGIN) - TIP_MARGIN));
      setTip(
        r.bottom + TIP_ROOM > window.innerHeight
          ? { term, left, bottom: window.innerHeight - r.top + TIP_MARGIN, ...colors }
          : { term, left, top: r.bottom + TIP_MARGIN, ...colors },
      );
    };
    const hide = () => setTip(null);

    for (const rect of root.querySelectorAll('rect[rx="7"]')) {
      const label = rect.nextElementSibling;
      if (label?.tagName !== 'text' || label.getAttribute('font-weight') !== '600') continue;
      const y = Number(rect.getAttribute('y'));
      const text = label.textContent ?? '';
      const term = findTerm(lastAtOrAbove(records, y, 60), lastAtOrAbove(columns, y, 40), text);
      if (!term) continue;

      const box = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      rect.before(box);
      box.append(rect, label);
      box.style.cursor = 'help';
      box.setAttribute('tabindex', '0');
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', `${text}. ${term.definition}`);
      box.addEventListener('mouseenter', () => show(box, term));
      box.addEventListener('mouseleave', hide);
      box.addEventListener('focus', () => show(box, term));
      box.addEventListener('blur', hide);
      box.addEventListener('click', () => show(box, term)); // for touch screens
    }

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') hide(); };
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', hide, true);
    };
  }, [html, minWidth]);

  return (
    <>
      <div ref={container} style={{ overflowX: 'auto' }} />
      {tip && (
        <div
          role="tooltip"
          style={{
            position: 'fixed', left: tip.left, top: tip.top, bottom: tip.bottom, zIndex: 1000,
            width: TIP_WIDTH, maxWidth: `calc(100vw - ${2 * TIP_MARGIN}px)`,
            background: tip.fill, color: tip.color, border: `1.5px solid ${tip.stroke}`,
            borderRadius: 6, padding: '0.6rem 0.8rem',
            fontSize: '0.85rem', lineHeight: 1.45, boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{tip.term.term}</div>
          {tip.term.definition}
        </div>
      )}
    </>
  );
}
