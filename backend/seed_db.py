import os
import sys
import pandas as pd
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import ReportTemplate, ReportType, TemplatePart, TemplateCategory, TemplateControl, ControlType, ControlOption

def seed():
    db = SessionLocal()
    # Check if template already exists
    existing = db.query(ReportTemplate).filter_by(name="Самооцінювання стану кіберзахисту", type=ReportType.SELF_ASSESSMENT).first()
    if existing:
        print("Template already exists!")
        return

    # Create Template
    template = ReportTemplate(
        name="Самооцінювання стану кіберзахисту",
        type=ReportType.SELF_ASSESSMENT,
        version="1.0"
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    # File path
    file_path = "self-checking.xlsx"

    # --- PART 1: Базові заходи ---
    part1 = TemplatePart(template_id=template.id, name="Виконання базових заходів", order_num=1)
    db.add(part1)
    db.commit()
    db.refresh(part1)

    df1 = pd.read_excel(file_path, sheet_name=0, header=1)
    df1 = df1.drop(0)

    options_part1 = [
        {"label": "Позитивно", "mult": 1.0},
        {"label": "Частково", "mult": 0.5},
        {"label": "Заплановано", "mult": 0.2},
        {"label": "Негативно", "mult": 0.0},
        {"label": "Не застосовується", "mult": None}
    ]

    current_category_name = None
    current_category = None
    cat_order = 1
    ctrl_order = 1

    for idx, row in df1.iterrows():
        cat_name = str(row.iloc[1]).strip()
        measure_name = str(row.iloc[2]).strip()
        question_text = str(row.iloc[3]).strip()
        
        if pd.isna(cat_name) or cat_name == "" or cat_name == "nan" or cat_name == "None":
            cat_name = current_category_name
            
        if pd.isna(question_text) or question_text == "" or question_text == "nan" or question_text == "None":
            continue

        code = ""
        if measure_name:
            parts = measure_name.split()
            if len(parts) > 0 and "-" in parts[0]:
                code = parts[0]

        if cat_name != current_category_name:
            current_category_name = cat_name
            current_category = TemplateCategory(part_id=part1.id, name=cat_name, order_num=cat_order)
            db.add(current_category)
            db.commit()
            db.refresh(current_category)
            cat_order += 1

        control = TemplateControl(
            category_id=current_category.id,
            code=code,
            question_text=question_text,
            control_type=ControlType.SELECT,
            is_required=True,
            weight=1,
            order_num=ctrl_order
        )
        db.add(control)
        db.commit()
        db.refresh(control)
        ctrl_order += 1

        for opt_idx, opt in enumerate(options_part1):
            db.add(ControlOption(
                control_id=control.id,
                label=opt["label"],
                score_multiplier=opt["mult"],
                order_num=opt_idx + 1
            ))
        db.commit()

    # --- PART 2: Виконання вимог законодавства ---
    part2 = TemplatePart(template_id=template.id, name="Виконання вимог законодавства", order_num=2)
    db.add(part2)
    db.commit()
    db.refresh(part2)

    df2 = pd.read_excel(file_path, sheet_name=1, header=1)
    df2 = df2.drop(0)

    options_part2 = [
        {"label": "Виконано повністю / ТАК / 100%", "mult": 1.0},
        {"label": "Виконано частково / >50%", "mult": 0.5},
        {"label": "Заплановано / У процесі виконання / <50%", "mult": 0.2},
        {"label": "Не виконано / НІ / 0%", "mult": 0.0}
    ]

    current_category_name = None
    current_category = None
    cat_order = 1
    ctrl_order = 1

    for idx, row in df2.iterrows():
        cat_name = str(row.iloc[1]).strip()
        question_text = str(row.iloc[2]).strip()
        
        if pd.isna(cat_name) or cat_name == "" or cat_name == "nan" or cat_name == "None":
            cat_name = current_category_name
            
        if pd.isna(question_text) or question_text == "" or question_text == "nan" or question_text == "None":
            continue

        if cat_name != current_category_name:
            current_category_name = cat_name
            current_category = TemplateCategory(part_id=part2.id, name=cat_name, order_num=cat_order)
            db.add(current_category)
            db.commit()
            db.refresh(current_category)
            cat_order += 1

        control = TemplateControl(
            category_id=current_category.id,
            code=None,
            question_text=question_text,
            control_type=ControlType.SELECT,
            is_required=True,
            weight=1,
            order_num=ctrl_order
        )
        db.add(control)
        db.commit()
        db.refresh(control)
        ctrl_order += 1

        for opt_idx, opt in enumerate(options_part2):
            db.add(ControlOption(
                control_id=control.id,
                label=opt["label"],
                score_multiplier=opt["mult"],
                order_num=opt_idx + 1
            ))
        db.commit()

    print("Seeding completed successfully!")

if __name__ == "__main__":
    seed()
