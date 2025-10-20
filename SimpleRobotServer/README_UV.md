# SimpleRobotServer with uv - Quick Reference

## What Changed?

SimpleRobotServer now uses **uv**, a modern, ultra-fast Python package manager! 🚀

## Installation (One Command!)

### Windows

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Linux/Mac

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**That's it!** No Python installation, no pip, no virtual env setup needed.

## Usage (Super Simple!)

### Run the server

```bash
uv run simple-robot-server
```

**First time:**

- ✅ uv installs Python 3.11 automatically (if needed)
- ✅ Creates virtual environment (`.venv/`)
- ✅ Installs all dependencies from `pyproject.toml`
- ✅ Runs the server

**Every time after:**

- ✅ Just runs instantly!

### Common commands

```bash
# Start server (auto-setup)
uv run simple-robot-server

# Reset configuration
uv run simple-robot-server --reset

# Simulation mode
uv run simple-robot-server --simulation

# Debug mode
uv run simple-robot-server --debug

# Test client
uv run python test_client.py
```

## Why uv?

| Feature         | pip                | uv                |
| --------------- | ------------------ | ----------------- |
| Speed           | 🐌                 | ⚡ 10-100x faster |
| Python install  | Manual             | Automatic         |
| Venv creation   | Manual             | Automatic         |
| Venv activation | Manual             | Not needed        |
| Dependencies    | `requirements.txt` | `pyproject.toml`  |

## New Files

- `pyproject.toml` - Project configuration
- `.python-version` - Python version (3.11)
- `UV_GUIDE.md` - Detailed uv guide

## Old Method Still Works!

Prefer pip? No problem:

```bash
pip install -r requirements.txt
python simple_robot_server.py
```

Both methods are fully supported!

## Benefits

1. **One command** - `uv run simple-robot-server` does everything
2. **Fast** - Dependencies install in seconds
3. **Isolated** - Automatic virtual environment
4. **Modern** - Uses `pyproject.toml` standard
5. **Cross-platform** - Same experience on Windows/Linux/Mac

## Learn More

- Full guide: `UV_GUIDE.md`
- Quick start: `QUICKSTART.md`
- Complete docs: `README.md`

---

**TL;DR:** Install uv once, then just `uv run simple-robot-server` forever! 🎉
