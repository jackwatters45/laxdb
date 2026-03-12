# Lacrosse Video Analysis Pipeline - Phase 1

**Type**: Feature (New Package)
**Status**: Draft
**Created**: 2026-01-24

## Overview

Build an inference-only video analysis pipeline for lacrosse game film using pretrained open-source models. No custom training required. Detects players, tracks them across frames, classifies teams by uniform, and attempts jersey number OCR.

## Problem Statement

Coaches spend hours manually reviewing game film. There's no automated way to:
- Identify which players are on field at any moment
- Track player movements across plays
- Distinguish home vs away team automatically
- Associate jersey numbers with tracked players

## Proposed Solution

Python-based CV pipeline using pretrained models, deployed to serverless GPU (Modal), invoked via HTTP from laxdb TypeScript API.

### Model Stack (No Training Needed)

| Component | Model | Purpose |
|-----------|-------|---------|
| Detection | YOLO11s | Detect persons (pretrained COCO class 0) |
| Tracking | ByteTrack | Track persons across frames |
| Embeddings | SigLIP | Visual embeddings for team clustering |
| Clustering | K-Means | Separate players into 2 teams |
| OCR | SmolVLM2 | Read jersey numbers |

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   laxdb/web     │────▶│    laxdb/api     │────▶│  Modal (Python) │
│  Upload Video   │     │  Create Job      │     │  CV Pipeline    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                        │
        ▼                        ▼                        ▼
   ┌─────────┐            ┌───────────┐           ┌─────────────┐
   │   R2    │◀───────────│ PlanetScale│◀──────────│  R2 Results │
   │ Videos  │            │   Jobs    │           │    JSON     │
   └─────────┘            └───────────┘           └─────────────┘
```

## Technical Approach

### Phase 1 Scope

**In Scope:**
- Video upload (MP4/MOV, max 10GB, max 4hr)
- Player detection (bounding boxes per frame)
- Player tracking (consistent IDs across frames)
- Team classification (2 clusters by uniform color)
- Jersey OCR (best-effort, ~50% expected accuracy)
- JSON results stored in R2

**Out of Scope (Phase 2+):**
- Ball tracking (too small, too fast)
- Field/goal detection
- Play segmentation
- Real-time processing
- Custom model training
- Human-in-the-loop corrections

### Implementation Phases

#### Phase 1.1: Python Pipeline (Core CV)

New directory: `services/video-analysis/` (outside monorepo packages)

```
services/video-analysis/
├── pyproject.toml              # uv/poetry config
├── src/
│   └── lacrosse_cv/
│       ├── __init__.py
│       ├── config.py           # Settings dataclass
│       ├── models/
│       │   ├── detector.py     # YOLO11 wrapper
│       │   ├── tracker.py      # ByteTrack wrapper
│       │   ├── embedder.py     # SigLIP wrapper
│       │   └── ocr.py          # SmolVLM2 wrapper
│       ├── pipeline.py         # Main orchestration
│       ├── schemas.py          # Pydantic output models
│       └── modal_app.py        # Modal deployment
├── tests/
└── Makefile
```

**detector.py** - YOLO11 person detection:
```python
from ultralytics import YOLO
import numpy as np

class PlayerDetector:
    def __init__(self, model: str = "yolo11s.pt", conf: float = 0.5):
        self.model = YOLO(model)
        self.conf = conf

    def detect(self, frame: np.ndarray) -> dict:
        results = self.model(frame, conf=self.conf, classes=[0], verbose=False)[0]
        return {
            "boxes": results.boxes.xyxy.cpu().numpy(),
            "scores": results.boxes.conf.cpu().numpy(),
        }
```

**tracker.py** - ByteTrack integration:
```python
import supervision as sv

class PlayerTracker:
    def __init__(self):
        self.tracker = sv.ByteTrack()

    def update(self, detections: sv.Detections) -> sv.Detections:
        return self.tracker.update_with_detections(detections)
```

**embedder.py** - SigLIP + K-Means:
```python
import torch
from transformers import AutoProcessor, AutoModel
from sklearn.cluster import KMeans
import numpy as np

