# AGENTS.md

## Purpose
> Replace this section with your project or repository purpose.
This file provides a TEMPLATE of an AGENTS.md. Replace the 3 steps below with your own technical requirements. 
An AGENTS.md file acts as a centralized configuration and context layer placed at the root of a repository.  
It outlines exact build steps, test instructions, coding conventions, and constraints that an AI agent cannot automatically infer from code alone.
Think of this file as a "letter" to your AI Agent with technical instructions.
---

## 1. Core Workflow (Spec-Driven Development)
* **Plan First:** You must always use **PLAN mode** (or design thinking) before making edits.
* **Review Specs:** Read `requirements.md` to understand objectives before touching code if it exists.
* **Propose Changes:** Present file-modification plans to the student for confirmation first.

## 2. Technical Environment & Commands
> Replace these technical requirements with your own (although this is a good starter point)
* **Language/Stack:** Python 3.11+
* **Build Commands:** `pip install -r requirements.txt`
* **Test Command:** `pytest`

## 3. Style and Quality Constraints
> Replace these technical requirements with your own (although this is a good starter point)
* Keep files modular and functions under 20 lines.
* Write docstrings for all public methods.
* Run tests automatically after any architectural file change.

---

## Additional Example: Calculator API Implementation
> These are additional types of instructions you could detail in this file.
* **Agent Behavior:** The agent must inspect `requirements.md` and use plan mode to outline the Calculator's folder structure.
* **Agent Build Action:** Run `pytest` to verify the local testing suite passes before modifying code.
* **Agent Refactoring Rule:** Ensure error handling (like division-by-zero checks) is isolated into unique custom exception helpers.
