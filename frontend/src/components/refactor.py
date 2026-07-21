import os
import glob

components_dir = r"C:\Users\hmpl_\OneDrive\Favorites\Escritorio\SGC page\frontend\src\components"

replacements = {
    # Backgrounds and borders
    "bg-white ": "glass-card-dark ",
    "bg-white\"": "glass-card-dark\"",
    "bg-slate-50 ": "glass-card-dark-header ",
    "bg-slate-50\"": "glass-card-dark-header\"",
    "border-slate-200": "border-cyan-500/20",
    "border-slate-300": "border-cyan-500/30",
    "bg-slate-100": "bg-[#00152e]/50",
    
    # Texts
    "text-[#002855]": "text-white",
    "text-slate-800": "text-slate-200",
    "text-slate-900": "text-white",
    "text-slate-700": "text-slate-300",
    "text-slate-600": "text-slate-300",
    "text-slate-500": "text-slate-400",
    
    # Table specifics
    "divide-slate-200": "divide-cyan-500/20",
    "divide-slate-100": "divide-cyan-500/10",
    "hover:bg-slate-50": "hover:bg-white/5",
    "bg-gray-50": "glass-card-dark-header",
    
    # Inputs
    "bg-transparent border border-slate-200": "bg-black/20 border border-cyan-500/30 text-white",
    "bg-white border-slate-200": "bg-black/20 border-cyan-500/30 text-white"
}

# Find all jsx files except in landing and layout
for root, dirs, files in os.walk(components_dir):
    if "landing" in root or "layout" in root:
        continue
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Avoid replacing bg-white/something
            original = content
            for old, new in replacements.items():
                content = content.replace(old, new)
                
            if original != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {filepath}")

print("Refactoring complete.")
