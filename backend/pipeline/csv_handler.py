import csv

def add_to_csv(df):
    with open("data/data.csv", "a", newline="") as file:
        writer = csv.writer(file)

        writer.writerow([
            df["id"],
            df["product"],
            df["price"],
            df["rating"]
        ])
