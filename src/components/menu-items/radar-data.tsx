export interface RadarDataItem {
    category: 'PRESSURES' | 'DEPENDENCIES' | 'OVERALL';
    label: string;
    data: { subject: string; Pressures: number; Dependencies: number }[];
    exposureType?: 'direct' | 'indirect';
}

export interface TooltipContentProps {
    subject: string;
    tooltip: string;
}

export const CustomToolTipContent: TooltipContentProps[] = [
    { subject: 'Aerosol', tooltip: 'The concentration of fine particles in the atmosphere, which can affect climate and human health. The boundary is regionally specified and currently only tentatively quantified.' },
    { subject: 'Stratospheric ozone', tooltip: 'The thinning of the ozone layer in the stratosphere, which protects us from harmful ultraviolet radiation. This boundary is considered to be within the safe operating space due to international agreements like the Montreal Protocol.' },
    { subject: 'Ocean acidification', tooltip: 'The ongoing decrease in the pH of the Earth\’s oceans, caused by the absorption of carbon dioxide from the atmosphere. The boundary is measured by the mean saturation state of aragonite in surface seawater.' },
    { subject: 'Landsystem change', tooltip: 'The conversion of natural ecosystems, like forests and grasslands, to other land uses such as agriculture and urban areas. The boundary is measured by the percentage of global forest cover remaining.' },
    { subject: 'Freshwater use', tooltip: 'The amount of freshwater extracted from rivers, lakes, and aquifers for human use. The boundary is defined by the amount of blue water used in river basins.' },
    { subject: 'Climate change', tooltip: 'The increase in global average temperature and changes in weather patterns due to greenhouse gas emissions. The boundary is defined by atmospheric carbon dioxide concentration and radiative forcing.' },
    { subject: 'Biosphere integrity', tooltip: 'This encompasses the decline in biodiversity, measured by genetic diversity and functional diversity.' },
    { subject: 'Biogeochemical flows', tooltip: 'These cycles are disrupted by excessive use of fertilizers, leading to pollution of water and air. The boundaries are defined by industrial and agricultural inputs of nitrogen and phosphorus to the biosphere and oceans.' },
]

// Direct Exposure Data
export const HeatmapDataDirect: RadarDataItem[] = [
    {
        category: 'PRESSURES',
        label: 'Nature-related Pressures',
        exposureType: 'direct',
        data: [
            { subject: 'Aerosol', Pressures: 28.0, Dependencies: 0 },
            { subject: 'Stratospheric ozone', Pressures: 0, Dependencies: 0 },
            { subject: 'Ocean acidification', Pressures: 11.9, Dependencies: 0 },
            { subject: 'Landsystem change', Pressures: 22.9, Dependencies: 0 },
            { subject: 'Freshwater use', Pressures: 35.3, Dependencies: 0 },
            { subject: 'Climate change', Pressures: 0, Dependencies: 0 },
            { subject: 'Biosphere integrity', Pressures: 53.9, Dependencies: 0 },
            { subject: 'Biogeochemical flows', Pressures: 57.1, Dependencies: 0 },
        ],
    },
    {
        category: 'DEPENDENCIES',
        label: 'Nature-related Dependencies',
        exposureType: 'direct',
        data: [
            { subject: 'Aerosol', Pressures: 0, Dependencies: 22.5 },
            { subject: 'Stratospheric ozone', Pressures: 0, Dependencies: 0 },
            { subject: 'Ocean acidification', Pressures: 0, Dependencies: 11.1 },
            { subject: 'Landsystem change', Pressures: 0, Dependencies: 13.0 },
            { subject: 'Freshwater use', Pressures: 0, Dependencies: 62.7 },
            { subject: 'Climate change', Pressures: 0, Dependencies: 31.3 },
            { subject: 'Biosphere integrity', Pressures: 0, Dependencies: 38.1 },
            { subject: 'Biogeochemical flows', Pressures: 0, Dependencies: 31.1 },
        ],
    },
    {
        category: 'OVERALL',
        label: 'Nature-related Dependencies & Pressures',
        exposureType: 'direct',
        data: [
            { subject: 'Aerosol', Pressures: 28.0, Dependencies: 22.5 },
            { subject: 'Stratospheric ozone', Pressures: 0, Dependencies: 0 },
            { subject: 'Ocean acidification', Pressures: 11.9, Dependencies: 11.1 },
            { subject: 'Landsystem change', Pressures: 22.9, Dependencies: 13.0 },
            { subject: 'Freshwater use', Pressures: 35.3, Dependencies: 62.7 },
            { subject: 'Climate change', Pressures: 0, Dependencies: 31.3 },
            { subject: 'Biosphere integrity', Pressures: 53.9, Dependencies: 38.1 },
            { subject: 'Biogeochemical flows', Pressures: 57.1, Dependencies: 31.1 },
        ]
    }
];

