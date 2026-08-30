import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0.0
    try:
        with open(path, 'r', newline='', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            if 'amount' not in (reader.fieldnames or []):
                raise ValueError("CSV missing 'amount' column")
            for row in reader:
                try:
                    total += float(row['amount'])
                except (TypeError, ValueError):
                    continue
    except FileNotFoundError:
        raise
    return total
