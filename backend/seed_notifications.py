from app.database import SessionLocal, engine
from app.models import Notification, User, UserRole, Base
from datetime import datetime, timedelta

Base.metadata.create_all(bind=engine)

db = SessionLocal()
db.query(Notification).delete()
db.commit()

user = db.query(User).filter(User.role == UserRole.USER).first()

if user:
    db.add_all([
        Notification(
            title='Звіт повернуто на доопрацювання',
            message='Ваш звіт було перевірено аналітиком та повернуто на доопрацювання.',
            user_id=user.id,
            created_at=datetime.utcnow() - timedelta(hours=2)
        ),
        Notification(
            title='Оновлення методики',
            message='Опубліковано нову версію стандарту щодо базових вимог кіберзахисту.',
            user_id=user.id,
            created_at=datetime.utcnow() - timedelta(days=1)
        ),
        Notification(
            title='Вітаємо в системі!',
            message='Ваш обліковий запис успішно підключено. Можете починати роботу.',
            user_id=user.id,
            is_read=True,
            created_at=datetime.utcnow() - timedelta(days=3)
        ),
    ])

db.add_all([
    Notification(
        title='Нові звіти на перевірці',
        message='3 нові звіти очікують вашого розгляду в реєстрі звітів.',
        target_role=UserRole.ANALYST,
        created_at=datetime.utcnow() - timedelta(hours=1)
    ),
    Notification(
        title='Протерміновані оцінювання',
        message='2 організації не подали звіт у встановлений термін. Рекомендується надіслати нагадування.',
        target_role=UserRole.ANALYST,
        created_at=datetime.utcnow() - timedelta(days=1)
    ),
    Notification(
        title='Оновлення методики',
        message='Опубліковано нову версію стандарту. Перегляньте перед наступним циклом оцінювання.',
        target_role=UserRole.ANALYST,
        is_read=True,
        created_at=datetime.utcnow() - timedelta(days=2)
    ),
    Notification(
        title='Новий запит на доступ',
        message='Організація надіслала запит на підключення. Необхідно створити обліковий запис.',
        target_role=UserRole.FUNC_ADMIN,
        created_at=datetime.utcnow() - timedelta(minutes=30)
    ),
    Notification(
        title='Змінено роль користувача',
        message='Зафіксовано зміну ролі: user@test.ua -> ANALYST. Перевірте журнал дій.',
        target_role=UserRole.FUNC_ADMIN,
        created_at=datetime.utcnow() - timedelta(hours=5)
    ),
    Notification(
        title='Нові облікові записи',
        message='5 нових користувачів зареєстровано протягом останнього тижня. Перевірте розподіл ролей.',
        target_role=UserRole.FUNC_ADMIN,
        is_read=True,
        created_at=datetime.utcnow() - timedelta(days=3)
    ),
    Notification(
        title='Оновлення шаблону звіту',
        message='Шаблон самооцінювання v1.0 очікує на публікацію нової версії.',
        target_role=UserRole.FUNC_ADMIN,
        created_at=datetime.utcnow() - timedelta(days=4)
    ),
])

db.commit()
db.close()
print('Notifications seeded successfully')
