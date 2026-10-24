import re
import json

text = "Ada: 42, Grace: 57, Katherine: 91"
records = [{"name": name, "score": int(score)}
           for name, score in re.findall(r"(\w+): (\d+)", text)]
print(json.dumps(records, indent=2))
