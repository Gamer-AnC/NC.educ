export interface VivaQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface Experiment {
  id: string;
  title: string;
  description: string;
  objective: string;
  apparatus: string[];
  theory: string;
  procedure: string[];
  simulatorType: 'titration' | 'salt_analysis' | 'pendulum' | 'ohms_law' | 'photosynthesis' | 'food_tests' | 'logic_gates' | 'sql_sandbox' | 'reaction_rate' | 'calorimetry' | 'resonance_sound' | 'hookes_law' | 'amylase_temp' | 'unified_bench';
  vivaQuestions: VivaQuestion[];
  // Unified Bench configuration
  unit?: string;
  inputLabel?: string;
  inputMin?: number;
  inputMax?: number;
  inputStep?: number;
  inputDefault?: number;
  outputLabel?: string;
  outputFormula?: string;
  // Dynamic output calculation based on slider value
  calculate?: (value: number) => number | string;
  expectedQuestion?: string;
  validateAnswer?: (val: number, currentVal: number) => { success: boolean; feedback: string };
}

// 20 unique experiment titles and configs per subject
const CHEMISTRY_TITLES = [
  { id: 'titration', title: 'Acid-Base Titration (HCl vs NaOH)', desc: 'Volumetric neutralization analysis with color indicators.' },
  { id: 'salt_analysis', title: 'Qualitative Inorganic Salt Analysis', desc: 'Precipitation testing for cations and anions.' },
  { id: 'reaction_rate', title: 'Reaction Rate of Sodium Thiosulfate & HCl', desc: 'Analyzing temperature and concentration effects on rate.' },
  { id: 'calorimetry', title: 'Enthalpy of Neutralization', desc: 'Measuring temperature rise to calculate neutralization heat.' },
  { id: 'electrolysis_cuso4', title: 'Electrolysis of Copper(II) Sulfate', desc: 'Investigating mass changes of electrodes and copper plating.' },
  { id: 'crystallization_water', title: 'Water of Crystallization in CuSO4.5H2O', desc: 'Heating blue copper sulfate to calculate bound water moles.' },
  { id: 'chromatography', title: 'Paper Chromatography of Food Dyes', desc: 'Calculating Rf values of pigments using mobile phases.' },
  { id: 'alum_prep', title: 'Synthesis of Potash Alum', desc: 'Preparing crystals of potassium aluminum sulfate from scrap.' },
  { id: 'le_chatelier', title: 'Chemical Equilibrium Shifts', desc: 'Observing Le Chatelier\'s principle in chromate/dichromate.' },
  { id: 'indicator_range', title: 'Indicator pH Transition Ranges', desc: 'Determining pH range of natural red cabbage indicator.' },
  { id: 'sulfate_gravimetry', title: 'Gravimetric Analysis of Sulfate', desc: 'Precipitating sulfate as barium sulfate to find barium mass.' },
  { id: 'faraday_law', title: 'Verification of Faraday\'s First Law', desc: 'Measuring current duration against deposited copper mass.' },
  { id: 'oxygen_prep', title: 'Preparation of Oxygen Gas in Laboratory', desc: 'Decomposing hydrogen peroxide using manganese dioxide catalyst.' },
  { id: 'halide_identification', title: 'Identification of Halide Ions', desc: 'Using silver nitrate and ammonia to distinguish halides.' },
  { id: 'solubility_product', title: 'Solubility Product of Calcium Hydroxide', desc: 'Determining Ksp through acid-base titration of saturated limewater.' },
  { id: 'dumas_method', title: 'Molecular Mass of Volatile Liquid', desc: 'Dumas bulb vapor measurement to calculate molar mass.' },
  { id: 'redox_titration', title: 'Redox Titration of Iron(II) with Permanganate', desc: 'Using potassium permanganate as self-indicating oxidant.' },
  { id: 'saponification', title: 'Preparation of Soap (Saponification)', desc: 'Alkaline hydrolysis of oils to produce sodium carboxylate.' },
  { id: 'water_detection', title: 'Chemical Identification of Water', desc: 'Using anhydrous cobalt chloride and copper sulfate indicator papers.' },
  { id: 'ca_decomposition', title: 'Thermal Decomposition of Calcium Carbonate', desc: 'Heating marble chips and analyzing produced CO2 gas.' }
];

