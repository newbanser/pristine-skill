import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    with open(path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            amount = row.get('amount')
            if amount is None:
                continue
            try:
                total += float(amount)
            except (ValueError, TypeError):
                continue
    return total
