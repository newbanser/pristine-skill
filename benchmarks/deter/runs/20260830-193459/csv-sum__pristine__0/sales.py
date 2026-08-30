import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0.0
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                total += float(row['amount'])
            except (KeyError, TypeError, ValueError):
                continue
    return total