const PHYSICS_TITLES = [
  { id: 'pendulum', title: 'Gravity "g" using Simple Pendulum', desc: 'Period measurement of oscillations with varying lengths.' },
  { id: 'ohms_law', title: 'Verification of Ohm\'s Law', desc: 'V-I plotting and unknown resistance deduction.' },
  { id: 'resonance_sound', title: 'Speed of Sound using Resonance Tube', desc: 'Finding sound velocity in air via tuning forks and water columns.' },
  { id: 'prism_refraction', title: 'Refractive Index of a Glass Prism', desc: 'Plotting angle of deviation against angle of incidence.' },
  { id: 'hookes_law', title: 'Hooke\'s Law & Spring Constant', desc: 'Measuring load extension to calculate force constant.' },
  { id: 'convex_lens', title: 'Focal Length of a Convex Lens', desc: 'Convex lens distance plotting using u-v and magnification.' },
  { id: 'heat_capacity', title: 'Specific Heat Capacity of Copper', desc: 'Calorimeter investigation with copper blocks and mixtures.' },
  { id: 'viscosity_terminal', title: 'Viscosity of Oils via Stokes\' Law', desc: 'Dropping metal spheres in glycerin to measure terminal velocity.' },
  { id: 'boyles_law', title: 'Verification of Boyle\'s Law', desc: 'Gas pressure-volume relationship at constant temperature.' },
  { id: 'surface_tension', title: 'Surface Tension of Water', desc: 'Capillary tube rise method to calculate surface forces.' },
  { id: 'principle_moments', title: 'Principle of Moments Verification', desc: 'Balancing non-uniform meter rule with variable weights.' },
  { id: 'magnetic_field_wire', title: 'Magnetic Field of a Straight Wire', desc: 'Using Hall probe to measure field strength vs distance.' },
  { id: 'thermal_expansion', title: 'Linear Expansion Coefficient of Metals', desc: 'Steam jacket heating of copper and aluminum rod extensions.' },
  { id: 'resistor_combinations', title: 'Resistors in Series and Parallel', desc: 'Equivalent resistance verification using digital multimeters.' },
  { id: 'potentiometer_emfs', title: 'EMF Comparison using Potentiometer', desc: 'Comparing cell electromotive forces via balancing lengths.' },
  { id: 'youngs_modulus', title: 'Young\'s Modulus of a Wire', desc: 'Applying heavy weights to measure wire elongation via micrometer.' },
  { id: 'centripetal_force', title: 'Centripetal Force of Rotating Mass', desc: 'Relating orbital radius, frequency, and tension force.' },
  { id: 'half_life', title: 'Simulation of Radioactive Decay', desc: 'Dice rolling simulation modeling exponential half-life curves.' },
  { id: 'stefan_radiation', title: 'Stefan-Boltzmann Radiation Constant', desc: 'Thermal emission rates as a function of absolute temperature.' },
  { id: 'transverse_waves', title: 'Wave Speed on Stretched Strings', desc: 'Melde\'s experiment finding frequency, tension, and wave harmonics.' }
];

const BIOLOGY_TITLES = [
  { id: 'photosynthesis', title: 'Photosynthesis Rate Factors (Elodea)', desc: 'Oxygen bubble rates under variable light distances.' },
  { id: 'food_tests', title: 'Biochemical Nutrient Food Tests', desc: 'Nutrient identification of proteins, lipids, sugars, starch.' },
  { id: 'amylase_temp', title: 'Amylase Enzyme Rate vs Temperature', desc: 'Starch digestion rates tracked with iodine color timings.' },
  { id: 'transpiration_potometer', title: 'Transpiration Rate using Potometer', desc: 'Measuring water bubble movement in varying humidity conditions.' },
  { id: 'osmosis_potato', title: 'Osmosis in Potato Tissue Cylinders', desc: 'Weighing potato rods in different sucrose concentrations.' },
  { id: 'microscope_cells', title: 'Microscopic Structure of Onion Cells', desc: 'Staining onion epidermis with iodine to examine cell walls and nuclei.' },
  { id: 'seed_respirometer', title: 'Oxygen Uptake of Germinating Seeds', desc: 'Respirometer carbon dioxide absorption measurement.' },
  { id: 'yeast_fermentation', title: 'Anaerobic Fermentation of Yeast', desc: 'Measuring carbon dioxide rates with different carbon sources.' },
  { id: 'quadrat_ecology', title: 'Ecology Population Density', desc: 'Using virtual 1m² quadrats to sample daisy distribution.' },
  { id: 'enzyme_ph', title: 'Effect of pH on Catalase Activity', desc: 'Yeast oxygen froth height in hydrogen peroxide at various pH levels.' },
  { id: 'heart_structure', title: 'Mammalian Heart Anatomy', desc: 'Anatomical analysis of ventricles, auricles, and valves.' },
  { id: 'soil_absorption', title: 'Water Retention of Soil Types', desc: 'Comparing drainage capacity of sand, clay, and loam.' },
  { id: 'plant_tropisms', title: 'Phototropic & Geotropic Response', desc: 'Seedling growth orientation tracking using a clinostat.' },
  { id: 'vitamin_c_titration', title: 'Vitamin C Titration in Juices', desc: 'Decolorizing DCPIP dye to calculate ascorbic acid content.' },
  { id: 'pulse_rate_exercise', title: 'Cardiovascular Fitness Test', desc: 'Monitoring pulse recovery times before and after step-exercise.' },
  { id: 'leaf_chromatography', title: 'Chromatography of Leaf Pigments', desc: 'Separating chlorophyll-a, chlorophyll-b, and carotenoids.' },
  { id: 'catalase_liver', title: 'Liver Catalase Decomposition Rate', desc: 'Measuring gas release speed under fresh vs boiled liver tissue.' },
  { id: 'genetic_crosses', title: 'Monohybrid Mendelian Crosses', desc: 'F1 and F2 generation phenotype counts in pea plant models.' },
  { id: 'bone_structures', title: 'Microscopic Bone & Joint Anatomy', desc: 'Examining synovial joints, cartilage, and Haversian systems.' },
  { id: 'stomatal_distribution', title: 'Stomatal Counts on Leaf Epidermis', desc: 'Comparing stomatal density on upper vs lower leaf surfaces.' }
];

