# Using uv with SimpleRobotServer

## What is uv?

`uv` is a modern, ultra-fast Python package manager and project manager written in Rust. It's **much faster** than pip and handles everything automatically!

### Why uv?

✅ **10-100x faster** than pip  
✅ **Automatic dependency management** - no manual pip install needed  
✅ **Project isolation** - creates virtual environments automatically  
✅ **Lockfile support** - reproducible installs  
✅ **Compatible** with pip and pyproject.toml

## Installation (One-Time)

### Windows (PowerShell)

```powershell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Linux/Mac

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

That's it! No need to install Python manually - uv handles everything.

## Using SimpleRobotServer with uv

### Quick Start

```bash
# Navigate to SimpleRobotServer folder
cd SimpleRobotServer

# Run the server (uv handles dependencies automatically!)
uv run simple-robot-server
```

**First time:**

- uv automatically creates a virtual environment
- Installs all dependencies from `pyproject.toml`
- Runs the server

**Every time after:**

- Just runs instantly! Dependencies already installed.

### Common Commands

```bash
# Run the server
uv run simple-robot-server

# Run with options
uv run simple-robot-server --reset
uv run simple-robot-server --simulation
uv run simple-robot-server --debug

# Run test client
uv run python test_client.py

# Run any Python script
uv run python my_script.py
```

### Manual Dependency Management (Optional)

```bash
# Install dependencies manually (usually not needed)
uv pip install -e .

# Add a new dependency
uv add websockets

# Upgrade a dependency
uv pip install --upgrade lerobot

# Show installed packages
uv pip list
```

## How uv Works with SimpleRobotServer

### Project Structure

```
SimpleRobotServer/
├── pyproject.toml          # Project config + dependencies
├── .python-version         # Python version (3.11)
├── simple_robot_server.py  # Main server
└── ...
```

### pyproject.toml

```toml
[project]
name = "simple-robot-server"
version = "0.1.0"
requires-python = ">=3.10"
dependencies = [
    "websockets>=12.0",
    "pyserial>=3.5",
    "lerobot[feetech]",
]

[project.scripts]
simple-robot-server = "simple_robot_server:main"
```

### What happens when you run `uv run simple-robot-server`:

1. ✅ uv reads `pyproject.toml`
2. ✅ Creates/uses virtual environment (`.venv/`)
3. ✅ Installs dependencies if needed
4. ✅ Runs the `main()` function from `simple_robot_server.py`

## Comparison: uv vs pip

| Task           | With pip                          | With uv                   |
| -------------- | --------------------------------- | ------------------------- |
| Install Python | Manual download                   | Automatic                 |
| Create venv    | `python -m venv .venv`            | Automatic                 |
| Activate venv  | `source .venv/bin/activate`       | Not needed                |
| Install deps   | `pip install -r requirements.txt` | Automatic                 |
| Run script     | `python script.py`                | `uv run python script.py` |
| Speed          | 🐌 Slow                           | ⚡ 10-100x faster         |

## Troubleshooting

### "uv: command not found"

Install uv first:

```bash
# Windows
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Linux/Mac
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Then restart your terminal.

### Dependencies not installing

```bash
# Force reinstall
uv pip install --force-reinstall -e .

# Or clear cache
uv cache clean
uv run simple-robot-server
```

### Want to use pip instead?

No problem! The project works with both:

```bash
pip install -r requirements.txt
python simple_robot_server.py
```

## Advanced Usage

### Using a specific Python version

```bash
# Use Python 3.11
uv run --python 3.11 simple-robot-server

# Or set in .python-version (already set to 3.11)
```

### Running in editable mode

```bash
# Install as editable package
uv pip install -e .

# Now you can run from anywhere
simple-robot-server --help
```

### Creating a lockfile

```bash
# Generate uv.lock for reproducible installs
uv lock

# Install from lockfile
uv sync
```

## Benefits for SimpleRobotServer

1. **No manual setup** - Just `uv run simple-robot-server`
2. **Fast installs** - LeRobot dependencies install in seconds, not minutes
3. **Isolated** - Won't conflict with other Python projects
4. **Reproducible** - Same versions every time
5. **Cross-platform** - Works identically on Windows/Linux/Mac

## Learn More

- [uv Documentation](https://docs.astral.sh/uv/)
- [uv GitHub](https://github.com/astral-sh/uv)
- [pyproject.toml guide](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/)

---

**TL;DR:** Just run `uv run simple-robot-server` and everything works! 🚀
