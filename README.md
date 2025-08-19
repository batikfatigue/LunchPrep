<div align="center">

# LunchPrep

Format bank CSV statements into clean, import‑ready files for **Lunch Money** — with intelligent, batch transaction categorization powered by **Google Gemini**.

<br/>

<img alt="status: WIP" src="https://img.shields.io/badge/status-WIP-orange" />
<img alt="for: Lunch Money" src="https://img.shields.io/badge/for-Lunch%20Money-00A86B" />
<img alt="AI: Google Gemini" src="https://img.shields.io/badge/AI-Google%20Gemini-4285F4" />
<img alt="license: restricted" src="https://img.shields.io/badge/license-Restricted-red" />

</div>

---

## Overview

LunchPrep helps you transform raw bank CSV exports into a format suitable for seamless import into [Lunch Money](https://lunchmoney.app). It uses **Google Gemini** to suggest categories for transactions and supports **batch processing** for efficiency.

> Note: This project is an active work in progress.

### What it does
- Formats and normalizes bank CSVs to Lunch Money’s expected import structure
- Suggests categories using Google Gemini
- Processes transactions in batches for speed and lower token usage

### How it works (at a glance)
1. Parse your bank CSV and map fields to a standard schema
2. Batch transactions and request category suggestions from Gemini
3. Output a clean CSV ready for Lunch Money import


---


## License

This repository is provided **for viewing purposes only**.  
No reproduction, modification, or redistribution of the contents is permitted without explicit permission.

© 2025 batikfatigue. All rights reserved.