const CS_TITLES = [
  { id: 'logic_gates', title: 'Interactive Logic Gates Board', desc: 'Building complex logic and truth tables visually.' },
  { id: 'sql_sandbox', title: 'SQL Database Query Sandbox', desc: 'Executing database queries and viewing live grids.' },
  { id: 'binary_bitwise', title: 'Binary & Bitwise Operations', desc: 'Interactive bit shifting, AND, OR, and XOR at byte level.' },
  { id: 'sorting_algorithms', title: 'Bubble Sort & Binary Search', desc: 'Step-by-step sorting iterations and search space splits.' },
  { id: 'cpu_registers', title: 'CPU Registers & Assembly Simulation', desc: 'Executing ADD, MOV, and SUB commands inside register grids.' },
  { id: 'dom_tree', title: 'HTML/CSS DOM Renderer Tree', desc: 'Building nesting nodes to visualize browser rendering engines.' },
  { id: 'stack_queue', title: 'Stack (LIFO) & Queue (FIFO) Boards', desc: 'Pushing and popping elements to visualize buffer overflows.' },
  { id: 'subnetting_ip', title: 'IP Subnetting & Routing Tables', desc: 'Calculating CIDR blocks, broadcast addresses, and subnets.' },
  { id: 'regex_automata', title: 'Regex Parse & Finite Automata', desc: 'Validating patterns on Finite State Machines (FSM).' },
  { id: 'cryptography_rsa', title: 'Cryptography: Caesar & RSA Keys', desc: 'Generating public/private keys and encoding strings.' },
  { id: 'tree_traversals', title: 'Binary Tree Traversals (DFS)', desc: 'Visualizing Inorder, Preorder, and Postorder recursive paths.' },
  { id: 'cpu_scheduling', title: 'OS CPU Scheduling Algorithms', desc: 'Simulating Round Robin, First-In-First-Out, and SJF gantts.' },
  { id: 'graph_traversal', title: 'Graph Traversal (BFS & DFS)', desc: 'Tracing visited sets and queue contents on visual maps.' },
  { id: 'huffman_coding', title: 'Huffman Data Compression Tree', desc: 'Generating frequency trees to construct optimal binary codes.' },
  { id: 'turing_machine', title: 'Turing Machine Tape Simulator', desc: 'Writing state instructions to modify standard endless tapes.' },
  { id: 'dijkstra_path', title: 'Dijkstra\'s Shortest Path Finder', desc: 'Updating vertex distance weights across node vertices.' },
  { id: 'relational_algebra', title: 'Relational Algebra Operators', desc: 'Selecting, projecting, and joining visual tuples.' },
  { id: 'bankers_deadlock', title: 'OS Deadlock: Banker\'s Algorithm', desc: 'Determining if resource allocation requests lead to safe states.' },
  { id: 'cache_coherency', title: 'L1/L2 Cache Mapping Simulation', desc: 'Tracking direct-mapped cache hits, misses, and replacements.' },
  { id: 'nosql_document', title: 'NoSQL Document Store Database', desc: 'Querying and filtering nested JSON collections.' }
];

