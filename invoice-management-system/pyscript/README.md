# Batch Invoice Uploader & Performance Timing Script

Automates uploading PDF invoices from `E:\RB invoices` one-by-one to the local Invoice Management System API (`POST /api/invoices/upload`), records the exact processing duration for each document, and saves a consolidated JSON report.

---

## 🚀 Quick Start

### 1. Ensure the Backend Server is Running
In one terminal, start your backend server:
```bash
npm start
```
*(Server should be running on `http://localhost:3009`)*

---

### 2. Run the Batch Upload Script

Choose the command matching your terminal:

#### In Git Bash (MINGW64):
```bash
"/c/Users/hp/AppData/Local/Programs/Python/Python311/python.exe" pyscript/batch_upload_invoices.py
```
*(Or simply: `"C:/Users/hp/AppData/Local/Programs/Python/Python311/python.exe" pyscript/batch_upload_invoices.py`)*

#### In PowerShell:
```powershell
& "C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe" pyscript\batch_upload_invoices.py
```

#### In Command Prompt (CMD):
```cmd
"C:\Users\hp\AppData\Local\Programs\Python\Python311\python.exe" pyscript\batch_upload_invoices.py
```

---

## ⚙️ Optional Command-Line Arguments

| Argument | Default | Description |
|:---|:---|:---|
| `--dir` | `E:\RB invoices` | Source directory containing PDF invoices |
| `--url` | `http://localhost:3009/api/invoices/upload` | Target upload API endpoint |
| `--output` | `pyscript/batch_upload_results.json` | Path where consolidated JSON output will be saved |
| `--timeout` | `240` | Timeout in seconds per upload request |
| `--limit` | `None` (all) | Limit number of files to process (e.g. `--limit 3` for a quick test) |

### Examples (in Git Bash):
```bash
# Test run with just the first 2 files:
"/c/Users/hp/AppData/Local/Programs/Python/Python311/python.exe" pyscript/batch_upload_invoices.py --limit 2

# Custom timeout:
"/c/Users/hp/AppData/Local/Programs/Python/Python311/python.exe" pyscript/batch_upload_invoices.py --timeout 300
```
