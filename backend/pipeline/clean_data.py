import pandas as pd

#Clean Data
def clean_csv():
    df = pd.read_csv('data/data.csv')
    df = df.dropna()
    df = df.drop_duplicates()
    df["price"] = pd.to_numeric(df["price"],errors="coerce")
    df["rating"] = pd.to_numeric(df["rating"],errors="coerce")
    df = df[df["rating"]>0]
    df = df[df["price"]>0]
    return df

