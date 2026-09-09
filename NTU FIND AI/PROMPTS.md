# NTU FindAI Prompt Variants

The editable source of truth is `prompts.js`. This document explains the experimental design for teammates and assessors.

## Version A — Minimal LLM baseline

Module 1 gives only a short request to find and explain three matches. Module 2 gives only a short request to ask an ownership question and evaluate the answer. It intentionally excludes detailed matching criteria, uncertainty rules, and privacy safeguards.

## Version B — Simplified system

Module 1 defines the university lost-and-found role, basic matching attributes, ranking, scores, and a follow-up question. Module 2 adds a basic instruction not to reveal the expected answer and uses weak/medium/strong evidence. It intentionally excludes the detailed safety and exception-handling rules in C.

## Version C — Full system

Module 1 includes structured attribute interpretation, conservative ranking, synonyms, uncertainty, no-invention rules, public/private separation, and no-ownership-confirmation rules. Module 2 includes neutral questioning, semantic comparison, information-leakage prevention, cautious treatment of weak answers, one additional question, and mandatory human review.

## Fair-comparison controls

Keep the following identical across A, B, and C:

- the same 20 test reports;
- the same found-item records;
- the same LLM model and API settings;
- the same interface and JSON output schema;
- the same evaluation rubric.

Only the prompt instructions should change.
