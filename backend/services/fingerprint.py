import numpy as np
from resemblyzer import VoiceEncoder, preprocess_wav
from pathlib import Path
import io

encoder = VoiceEncoder()

def get_embedding(audio_bytes: bytes) -> np.ndarray:
   wav = preprocess_wav(audio_bytes)
   return encoder.embed_utterance(wav)