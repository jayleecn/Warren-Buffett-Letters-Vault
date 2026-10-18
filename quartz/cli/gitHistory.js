import { spawnSync } from "node:child_process";

// Run once before the build starts, not once per Markdown parser worker.
export function ensureFullGitHistory(directory) {
  const git = (args) =>
    spawnSync("git", ["-C", directory, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120_000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: "0", LC_ALL: "C" },
    });
  const shallow = () => git(["rev-parse", "--is-shallow-repository"]);
  const initial = shallow();

  // Preserve local builds of content outside Git. Other Git errors must not
  // silently turn a tracked page's lastmod into its checkout time.
  if (
    !initial.error &&
    initial.status !== 0 &&
    /^fatal: not a git repository\b/.test(initial.stderr)
  ) {
    return;
  }
  if (initial.status === 0 && initial.stdout.trim() === "false") return;

  if (initial.status === 0 && initial.stdout.trim() === "true") {
    console.log(
      "Fetching complete Git history for accurate content modification dates...",
    );
    const fetched = git(["fetch", "--no-tags", "--unshallow", "origin"]);
    if (fetched.status === 0) {
      const verified = shallow();
      if (verified.status === 0 && verified.stdout.trim() === "false") return;
    }
  }

  // Never continue with checkout mtimes or a shallow-boundary commit as lastmod.
  throw new Error(
    "Cannot build accurate content dates without complete Git history. " +
      "Run `git fetch --unshallow origin` in the content repository, verify " +
      "`git rev-parse --is-shallow-repository` returns false, and retry the build.",
  );
}
