import { cloneElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import {
  useFloating, autoUpdate, offset, flip, shift,
  useClick, useDismiss, useRole, useInteractions,
  FloatingPortal, FloatingFocusManager,
} from '@floating-ui/react';

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactElement<Record<string, unknown>>;
  children: ReactNode;
  className?: string;
  /** Extra inline style for the floating panel. Merged *under* `floatingStyles`
   *  so positioning always wins. Used to forward `--drp-*` theme tokens onto
   *  the portalled panel, which cannot inherit them from `.drp-root`. */
  style?: CSSProperties;
  /**
   * When true, the click-to-toggle interaction is disabled on the trigger.
   * Use this when the parent manages `open` via focus events instead of clicks,
   * so that clicking an input inside the trigger does not toggle the popover
   * closed immediately after the focus handler opens it.
   */
  disableClickToggle?: boolean;
}

/** Anchored, dismissible popover built on floating-ui. */
export function Popover({ open, onOpenChange, trigger, children, className, style, disableClickToggle }: PopoverProps) {
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange,
    placement: 'bottom-start',
    whileElementsMounted: autoUpdate,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
  });

  const click = useClick(context, { enabled: !disableClickToggle });
  const dismiss = useDismiss(context);
  const role = useRole(context, { role: 'dialog' });
  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss, role]);

  return (
    <>
      {cloneElement(
        trigger,
        getReferenceProps({ ref: refs.setReference, ...trigger.props }),
      )}
      {open && (
        <FloatingPortal>
          {/*
            `disabled` prevents FloatingFocusManager from stealing focus away
            from the text inputs when the popover opens. Escape-key and
            outside-click dismissal still work because those come from useDismiss.
          */}
          <FloatingFocusManager context={context} modal={false} disabled>
            <div
              ref={refs.setFloating}
              style={{ ...style, ...floatingStyles }}
              className={className}
              {...getFloatingProps()}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
}
