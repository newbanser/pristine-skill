import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                total += float(row['amount'])
            except (KeyError, ValueError):
                # Skip rows missing 'amount' or with non-numeric values
                continue
    return total
