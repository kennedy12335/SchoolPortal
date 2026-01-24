"""
Mock Data Generator for School Payment System

Generates:
- 600 students (100 per year group, 20 per class)
- Parents with realistic family structures

Family rules:
- Each child has 1 or 2 parents
- A parent can have up to 4 children
- If two parents share a child, they share ALL children (realistic family unit)
"""

import random
import sys
import os
from uuid import uuid4

# Add the parent directory to the path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models.base import Base
from app.models.student import Student
from app.models.parent import Parent, parent_student_association
from app.models.classes import YearGroup, ClassName
from app.models.fee import Fee
from app.models.student_fee import StudentFee


# Sample names for generating realistic data
FIRST_NAMES_MALE = [
    "Chukwuemeka", "Oluwaseun", "Adebayo", "Chibueze", "Tunde", "Emeka", "Olumide",
    "Ikechukwu", "Obiora", "Nnamdi", "Tobi", "Femi", "Kayode", "Chidi", "Yusuf",
    "Abdullahi", "Ibrahim", "Musa", "David", "Samuel", "John", "Michael", "Daniel",
    "Emmanuel", "Peter", "Paul", "James", "Benjamin", "Joseph", "Joshua", "Caleb",
    "Ethan", "Andrew", "Matthew", "Luke", "Mark", "Timothy", "Stephen", "Philip",
    "Nathan", "Victor", "Oscar", "Henry", "Charles", "William", "George", "Thomas",
    "Richard", "Robert", "Edward", "Francis", "Kenneth", "Patrick", "Dennis", "Gerald",
    "Raymond", "Eugene", "Lawrence", "Albert", "Arthur", "Frederick", "Harold"
]

FIRST_NAMES_FEMALE = [
    "Chidinma", "Oluwabunmi", "Adaeze", "Ngozi", "Funke", "Yetunde", "Aisha",
    "Fatima", "Amina", "Halima", "Grace", "Faith", "Hope", "Joy", "Peace",
    "Blessing", "Mercy", "Patience", "Esther", "Ruth", "Mary", "Sarah", "Rebecca",
    "Rachel", "Hannah", "Abigail", "Elizabeth", "Victoria", "Catherine", "Margaret",
    "Patricia", "Jennifer", "Linda", "Barbara", "Susan", "Jessica", "Karen", "Nancy",
    "Betty", "Dorothy", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle",
    "Carol", "Amanda", "Melissa", "Deborah", "Stephanie", "Rebecca", "Sharon", "Laura",
    "Cynthia", "Kathleen", "Amy", "Angela", "Shirley", "Anna", "Helen", "Samantha"
]

LAST_NAMES = [
    "Okonkwo", "Adeyemi", "Bakare", "Chukwu", "Danjuma", "Eze", "Fashola",
    "Gambari", "Hassan", "Igwe", "Jibril", "Kalu", "Lawal", "Mohammed",
    "Nwosu", "Okafor", "Peterside", "Quadri", "Rabiu", "Sanusi", "Taiwo",
    "Uche", "Vandu", "Waziri", "Yakubu", "Zaria", "Abubakar", "Adeleke",
    "Amadi", "Bello", "Chinonso", "Dikko", "Ebere", "Fadipe", "Gana",
    "Haruna", "Ibeh", "Johnson", "Kamara", "Lateef", "Madu", "Nwankwo",
    "Ogbonna", "Opara", "Pius", "Quadir", "Rufai", "Suleiman", "Tanko",
    "Udoh", "Vincent", "Williams", "Xavier", "Yaro", "Zainab", "Adams",
    "Brown", "Clark", "Davies", "Evans", "Foster", "Green", "Harris",
    "Jackson", "King", "Lewis", "Martin", "Nelson", "Owen", "Price"
]

MIDDLE_NAMES = [
    "Chinedu", "Oluwafemi", "Adaobi", "Amara", "Tochukwu", "Ifeanyi", "Kelechi",
    "Nneka", "Chiamaka", "Obinna", "Uzoamaka", "Kenechukwu", "Somtochukwu",
    None, None, None, None, None  # Include None for students without middle names
]

# Fees data (base, fixed fees)
FEES_DATA = [
    {"code": "TUITION", "name": "Tuition", "amount": 500000.0, "description": "Annual tuition fee"},
    {"code": "BOARDING", "name": "Boarding", "amount": 200000.0, "description": "Boarding accommodation"},
    {"code": "UTILITY", "name": "Utility", "amount": 50000.0, "description": "Utilities and maintenance"},
    {"code": "PRIZE_GIVING", "name": "Prize Giving Day", "amount": 15000.0, "description": "Prize giving day event"},
    {"code": "YEAR_BOOK", "name": "Year Book", "amount": 10000.0, "description": "Annual yearbook"},
    {"code": "OFFERING_HAIRS", "name": "Offering & Hairs", "amount": 5000.0, "description": "School offerings"},
]

# Year groups to use (6 year groups for 600 students = 100 per year)
YEAR_GROUPS = [
    YearGroup.YEAR_6,
    YearGroup.YEAR_7,
    YearGroup.YEAR_8,
    YearGroup.YEAR_9,
    YearGroup.YEAR_10,
    YearGroup.YEAR_11,
]

