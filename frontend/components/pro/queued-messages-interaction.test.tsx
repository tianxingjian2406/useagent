// The interaction half of the queued-messages tests: register happy-dom's
// globals BEFORE react-dom/client loads, mount the real QueuedMessages, remove
// a row, and read the live focus. Removing a row must not strand the keyboard
// user: focus lands on the next row's Remove, or the reply box when none left.
import { expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof window === "undefined") GlobalRegistrator.register();

const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { QueuedMessages } = await import("./queued-messages");
import type { QueuedMessage } from "./queued-messages";

const flushFrame = () => new Promise<void>((resolve) => setTimeout(resolve, 60));

function mountComposer(): HTMLTextAreaElement {
  const composer = document.createElement("div");
  composer.setAttribute("data-session-ui", "reply-composer");
  const textarea = document.createElement("textarea");
  composer.appendChild(textarea);
  document.body.appendChild(composer);
  return textarea;
}

function msg(id: string, position: number): QueuedMessage {
  return { id, position, text: `queued ${id}` };
}

test("removing a queued message focuses the next row's Remove button", async () => {
  const textarea = mountComposer();
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  let messages: QueuedMessage[] = [msg("a", 1), msg("b", 2)];
  const onRemove = async (id: string) => {
    messages = messages.filter((m) => m.id !== id);
    await rerender();
  };
  const rerender = async () => {
    await act(async () => {
      root.render(<QueuedMessages messages={messages} onRemove={onRemove} />);
    });
  };
  await rerender();

  const first = host.querySelector<HTMLButtonElement>('[aria-label="Remove queued message 1"]');
  expect(first).not.toBeNull();
  await act(async () => {
    first?.click();
  });
  await flushFrame();

  expect(document.activeElement?.getAttribute("aria-label")).toBe("Remove queued message 2");

  root.unmount();
  textarea.parentElement?.remove();
  host.remove();
});

test("removing the last queued message focuses the reply box", async () => {
  const textarea = mountComposer();
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);

  let messages: QueuedMessage[] = [msg("only", 1)];
  const onRemove = async (id: string) => {
    messages = messages.filter((m) => m.id !== id);
    await rerender();
  };
  const rerender = async () => {
    await act(async () => {
      root.render(<QueuedMessages messages={messages} onRemove={onRemove} />);
    });
  };
  await rerender();

  const remove = host.querySelector<HTMLButtonElement>('[aria-label="Remove queued message 1"]');
  expect(remove).not.toBeNull();
  await act(async () => {
    remove?.click();
  });
  await flushFrame();

  expect(document.activeElement).toBe(textarea);

  root.unmount();
  textarea.parentElement?.remove();
  host.remove();
});
