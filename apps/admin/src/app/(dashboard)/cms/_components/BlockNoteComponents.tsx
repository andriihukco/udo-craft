"use client";

/**
 * Minimal BlockNote ComponentsContext provider.
 * Only SuggestionMenu is implemented — everything else returns null.
 */

import { ComponentType, ReactNode } from "react";
import { ComponentsContext, type Components } from "@blocknote/react";
import { cn } from "@/lib/utils";

// ── SuggestionMenu ────────────────────────────────────────────────────────────

const SuggestionMenuRoot: ComponentType<{ id: string; className?: string; children?: ReactNode }> = ({ id, className, children }) => (
  <div
    id={id}
    role="listbox"
    aria-label="Slash menu"
    className={cn(
      "z-50 w-64 max-h-72 overflow-y-auto rounded-xl border border-border bg-background shadow-xl py-1",
      className,
    )}
  >
    {children}
  </div>
);

const SuggestionMenuLabel: ComponentType<{ className?: string; children?: ReactNode }> = ({ className, children }) => (
  <p className={cn("px-3 pt-2 pb-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground", className)}>
    {children}
  </p>
);

const SuggestionMenuEmptyItem: ComponentType<{ className?: string; children?: ReactNode }> = ({ className, children }) => (
  <p className={cn("px-3 py-2 text-sm text-muted-foreground", className)}>{children}</p>
);

const SuggestionMenuLoader: ComponentType<{ className?: string }> = ({ className }) => (
  <p className={cn("px-3 py-2 text-sm text-muted-foreground", className)}>Завантаження…</p>
);

const SuggestionMenuItem: ComponentType<{
  className?: string;
  id: string;
  isSelected: boolean;
  onClick: () => void;
  item: { title: string; subtext?: string; icon?: ReactNode };
}> = ({ className, id, isSelected, onClick, item }) => (
  <button
    id={id}
    type="button"
    role="option"
    aria-selected={isSelected}
    // Use onMouseDown so the click fires before the editor loses focus.
    // preventDefault stops the editor from blurring (FloatingUI already does
    // this via onMouseDownCapture, but we need it here too for the item itself).
    onMouseDown={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      "w-full flex items-center gap-2.5 px-3 py-1.5 text-sm text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
      isSelected ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50",
      className,
    )}
  >
    {item.icon && (
      <span className="size-7 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground shrink-0">
        {item.icon}
      </span>
    )}
    <span className="flex flex-col min-w-0">
      <span className="font-medium text-foreground truncate">{item.title}</span>
      {item.subtext && <span className="text-[11px] text-muted-foreground truncate">{item.subtext}</span>}
    </span>
  </button>
);

// ── Null stubs for everything else ────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Null: ComponentType<any> = () => null;

const components: Components = {
  SuggestionMenu: {
    Root: SuggestionMenuRoot,
    EmptyItem: SuggestionMenuEmptyItem,
    Item: SuggestionMenuItem,
    Label: SuggestionMenuLabel,
    Loader: SuggestionMenuLoader,
  },
  GridSuggestionMenu: { Root: Null, EmptyItem: Null, Item: Null, Loader: Null },
  FormattingToolbar: { Root: Null, Button: Null, Select: Null },
  LinkToolbar: { Root: Null, Button: Null, Select: Null },
  FilePanel: { Root: Null, Button: Null, FileInput: Null, TabPanel: Null, TextInput: Null },
  SideMenu: { Root: Null, Button: Null },
  TableHandle: { Root: Null, ExtendButton: Null },
  Comments: { Card: Null, CardSection: Null, ExpandSectionsPrompt: Null, Editor: Null, Comment: Null },
  Generic: {
    Badge: { Root: Null, Group: Null },
    Form: { Root: Null, TextInput: Null },
    Menu: { Root: Null, Divider: Null, Dropdown: Null, Item: Null, Label: Null, Trigger: Null, Button: Null },
    Popover: { Root: Null, Content: Null, Trigger: Null },
    Toolbar: { Root: Null, Button: Null, Select: Null },
  },
};

export function BlockNoteComponentsProvider({ children }: { children: ReactNode }) {
  return (
    <ComponentsContext.Provider value={components}>
      {children}
    </ComponentsContext.Provider>
  );
}
