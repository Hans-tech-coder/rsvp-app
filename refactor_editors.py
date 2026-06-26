import os
import glob
import re

dir_path = "/Users/hans_skyrocket/wdding-rsvp/src/app/admin/content/"
files = glob.glob(dir_path + "*Editor.tsx")
files = [f for f in files if not f.endswith("FaqsEditor.tsx") and not f.endswith("RegistryEditor.tsx")]

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    print(f"Checking {os.path.basename(filepath)}...")
