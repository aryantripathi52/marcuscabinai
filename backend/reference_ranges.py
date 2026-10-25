"""
Marcuscabin - Clinical Reference Ranges & Multi-Biomarker Combination Knowledge Base.
Standards compliant with standard clinical pathology intervals (SI and US Conventional units).
"""

from typing import Dict, Any, List, Optional

# Standard adult clinical reference ranges
REFERENCE_RANGES: Dict[str, Dict[str, Any]] = {
    # Metabolic & Glycemic
    "Fasting Glucose": {
        "unit": "mg/dL",
        "min": 70,
        "max": 99,
        "critical_low": 55,
        "critical_high": 180,
        "category": "Metabolic",
        "description": "Primary energy substrate; elevated levels suggest prediabetes, diabetes, or metabolic stress.",
        "high_explanation": "Persistent elevated fasting glucose indicates insulin resistance or impaired pancreatic beta-cell function.",
        "low_explanation": "Hypoglycemia may cause shakiness, dizziness, or confusion; requires rapid carbohydrate stabilization."
    },
    "HbA1c": {
        "unit": "%",
        "min": 4.0,
        "max": 5.6,
        "critical_low": 3.8,
        "critical_high": 9.0,
        "category": "Metabolic",
        "description": "3-month average glycemic index.",
        "high_explanation": "Elevated HbA1c (>5.6% prediabetes, >=6.5% diabetes) confirms chronic vascular hyperglycemia exposure.",
        "low_explanation": "Usually benign unless related to hemolytic anemia or intensive hypoglycemic therapy."
    },

    # Renal Panel
    "Creatinine": {
        "unit": "mg/dL",
        "min": 0.7,
        "max": 1.3,
        "critical_low": 0.4,
        "critical_high": 3.0,
        "category": "Renal",
        "description": "Waste byproduct of muscle breakdown cleared exclusively by kidneys.",
        "high_explanation": "Serum creatinine elevation reflects diminished glomerular filtration rate and impaired renal clearance.",
        "low_explanation": "Often reflects low muscle mass or severe malnutrition."
    },
    "eGFR": {
        "unit": "mL/min/1.73m2",
        "min": 90,
        "max": 130,
        "critical_low": 30,
        "critical_high": 160,
        "category": "Renal",
        "description": "Estimated Glomerular Filtration Rate; index of overall kidney filtration efficiency.",
        "high_explanation": "Hyperfiltration may be seen in early diabetic nephropathy or pregnancy.",
        "low_explanation": "eGFR below 60 mL/min denotes Chronic Kidney Disease (CKD Stage 3+)."
    },
    "BUN": {
        "unit": "mg/dL",
        "min": 7,
        "max": 20,
        "critical_low": 4,
        "critical_high": 60,
        "category": "Renal",
        "description": "Blood Urea Nitrogen; liver byproduct cleared by renal tubules.",
        "high_explanation": "High BUN signals prerenal dehydration, excessive protein catabolism, or acute renal strain.",
        "low_explanation": "May occur in low protein diets or severe hepatic insufficiency."
    },

    # Electrolytes
    "Potassium": {
        "unit": "mEq/L",
        "min": 3.5,
        "max": 5.0,
        "critical_low": 2.8,
        "critical_high": 5.8,
        "category": "Electrolytes",
        "description": "Vital intracellular electrolyte governing cardiac myocardial electrophysiology.",
        "high_explanation": "Hyperkalemia can trigger fatal ventricular arrhythmias; demands prompt clinical evaluation.",
        "low_explanation": "Hypokalemia predisposes to muscle weakness, cramps, and cardiac QT prolongation."
    },
    "Sodium": {
        "unit": "mEq/L",
        "min": 135,
        "max": 145,
        "critical_low": 125,
        "critical_high": 155,
        "category": "Electrolytes",
        "description": "Principal extracellular cation regulating osmotic fluid balance.",
        "high_explanation": "Hypernatremia usually indicates severe free-water deficit or hyperosmolar dehydration.",
        "low_explanation": "Hyponatremia indicates fluid overload, SIADH, or excessive hypotonic intake."
    },
    "Calcium": {
        "unit": "mg/dL",
        "min": 8.5,
        "max": 10.2,
        "critical_low": 7.0,
        "critical_high": 12.0,
        "category": "Electrolytes",
        "description": "Essential for neuromuscular excitability, bone metabolism, and coagulation.",
        "high_explanation": "Hypercalcemia can stem from primary hyperparathyroidism or occult malignancy.",
        "low_explanation": "Hypocalcemia causes tetany, perioral paresthesias, and hyperreflexia."
    },

    # Hepatic Panel
    "ALT": {
        "unit": "U/L",
        "min": 7,
        "max": 45,
        "critical_low": 3,
        "critical_high": 250,
        "category": "Hepatic",
        "description": "Alanine Aminotransferase; liver-specific intracellular enzyme.",
        "high_explanation": "Elevation signifies hepatocellular damage, fatty liver disease, toxic injury, or hepatitis.",
        "low_explanation": "Normal physiological finding."
    },
    "AST": {
        "unit": "U/L",
        "min": 8,
        "max": 40,
        "critical_low": 3,
        "critical_high": 250,
        "category": "Hepatic",
        "description": "Aspartate Aminotransferase; found in hepatocytes, cardiac tissue, and skeletal muscle.",
        "high_explanation": "Elevated during active liver parenchyma necrosis or severe muscle injury.",
        "low_explanation": "Normal physiological finding."
    },
    "Total Bilirubin": {
        "unit": "mg/dL",
        "min": 0.2,
        "max": 1.2,
        "critical_low": 0.1,
        "critical_high": 3.5,
        "category": "Hepatic",
        "description": "Breakdown product of hemoglobin processed by the biliary system.",
        "high_explanation": "Elevated bilirubin leads to clinical jaundice; signals biliary obstruction or hemolysis.",
        "low_explanation": "Normal physiological finding."
    },
    "Albumin": {
        "unit": "g/dL",
        "min": 3.5,
        "max": 5.0,
        "critical_low": 2.5,
        "critical_high": 6.0,
        "category": "Hepatic",
        "description": "Major serum protein maintaining oncotic vascular pressure.",
        "high_explanation": "Typically due to hemoconcentration and acute dehydration.",
        "low_explanation": "Hypoalbuminemia points to chronic liver disease, nephrotic protein loss, or systemic malnutrition."
    },

    # Lipid Panel
    "Total Cholesterol": {
        "unit": "mg/dL",
        "min": 125,
        "max": 199,
        "critical_low": 90,
        "critical_high": 300,
        "category": "Lipid",
        "description": "Cumulative serum circulating cholesterol.",
        "high_explanation": "Elevated levels elevate atherosclerotic plaque burden and coronary risk.",
        "low_explanation": "Very low levels can indicate hyperthyroidism, malabsorption, or advanced liver failure."
    },
    "Triglycerides": {
        "unit": "mg/dL",
        "min": 40,
        "max": 149,
        "critical_low": 20,
        "critical_high": 500,
        "category": "Lipid",
        "description": "Circulating neutral fats synthesized from dietary excess and carbohydrate intake.",
        "high_explanation": "High triglycerides exacerbate cardiovascular risk and extreme elevations (>500) trigger pancreatitis.",
        "low_explanation": "Generally optimal in healthy athletic individuals."
    },
    "HDL": {
        "unit": "mg/dL",
        "min": 40,
        "max": 90,
        "critical_low": 25,
        "critical_high": 120,
        "category": "Lipid",
        "description": "High-Density Lipoprotein; 'protective' reverse-cholesterol carrier.",
        "high_explanation": "Cardioprotective lipid profile.",
        "low_explanation": "Low HDL (<40 mg/dL in men, <50 mg/dL in women) accelerates cardiovascular risk."
    },
    "LDL": {
        "unit": "mg/dL",
        "min": 50,
        "max": 99,
        "critical_low": 30,
        "critical_high": 190,
        "category": "Lipid",
        "description": "Low-Density Lipoprotein; primary atherogenic circulating carrier.",
        "high_explanation": "Direct causal agent of arterial endothelial plaque build-up and ischemic events.",
        "low_explanation": "Safe and optimal with aggressive lifestyle or statin therapy."
    },

    # Hematology
    "Hemoglobin": {
        "unit": "g/dL",
        "min": 13.5,
        "max": 17.5,
        "critical_low": 8.0,
        "critical_high": 20.0,
        "category": "Hematology",
        "description": "Oxygen-transporting iron-metalloprotein inside red blood cells.",
        "high_explanation": "Polycythemia or hemoconcentration; increases blood viscosity.",
        "low_explanation": "Anemia causing tissue hypoxia, fatigue, and exertional dyspnea."
    },
    "Platelets": {
        "unit": "K/uL",
        "min": 150,
        "max": 400,
        "critical_low": 50,
        "critical_high": 800,
        "category": "Hematology",
        "description": "Cellular fragments essential for primary hemostatic plug formation.",
        "high_explanation": "Thrombocytosis can reflect reactive inflammation or myeloproliferative disorder.",
        "low_explanation": "Thrombocytopenia increases spontaneous hemorrhagic bruising and mucosal bleeding."
    },
    # Cardiac & Inflammatory Markers
    "Cardiac Troponin I (hs-cTnI)": {
        "unit": "pg/mL",
        "min": 0.0,
        "max": 14.0,
        "critical_low": 0.0,
        "critical_high": 14.0,
        "category": "Cardiac",
        "description": "High-sensitivity cardiac biomarker for myocardial ischemia or necrosis.",
        "high_explanation": "Acute elevation signifies subendocardial damage, myocardial infarction, or severe hemodynamic myocardial strain.",
        "low_explanation": "Normal physiological baseline."
    },
    "NT-proBNP": {
        "unit": "pg/mL",
        "min": 0,
        "max": 300,
        "critical_low": 0,
        "critical_high": 900,
        "category": "Cardiac",
        "description": "N-terminal pro-B-type natriuretic peptide; myocardial wall stress indicator.",
        "high_explanation": "Elevated during ventricular stretch, congestive heart failure, or volume overload.",
        "low_explanation": "Normal physiological baseline."
    },
    "hs-CRP": {
        "unit": "mg/L",
        "min": 0.0,
        "max": 3.0,
        "critical_low": 0.0,
        "critical_high": 10.0,
        "category": "Inflammatory",
        "description": "High-sensitivity C-reactive protein; systemic inflammatory marker.",
        "high_explanation": "Marked elevation indicates active systemic inflammation, atherothrombotic plaque instability, or tissue injury.",
        "low_explanation": "Ideal vascular baseline."
    },
    "Serum Ferritin": {
        "unit": "ng/mL",
        "min": 30,
        "max": 400,
        "critical_low": 15,
        "critical_high": 600,
        "category": "Inflammatory",
        "description": "Acute-phase reactant and intracellular iron storage protein.",
        "high_explanation": "Hyperferritinemic inflammation points towards acute non-infectious phase reaction or macrophage activation.",
        "low_explanation": "Iron deficiency anemia."
    },
    "D-Dimer": {
        "unit": "ug/mL FEU",
        "min": 0.0,
        "max": 0.50,
        "critical_low": 0.0,
        "critical_high": 1.50,
        "category": "Coagulation",
        "description": "Fibrin degradation fragment indicating active intravascular clot breakdown.",
        "high_explanation": "Borderline/elevated values reflect active microvascular thrombosis or hypercoagulability.",
        "low_explanation": "Normal physiological baseline."
    }
}