class TeamClassifier:
    def __init__(self, model_id: str = "google/siglip-base-patch16-224"):
        self.processor = AutoProcessor.from_pretrained(model_id)
        self.model = AutoModel.from_pretrained(model_id, torch_dtype=torch.float16)
        self.kmeans = None

    def get_embedding(self, crop) -> np.ndarray:
        inputs = self.processor(images=crop, return_tensors="pt")
        with torch.inference_mode():
            features = self.model.get_image_features(**inputs)
        return (features / features.norm(dim=-1, keepdim=True)).cpu().numpy().squeeze()

    def fit_teams(self, embeddings: np.ndarray) -> np.ndarray:
        self.kmeans = KMeans(n_clusters=2, random_state=42)
        return self.kmeans.fit_predict(embeddings)
```

**ocr.py** - SmolVLM2 jersey reading:
```python
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText

class JerseyOCR:
    def __init__(self, model_id: str = "HuggingFaceTB/SmolVLM2-2.2B-Instruct"):
        self.processor = AutoProcessor.from_pretrained(model_id)
        self.model = AutoModelForImageTextToText.from_pretrained(
            model_id, torch_dtype=torch.bfloat16
        )

    def read_number(self, crop) -> str | None:
        messages = [{"role": "user", "content": [
            {"type": "image", "image": crop},
            {"type": "text", "text": "Jersey number only. Reply with number or 'none'."}
        ]}]
        inputs = self.processor.apply_chat_template(messages, return_tensors="pt")
        output = self.model.generate(**inputs, max_new_tokens=8)
        text = self.processor.decode(output[0], skip_special_tokens=True)
        return self._parse_number(text)
```

**modal_app.py** - Serverless deployment:
```python
import modal

image = modal.Image.debian_slim(python_version="3.11").pip_install(
    "ultralytics", "supervision", "transformers", "torch", "scikit-learn", "opencv-python-headless"
)

app = modal.App("lacrosse-cv")

@app.function(image=image, gpu="A10G", timeout=3600)
def analyze_video(video_url: str, callback_url: str) -> dict:
    from lacrosse_cv.pipeline import process_video
    result = process_video(video_url)
    # POST result to callback_url
    return result
```

#### Phase 1.2: TypeScript Integration

**packages/core/src/video-analysis/** - Domain logic:

```
video-analysis/
├── video-analysis.schema.ts    # Effect Schema for job/results
├── video-analysis.sql.ts       # Drizzle table definitions
├── video-analysis.repo.ts      # DB operations
├── video-analysis.service.ts   # Business logic
├── video-analysis.error.ts     # Domain errors
└── index.ts
```

**video-analysis.sql.ts**:
```typescript
import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core"
import { createId } from "@paralleldrive/cuid2"

export const videoAnalysisJob = pgTable("video_analysis_job", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull(),
  videoUrl: text("video_url").notNull(),        // R2 URL
  status: text("status").notNull(),              // queued|processing|completed|failed
  progress: integer("progress").default(0),      // 0-100
  resultUrl: text("result_url"),                 // R2 URL to JSON results
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
})
```

**video-analysis.schema.ts** - Output format:
```typescript
import { Schema } from "effect"

export const BoundingBox = Schema.Struct({
  x1: Schema.Number,
  y1: Schema.Number,
  x2: Schema.Number,
  y2: Schema.Number,
})

export const TrackAppearance = Schema.Struct({
  frameIndex: Schema.Number,
  timestampMs: Schema.Number,
  bbox: BoundingBox,
  confidence: Schema.Number,
})

export const PlayerTrack = Schema.Struct({
  trackId: Schema.Number,
  teamId: Schema.NullOr(Schema.Number),           // 0 or 1, null if unclassified
  jerseyNumber: Schema.NullOr(Schema.String),     // null if OCR failed
  jerseyConfidence: Schema.NullOr(Schema.Number), // OCR confidence
  appearances: Schema.Array(TrackAppearance),
})

export const AnalysisResult = Schema.Struct({
  videoId: Schema.String,
  durationMs: Schema.Number,
  frameCount: Schema.Number,
  fps: Schema.Number,
  tracks: Schema.Array(PlayerTrack),
  processedAt: Schema.String,
})
```

**packages/api/src/video-analysis.rpc.ts**:
```typescript
import { Rpc } from "@effect/rpc"
import { VideoAnalysisService } from "@laxdb/core/video-analysis"

