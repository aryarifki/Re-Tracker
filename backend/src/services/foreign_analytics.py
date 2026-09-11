import numpy as np
import pandas as pd
from hmmlearn import hmm
from statsmodels.tsa.api import VAR

def compute_hmm_regime(net_flows: list, n_states: int = 3) -> dict:
    """Mengidentifikasi regime akumulasi/distribusi menggunakan Hidden Markov Model."""
    if len(net_flows) < 10:
        return {"states": [], "probabilities": []}
        
    X = np.array(net_flows).reshape(-1, 1)
    
    # Model HMM Gaussian
    model = hmm.GaussianHMM(n_components=n_states, covariance_type="full", n_iter=100, random_state=42)
    model.fit(X)
    
    raw_states = model.predict(X)
    raw_probs = model.predict_proba(X)
    
    # Mapping state deterministik berdasarkan mean foreign_net
    # Indeks 0 = Distribusi (Terendah), 1 = Netral, 2 = Akumulasi (Tertinggi)
    means = model.means_.flatten()
    sorted_indices = np.argsort(means) # Urutan dari terkecil ke terbesar
    
    mapping = {
        int(sorted_indices[0]): 0, # Lowest mean -> 0 (Distribution)
        int(sorted_indices[1]): 1, # Middle mean -> 1 (Neutral)
        int(sorted_indices[2]): 2  # Highest mean -> 2 (Accumulation)
    }
    
    mapped_states = [mapping[int(s)] for s in raw_states]
    # Reorder kolom probabilities agar konsisten dengan mapped_states [0, 1, 2]
    mapped_probs = raw_probs[:, sorted_indices]
    
    return {
        "states": mapped_states,
        "probabilities": mapped_probs.tolist()
    }

def compute_var_irf(foreign_net: list, returns: list, lags: int = 2, horizon: int = 5) -> dict:
    """Menghitung Impulse Response dari intervensi asing ke harga saham (VAR)."""
    if len(foreign_net) != len(returns) or len(foreign_net) < 20:
        return {}
        
    df = pd.DataFrame({
        "foreign": foreign_net,
        "ret": returns
    }).dropna()
    
    model = VAR(df)
    try:
        results = model.fit(maxlags=lags)
        irf = results.irf(horizon)
        
        # Ekstrak efek shock 'foreign' (indeks 0) terhadap 'ret' (indeks 1)
        irfs = irf.irfs[:, 1, 0]
        stderr = irf.stderr()[:, 1, 0]
        
        # Hitung Confidence Interval absolut 95% (Z-score 1.96)
        lower_bound = irfs - 1.96 * stderr
        upper_bound = irfs + 1.96 * stderr
        
        return {
            "foreign_shock_to_ret": irfs.tolist(),
            "lower_bound": lower_bound.tolist(),
            "upper_bound": upper_bound.tolist()
        }
    except Exception:
        # Menghindari crash jika matriks singular (data terlalu datar)
        return {}

def compute_foreign_hhi(broker_net_values: list) -> float:
    """Menghitung Herfindahl-Hirschman Index untuk konsentrasi broker."""
    if not broker_net_values:
        return 0.0
    
    # Ambil nilai absolut untuk mengukur dominasi volume (baik beli maupun jual)
    abs_vals = np.abs(broker_net_values)
    total = np.sum(abs_vals)
    
    if total == 0:
        return 0.0
        
    shares = abs_vals / total
    hhi = np.sum(shares ** 2)
    return float(hhi)
