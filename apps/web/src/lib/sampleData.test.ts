import { describe, expect, it } from "vitest";
import { project } from "./boxes";
import { SAMPLE, buildSample } from "./sampleData";

const NOW = 1_800_000_000;

describe("sample data", () => {
  const data = buildSample(NOW);
  const opts = { whitelist: data.whitelist.pubkeys, now: NOW, sample: true };

  it("is marked as sample", () => {
    expect(SAMPLE).toBe(true);
    expect(data.sample).toBe(true);
  });

  it("projects to boxes, all flagged sample", () => {
    const vms = project(data.boxes, data.comments, { ...opts, showEveryone: true });
    expect(vms).toHaveLength(8);
    expect(vms.every((v) => v.box.sample === true && v.sample)).toBe(true);
  });

  it("hides the unknown box by default", () => {
    const vms = project(data.boxes, data.comments, { ...opts, showEveryone: false });
    expect(vms).toHaveLength(7);
  });

  it("includes waiting, empty, differs and unknown states", () => {
    const states = new Set(
      project(data.boxes, data.comments, { ...opts, showEveryone: true }).map(
        (v) => v.status.state,
      ),
    );
    expect(states).toContain("letters-waiting");
    expect(states).toContain("empty");
    expect(states).toContain("differs");
  });
});
