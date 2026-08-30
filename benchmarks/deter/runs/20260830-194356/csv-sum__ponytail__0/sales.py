import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    with open(path, newline='') as f:
        for row in csv.DictReader(f):
            try:
                total += float(row['amount'])
            except (KeyError, ValueError):
                continue
    return total
