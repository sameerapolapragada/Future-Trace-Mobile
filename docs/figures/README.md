# Process flow figures

PNG exports and Mermaid source for Feature 1 & 2 user flows.

| PNG (view/share) | Source `.mmd` | Description |
|------------------|---------------|-------------|
| `figure-1-free-career-scan.png` | `figure-1-free-career-scan.mmd` | Feature 1 — Free Career Scan |
| `figure-2-career-xray-transition-roles.png` | `figure-2-career-xray-transition-roles.mmd` | Feature 2 — Career X-Ray → Transition Roles → Transition Paths |
| `figure-3-combined-happy-path.png` | `figure-3-combined-happy-path.mmd` | Combined end-to-end happy path |

Regenerate PNGs from source:

```bash
cd docs/figures
npx @mermaid-js/mermaid-cli -i figure-1-free-career-scan.mmd -o figure-1-free-career-scan.png -b transparent
npx @mermaid-js/mermaid-cli -i figure-2-career-xray-transition-roles.mmd -o figure-2-career-xray-transition-roles.png -b transparent
npx @mermaid-js/mermaid-cli -i figure-3-combined-happy-path.mmd -o figure-3-combined-happy-path.png -b transparent
```

Full narrative and step tables: [`../FEATURE_1_AND_2_PROCESS_FLOW.md`](../FEATURE_1_AND_2_PROCESS_FLOW.md)