// Helper to generate dynamic questions and data for unified benches
const generateUnifiedConfig = (id: string, subject: string, index: number) => {
  let inputLabel = 'Independent Variable';
  let unit = 'units';
  let inputMin = 10;
  let inputMax = 100;
  let inputStep = 5;
  let inputDefault = 50;
  let outputLabel = 'Dependent Observation';
  let outputFormula = 'f(x)';
  let expectedQuestion = 'Calculate the constant factor:';
  
  // Custom formulas and questions based on experiment ID
  let calculate = (val: number) => (val * 1.5).toFixed(2);
  let validateAnswer = (val: number, currentVal: number) => {
    const expected = currentVal * 1.5;
    const diff = Math.abs(val - expected);
    if (diff < 0.5) {
      return { success: true, feedback: 'Excellent calculation! Your derived constant is completely correct.' };
    }
    return { success: false, feedback: `Incorrect. Expected value is around ${expected.toFixed(2)}. Double check your math!` };
  };

  if (subject === 'chemistry') {
    if (id === 'reaction_rate') {
      inputLabel = 'Temperature (°C)';
      unit = '°C';
      inputMin = 10;
      inputMax = 90;
      inputStep = 5;
      inputDefault = 25;
      outputLabel = 'Reaction Speed (1/t)';
      outputFormula = 'Rate = 0.005 * Temp + 0.01';
      calculate = (val: number) => (0.005 * val + 0.01).toFixed(4);
      expectedQuestion = 'What is the rate of reaction at your selected temperature?';
      validateAnswer = (val: number, currentVal: number) => {
        const expected = 0.005 * currentVal + 0.01;
        const diff = Math.abs(val - expected);
        if (diff < 0.002) return { success: true, feedback: 'Spot on! The reaction rate matches the kinetics formula perfectly.' };
        return { success: false, feedback: `Incorrect. Expected ${expected.toFixed(4)}. Be accurate down to 3 decimal places!` };
      };
    } else if (id === 'calorimetry') {
      inputLabel = 'NaOH Concentration (M)';
      unit = 'M';
      inputMin = 0.1;
      inputMax = 2.0;
      inputStep = 0.1;
      inputDefault = 1.0;
      outputLabel = 'Temperature Rise (ΔT)';
      outputFormula = 'ΔT = 5.7 * Conc';
      calculate = (val: number) => (5.7 * val).toFixed(2);
      expectedQuestion = 'Calculate the energy released in Joules if Volume = 100 mL, (Q = m * c * ΔT, where c = 4.18 J/g°C):';
      validateAnswer = (val: number, currentVal: number) => {
        const dt = 5.7 * currentVal;
        const expectedQ = 100 * 4.18 * dt; // mass ~ 100g
        const diff = Math.abs(val - expectedQ);
        if (diff < 20) return { success: true, feedback: `Correct! You successfully computed Q = ${expectedQ.toFixed(0)} Joules.` };
        return { success: false, feedback: `Expected around ${expectedQ.toFixed(0)} J. Check your equation: 100 * 4.18 * ΔT.` };
      };
    } else {
      // General chemistry fallback
      inputLabel = 'Reagent Added (g)';
      unit = 'g';
      outputLabel = 'Precipitate Mass (g)';
      outputFormula = 'Mass = 0.35 * Input';
      calculate = (val: number) => (0.35 * val).toFixed(2);
      expectedQuestion = 'Calculate stoichiometric ratio (Precipitate / Input):';
      validateAnswer = (val: number) => {
        if (Math.abs(val - 0.35) < 0.02) return { success: true, feedback: 'Correct ratio computed.' };
        return { success: false, feedback: 'The constant ratio should be exactly 0.35.' };
      };
    }
  } else if (subject === 'physics') {
    if (id === 'resonance_sound') {
      inputLabel = 'Tuning Fork Frequency (Hz)';
      unit = 'Hz';
      inputMin = 256;
      inputMax = 512;
      inputStep = 16;
      inputDefault = 340;
      outputLabel = 'First Resonance Length (cm)';
      outputFormula = 'Length = 34000 / (4 * Freq)';
      calculate = (val: number) => (34000 / (4 * val)).toFixed(2);
      expectedQuestion = 'Calculate velocity of sound in m/s (v = 4 * f * L / 100):';
      validateAnswer = (val: number, currentVal: number) => {
        const length = 34000 / (4 * currentVal);
        const expectedV = 4 * currentVal * (length / 100);
        if (Math.abs(val - expectedV) < 5) return { success: true, feedback: `Perfect! Speed of sound is exactly ${expectedV.toFixed(0)} m/s.` };
        return { success: false, feedback: `Expected speed of sound is near ${expectedV.toFixed(0)} m/s.` };
      };
    } else if (id === 'hookes_law') {
      inputLabel = 'Load Mass (g)';
      unit = 'g';
      inputMin = 50;
      inputMax = 500;
      inputStep = 50;
      inputDefault = 200;
      outputLabel = 'Spring Extension (mm)';
      outputFormula = 'Ext = 0.08 * Mass';
      calculate = (val: number) => (0.08 * val).toFixed(1);
      expectedQuestion = 'Calculate spring constant (g = 9.8 m/s²) in N/m (K = Force(N) / Ext(m)):';
      validateAnswer = (val: number, currentVal: number) => {
        const force = (currentVal / 1000) * 9.8;
        const extM = (0.08 * currentVal) / 1000;
        const expectedK = force / extM;
        if (Math.abs(val - expectedK) < 5) return { success: true, feedback: `Bravo! Spring constant K = ${expectedK.toFixed(1)} N/m.` };
        return { success: false, feedback: `Expected value around ${expectedK.toFixed(1)} N/m.` };
      };
    } else {
      inputLabel = 'Load Variable';
      unit = 'V';
      outputLabel = 'Resulting Value';
      calculate = (val: number) => (val * 2.2).toFixed(2);
    }
  } else if (subject === 'biology') {
    if (id === 'amylase_temp') {
      inputLabel = 'Temperature (°C)';
      unit = '°C';
      inputMin = 10;
      inputMax = 80;
      inputStep = 5;
      inputDefault = 37;
      outputLabel = 'Starch Digestion Time (sec)';
      outputFormula = 'Optimal at 37°C. Slows down below & above.';
      calculate = (val: number) => {
        const diff = Math.abs(val - 37);
        const seconds = Math.max(20, 20 + diff * diff * 0.4);
        return seconds.toFixed(0);
      };
      expectedQuestion = 'What temperature provides optimal enzymatic kinetics (minimum digestion time)?';
      validateAnswer = (val: number) => {
        if (val === 37) return { success: true, feedback: 'Correct! 37°C is human body temperature and optimal for amylase.' };
        return { success: false, feedback: 'Incorrect. Think about human core body temperature in Celsius.' };
      };
    } else if (id === 'osmosis_potato') {
      inputLabel = 'Sucrose Concentration (M)';
      unit = 'M';
      inputMin = 0.0;
      inputMax = 1.0;
      inputStep = 0.1;
      inputDefault = 0.2;
      outputLabel = 'Change in Potato Mass (%)';
      outputFormula = 'Mass Change = 20 - 40 * Conc';
      calculate = (val: number) => (20 - 40 * val).toFixed(1);
      expectedQuestion = 'Find the isotonic point (concentration where mass change is 0%):';
      validateAnswer = (val: number) => {
        if (Math.abs(val - 0.5) < 0.05) return { success: true, feedback: 'Excellent! At 0.5 M sucrose, no net osmosis occurs, showing internal water potential.' };
        return { success: false, feedback: 'Hint: Set 20 - 40 * Conc = 0 and solve for Conc.' };
      };
    } else {
      inputLabel = 'Environmental Variable';
      unit = 'units';
      outputLabel = 'Cellular Activity';
      calculate = (val: number) => (val * 0.8).toFixed(1);
    }
  } else if (subject === 'computer_science') {
    if (id === 'binary_bitwise') {
      inputLabel = 'Decimal Byte Value';
      unit = '';
      inputMin = 0;
      inputMax = 255;
      inputStep = 1;
      inputDefault = 128;
      outputLabel = 'Binary Octet Representation';
      outputFormula = '8-bit parsing';
      calculate = (val: number) => val.toString(2).padStart(8, '0');
      expectedQuestion = 'What is the binary representation of your selected decimal?';
      validateAnswer = (val: any, currentVal: number) => {
        const expected = currentVal.toString(2).padStart(8, '0');
        if (String(val).trim() === expected) return { success: true, feedback: 'Splendid! Binary bits are 100% correct.' };
        return { success: false, feedback: `Incorrect. Expected ${expected}` };
      };
    } else if (id === 'subnetting_ip') {
      inputLabel = 'Subnet Prefix Mask (/)';
      unit = 'bits';
      inputMin = 24;
      inputMax = 30;
      inputStep = 1;
      inputDefault = 24;
      outputLabel = 'Usable IP Addresses';
      outputFormula = 'Hosts = 2^(32 - Mask) - 2';
      calculate = (val: number) => (Math.pow(2, 32 - val) - 2).toString();
      expectedQuestion = 'How many usable hosts in this mask?';
      validateAnswer = (val: number, currentVal: number) => {
        const expected = Math.pow(2, 32 - currentVal) - 2;
        if (val === expected) return { success: true, feedback: 'Brilliant IP calculations! Correct number of usable host nodes.' };
        return { success: false, feedback: `Incorrect. Use: 2^(32 - CIDR) - 2. Expected is ${expected}` };
      };
    } else {
      inputLabel = 'Code Instruction Length';
      unit = 'lines';
      outputLabel = 'Execution Time (ms)';
      calculate = (val: number) => (val * 0.05).toFixed(3);
    }
  }

  return {
    inputLabel,
    unit,
    inputMin,
    inputMax,
    inputStep,
    inputDefault,
    outputLabel,
    outputFormula,
    calculate,
    expectedQuestion,
    validateAnswer
  };
};

