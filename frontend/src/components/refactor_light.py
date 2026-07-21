import os

components_dir = r"C:\Users\hmpl_\OneDrive\Favorites\Escritorio\SGC page\frontend\src\components"

replacements = {
    # Backgrounds and borders
    "glass-card-dark ": "bg-white ",
    "glass-card-dark\"": "bg-white\"",
    "glass-card-dark-header ": "bg-slate-50 ",
    "glass-card-dark-header\"": "bg-slate-50\"",
    "border-cyan-500/20": "border-slate-200",
    "border-cyan-500/30": "border-slate-300",
    "bg-[#00152e]/50": "bg-slate-100",
    
    # Texts
    "text-slate-200": "text-slate-800",
    "text-slate-300": "text-slate-700",
    "text-slate-400": "text-slate-500",
    
    # Specific Text color fixes to restore headers and content without breaking buttons
    'className="font-bold text-white': 'className="font-bold text-[#002855]',
    'className="font-semibold text-white"': 'className="font-semibold text-slate-800"',
    'font-medium text-white"': 'font-medium text-slate-800"',
    'text-white mb-4 flex': 'text-[#002855] mb-4 flex',
    
    # Table specifics
    "divide-cyan-500/20": "divide-slate-200",
    "divide-cyan-500/10": "divide-slate-100",
    "hover:bg-white/5": "hover:bg-slate-50",
    
    # Inputs
    "bg-black/20 border border-cyan-500/30 text-white": "bg-transparent border border-slate-200",
    "bg-black/20 border-cyan-500/30 text-white": "bg-white border-slate-200",
    
    # Checkbox background and text fixes
    "bg-white/10 px-2 py-0.5 rounded": "bg-slate-100 px-2 py-0.5 rounded",
    "bg-white/20 p-2": "bg-blue-100 text-blue-700 p-2"
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
            
            original = content
            for old, new in replacements.items():
                content = content.replace(old, new)
                
            if original != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated: {filepath}")

print("Light refactoring complete.")
