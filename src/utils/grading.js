/**
 * Converts a percentage to a Philippine grade point (1.0 to 5.0).
 * 1.0 is Excellent, 3.0 is Passing, 5.0 is Failed.
 */
export const percentageToGradePoint = (percentage, passingGrade = 60) => {
    if (percentage === null || percentage === undefined) return null;
    const p = parseFloat(percentage);
    if (isNaN(p)) return null;

    if (p < passingGrade) return 5.00;
    if (p >= 100) return 1.00;

    const range = 100 - passingGrade;
    if (range <= 0) return 3.00;

    // Linear interpolation: Grade = 1.0 + 2.0 * (100 - p) / range
    const rawGrade = 1.0 + 2.0 * (100 - p) / range;
    
    // Round to the nearest 0.25
    return Math.round(rawGrade * 4) / 4;
};

export const getGradeDescription = (gradePoint) => {
    if (gradePoint === null || gradePoint === undefined) return '';
    const g = parseFloat(gradePoint);
    if (g <= 1.25) return 'Excellent';
    if (g <= 1.75) return 'Very Good';
    if (g <= 2.25) return 'Good';
    if (g <= 2.75) return 'Satisfactory';
    if (g <= 3.00) return 'Passing';
    return 'Failed';
};