CLASS_NAMES = list(ClassName)  # All 5 classes


def generate_phone_number():
    """Generate a realistic Nigerian phone number."""
    prefixes = ["0803", "0805", "0806", "0807", "0808", "0809", "0810", "0811",
                "0812", "0813", "0814", "0815", "0816", "0817", "0818", "0819",
                "0903", "0905", "0906", "0907", "0908", "0909", "0915", "0916"]
    return f"{random.choice(prefixes)}{random.randint(1000000, 9999999)}"


def generate_email(first_name: str, last_name: str, domain: str = None) -> str:
    """Generate a unique email address."""
    if domain is None:
        domains = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "mail.com"]
        domain = random.choice(domains)

    suffix = random.randint(1, 9999)
    return f"{first_name.lower()}.{last_name.lower()}{suffix}@{domain}"


def generate_reg_number(year_group: YearGroup, index: int) -> str:
    """Generate a unique registration number."""
    year_num = year_group.name.split("_")[1]  # Extract number from YEAR_X
    return f"STU{year_num}{str(index).zfill(4)}"


def create_families(num_students: int = 600) -> list:
    """
    Create family structures with realistic parent-child relationships.

    Returns a list of families, each containing:
    - 'parents': list of 1 or 2 parent dicts
    - 'children_count': number of children (1-4)
    """
    families = []
    total_children = 0

    while total_children < num_students:
        # Determine number of children for this family (1-4)
        remaining = num_students - total_children
        max_children = min(4, remaining)

        if remaining <= 4:
            children_count = remaining
        else:
            # Weight towards 1-2 children to create more variety
            weights = [0.3, 0.35, 0.2, 0.15][:max_children]
            children_count = random.choices(range(1, max_children + 1), weights=weights)[0]

        # Determine number of parents (1 or 2)
        # 75% have two parents, 25% have single parent
        num_parents = 2 if random.random() < 0.75 else 1

        # Generate parent data
        family_last_name = random.choice(LAST_NAMES)
        parents = []

        if num_parents == 2:
            # Father
            father = {
                "id": str(uuid4()),
                "auth_id": f"auth_{uuid4().hex[:16]}",
                "first_name": random.choice(FIRST_NAMES_MALE),
                "last_name": family_last_name,
                "email": None,  # Will be set later to ensure uniqueness
                "phone": None,  # Will be set later to ensure uniqueness
            }
            parents.append(father)

            # Mother (may have different last name or same)
            mother_last_name = family_last_name if random.random() < 0.8 else random.choice(LAST_NAMES)
            mother = {
                "id": str(uuid4()),
                "auth_id": f"auth_{uuid4().hex[:16]}",
                "first_name": random.choice(FIRST_NAMES_FEMALE),
                "last_name": mother_last_name,
                "email": None,
                "phone": None,
            }
            parents.append(mother)
        else:
            # Single parent (randomly male or female)
            is_male = random.random() < 0.4
            parent = {
                "id": str(uuid4()),
                "auth_id": f"auth_{uuid4().hex[:16]}",
                "first_name": random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE),
                "last_name": family_last_name,
                "email": None,
                "phone": None,
            }
            parents.append(parent)

        families.append({
            "parents": parents,
            "children_count": children_count,
            "family_last_name": family_last_name,
        })

        total_children += children_count

    return families


def assign_unique_contact_info(families: list, used_emails: set, used_phones: set):
    """Assign unique emails and phone numbers to all parents."""
    for family in families:
        for parent in family["parents"]:
            # Generate unique email
            email = generate_email(parent["first_name"], parent["last_name"])
            while email in used_emails:
                email = generate_email(parent["first_name"], parent["last_name"])
            used_emails.add(email)
            parent["email"] = email

            # Generate unique phone
            phone = generate_phone_number()
            while phone in used_phones:
                phone = generate_phone_number()
            used_phones.add(phone)
            parent["phone"] = phone


def generate_students(families: list) -> list:
    """
    Generate student data distributed evenly across year groups and classes.

    Distribution: 100 students per year group, 20 per class (5 classes).
    """
    students = []
    used_emails = set()

    # Create slots for each year group and class
    # 100 students per year, 20 per class
    slots = []
    for year_group in YEAR_GROUPS:
        for class_name in CLASS_NAMES:
            for _ in range(20):  # 20 students per class
                slots.append((year_group, class_name))

    # Shuffle slots to distribute randomly
    random.shuffle(slots)

    slot_index = 0
    reg_counters = {yg: 1 for yg in YEAR_GROUPS}

    for family in families:
        family_last_name = family["family_last_name"]

        for _ in range(family["children_count"]):
            if slot_index >= len(slots):
                break

            year_group, class_name = slots[slot_index]

            # Determine gender randomly
            is_male = random.random() < 0.5
            first_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
            middle_name = random.choice(MIDDLE_NAMES)

            # Generate unique student email (optional, some students may not have)
            student_email = None
            if random.random() < 0.3:  # 30% of students have email
                student_email = generate_email(first_name, family_last_name, "student.school.edu")
                while student_email in used_emails:
                    student_email = generate_email(first_name, family_last_name, "student.school.edu")
                used_emails.add(student_email)

            reg_number = generate_reg_number(year_group, reg_counters[year_group])
            reg_counters[year_group] += 1

            student = {
                "id": str(uuid4()),
                "reg_number": reg_number,
                "first_name": first_name,
                "middle_name": middle_name,
                "last_name": family_last_name,
                "year_group": year_group,
                "class_name": class_name,
                "email": student_email,
                "parent_ids": [p["id"] for p in family["parents"]],
            }

            students.append(student)
            slot_index += 1

    return students


