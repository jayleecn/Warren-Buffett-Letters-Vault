import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { ensureFullGitHistory } from "./gitHistory.js";

const contentDate = "2026-09-06T10:00:00.000Z";
const deploymentDate = "2026-10-18T07:00:00.000Z";
const cli = fileURLToPath(new URL("../bootstrap-cli.mjs", import.meta.url));
const project = fileURLToPath(new URL("../../", import.meta.url));

function git(directory, ...args) {
  return execFileSync("git", ["-C", directory, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "quartz-git-history-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, "source");
  mkdirSync(join(source, "content"), { recursive: true });
  git(source, "init", "--initial-branch=main");
  git(source, "config", "user.name", "Git history test");
  git(source, "config", "user.email", "fixture@example.invalid");
  function commit(date, message) {
    git(source, "add", ".");
    execFileSync("git", ["-C", source, "commit", "-m", message], {
      stdio: "pipe",
      env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date },
    });
  }
  writeFileSync(join(source, "content", "letter.md"), "# Historical letter\n");
  commit(contentDate, "Add content");
  writeFileSync(join(source, "app.js"), "// Unrelated deployment change\n");
  commit(deploymentDate, "Change only application code");
  function clone(name, from = source) {
    const directory = join(root, name);
    git(root, "clone", "--depth=1", pathToFileURL(from).href, directory);
    assert.equal(
      git(directory, "rev-parse", "--is-shallow-repository"),
      "true",
    );
    return directory;
  }
  const modified = (directory) =>
    new Date(
      git(directory, "log", "-1", "--format=%cI", "--", "content/letter.md"),
    ).toISOString();
  return { root, source, clone, modified };
}

test("a real shallow clone recovers content dates without moving HEAD or changing files", (t) => {
  const { source, clone, modified } = fixture(t);
  const directory = clone("shallow");
  git(directory, "checkout", "--detach");
  const head = git(directory, "rev-parse", "HEAD");
  const content = readFileSync(join(directory, "content", "letter.md"), "utf8");
  assert.equal(modified(directory), deploymentDate);

  ensureFullGitHistory(join(directory, "content"));

  assert.equal(git(directory, "rev-parse", "--is-shallow-repository"), "false");
  assert.equal(modified(directory), contentDate);
  assert.equal(modified(directory), modified(source));
  assert.equal(git(directory, "rev-parse", "HEAD"), head);
  assert.equal(git(directory, "status", "--porcelain"), "");
  assert.equal(
    readFileSync(join(directory, "content", "letter.md"), "utf8"),
    content,
  );
});

test("complete history preserves dates and requires no remote fetch", (t) => {
  const { source, modified } = fixture(t);
  git(source, "remote", "add", "origin", join(source, "missing-remote"));
  ensureFullGitHistory(join(source, "content"));
  assert.equal(modified(source), contentDate);
  assert.equal(git(source, "status", "--porcelain"), "");
});

test("a failed shallow fetch throws instead of permitting filesystem fallback", (t) => {
  const { clone, modified } = fixture(t);
  const directory = clone("unreachable");
  git(
    directory,
    "remote",
    "set-url",
    "origin",
    join(directory, "missing-remote"),
  );
  assert.throws(
    () => ensureFullGitHistory(directory),
    /without complete Git history/,
  );
  assert.equal(git(directory, "rev-parse", "--is-shallow-repository"), "true");
  assert.equal(modified(directory), deploymentDate);
});

test("fetching from an incomplete origin still fails closed", (t) => {
  const { clone } = fixture(t);
  const shallowOrigin = clone("incomplete-origin");
  const directory = clone("incomplete-consumer", shallowOrigin);
  assert.throws(
    () => ensureFullGitHistory(directory),
    /without complete Git history/,
  );
  assert.equal(git(directory, "rev-parse", "--is-shallow-repository"), "true");
});

test("a content directory outside Git keeps local-build behavior", (t) => {
  const { root } = fixture(t);
  const directory = join(root, "local-content");
  mkdirSync(directory);
  writeFileSync(join(directory, "index.md"), "# Local note\n");
  assert.doesNotThrow(() => ensureFullGitHistory(directory));
});

test("unreadable or missing content directories are not mistaken for non-Git content", (t) => {
  const { root } = fixture(t);
  assert.throws(
    () => ensureFullGitHistory(join(root, "missing")),
    /without complete Git history/,
  );
});

test("the real Quartz CLI aborts before cleaning output or generating any dates", (t) => {
  const { root, clone } = fixture(t);
  const directory = clone("blocked-build");
  git(
    directory,
    "remote",
    "set-url",
    "origin",
    join(directory, "missing-remote"),
  );
  const output = join(root, "public");
  mkdirSync(output);
  writeFileSync(join(output, "sitemap.xml"), "previous sitemap\n");
  const result = spawnSync(
    process.execPath,
    [cli, "build", "-d", join(directory, "content"), "-o", output],
    {
      cwd: project,
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  assert.equal(result.status, 1, result.stderr);
  assert.match(result.stderr, /without complete Git history/);
  assert.doesNotMatch(
    result.stdout,
    /Cleaned output|Parsing input|Done processing/,
  );
  assert.equal(
    readFileSync(join(output, "sitemap.xml"), "utf8"),
    "previous sitemap\n",
  );
});
