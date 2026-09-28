/**
 * Facts about the person that appear on more than one page, and in what /ask can
 * say. Change them here, once.
 */
export const profile = {
    name: "Ujjwal Jain",
    role: "Full-stack engineer, backend-focused, building GenAI products end to end",
    degree: "Bachelor's in Computer Science",
    school: "BITS Pilani",
    years: "2024–2028",
    cgpa: "8.82",
    github: "https://github.com/Ujjwaljain16",
} as const;

/** The education line shown on the home page. */
export const educationLine = `${profile.degree} · ${profile.school} · ${profile.cgpa} CGPA · ${profile.years}`;
