// A tiny LIFO registry of "open overlay" close handlers (mobile menu, modals,
// image lightbox). The Android hardware back button consults this first so it
// closes the top overlay instead of navigating away / exiting the app.

type CloseFn = () => void;

const stack: CloseFn[] = [];

/** Register an overlay's close handler while it is open. Returns an unregister
 *  function — call it (e.g. in a useEffect cleanup) when the overlay closes. */
export function pushOverlay(close: CloseFn): () => void {
  stack.push(close);
  return () => {
    const i = stack.lastIndexOf(close);
    if (i >= 0) stack.splice(i, 1);
  };
}

/** Close the top-most open overlay, if any. Returns true if one was closed. */
export function handleOverlayBack(): boolean {
  const close = stack.pop();
  if (close) {
    close();
    return true;
  }
  return false;
}
