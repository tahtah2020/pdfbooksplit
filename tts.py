"""Egyptian-dialect TTS (NAMAA-Egyptian-TTS on Chatterbox Multilingual, MIT license).
Single:  python tts.py "النص بالعامية" out.wav [reference.wav] [--exaggeration 0.6] [--seed 7]
Batch:   python tts.py --batch lines.json OUT_DIR   (lines: [{"id","text","voice"?,"exaggeration"?,"seed"?}])
         "voice" = a name in ./voices (e.g. zizo_trend) or a wav path. Model loads once for the whole batch.
Runs on Apple Silicon (MPS), CUDA, or plain CPU (e.g. GitHub Actions). Models are cached in ./hf-cache."""
import argparse, json, os
HERE = os.path.dirname(os.path.abspath(__file__))
os.environ.setdefault("HF_HOME", os.path.join(HERE, "hf-cache"))
import torch, torchaudio as ta
from huggingface_hub import hf_hub_download
from safetensors.torch import load_file
from chatterbox import mtl_tts

ap = argparse.ArgumentParser()
ap.add_argument("text", nargs="?"); ap.add_argument("out", nargs="?"); ap.add_argument("ref", nargs="?")
ap.add_argument("--batch"); ap.add_argument("--exaggeration", type=float, default=0.6)
ap.add_argument("--cfg", type=float, default=0.4); ap.add_argument("--seed", type=int, default=7)
a = ap.parse_args()
dev = "cuda" if torch.cuda.is_available() else "mps" if torch.backends.mps.is_available() else "cpu"
_load = torch.load
torch.load = lambda *x, **k: _load(*x, **{**k, "map_location": torch.device(dev)})
m = mtl_tts.ChatterboxMultilingualTTS.from_pretrained(device=dev)
m.t3.load_state_dict(load_file(hf_hub_download("NAMAA-Space/NAMAA-Egyptian-TTS", "t3_mtl23ls_v2.safetensors"), device=dev))
m.t3.to(dev).eval()


def voice_path(v):
    if not v: return None
    p = os.path.join(HERE, "voices", f"{v}.wav")
    return p if os.path.exists(p) else v if os.path.exists(v) else None


def speak(text, out, ref, ex, seed):
    torch.manual_seed(seed)
    w = m.generate(text, language_id="ar", audio_prompt_path=ref, exaggeration=ex, cfg_weight=a.cfg)
    ta.save(out, w.cpu(), m.sr); print("saved", out, flush=True)


if a.batch:
    lines = json.load(open(a.batch)) if os.path.exists(a.batch) else json.loads(a.batch)
    os.makedirs(a.text, exist_ok=True)
    for ln in lines:
        speak(ln["text"], os.path.join(a.text, f"{ln['id']}.wav"), voice_path(ln.get("voice")),
              float(ln.get("exaggeration", a.exaggeration)), int(ln.get("seed", a.seed)))
else:
    speak(a.text, a.out, voice_path(a.ref), a.exaggeration, a.seed)
