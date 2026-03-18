export interface NatureTableRow {
    id: number;
    category: string;
    natureThematic: string;
    useOfProceeds: string[];
    kpis: string[];
    mdbNatureFinance: boolean;
    icmaSustainableBonds: boolean;
    scbGreenSustainable: boolean;
}

export const NatureTableData: NatureTableRow[] = [
    {
        id: 1,
        category: 'Restoration and conservation of biodiversity and ecosystem services',
        natureThematic: 'Restoration & conservation',
        useOfProceeds: [
            'Restoring biodiversity following mine closure, including remediation of contaminated sites, beyond compliance with E&S risk management policies and standards',
            'Conserving or restoring biodiversity on non-operation land to enhance biodiversity or ecosystem services'
        ],
        kpis: [
            'Land disturbed rehabilitated (%) split into:',
            '• Required by regulation;',
            '• Required by certifier; and',
            '• Voluntary',
            'Area of land with a permanently protected land status as of the end of the reporting period'
        ],
        mdbNatureFinance: true,
        icmaSustainableBonds: true,
        scbGreenSustainable: true
    },
    {
        id: 2,
        category: 'Transformation of economic activities to reduce one or more of the direct drivers of biodiversity, ecosystems and ecosystem services loss',
        natureThematic: 'Sustainable use & protection of water',
        useOfProceeds: [
            'Implementing technologies or management approaches to reduce water consumption or withdrawal in mining operations',
            'Activities related to improving water quality'
        ],
        kpis: [
            'Reduction in freshwater abstraction in water scarce areas (m3)²',
            'Increase in (fresh) water recycled (%)',
            'Reduction in water consumption / use [intensity in m3 per ton of output produced]'
        ],
        mdbNatureFinance: true,
        icmaSustainableBonds: true,
        scbGreenSustainable: true
    },
    {
        id: 3,
        category: 'Transformation of economic activities to reduce one or more of the direct drivers of biodiversity, ecosystems and ecosystem services loss',
        natureThematic: 'Waste and pollution prevention',
        useOfProceeds: [
            'Projects that prevent, reduce and/or substitute harmful chemicals to biodiversity in soil and water',
            'Processing previously deemed uneconomical low-grade stockpiles or mine rock waste to reduce leaching potential, waste generated, and pollution.'
        ],
        kpis: [
            'Reduction in Nox / Sox / VOCs / PM / CO and/or other pollutants (tonnes)',
            'Reduction on weight of hazardous waste (%)'
        ],
        mdbNatureFinance: true,
        icmaSustainableBonds: true,
        scbGreenSustainable: true
    },
    {
        id: 4,
        category: 'Integration of nature-based solutions across economic sectors',
        natureThematic: 'Nature-based solutions',
        useOfProceeds: [
            'Using green infrastructure or combined green/grey solutions with clear localized benefits to biodiversity (i.e. constructing wetlands for water treatment, integrating NbS for water retention in upper watershed in the mine design etc.)',
            'Nature-based remediation technologies to reduce pollution, promote erosion control and enhance soil properties'
        ],
        kpis: [
            '% of water treatment facilities or m3 of water treated using nature-based solutions'
        ],
        mdbNatureFinance: true,
        icmaSustainableBonds: true,
        scbGreenSustainable: true
    },
    {
        id: 5,
        category: 'Implementation of initiatives, tools, and activities that support above activities',
        natureThematic: 'Supporting Nature-related initiatives',
        useOfProceeds: [
            'Training on improved design and construction approaches or technologies that reduce impacts of mining on nature',
            'Developing or using tools to help to engage and better locate mining sites'
        ],
        kpis: [
            '% of staff trained on environmental protection relating to nature'
        ],
        mdbNatureFinance: true,
        icmaSustainableBonds: true,
        scbGreenSustainable: false
    }
];

// Planetary Boundary Indicators Table
export interface PlanetaryBoundaryRow {
    boundary: string;
    pressures: string[];
    dependencies: string[];
}

export const PlanetaryBoundaryData: PlanetaryBoundaryRow[] = [
    {
        boundary: 'Aerosol',
        pressures: ['PM2.5'],
        dependencies: ['PM2.5']
    },
    {
        boundary: 'Biogeochemical flows',
        pressures: ['Toxic metal soil pollution', 'Nitrogen', 'Phosphor', 'Mismanaged plastic waste'],
        dependencies: ['Toxic metal soil pollution', 'Soil organic content loss', 'TDS water quality']
    },
    {
        boundary: 'Biosphere integrity',
        pressures: ['Mean Species Abundance (MSA)'],
        dependencies: ['Mean Species Abundance (MSA)']
    },
    {
        boundary: 'Climate Change',
        pressures: ['---'],
        dependencies: ['% of natural land']
    },
    {
        boundary: 'Freshwater use',
        pressures: ['Water stress levels'],
        dependencies: ['Water stress levels', 'BOD water quality', 'Water annual variability', 'Water seasonal variability']
    },
    {
        boundary: 'Land system change',
        pressures: ['Proximity to sensitive areas', 'Tree cover loss'],
        dependencies: ['Change in % of natural land', 'Soil organic content loss']
    },
    {
        boundary: 'Ocean acidification',
        pressures: ['Ocean health index'],
        dependencies: ['Marine STAR']
    },
    {
        boundary: 'Stratospheric ozone',
        pressures: ['O3'],
        dependencies: ['O3']
    }
];

