import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    with open(path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            value = row.get('amount')
            if value is None or value.strip() == '':
                continue
            try:
                total += float(value)
            except ValueError:
                # skip malformed non-numeric entries
                continue
    return total
