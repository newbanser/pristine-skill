import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0
    try:
        with open(path, newline='') as f:
            reader = csv.DictReader(f)
            if reader.fieldnames is None:
                return 0
            for row in reader:
                raw = row.get('amount')
                if raw is None:
                    continue
                try:
                    total += float(raw)
                except ValueError:
                    continue
    except FileNotFoundError:
        return 0
    return total
