import os
import dotenv

# Force mock mode for all automated test runs (offline, zero-cost, deterministic)
os.environ["LLM_PROVIDER"] = "mock"

orig_load = dotenv.load_dotenv


def safe_load_dotenv(*args, **kwargs):
    res = orig_load(*args, **kwargs)
    os.environ["LLM_PROVIDER"] = "mock"
    return res


dotenv.load_dotenv = safe_load_dotenv