def seed_database(db: Session):
    """Seed the database with mock data."""
    print("Starting database seeding...")

    # Clear existing data (optional - comment out if you want to append)
    print("Clearing existing data...")
    db.execute(parent_student_association.delete())
    db.query(Student).delete()
    db.query(Parent).delete()
    db.commit()

    # Create families
    print("Creating family structures...")
    families = create_families(num_students=600)
    print(f"  Created {len(families)} families")

    # Assign unique contact info to parents
    used_emails = set()
    used_phones = set()
    assign_unique_contact_info(families, used_emails, used_phones)

    # Create parents in database
    print("Creating parents...")
    parent_objects = {}
    for family in families:
        for parent_data in family["parents"]:
            parent = Parent(
                id=parent_data["id"],
                auth_id=parent_data["auth_id"],
                first_name=parent_data["first_name"],
                last_name=parent_data["last_name"],
                email=parent_data["email"],
                phone=parent_data["phone"],
            )
            db.add(parent)
            parent_objects[parent_data["id"]] = parent

    db.flush()
    total_parents = len(parent_objects)
    print(f"  Created {total_parents} parents")

    # Generate students
    print("Creating students...")
    students_data = generate_students(families)

    student_objects = []
    for student_data in students_data:
        student = Student(
            id=student_data["id"],
            reg_number=student_data["reg_number"],
            first_name=student_data["first_name"],
            middle_name=student_data["middle_name"],
            last_name=student_data["last_name"],
            year_group=student_data["year_group"],
            class_name=student_data["class_name"],
            email=student_data["email"]
        )

        # Link parents to student
        for parent_id in student_data["parent_ids"]:
            student.parents.append(parent_objects[parent_id])

        db.add(student)
        student_objects.append(student)

    db.flush()
    print(f"  Created {len(student_objects)} students")

    # Print distribution stats
    print("\n  Distribution by year group and class:")
    for year_group in YEAR_GROUPS:
        year_students = [s for s in students_data if s["year_group"] == year_group]
        print(f"    {year_group.value}: {len(year_students)} students")
        for class_name in CLASS_NAMES:
            class_students = [s for s in year_students if s["class_name"] == class_name]
            print(f"      {class_name.value}: {len(class_students)} students")

    # Create clubs
    print("\nCreating clubs...")
    fee_objects = []
    for fee_data in FEES_DATA:
        fee = Fee(
            id=str(uuid4()),
            code=fee_data["code"],
            name=fee_data["name"],
            amount=fee_data["amount"],
            description=fee_data.get("description"),
        )
        db.add(fee)
        fee_objects.append(fee)

    db.flush()
    print(f"  Created {len(fee_objects)} fees")

    # Assign fees to all students as StudentFee rows
    print("Assigning fees to students (creating StudentFee rows)...")
    student_fee_count = 0
    for student in student_objects:
        for fee in fee_objects:
            sf = StudentFee(
                id=str(uuid4()),
                student_id=student.id,
                fee_id=fee.id,
                amount=fee.amount,
                paid=False,
            )
            db.add(sf)
            student_fee_count += 1

    db.flush()
    print(f"  Created {student_fee_count} student_fee records for {len(student_objects)} students")



    # Commit all changes
    db.commit()

    # Print summary
    print("\n" + "="*50)
    print("SEEDING COMPLETE - Summary:")
    print("="*50)
    print(f"  Total Parents: {total_parents}")
    print(f"  Total Students: {len(student_objects)}")
    print(f"  Total Families: {len(families)}")
    print(f"  Total Clubs: {len(clubs)}")

    # Family statistics
    single_parent_families = sum(1 for f in families if len(f["parents"]) == 1)
    two_parent_families = sum(1 for f in families if len(f["parents"]) == 2)
    print(f"\n  Single-parent families: {single_parent_families}")
    print(f"  Two-parent families: {two_parent_families}")

    children_counts = {}
    for family in families:
        count = family["children_count"]
        children_counts[count] = children_counts.get(count, 0) + 1

    print("\n  Children per family:")
    for count in sorted(children_counts.keys()):
        print(f"    {count} child(ren): {children_counts[count]} families")


def main():
    """Main entry point."""
    print("Mock Data Generator for School Payment System")
    print("="*50)

    # Create database session
    db = SessionLocal()

    try:
        seed_database(db)
    except Exception as e:
        print(f"\nError during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()

    print("\nDone!")


if __name__ == "__main__":
    main()
