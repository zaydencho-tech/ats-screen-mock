import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };
type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  disabled?: boolean;
  menuZIndex?: number;
};

/** Interview filters: a single-select listbox with focus retained on its trigger. */
export default function InterviewFilterSelect({ label, value, options, onChange, disabled, menuZIndex = 1000 }: Props) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 0, maxHeight: 240 });
  const selected = options.findIndex(option => option.value === value);
  const expanded = open && !disabled && options.length > 0;

  function show() {
    if (disabled || !options.length) return;
    setActive(Math.max(0, selected));
    setOpen(true);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || disabled) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  useLayoutEffect(() => {
    if (!expanded) return;
    function place() {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 12;
      const above = rect.top - 12;
      const upwards = below < Math.min(240, options.length * 34 + 8) && above > below;
      const maxHeight = Math.max(0, Math.min(240, upwards ? above : below));
      const height = Math.min(maxHeight, options.length * 34 + 8);
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
        top: upwards ? rect.top - height - 4 : rect.bottom + 4,
        width: Math.min(rect.width, window.innerWidth - 16),
        maxHeight,
      });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [expanded, options.length]);

  useEffect(() => {
    if (!expanded) return;
    function outside(event: PointerEvent) {
      const node = event.target as Node;
      if (!triggerRef.current?.contains(node) && !menuRef.current?.contains(node)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [expanded]);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    const option = menu?.children[active] as HTMLElement | undefined;
    if (!menu || !option) return;
    if (option.offsetTop < menu.scrollTop) menu.scrollTop = option.offsetTop;
    else if (option.offsetTop + option.offsetHeight > menu.scrollTop + menu.clientHeight) {
      menu.scrollTop = option.offsetTop + option.offsetHeight - menu.clientHeight;
    }
  }, [expanded, active]);

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!expanded) show();
      if (event.key === "Home") setActive(0);
      else if (event.key === "End") setActive(options.length - 1);
      else if (expanded) setActive(index => Math.max(0, Math.min(options.length - 1, index + (event.key === "ArrowDown" ? 1 : -1))));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (expanded) choose(active); else show();
    } else if (event.key === "Escape") {
      if (expanded) event.preventDefault();
      setOpen(false);
    } else if (event.key === "Tab") {
      setOpen(false);
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const now = Date.now();
      const text = now - searchRef.current.time < 700 ? searchRef.current.text + event.key : event.key;
      searchRef.current = { text, time: now };
      const index = options.findIndex(option => option.label.toLocaleLowerCase().startsWith(text.toLocaleLowerCase()));
      if (index >= 0) { if (!expanded) show(); setActive(index); }
    }
  }

  return <>
    <button
      ref={triggerRef}
      type="button"
      className="interview-filter-trigger"
      role="combobox"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={expanded}
      aria-controls={expanded ? id : undefined}
      aria-activedescendant={expanded ? `${id}-${active}` : undefined}
      disabled={disabled}
      onClick={() => expanded ? setOpen(false) : show()}
      onKeyDown={onKeyDown}
      onBlur={() => setOpen(false)}
    >
      <span>{options[selected]?.label ?? label}</span>
      <ChevronDown size={14} aria-hidden="true" />
    </button>
    {expanded && createPortal(
      <div ref={menuRef} id={id} role="listbox" aria-label={label} className="interview-filter-menu" style={{...position, zIndex: menuZIndex}}>
        {options.map((option, index) => <div
          key={option.value}
          id={`${id}-${index}`}
          role="option"
          aria-selected={option.value === value}
          data-active={index === active}
          className="interview-filter-option"
          onPointerMove={() => setActive(index)}
          onMouseDown={event => event.preventDefault()}
          onClick={() => choose(index)}
        >
          <span>{option.label}</span>
          {option.value === value && <Check size={14} aria-hidden="true" />}
        </div>)}
      </div>, document.body,
    )}
  </>;
}
