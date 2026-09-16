"use client";

import {
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export type BouncyAccordionItem = {
  id: string;
  category?: string;
  badgeColor?: string;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};

export type BouncyAccordionClassNames = {
  root?: string;
  item?: string;
  trigger?: string;
  icon?: string;
  title?: string;
  chevron?: string;
  content?: string;
  description?: string;
};

export interface BouncyAccordionProps {
  items: BouncyAccordionItem[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  collapsible?: boolean;
  className?: string;
  classNames?: BouncyAccordionClassNames;
}

// Exact spring transitions from official @beui/bouncy-accordion registry
const ROW_TRANSITION: Transition = {
  type: "spring",
  duration: 0.55,
  bounce: 0.38,
};

const CONTENT_OPEN_TRANSITION: Transition = {
  type: "spring",
  duration: 0.58,
  bounce: 0.32,
};

const CONTENT_CLOSE_TRANSITION: Transition = {
  type: "spring",
  duration: 0.46,
  bounce: 0.26,
};

const DESCRIPTION_TRANSITION: Transition = {
  duration: 0.18,
  ease: EASE_OUT,
};

const CHEVRON_TRANSITION: Transition = {
  type: "spring",
  duration: 0.42,
  bounce: 0.28,
};

function useControllableAccordionValue({
  value,
  defaultValue,
  onValueChange,
}: {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
}) {
  const [internalValue, setInternalValue] = useState<string | null>(defaultValue ?? null);
  const isControlled = value !== undefined;
  const currentValue = value ?? internalValue;

  const setValue = useCallback(
    (next: string | null) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return [currentValue, setValue] as const;
}

function BouncyAccordionRow({
  item,
  open,
  startsGroup,
  endsGroup,
  separatedFromPrevious,
  contentId,
  triggerId,
  reduce,
  classNames,
  onToggle,
}: {
  item: BouncyAccordionItem;
  open: boolean;
  startsGroup: boolean;
  endsGroup: boolean;
  separatedFromPrevious: boolean;
  contentId: string;
  triggerId: string;
  reduce: boolean | null;
  classNames?: BouncyAccordionClassNames;
  onToggle: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const updateHeight = () => {
      setContentHeight(node.offsetHeight);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <motion.div
      layout="position"
      initial={false}
      style={{ marginTop: separatedFromPrevious ? 12 : 0 }}
      transition={reduce ? { duration: 0 } : ROW_TRANSITION}
    >
      <motion.div
        data-state={open ? "open" : "closed"}
        initial={false}
        animate={{
          borderTopLeftRadius: startsGroup ? 28 : 0,
          borderTopRightRadius: startsGroup ? 28 : 0,
          borderBottomLeftRadius: endsGroup ? 28 : 0,
          borderBottomRightRadius: endsGroup ? 28 : 0,
        }}
        transition={reduce ? { duration: 0 } : ROW_TRANSITION}
        className={cn(
          "overflow-hidden border border-zinc-200/80 dark:border-white/10 bg-white/90 dark:bg-[#16161B]/90 text-zinc-900 dark:text-white backdrop-blur-md transition-colors duration-300",
          open && "border-[#0066B2]/50 dark:border-[#38BDF8]/50 bg-white dark:bg-[#1C1C24] shadow-2xl ring-1 ring-[#0066B2]/30 dark:ring-[#38BDF8]/30",
          item.disabled && "opacity-50 pointer-events-none",
          classNames?.item
        )}
      >
        <button
          id={triggerId}
          type="button"
          disabled={item.disabled}
          aria-expanded={open}
          aria-controls={contentId}
          onClick={onToggle}
          className={cn(
            "flex min-h-[64px] w-full items-center justify-between gap-4 p-5 sm:p-6 text-left outline-none cursor-pointer transition-colors focus-visible:bg-zinc-100/50 dark:focus-visible:bg-white/5",
            classNames?.trigger
          )}
        >
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            {item.category && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border backdrop-blur-md",
                    item.badgeColor ?? "bg-blue-500/10 text-[#0066B2] dark:text-[#38BDF8] border-[#0066B2]/20"
                  )}
                >
                  {item.icon}
                  {item.category}
                </span>
              </div>
            )}
            <h3
              className={cn(
                "text-base sm:text-lg font-extrabold text-zinc-900 dark:text-white leading-snug group-hover:text-[#0066B2] dark:group-hover:text-[#38BDF8] transition-colors",
                classNames?.title
              )}
            >
              {item.title}
            </h3>
          </div>

          {/* Exact Bouncy Accordion Rotating Arrow */}
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={reduce ? { duration: 0 } : CHEVRON_TRANSITION}
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center text-zinc-400 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors",
              classNames?.chevron
            )}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>

        <motion.div
          layout="size"
          id={contentId}
          role="region"
          aria-labelledby={triggerId}
          aria-hidden={!open}
          inert={!open ? ("" as unknown as boolean) : undefined}
          initial={false}
          style={{ height: open && item.description ? contentHeight : 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : open
              ? CONTENT_OPEN_TRANSITION
              : CONTENT_CLOSE_TRANSITION
          }
          className={cn("overflow-hidden", classNames?.content)}
        >
          <motion.div
            ref={contentRef}
            animate={{
              opacity: open ? 1 : 0,
            }}
            transition={reduce ? { duration: 0 } : DESCRIPTION_TRANSITION}
            className="px-5 pb-6 pt-1 sm:px-6"
          >
            <div
              className={cn(
                "text-xs sm:text-sm leading-relaxed text-zinc-600 dark:text-zinc-300",
                classNames?.description
              )}
            >
              {item.description}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function BouncyAccordion({
  items,
  value,
  defaultValue = null,
  onValueChange,
  collapsible = true,
  className,
  classNames,
}: BouncyAccordionProps) {
  const reduce = useReducedMotion();
  const baseId = useId();
  const [activeValue, setActiveValue] = useControllableAccordionValue({
    value,
    defaultValue,
    onValueChange,
  });
  const activeIndex = items.findIndex((item) => item.id === activeValue);

  const toggleItem = useCallback(
    (id: string) => {
      if (activeValue === id) {
        if (collapsible) {
          setActiveValue(null);
        }
        return;
      }
      setActiveValue(id);
    },
    [activeValue, collapsible, setActiveValue]
  );

  return (
    <div className={cn("w-full flex flex-col", className, classNames?.root)}>
      {items.map((item, index) => {
        const open = activeValue === item.id;
        const previousIsOpen = activeIndex === index - 1;
        const nextIsOpen = activeIndex === index + 1;
        const startsGroup = open || index === 0 || previousIsOpen;
        const endsGroup = open || index === items.length - 1 || nextIsOpen;
        const separatedFromPrevious = index > 0 && (open || previousIsOpen);
        const contentId = `${baseId}-${item.id}-content`;
        const triggerId = `${baseId}-${item.id}-trigger`;

        return (
          <BouncyAccordionRow
            key={item.id}
            item={item}
            open={open}
            startsGroup={startsGroup}
            endsGroup={endsGroup}
            separatedFromPrevious={separatedFromPrevious}
            contentId={contentId}
            triggerId={triggerId}
            reduce={reduce}
            classNames={classNames}
            onToggle={() => toggleItem(item.id)}
          />
        );
      })}
    </div>
  );
}
