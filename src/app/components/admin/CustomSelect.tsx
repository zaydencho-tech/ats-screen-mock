import {
  Children, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState,
  type ReactNode, type SelectHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import "./custom-select.css";

type Option = { value: string; label: string; disabled: boolean };

function textOf(children: ReactNode): string {
  return Children.toArray(children).map(child => isValidElement(child)
    ? textOf((child.props as { children?: ReactNode }).children)
    : String(child)).join("");
}

function readOptions(children: ReactNode, groupDisabled = false): Option[] {
  const options: Option[] = [];
  Children.forEach(children, child => {
    if (!isValidElement(child)) return;
    const props = child.props as { value?: string | number; children?: ReactNode; disabled?: boolean };
    if (child.type === "option") {
      const label = textOf(props.children);
      options.push({ value: String(props.value ?? label), label, disabled: groupDisabled || !!props.disabled });
    } else {
      options.push(...readOptions(props.children, groupDisabled || !!props.disabled));
    }
  });
  return options;
}

/** Keeps the original select's values, form semantics and change handlers behind a custom combobox. */
export default function CustomSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const {
    children, value, defaultValue, onChange, className = "", style, disabled, id,
    onFocus, onBlur, onKeyDown, onMouseDown, onInvalid, ...nativeProps
  } = props;
  const generatedId = useId();
  const triggerId = id ?? `ats-select-${generatedId}`;
  const menuId = `${triggerId}-menu`;
  const rootRef = useRef<HTMLSpanElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef({ text: "", time: 0 });
  const options = readOptions(children);
  const [localValue, setLocalValue] = useState(String(defaultValue ?? options[0]?.value ?? ""));
  const selectedValue = String(value ?? localValue);
  const foundIndex = options.findIndex(option => option.value === selectedValue);
  const selectedIndex = foundIndex < 0 ? 0 : foundIndex;
  const selected = options[selectedIndex];
  const locked = !!disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState({ left: 0, top: 0, width: 200, maxHeight: 280 });
  const longest = options.reduce((label, option) => option.label.length > label.length ? option.label : label, "");

  const openMenu = (edge?: "first" | "last") => {
    if (locked) return;
    const first = options.findIndex(option => !option.disabled);
    const last = options.map(option => !option.disabled).lastIndexOf(true);
    setActiveIndex(edge === "first" ? first : edge === "last" ? last
      : !selected?.disabled ? selectedIndex : first);
    setOpen(true);
  };

  const choose = (index: number) => {
    const option = options[index];
    if (locked || !option || option.disabled) return;
    const native = nativeRef.current;
    if (native && native.value !== option.value) {
      native.value = option.value;
      native.dispatchEvent(new Event("change", { bubbles: true }));
    }
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => { if (locked) setOpen(false); }, [locked]);

  useLayoutEffect(() => {
    if (!open) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, 200), window.innerWidth - 16);
      const desiredHeight = Math.min(280, options.length * 36 + 10);
      const below = window.innerHeight - rect.bottom - 14;
      const above = rect.top - 14;
      const flip = below < Math.min(desiredHeight, 160) && above > below;
      const maxHeight = Math.max(36, Math.min(desiredHeight, flip ? above : below));
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: flip ? rect.top - maxHeight - 6 : rect.bottom + 6,
        width, maxHeight,
      });
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)
        && !menuRef.current?.contains(event.target)) setOpen(false);
    };
    const scroll = (event: Event) => {
      if (!(event.target instanceof Node) || !menuRef.current?.contains(event.target)) updatePosition();
    };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setOpen(false); });
    if (triggerRef.current) observer.observe(triggerRef.current);
    updatePosition();
    document.addEventListener("pointerdown", outside);
    document.addEventListener("scroll", scroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      observer.disconnect();
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("scroll", scroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, children]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector(`#${CSS.escape(`${menuId}-${activeIndex}`)}`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, menuId]);

  const move = (direction: number) => {
    for (let offset = 1; offset <= options.length; offset++) {
      const index = (activeIndex + direction * offset + options.length) % options.length;
      if (!options[index].disabled) { setActiveIndex(index); return; }
    }
  };

  return (
    <span
      ref={rootRef}
      className="ats-custom-select"
      style={{ width: style?.width ?? (className.split(/\s+/).includes("w-full") ? "100%" : undefined) }}
    >
      <select
        {...nativeProps}
        ref={nativeRef}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        className="ats-custom-select-native"
        onChange={event => { setLocalValue(event.target.value); onChange?.(event); }}
        onFocus={onFocus}
        onBlur={onBlur}
        onInvalid={event => { onInvalid?.(event); event.preventDefault(); triggerRef.current?.focus(); }}
      >
        {children}
      </select>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        role="combobox"
        aria-label={props["aria-label"]}
        aria-labelledby={props["aria-labelledby"]}
        aria-describedby={props["aria-describedby"]}
        aria-required={props.required || props["aria-required"]}
        aria-invalid={props["aria-invalid"]}
        aria-disabled={locked || undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-activedescendant={open && options[activeIndex] ? `${menuId}-${activeIndex}` : undefined}
        disabled={disabled}
        className={`ats-custom-select-trigger ${className}`}
        style={{ ...style, paddingRight: 32, backgroundImage: "none", textAlign: "left" }}
        title={props.title ?? selected?.label}
        onFocus={() => nativeRef.current?.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))}
        onBlur={() => { nativeRef.current?.dispatchEvent(new FocusEvent("focusout", { bubbles: true })); setOpen(false); }}
        onMouseDown={event => onMouseDown?.(event as unknown as Parameters<NonNullable<typeof onMouseDown>>[0])}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={event => {
          onKeyDown?.(event as unknown as Parameters<NonNullable<typeof onKeyDown>>[0]);
          if (event.defaultPrevented || locked) return;
          if (event.key === "Escape") {
            if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
          } else if (event.key === "Tab") {
            setOpen(false);
          } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            if (!open) openMenu(); else move(event.key === "ArrowDown" ? 1 : -1);
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault(); openMenu(event.key === "Home" ? "first" : "last");
          } else if (event.key === "Enter" || event.key === " ") {
            event.preventDefault(); if (open) choose(activeIndex); else openMenu();
          } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            const now = Date.now();
            searchRef.current = { text: (now - searchRef.current.time < 700 ? searchRef.current.text : "") + event.key.toLocaleLowerCase(), time: now };
            const index = options.findIndex(option => !option.disabled && option.label.toLocaleLowerCase().startsWith(searchRef.current.text));
            if (index >= 0) { setActiveIndex(index); setOpen(true); }
          }
        }}
      >
        <span className="ats-custom-select-label">
          <span>{selected?.label ?? "선택"}</span>
          <span className="ats-custom-select-sizer" aria-hidden="true">{longest}</span>
        </span>
        <ChevronDown className="ats-custom-select-chevron" aria-hidden="true" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="listbox"
          aria-label={props["aria-label"] ?? selected?.label ?? "선택 항목"}
          className="ats-custom-select-menu"
          style={position}
          onPointerDown={event => event.preventDefault()}
        >
          {options.length === 0 && <div className="ats-custom-select-empty">선택할 항목이 없습니다.</div>}
          {options.map((option, index) => (
            <div
              id={`${menuId}-${index}`}
              key={`${option.value}-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              aria-disabled={option.disabled || undefined}
              data-active={index === activeIndex || undefined}
              className="ats-custom-select-option"
              title={option.label}
              onPointerMove={() => { if (!option.disabled) setActiveIndex(index); }}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {index === selectedIndex && <Check aria-hidden="true" />}
            </div>
          ))}
        </div>, document.body,
      )}
    </span>
  );
}