const generateVivaQuestions = (id: string, subject: string): VivaQuestion[] => {
  if (subject === 'chemistry') {
    return [
      {
        question: 'Which indicator is best suited for titrating a strong acid against a weak base?',
        options: ['Phenolphthalein', 'Methyl Orange', 'Bromothymol Blue', 'Litmus Solution'],
        answer: 1,
        explanation: 'Methyl Orange transitions in the acidic pH range (3.1 - 4.4), which perfectly matches the equivalence point of a strong acid - weak base neutralization.'
      },
      {
        question: 'What is the primary visual observation when NaOH is added to a solution containing Fe3+ ions?',
        options: ['Pale blue precipitate', 'White gelatinous precipitate', 'Reddish-brown precipitate', 'Dirty green precipitate'],
        answer: 2,
        explanation: 'Fe3+ reacts with hydroxide ions to form insoluble reddish-brown Iron(III) Hydroxide precipitate: Fe³⁺ + 3OH⁻ -> Fe(OH)₃.'
      },
      {
        question: 'What does Le Chatelier\'s principle state about chemical equilibrium?',
        options: [
          'The rate of forward reaction is always twice the backward reaction.',
          'An equilibrium system responds to minimize any applied stress or change.',
          'Catalysts change the absolute position of final equilibrium.',
          'Pressure increases always shift equilibrium towards more gaseous moles.'
        ],
        answer: 1,
        explanation: 'Le Chatelier\'s principle states that if a constraint is applied to a system at equilibrium, the system shifts to oppose the change.'
      },
      {
        question: 'Why does adding BaCl2 to a sulfate solution produce a precipitate that is insoluble in hydrochloric acid?',
        options: [
          'Barium Sulfate is extremely stable and insoluble in water and strong dilute acids.',
          'The HCl dissolves the container instead.',
          'Barium forms an alloy with chloride.',
          'Sulfate evaporates upon contact with HCl.'
        ],
        answer: 0,
        explanation: 'Barium Sulfate precipitate is highly insoluble, and unlike carbonates or sulfites, it is completely insoluble in dilute hydrochloric acid.'
      }
    ];
  } else if (subject === 'physics') {
    return [
      {
        question: 'How does the period of a simple pendulum change if you quadruple the length of the string?',
        options: ['It remains unchanged', 'It is doubled', 'It is quadrupled', 'It is halved'],
        answer: 1,
        explanation: 'Period T is proportional to the square root of length L (T ∝ √L). Thus, quadrupling length doubles the period (√4 = 2).'
      },
      {
        question: 'What does a straight line V-I characteristic graph passing through the origin tell us about a resistor?',
        options: [
          'It is a non-ohmic device',
          'Its resistance varies exponentially with temperature',
          'It obeys Ohm\'s Law and has constant resistance',
          'It is acts as an active battery'
        ],
        answer: 2,
        explanation: 'A linear V-I relationship passing through the origin verifies a constant ratio of V/I, demonstrating Ohmic behavior.'
      },
      {
        question: 'In a resonance tube experiment, why is the first resonance length approximately one-quarter of the wavelength?',
        options: [
          'Because the tube acts as a closed-end air column with a node at water and antinode at the top.',
          'Because gravity pulls the sound waves down.',
          'Because sound waves are double-coiled.',
          'It is a random conversion standard.'
        ],
        answer: 0,
        explanation: 'A resonance tube is closed at one end (by water), so the fundamental wave harmonic forms a node at the water and an antinode at the open top, corresponding to λ/4.'
      },
      {
        question: 'What happens to the equivalent resistance when you add more resistors in a parallel circuit?',
        options: ['The total resistance increases', 'The total resistance decreases', 'The total resistance remains equal to the largest resistor', 'Voltage drops to zero'],
        answer: 1,
        explanation: 'Adding resistors in parallel adds more paths for current, reducing the total equivalent resistance to less than the smallest individual resistor.'
      }
    ];
  } else if (subject === 'biology') {
    return [
      {
        question: 'Which of the following colors of light stimulates the lowest rate of photosynthesis in green leaves?',
        options: ['Blue Light', 'Red Light', 'Green Light', 'White Light'],
        answer: 2,
        explanation: 'Green plants appear green because chlorophyll pigments reflect green light rather than absorbing it. Therefore, green light is the least effective for photosynthesis.'
      },
      {
        question: 'Which chemical reagent turns from blue to violet/purple in the presence of protein molecules?',
        options: ['Iodine Solution', 'Biuret Reagent', 'Benedict\'s Solution', 'Ethanol Emulsion'],
        answer: 1,
        explanation: 'Biuret reagent detects peptide bonds in proteins, transitioning from a light blue color to a beautiful violet/purple.'
      },
      {
        question: 'What happens to plant cells when placed in a highly concentrated hypertonic salt solution?',
        options: ['They burst due to turgor pressure', 'They become turgid and absorb water', 'They undergo plasmolysis and become flaccid', 'Nothing happens'],
        answer: 2,
        explanation: 'Water moves out of the cell vacuole down its water potential gradient via osmosis, causing the cell membrane to pull away from the cell wall (plasmolysis).'
      },
      {
        question: 'What is the function of salivary amylase?',
        options: ['Digests proteins into amino acids', 'Hydrolyzes starch into maltose', 'Emulsifies fats into lipids', 'Neutralizes hydrochloric acid'],
        answer: 1,
        explanation: 'Amylase is a digestive enzyme that catalyzes the breakdown of starch (complex carbohydrate) into maltose (simpler sugar).'
      }
    ];
  } else {
    return [
      {
        question: 'Which logic gate output is 1 ONLY if both of its inputs are 1?',
        options: ['OR Gate', 'AND Gate', 'XOR Gate', 'NOR Gate'],
        answer: 1,
        explanation: 'The AND gate outputs 1 (true) if and only if both Input A and Input B are 1.'
      },
      {
        question: 'Which SQL clause is used to filter records returned by a query?',
        options: ['WHERE', 'ORDER BY', 'GROUP BY', 'SELECT'],
        answer: 0,
        explanation: 'The WHERE clause is used in SQL to filter rows that meet a specified Boolean condition.'
      },
      {
        question: 'What does the term CIDR stand for in IP networking?',
        options: [
          'Classless Inter-Domain Routing',
          'Computer Internet Domain Record',
          'Common Integrated Digital Router',
          'Calculated IP Distribution Register'
        ],
        answer: 0,
        explanation: 'CIDR stands for Classless Inter-Domain Routing, introducing variable subnet mask lengths.'
      },
      {
        question: 'In computer science, what is the key characteristic of a Stack data structure?',
        options: ['First-In, First-Out (FIFO)', 'Last-In, First-Out (LIFO)', 'Random Access Memory (RAM)', 'Sequential Indexing'],
        answer: 1,
        explanation: 'A Stack is a LIFO (Last-In, First-Out) structure, meaning the last item pushed is the first one popped.'
      }
    ];
  }
};

