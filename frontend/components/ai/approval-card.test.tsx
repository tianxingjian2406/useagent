// The interaction half of the approval-card tests: register happy-dom's
// globals BEFORE react-dom/client loads, mount the real ApprovalCard, click
// Approve, and read what actually mounted. The tool approval card always
// passes exactly one option; that card must approve in one click.
import { describe, expect, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

if (typeof window === "undefined") GlobalRegistrator.register();

const { act } = await import("react");
const { createRoot } = await import("react-dom/client");
const { ApprovalCard } = await import("./approval-card");

const roots: ReturnType<typeof createRoot>[] = [];

async function mountCard(options: { label: string; detail?: string }[]): Promise<HTMLDivElement> {
  const host = document.createElement("div");
  document.body.appendChild(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => {
    root.render(
      <ApprovalCard
        question="Run this command?"
        options={options}
        onApprove={() => {}}
        onDeny={() => {}}
      />,
    );
  });
  return host;
}

describe("ApprovalCard", () => {
  test("a single option starts selected and Approve works at once", async () => {
    const seen = { approved: null as string | null };
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    roots.push(root);
    await act(async () => {
      root.render(
        <ApprovalCard
          question="Run this command?"
          options={[{ label: "Allow once" }]}
          onApprove={(option) => {
            seen.approved = option.label;
          }}
          onDeny={() => {}}
        />,
      );
    });
    const approve = [...host.querySelectorAll("button")].find((b) => b.textContent === "Approve");
    expect(approve?.disabled).toBe(false);
    await act(async () => {
      approve?.click();
    });
    expect(seen.approved).toBe("Allow once");
  });

  test("two options keep Approve disabled until a choice is made", async () => {
    const host = await mountCard([
      { label: "Allow once" },
      { label: "Always allow" },
    ]);
    const approve = [...host.querySelectorAll("button")].find((b) => b.textContent === "Approve");
    expect(approve?.disabled).toBe(true);
    const choice = [...host.querySelectorAll("button")].find((b) => b.textContent === "Always allow");
    await act(async () => {
      choice?.click();
    });
    expect(approve?.disabled).toBe(false);
  });
});
