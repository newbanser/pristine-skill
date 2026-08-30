import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    with open(path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # skip rows without amount or with invalid amounts
                amount_str = row.get('amount')
                if amount_str is None or amount_str.strip() == '':
                    continue
                total += float(amount_str)
            except (ValueError, TypeError):
                # malformed numeric value, skip this row
                continue
    return total
