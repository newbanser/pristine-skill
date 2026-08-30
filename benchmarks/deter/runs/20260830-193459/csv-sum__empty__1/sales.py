import csv

def sum_amount(path):
    """Read the CSV at path and return the sum of its 'amount' column."""
    total = 0.0
    try:
        with open(path, 'r', newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Check if 'amount' exists in the row and is not empty
                    if 'amount' in row and row['amount'].strip():
                        total += float(row['amount'].strip())
                    # If 'amount' is missing or empty, skip this row
                except (ValueError, KeyError, TypeError):
                    # Malformed row - skip it
                    continue
    except FileNotFoundError:
        # If file doesn't exist, return 0.0
        print(f"Warning: File {path} not found. Returning 0.0")
        return 0.0
    except Exception as e:
        # Handle other unexpected errors
        print(f"Warning: Error reading {path}: {e}. Returning 0.0")
        return 0.0
    
    return total
