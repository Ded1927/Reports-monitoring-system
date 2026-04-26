import pandas as pd
import json

def preview_excel(file_path):
    xl = pd.ExcelFile(file_path)
    result = {"sheet_names": xl.sheet_names, "sheets": {}}
    for sheet in xl.sheet_names:
        df = pd.read_excel(file_path, sheet_name=sheet, nrows=20)
        df = df.fillna("")
        result["sheets"][sheet] = {
            "columns": df.columns.tolist(),
            "rows": df.to_dict(orient="records")
        }
    with open('preview.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    preview_excel('self-checking.xlsx')
