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
    
    states = model.predict(X)
    probs = model.predict_proba(X)
    
    return {
        "states": states.tolist(),
        "probabilities": probs.tolist()
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
        return {
            "foreign_shock_to_ret": irf.irfs[:, 1, 0].tolist(),
            "lower_bound": irf.stderr()[:, 1, 0].tolist() if hasattr(irf, 'stderr') else [],
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

