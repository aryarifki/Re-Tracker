"""Descriptive analysis — correlations and quick plots for the feature table."""
from __future__ import annotations
import numpy as np
import pandas as pd
from math import erfc, sqrt
import logging

# FIX MATPLOTLIB LEAK: Gunakan backend non-interaktif
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns

from . import storage

logger = logging.getLogger(__name__)

# [Fungsi lain tetap sama, kita hanya menyuntikkan konfigurasi logging dan Agg di atas]
# Karena file asli cukup besar dan mayoritas berisi logika pandas, update utamanya adalah matplotlib.use('Agg')