export const videoAnalysisRouter = Rpc.make({
  createJob: Rpc.effect(CreateJobRequest, CreateJobResponse, () =>
    VideoAnalysisService.createJob(...)
  ),
  getJobStatus: Rpc.effect(GetJobRequest, GetJobResponse, () =>
    VideoAnalysisService.getJob(...)
  ),
  getResults: Rpc.effect(GetResultsRequest, AnalysisResult, () =>
    VideoAnalysisService.getResults(...)
  ),
})
```

#### Phase 1.3: Upload & Queue Flow

1. Frontend uploads video to R2 via presigned URL
2. Frontend calls `createJob` RPC with R2 URL
3. API creates job record (status: queued)
4. API triggers Modal function via HTTP (fire-and-forget)
5. Modal function:
   - Downloads video from R2
   - Runs CV pipeline
   - Uploads results JSON to R2
   - POSTs completion callback to API
6. API updates job record (status: completed, resultUrl: ...)
7. Frontend polls `getJobStatus` until complete
8. Frontend calls `getResults` to fetch analysis

## Acceptance Criteria

### Must Have
- [ ] Upload MP4/MOV video (max 10GB) to R2
- [ ] Create analysis job, receive job ID
- [ ] Poll job status (queued → processing → completed/failed)
- [ ] Retrieve JSON results with player tracks
- [ ] Each track has: trackId, teamId (0/1), appearances array
- [ ] Each appearance has: frameIndex, timestampMs, bbox

### Should Have
- [ ] Jersey number OCR (best-effort, with confidence score)
- [ ] Progress percentage during processing
- [ ] Error messages on failure

### Nice to Have
- [ ] Cancel in-progress job
- [ ] Re-run failed job
- [ ] Download annotated video with bounding boxes

### Quality Gates
- [ ] Detection accuracy: >90% of visible players detected
- [ ] Tracking consistency: <10% ID switches per minute
- [ ] Team classification: >85% correct assignments
- [ ] Processing speed: <2x video duration (e.g., 2hr game in <4hr)

## Dependencies & Prerequisites

### External Services
- **Modal**: GPU serverless (A10G instance)
- **R2**: Video and results storage (already available in laxdb)
- **PlanetScale**: Job metadata (already available)

### Python Dependencies
```
ultralytics>=8.3
supervision>=0.25
transformers>=4.46
torch>=2.4
scikit-learn>=1.5
opencv-python-headless>=4.10
modal>=0.67
```

### Model Weights (Auto-Downloaded)
- `yolo11s.pt` (~20MB)
- `google/siglip-base-patch16-224` (~400MB)
- `HuggingFaceTB/SmolVLM2-2.2B-Instruct` (~4GB)

## Cost Estimation

| Resource | Unit Cost | Estimate |
|----------|-----------|----------|
| Modal A10G | ~$0.75/hr | ~$1.50 per game-hour |
| R2 Storage | $0.015/GB/mo | ~$0.30/game |
| R2 Egress | Free (within CF) | $0 |

**Example**: 2-hour game = ~$3-4 processing cost

## Known Limitations

1. **No ball tracking** - Ball too small/fast for pretrained models
2. **No field detection** - Can't map to field coordinates
3. **Referee noise** - Referees included in detections, clustered separately or with team
4. **Replay confusion** - Broadcast replays may cause duplicate detections
5. **OCR accuracy** - Expect ~50% jersey number success rate without fine-tuning
6. **Similar uniforms** - Teams with similar colors may cluster poorly

## Open Questions

1. ~~Python/TypeScript integration~~ → Separate Python service on Modal
2. ~~Cloud GPU provider~~ → Modal (serverless, pay-per-use)
3. ~~Output format~~ → Per-track JSON with frame appearances
4. Should referees be filtered out? → Phase 2
5. Support for URL ingestion (YouTube)? → Phase 2

## References

### Internal
- `packages/pipeline/AGENTS.md` - Existing data pipeline patterns
- `packages/core/AGENTS.md` - Domain service patterns
- `alchemy.run.ts` - Infrastructure patterns

### External
- [Ultralytics YOLO11](https://docs.ultralytics.com/models/yolo11)
- [Meta SAM2](https://github.com/facebookresearch/sam2) (reserved for Phase 2)
- [SigLIP on HuggingFace](https://huggingface.co/google/siglip-base-patch16-224)
- [SmolVLM2 on HuggingFace](https://huggingface.co/HuggingFaceTB/SmolVLM2-2.2B-Instruct)
- [Supervision library](https://github.com/roboflow/supervision)
- [Modal documentation](https://modal.com/docs)
- [Roboflow Basketball AI Tutorial](https://www.youtube.com/watch?v=yGQb9KkvQ1Q) (inspiration)
