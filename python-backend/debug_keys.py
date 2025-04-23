import json

with open("team_stats.json") as f:
    data = json.load(f)

print("Available keys:", data[0].keys())
