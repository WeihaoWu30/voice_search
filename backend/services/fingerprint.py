import numpy as np
import tempfile
import os
from resemblyzer import VoiceEncoder, preprocess_wav

encoder = VoiceEncoder()

def get_embedding(audio_bytes: bytes) -> np.ndarray:
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        wav = preprocess_wav(tmp_path)
        return encoder.embed_utterance(wav)
    finally:
        os.unlink(tmp_path)
