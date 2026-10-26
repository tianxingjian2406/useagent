// The interaction half of the scroll-to-end tests: register happy-dom's
// globals BEFORE react-dom/client loads, mount the real ScrollToEndPill next
// to a stand-in composer, click the pill, and read the live focus. The pill
// unmounts itself once the reader is at the end; that must not drop focus.
import { expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof window === "undefined") GlobalRegistrator.register();

const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { ScrollToEndPill } = await import("./scroll-to-end-pill");
import type { RefObject } from "react";

test("activating Scroll to end jumps and keeps focus in the reply box", async () => {
  const composer = document.createElement("div");
  composer.setAttribute("data-session-ui", "reply-composer");
  const textarea = document.createElement("textarea");
  composer.appendChild(textarea);
  document.body.appendChild(composer);

  const scroller = document.createElement("div");
  document.body.appendChild(scroller);
  Object.defineProperty(scroller, "scrollHeight", { value: 500, configurable: true });
  Object.defineProperty(scroller, "clientHeight", { value: 200, configurable: true });
  Object.defineProperty(scroller, "scrollTop", {
    value: 0,
    writable: true,
    configurable: true,
  });
  const scrollRef: RefObject<HTMLElement | null> = { current: scroller };

  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => {
    root.render(<ScrollToEndPill scrollRef={scrollRef} />);
  });

  const pill = host.querySelector<HTMLButtonElement>('[data-session-ui="scroll-to-end"]');
  expect(pill).not.toBeNull();

  await act(async () => {
    pill?.click();
  });

  expect(scroller.scrollTop).toBe(500);
  expect(document.activeElement).toBe(textarea);

  root.unmount();
  composer.remove();
  scroller.remove();
});