// Indirect Exposure Data
export const HeatmapDataIndirect: RadarDataItem[] = [
    {
        category: 'PRESSURES',
        label: 'Nature-related Pressures',
        exposureType: 'indirect',
        data: [
            { subject: 'Aerosol', Pressures: 28.0, Dependencies: 0 },
            { subject: 'Stratospheric ozone', Pressures: 0, Dependencies: 0 },
            { subject: 'Ocean acidification', Pressures: 11.9, Dependencies: 0 },
            { subject: 'Landsystem change', Pressures: 22.9, Dependencies: 0 },
            { subject: 'Freshwater use', Pressures: 35.3, Dependencies: 0 },
            { subject: 'Climate change', Pressures: 0, Dependencies: 0 },
            { subject: 'Biosphere integrity', Pressures: 53.9, Dependencies: 0 },
            { subject: 'Biogeochemical flows', Pressures: 57.1, Dependencies: 0 },
        ],
    },
    {
        category: 'DEPENDENCIES',
        label: 'Nature-related Dependencies',
        exposureType: 'indirect',
        data: [
            { subject: 'Aerosol', Pressures: 0, Dependencies: 23.1 },
            { subject: 'Stratospheric ozone', Pressures: 0, Dependencies: 0 },
            { subject: 'Ocean acidification', Pressures: 0, Dependencies: 13.7 },
            { subject: 'Landsystem change', Pressures: 0, Dependencies: 56.6 },
            { subject: 'Freshwater use', Pressures: 0, Dependencies: 72.9 },
            { subject: 'Climate change', Pressures: 0, Dependencies: 56.8 },
            { subject: 'Biosphere integrity', Pressures: 0, Dependencies: 48.2 },
            { subject: 'Biogeochemical flows', Pressures: 0, Dependencies: 57.6 },
        ],
    },
    {
        category: 'OVERALL',
        label: 'Nature-related Dependencies & Pressures',
        exposureType: 'indirect',
        data: [
            { subject: 'Aerosol', Pressures: 28.0, Dependencies: 23.1 },
            { subject: 'Stratospheric ozone', Pressures: 0, Dependencies: 0 },
            { subject: 'Ocean acidification', Pressures: 11.9, Dependencies: 13.7 },
            { subject: 'Landsystem change', Pressures: 22.9, Dependencies: 56.6 },
            { subject: 'Freshwater use', Pressures: 35.3, Dependencies: 72.9 },
            { subject: 'Climate change', Pressures: 0, Dependencies: 56.8 },
            { subject: 'Biosphere integrity', Pressures: 53.9, Dependencies: 48.2 },
            { subject: 'Biogeochemical flows', Pressures: 57.1, Dependencies: 57.6 },
        ]
    }
];

// Chart Configuration
export const radarChartConfig = {
    title: 'Nature-related Dependencies & Pressures - Glencore Group',
    colors: {
        pressures: {
            stroke: '#4A90E2',
            fill: '#4A90E2',
        },
        dependencies: {
            stroke: '#7ED321',
            fill: '#7ED321',
        },
    },
    domain: [0, 100] as [number, number],
    tickCount: 6,
    fillOpacity: 0.6,
    strokeWidth: 2,
    height: 600,
};