"use client";

import { useState } from "react";
import ui from "@/components/ui.module.css";
import styles from "./RepoInput.module.css";

interface Props {
  repos: string[];
  suggestions: string[];
  onChange: (repos: string[]) => void;
}

export function RepoInput({ repos, suggestions, onChange }: Props) {
  const [draft, setDraft] = useState("");
  const add = (value: string) => {
    const repo = value.trim().replace(/^https?:\/\/github\.com\//, "");
    if (repo && !repos.includes(repo)) onChange([...repos, repo]);
    setDraft("");
  };
  const unused = suggestions.filter((repo) => !repos.includes(repo));
  return (
    <div className={ui.field}>
      <label className={ui.label} htmlFor="repo-input">
        Repositories
      </label>
      <div className={styles.box}>
        {repos.map((repo) => (
          <span key={repo} className={styles.chip}>
            {repo}
            <button
              type="button"
              aria-label={`Remove ${repo}`}
              onClick={() => onChange(repos.filter((r) => r !== repo))}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="repo-input"
          className={styles.input}
          value={draft}
          placeholder={repos.length ? "Add another…" : "owner/repo"}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === "," || event.key === " ") {
              event.preventDefault();
              add(draft);
            } else if (event.key === "Backspace" && !draft && repos.length) {
              onChange(repos.slice(0, -1));
            }
          }}
          onBlur={() => draft && add(draft)}
        />
      </div>
      {unused.length ? (
        <div className={styles.suggestions}>
          {unused.map((repo) => (
            <button
              key={repo}
              type="button"
              className={styles.suggestion}
              onClick={() => add(repo)}
            >
              + {repo}
            </button>
          ))}
        </div>
      ) : null}
      <span className={ui.hint}>
        Mounted into the agent’s sandbox at /workspace/&lt;repo&gt; using the server’s GitHub token.
      </span>
    </div>
  );
}
