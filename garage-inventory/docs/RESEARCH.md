# Research notes

Collected September 2026 while scoping the app. Vendor support sites were partly unreachable from the research sandbox, so exact limits are "as reported", not verified against the live pages.

## 1. Getting spreadsheet rows onto a label printer with QR codes

| Printer / software | Import formats | QR bound to a column? | Notes |
|---|---|---|---|
| **Brother P-touch Editor** (desktop) | Windows: xlsx/xls/csv/txt/mdb; **Mac: csv/txt only** | Yes (barcode object → database field) | CSV must not be UTF-8 on Windows (use ANSI or xlsx). One record = one label. Mobile "iPrint&Label" has no data import; Brother **Pro Label Tool** app does CSV merges. |
| **DYMO Connect** (desktop) | xlsx/xls/csv/txt/accdb | Yes, but **only URL-type QR objects** accept imported data | Needs Microsoft Access Database Engine on Windows. Mobile app has no import. |
| **NIIMBOT** app (B1/B21/D110…) | xlsx (first row = headers) | Yes | Pre-format numbers as text in Excel. No documented row limit. |
| **Phomemo Print Master** (M110/M120/M220) | xlsx/csv | Yes | Recommends ≤100 rows per import; split larger sheets. |
| **ZebraDesigner 3** | xlsx/csv/Access/ODBC | Yes | Database features are **Professional** edition only. |

Design decisions taken from this:

- Export **xlsx** as the primary format with every cell typed as text; CSV (UTF-8 with BOM) as a secondary option.
- The `QR` column is a plain URL (`https://host/#/l/TC1-D03`), which is the only QR type DYMO will bind and works everywhere else.
- Provide `Line1` / `Line2` / `Contents` columns already shortened for a label, so no template logic is needed in the label software.
- Offer a **browser print view** sized to the tape (`@page { size: WxH mm }`), one label per page. Every vendor above ships an OS printer driver, so "Print → your label printer, scale 100%" is the universal fallback and also yields a PDF. Mobile-only printers (e.g. NIIMBOT D110) have no desktop driver and need the app import instead.

Sources: Brother FAQ faqp00001040_003 and P-touch Editor 6 database/barcode help; DYMO Connect "Importing Data" and help.dymo.com articles on Excel import and PDF printing; niimbots.com Excel guide; phomemo.com batch-print pages; Zebra support articles 000021477 and "Connect a text or CSV file to a label".

## 2. Photo of a drawer → automatic inventory (phase 2)

**Bottom line:** naming the items in a drawer photo is well solved by any frontier multimodal model; *exact counts* of small overlapping parts (screws, washers) are not solved by any model. Design for "item list + approximate count + one-tap human correction".

### Cloud vision APIs (zero-shot "list every item as JSON")

- **Claude** (Anthropic): ~1.3k image tokens for a 1000×1000 photo, roughly $0.001–0.007 per image depending on model; JSON-schema structured outputs are supported. Anthropic's docs warn counts of many small objects are approximate.
- **OpenAI** GPT-5 family: sub-cent per image on the mini/nano tiers; structured outputs supported. Roboflow evals rank counting as its weakest task.
- **Gemini** 3 Flash: cheapest (~$0.001/image) and uniquely returns bounding boxes (`box_2d`) and segmentation masks natively, plus `responseSchema` JSON. Validate boxes; it occasionally emits out-of-range ones.
- Academic and Roboflow benchmarks agree: detection/identification is strong, counting degrades sharply past ~5 similar objects in clutter. Asking for a per-object list with locations *before* totals improves counts.

### Local / open models

| Model | Output | License | Where it runs |
|---|---|---|---|
| Florence-2 (0.23B/0.77B) | captions, open-vocab detection | MIT | In the browser on WebGPU (transformers.js) |
| OWLv2 | boxes for text queries | Apache-2.0 | Browser (slow, seconds/image), weak on tiny parts |
| Grounding DINO | boxes for text prompts | Apache-2.0 | GPU/CPU server; not in transformers.js yet |
| YOLO-World | real-time boxes, fixed vocabulary | GPL-3.0 | Raspberry Pi 5 / Jetson |
| SAM 2 | masks from points/boxes (no names) | Apache-2.0 | GPU preferred |
| SAM 3 | masks + boxes for all instances of a noun phrase (i.e. counting) | SAM License | CUDA GPU, 848M params |
| Qwen3-VL 2B/4B/8B | text, JSON, 2D grounding | Apache-2.0 | Laptop / 8 GB GPU (4B Q4 ~3.3 GB) |
| Moondream 3.1 / 2 | query, detect, point, count | BSL 1.1 | Pi 5 (~25 s/image at 512 px), Jetson, Mac |

### Existing products and datasets

Commercial "photo of a drawer → list" apps already exist (StuffID, Rorg, SnapFind, Homvi, Vorby, Scanlily), all backed by cloud LLMs. Open source: Homey, Photographic-Home-Inventory (FastAPI + Gemini), a-eye (Ollama). Roboflow Universe hosts hand-tool sets (17–32 classes) and fastener sets (~10k images: screw/bolt/nut/washer) suitable for fine-tuning a small counter later.

### Recommended phase-2 pipeline

1. On the Location page, "📷 Scan drawer": take a photo, send it with a JSON schema `{items:[{name, category, count_estimate, confidence, box}]}` to Gemini 3 Flash or Claude Sonnet. Cost is ~$0.001–0.01 per photo, so a whole garage is under a dollar.
2. Photograph sub-compartments separately or tile the image; ask for per-object entries before totals.
3. Show the proposed list as checkboxes with editable counts; on confirm, diff against the drawer's current items (add / update quantity / mark missing) so history stays meaningful. Store the photo on the location.
4. Optional: crop thumbnails per item from the returned boxes (or SAM 2 masks) for the item photos.
5. Local fallback for offline use: Florence-2 in the browser, or Moondream / Qwen3-VL on a mini-PC.

Expected accuracy: distinct tools 85–95 % named correctly; loose-fastener counts off by 20–50 % and inconsistent between runs, so keep counts editable.

Sources: platform.claude.com vision and structured-output docs; Roboflow vision-eval blog posts and playground.roboflow.com/evals; arXiv 2510.04401 and 2512.15254 on VLM counting; Hugging Face model cards for Florence-2, OWLv2, Qwen3-VL; github.com/facebookresearch/sam3; moondream.ai; Roboflow Universe datasets `manual-tools/tools-detection` and `fy113/fasteners`.
