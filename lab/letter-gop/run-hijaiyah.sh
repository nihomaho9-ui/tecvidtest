#!/bin/bash
# Resumable Hijaiyah eval. Skips clips already in out/hijaiyah.jsonl.
set -euo pipefail
cd /workspace/letter-lab/app/lab/letter-gop
export ORT_THREADS="${ORT_THREADS:-1}"
RESP="${RESPONDEN:-benar-1,benar-2,benar-3,benar-4,benar-5,salah-1,salah-2,salah-3,salah-4,salah-5}"
REPS="${REPS:-1}"
exec nice -n 19 env ORT_THREADS="$ORT_THREADS" stdbuf -oL -eL node eval-hijaiyah.mjs --reps="$REPS" --responden="$RESP"