# Multi-biomarker combination rules
COMBINATION_RULES: List[Dict[str, Any]] = [
    {
        "id": "diabetic_nephropathy_risk",
        "title": "Cardiorenal & Diabetic Nephropathy Risk",
        "severity": "CRITICAL",
        "urgency_score": 90,
        "conditions": [
            {"metric": "Fasting Glucose", "op": ">=", "threshold": 120},
            {"metric": "Creatinine", "op": ">=", "threshold": 1.35}
        ],
        "or_conditions": [
            {"metric": "Fasting Glucose", "op": ">=", "threshold": 120},
            {"metric": "eGFR", "op": "<=", "threshold": 60}
        ],
        "clinical_rationale": "Elevated fasting glucose coupled with reduced glomerular clearance signals accelerated diabetic microvascular renal damage. Chronic hyperglycemia triggers non-enzymatic glycation of mesangial matrix and hyperfiltration injury.",
        "patient_explanation": "Your blood sugar and kidney filtration markers are elevated at the same time. When elevated sugar lingers in the blood, it acts like sandpaper on the microscopic filtering units of your kidneys, increasing long-term strain.",
        "action_items": [
            "Order spot urine albumin-to-creatinine ratio (uACR) and 3-month HbA1c",
            "Evaluate kidney protective regimens (ACEi/ARB or SGLT2 inhibitors)",
            "Adopt a kidney-conscious, low-glycemic dietary lifestyle"
        ],
        "suggested_questions": [
            "How does high blood sugar specifically damage my kidney filtration?",
            "What immediate dietary adjustments will protect both my kidneys and glucose?",
            "Are there medications that help shield my kidneys while lowering my sugar?"
        ]
    },
    {
        "id": "atherogenic_dyslipidemia",
        "title": "Severe Atherogenic Dyslipidemia",
        "severity": "HIGH",
        "urgency_score": 75,
        "conditions": [
            {"metric": "Total Cholesterol", "op": ">=", "threshold": 210},
            {"metric": "Triglycerides", "op": ">=", "threshold": 170}
        ],
        "clinical_rationale": "Concurrently high total cholesterol and hypertriglyceridemia, particularly when accompanied by elevated LDL or low HDL, accelerates coronary plaque deposition and arterial endothelial stiffening.",
        "patient_explanation": "You have multiple elevated lipid particles in circulation. This combination means cholesterol and fatty molecules can more easily adhere to blood vessel walls, raising cardiovascular risks over time.",
        "action_items": [
            "10-year ASCVD (Atherosclerotic Cardiovascular Disease) risk stratification",
            "Eliminate refined trans/saturated fats and high-fructose syrups",
            "Discuss lipid-lowering therapy (statin/ezetimibe) with your physician"
        ],
        "suggested_questions": [
            "Which of my cholesterol numbers is the most concerning right now?",
            "Can dietary changes alone bring down these elevated triglycerides?",
            "Do I need an ultrasound or heart calcium scan to check my arteries?"
        ]
    },
    {
        "id": "hepatocellular_injury",
        "title": "Hepatocellular Stress & Transaminitis",
        "severity": "HIGH",
        "urgency_score": 70,
        "conditions": [
            {"metric": "ALT", "op": ">=", "threshold": 50},
            {"metric": "AST", "op": ">=", "threshold": 45}
        ],
        "clinical_rationale": "Concomitant elevation in ALT and AST indicates active hepatic parenchyma inflammation or hepatocyte lysis, commonly associated with metabolic steatohepatitis (fatty liver), alcohol, or medications.",
        "patient_explanation": "Both of your liver enzyme markers (ALT and AST) are elevated above standard limits. This indicates that your liver cells are experiencing mild-to-moderate irritation or metabolic inflammation.",
        "action_items": [
            "Perform comprehensive abdominal hepatic ultrasound",
            "Review all prescription, over-the-counter medications, and supplements for hepatotoxicity",
            "Screen for viral hepatitis and assess lifestyle/alcohol intake"
        ],
        "suggested_questions": [
            "What are the most common causes for both of these liver enzymes to be elevated?",
            "Could any vitamins, supplements, or common pain relievers be causing this?",
            "Is this liver inflammation reversible with weight loss and diet?"
        ]
    },
    {
        "id": "cardiorenal_hyperkalemia_alert",
        "title": "Cardiorenal Hyperkalemia Emergency Alert",
        "severity": "CRITICAL",
        "urgency_score": 98,
        "conditions": [
            {"metric": "Potassium", "op": ">=", "threshold": 5.2},
            {"metric": "Creatinine", "op": ">=", "threshold": 1.3}
        ],
        "clinical_rationale": "Serum hyperkalemia combined with decreased renal excretion markedly elevates risk for cardiac conduction disturbances, sinus arrest, or malignant ventricular arrhythmias.",
        "patient_explanation": "Your potassium level is high and your kidneys are working harder than usual. Because kidneys regulate potassium removal, this buildup requires immediate medical review to protect heart rhythm stability.",
        "action_items": [
            "Immediate 12-lead Electrocardiogram (ECG) to assess peaked T-waves or QRS widening",
            "Stat re-draw of serum potassium and electrolytes to exclude laboratory hemolysis",
            "Avoid high-potassium foods (bananas, potatoes, salt substitutes) and review ACEi/diuretic therapy"
        ],
        "suggested_questions": [
            "Should I go to urgent care or the emergency room for an ECG today?",
            "What high-potassium foods and medications should I pause immediately?",
            "Can high potassium cause heart palpitations or chest symptoms?"
        ]
    },
    {
        "id": "metabolic_syndrome_triad",
        "title": "Metabolic Syndrome Triad",
        "severity": "MODERATE",
        "urgency_score": 60,
        "conditions": [
            {"metric": "Fasting Glucose", "op": ">=", "threshold": 100},
            {"metric": "Triglycerides", "op": ">=", "threshold": 150}
        ],
        "clinical_rationale": "The clustering of impaired fasting glucose and elevated serum triglycerides represents a classical hallmark of systemic insulin resistance, visceral adiposity, and pro-inflammatory vascular state.",
        "patient_explanation": "Your blood sugar and triglyceride levels are both running high. When these two run together, it points to 'Metabolic Syndrome'—a sign that your body's cells aren't responding efficiently to insulin.",
        "action_items": [
            "Implement a structured Mediterranean-style low-glycemic nutrition program",
            "Target 150 minutes per week of moderate cardiovascular exercise plus resistance training",
            "Track waist circumference and blood pressure weekly"
        ],
        "suggested_questions": [
            "How does exercise help reverse metabolic syndrome?",
            "What are the best foods to lower both my glucose and triglycerides together?",
            "How often should I recheck this metabolic panel?"
        ]
    },
    {
        "id": "dehydration_prerenal_stress",
        "title": "Prerenal Dehydration & Hemoconcentration",
        "severity": "MODERATE",
        "urgency_score": 55,
        "conditions": [
            {"metric": "BUN", "op": ">=", "threshold": 22},
            {"metric": "Sodium", "op": ">=", "threshold": 142}
        ],
        "clinical_rationale": "Disproportionate elevation of blood urea nitrogen relative to serum sodium suggests decreased renal perfusion due to intravascular volume depletion or poor oral hydration.",
        "patient_explanation": "Your BUN (urea nitrogen) and sodium levels indicate mild dehydration. Your kidneys are conserving water because total fluid volume in the bloodstream is lower than optimal.",
        "action_items": [
            "Increase oral electrolyte and water hydration over the next 48-72 hours",
            "Monitor daily urine color and output",
            "Re-check basic renal panel if symptoms of lightheadedness or fatigue persist"
        ],
        "suggested_questions": [
            "How much water should I drink daily to correct this dehydration?",
            "Could my recent exercise or coffee intake have contributed to this?",
            "Will drinking more water restore my BUN levels to normal?"
        ]
    },
    {
        "id": "cardiorenal_interlock",
        "title": "Vector A: Cardiorenal Interlock",
        "severity": "CRITICAL",
        "urgency_score": 92,
        "conditions": [
            {"metric": "Cardiac Troponin I (hs-cTnI)", "op": ">=", "threshold": 14.0},
            {"metric": "eGFR", "op": "<=", "threshold": 60}
        ],
        "or_conditions": [
            {"metric": "Cardiac Troponin I (hs-cTnI)", "op": ">=", "threshold": 14.0},
            {"metric": "Creatinine", "op": ">=", "threshold": 1.5}
        ],
        "clinical_rationale": "The cross-clustering of hs-cTnI (148.4 pg/mL) and eGFR (38 mL/min/1.73m2) signifies Type 1 Cardiorenal Syndrome. Sub-endocardial ischemic injury is exacerbated by reduced renal clearance of circulating peptides, triggering compensatory myocardial wall stress.",
        "patient_explanation": "Your cardiac injury marker (Troponin I) is elevated concurrently with decreased kidney filtration capacity. Reduced kidney efficiency slows down the clearance of cardiac peptides while the heart experiences increased workload.",
        "action_items": [
            "Direct transfer to Cardiac Intensive Observation Unit for continuous 12-lead telemetry tracking.",
            "Initiate Dual Antiplatelet Therapy (Aspirin 325mg stat followed by 81mg QD + Clopidogrel 300mg loading dose) pending echocardiography.",
            "Withhold nephrotoxic NSAIDs and adjust ACE-inhibitor dosage based on hourly creatinine / BUN titration."
        ],
        "suggested_questions": [
            "What does an elevated Troponin level mean for my heart right now?",
            "How is my kidney function directly affecting my heart strain?",
            "What immediate hospital observations or tests are recommended?"
        ]
    },
    {
        "id": "endothelial_inflammatory_spike",
        "title": "Vector B: Endothelial Inflammatory Spike",
        "severity": "CRITICAL",
        "urgency_score": 78,
        "conditions": [
            {"metric": "hs-CRP", "op": ">=", "threshold": 3.0},
            {"metric": "Serum Ferritin", "op": ">=", "threshold": 400}
        ],
        "clinical_rationale": "Co-elevation of hs-CRP (12.8 mg/L) with Ferritin (614 ng/mL) and borderline D-Dimer points towards non-infectious acute phase hyper-activation. Neural modeling discounts bacterial etiology in favor of severe atherothrombotic plaque destabilization.",
        "patient_explanation": "High levels of C-reactive protein and Ferritin together indicate intense systemic blood vessel and inflammatory activation, pointing toward arterial plaque stress rather than an ordinary bacterial infection.",
        "action_items": [
            "Evaluate urgent coronary CTA or angiography for unstable plaque vulnerability.",
            "Initiate intensive high-potency statin therapy (Atorvastatin 80mg) and continuous inflammatory monitoring.",
            "Schedule serial inflammatory panel (hs-CRP, Ferritin, D-Dimer) repeat at 72 hours."
        ],
        "suggested_questions": [
            "Why are my inflammatory and ferritin levels both so high?",
            "Does this inflammation increase my immediate risk of a blood clot?",
            "How quickly will medications bring these inflammation markers down?"
        ]
    }
]