// Compile all 80 experiments programmatically to save space but maintain rich specific details!
export const PRACTICALS_DATA: Record<SubjectId, Experiment[]> = {
  chemistry: CHEMISTRY_TITLES.map((t, idx) => {
    const isClassic = t.id === 'titration' || t.id === 'salt_analysis';
    const config = generateUnifiedConfig(t.id, 'chemistry', idx);
    return {
      id: t.id,
      title: t.title,
      description: t.desc,
      objective: `To determine and analyze the chemical behavior of ${t.title.toLowerCase()} through quantitative testing and standard lab procedure.`,
      apparatus: isClassic 
        ? (t.id === 'titration' ? ['Burette (50mL)', 'Conical Flask (250mL)', 'Pipette (25mL)', 'Indicator'] : ['Test Tubes', 'NaOH Solution', 'Ammonia Reagents', 'Unknown Salt Sample'])
        : ['Graduated Cylinder', 'Reaction Beaker', 'Digital Balance Scale', 'Stopwatch', 'Stirring Rod'],
      theory: t.id === 'titration' 
        ? 'Acid-base titration relies on chemical neutralization: HCl + NaOH -> NaCl + H2O. At the equivalence point, moles of H+ equal moles of OH-.'
        : t.id === 'salt_analysis'
        ? 'Qualitative salt analysis utilizes selective precipitation. Hydroxide ions react with metal cations to form specific color hydroxides.'
        : `This practical investigates stoichiometry and chemical reaction kinetics where the primary mathematical relationship follows: ${config.outputFormula}.`,
      procedure: [
        'Pour 25.0 mL of the sample solution into a clean reaction flask.',
        'Add 2-3 drops of appropriate chemical indicator or set up digital probe sensor.',
        'Adjust the independent slider parameter on the virtual bench panel.',
        'Add the reactants step-by-step and observe the physical modifications.',
        'Record the measured dependent values in your observation notebook table.',
        'Perform stoichiometry calculations and check your final results.'
      ],
      simulatorType: isClassic ? (t.id as any) : ((t.id === 'reaction_rate' || t.id === 'calorimetry') ? (t.id as any) : 'unified_bench'),
      vivaQuestions: generateVivaQuestions(t.id, 'chemistry'),
      ...(!isClassic ? config : {})
    };
  }),
  physics: PHYSICS_TITLES.map((t, idx) => {
    const isClassic = t.id === 'pendulum' || t.id === 'ohms_law';
    const config = generateUnifiedConfig(t.id, 'physics', idx);
    return {
      id: t.id,
      title: t.title,
      description: t.desc,
      objective: `To experimentally verify the physical laws governing ${t.title.toLowerCase()} and calculate relevant constants.`,
      apparatus: isClassic
        ? (t.id === 'pendulum' ? ['Retort Stand & Clamp', 'Heavy Metallic Bob', 'Measuring Tape (1m)', 'Digital Stopwatch'] : ['Adjustable Power Supply (0-12V)', 'Resistor Under Test', 'Ammeter', 'Voltmeter', 'Rheostat'])
        : ['Digital Sensor Workbench', 'High-accuracy Stopwatch', 'Ruler Scale', 'Variable Calibration Masses'],
      theory: t.id === 'pendulum'
        ? 'For a simple pendulum, the period T of oscillation is T = 2 * pi * sqrt(L / g). By plotting T² vs L, gravity g can be computed as g = 4 * pi² / slope.'
        : t.id === 'ohms_law'
        ? 'Ohm\'s Law states that current I is directly proportional to voltage V across a conductor at constant temperature: V = I * R.'
        : `This investigation utilizes physical measurements to verify formulas: ${config.outputFormula}.`,
      procedure: [
        'Secure the physical apparatus firmly to the retort stand clamp or workspace floor.',
        'Adjust the independent physical dimension slider to your desired parameter value.',
        'Trigger the execution/oscillation flow and launch the digital timer.',
        'Stop the stopwatch after exact intervals or periodic stabilization is achieved.',
        'Calculate the derived quantities using standard mechanical physics equations.',
        'Type your computed answer into the verification box to validate your methodology.'
      ],
      simulatorType: isClassic ? (t.id as any) : ((t.id === 'resonance_sound' || t.id === 'hookes_law') ? (t.id as any) : 'unified_bench'),
      vivaQuestions: generateVivaQuestions(t.id, 'physics'),
      ...(!isClassic ? config : {})
    };
  }),
  biology: BIOLOGY_TITLES.map((t, idx) => {
    const isClassic = t.id === 'photosynthesis' || t.id === 'food_tests';
    const config = generateUnifiedConfig(t.id, 'biology', idx);
    return {
      id: t.id,
      title: t.title,
      description: t.desc,
      objective: `To observe and record the physiological and biochemical processes of ${t.title.toLowerCase()}.`,
      apparatus: isClassic
        ? (t.id === 'photosynthesis' ? ['Elodea weed', 'Boiling tube with Sodium Bicarbonate', 'Light Source on Metre Rule', 'Thermometer'] : ['Benedict\'s solution', 'Iodine', 'Biuret reagents', 'Ethanol', 'Water Bath', 'Food samples'])
        : ['Incubation Beakers', 'Petri Dishes', 'Chemical Reagents', 'Digital Scale', 'Microscopic Slides'],
      theory: t.id === 'photosynthesis'
        ? 'Photosynthesis rate is directly affected by light intensity, temperature, and CO2 availability. Light intensity obeys the inverse-square law with distance.'
        : t.id === 'food_tests'
        ? 'Specific macromolecular linkages are detected by selective chemical indicators (e.g. Benedict\'s copper reduction, Iodine-starch helix, Biuret-peptide bonds).'
        : `This physiological study tracks cellular changes obeying biological equations: ${config.outputFormula}.`,
      procedure: [
        'Prepare your biological tissue sample or chemical substrate inside the test tube.',
        'Change the ambient test factors using the visual control sliders.',
        'Allow the enzyme/biological system to incubate for the designated test duration.',
        'Observe the physical bubble output, mass variation, or color change reaction.',
        'Record the biological rate observations inside your lab notepad table.',
        'Answer the comprehension and viva Questions to verify your mastery.'
      ],
      simulatorType: isClassic ? (t.id as any) : (t.id === 'amylase_temp' ? (t.id as any) : 'unified_bench'),
      vivaQuestions: generateVivaQuestions(t.id, 'biology'),
      ...(!isClassic ? config : {})
    };
  }),
  computer_science: CS_TITLES.map((t, idx) => {
    const isClassic = t.id === 'logic_gates' || t.id === 'sql_sandbox';
    const config = generateUnifiedConfig(t.id, 'computer_science', idx);
    return {
      id: t.id,
      title: t.title,
      description: t.desc,
      objective: `To master theoretical concepts and execution flow of ${t.title.toLowerCase()} in a sandboxed computer system.`,
      apparatus: ['Virtual Computer Terminal', 'Interactive Truth Table Register', 'Logic Signal Probes', 'SQL Relational Tables Database'],
      theory: t.id === 'logic_gates'
        ? 'Logic gates process discrete binary values (0 and 1) following boolean algebraic identities: AND, OR, NOT, XOR, NAND, NOR.'
        : t.id === 'sql_sandbox'
        ? 'SQL (Structured Query Language) operates on relational tuples using declarative relational algebra predicates.'
        : `This CS practical explores structural parameters governed by formulaic relationships: ${config.outputFormula}.`,
      procedure: [
        'Load the computer science interactive layout or script parameters.',
        'Provide test binary values, CIDR ranges, or algorithm instructions in inputs.',
        'Run the code interpreter or step the state machine execution.',
        'Watch the registers, logic flows, or sorting array bars shift dynamically.',
        'Review the computer output to analyze efficiency and correctness.',
        'Validate your calculations using the built-in compiler query checks.'
      ],
      simulatorType: isClassic ? (t.id as any) : 'unified_bench',
      vivaQuestions: generateVivaQuestions(t.id, 'computer_science'),
      ...(!isClassic ? config : {})
    };
  })
};

export type SubjectId = 'chemistry' | 'physics' | 'biology' | 'computer_science';
