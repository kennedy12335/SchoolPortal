from enum import Enum

class YearGroup(Enum):
    YEAR_6 = "Year 6"
    YEAR_7 = "Year 7"
    YEAR_8 = "Year 8"
    YEAR_9 = "Year 9"
    YEAR_10 = "Year 10"
    YEAR_11 = "Year 11"
    YEAR_12 = "Year 12"

class ClassName(Enum):
    AMBER = "Amber" 
    EMERALD = "Emerald"
    IVORY = "Ivory"
    SPRING = "Spring"
    DIAMOND = "Diamond"

    # For Different schools, this would be configurable