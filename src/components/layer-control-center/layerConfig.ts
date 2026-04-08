import { API_ENDPOINTS } from "../../constants/apiEndpoints";
import { client } from "../../services/axiosClient";
import { getBackendImageUrl } from "../../services/utils";
import { getCdnUrl } from "../../utils/publicPath";

export interface LayerCheckboxConfig {
  key: string;
  label: string;
  isHeading?: boolean;
  stateKey?: string;
  actionImport?: string;
  tooltip?: string;
  defaultOption?: string;
  options?: { key: string; label: string; stateKey?: string; actionImport?: string }[];
  renderFile?: (year: number | string) => string;
}


export interface MainCheckboxConfig {
  key: string;
  stateKey?: string;
  actionImport?: string;
}


export interface LayerSectionConfig {
  sectionKey: string;
  oneCheckBoxAtATime?: boolean;
  title: string;
  checkboxes: LayerCheckboxConfig[];
  mainCheck?: MainCheckboxConfig;
}


export const layerSections: LayerSectionConfig[] = [
  {
    sectionKey: 'landSystemChange',
    title: 'A. Land system change',
    mainCheck: {
      key: 'proximity',
      stateKey: 'isProximityLayerEnabled',
      actionImport: 'setLayerForProximityToSensitiveLocations',
    },
    checkboxes: [
      // Proximity to sensitive locations heading (simple object)
      {
        key: 'proximityGroupHeading',
        label: 'Proximity to sensitive areas',
        tooltip: 'Restrictions aligned with SCB’s Position Statements.',
        isHeading: true
      },
      {
        key: 'proximity',
        label: 'Select All',
        stateKey: 'isProximityLayerEnabled',
        actionImport: 'setLayerForProximityToSensitiveLocations',
        tooltip: 'Enable all proximity layers.'
      },
      {
        key: 'keyBiodiversity',
        label: 'Key Biodiversity Area',
        stateKey: 'KBAPOL2024STREAM_Layer',
        actionImport: 'setShow_KBAPOL2024STREAM_Layer',
        tooltip: 'An area which holds a significant proportion of the global population size of a species facing a high risk of extinction.'
      },
      {
        key: 'iucn',
        label: 'IUCN I-III Sites',
        stateKey: 'WDPA00STREAM_Layer',
        actionImport: 'setShow_WDPA00STREAM_Layer',
        tooltip: 'A geographical space recognized and managed to conserve nature and its associated benefits.'
      },
      {
        key: 'ramsar',
        label: 'RAMSAR Wetland',
        stateKey: 'RAMSARSTREAM_Layer',
        actionImport: 'setShow_RAMSARSTREAM_Layer',
        tooltip: 'A wetland designated as being of international importance under the Ramsar Convention.'
      },
      {
        key: 'whs',
        label: 'UNESCO World Heritage Site',
        stateKey: 'WHS_STREAM_Layer',
        actionImport: 'setShow_WHS_STREAM_Layer',
        tooltip: 'A location designated by UNESCO as having significant cultural or natural importance.'
      },
      // Tree cover loss heading (simple object)
      {
        key: 'treeCoverLossHeading',
        label: 'Tree cover loss',
        isHeading: true
      },
      {
        key: 'landUseChange',
        label: 'Tree Cover Loss',
        stateKey: 'isGFCLayerEnabled',
        actionImport: 'setLayerForGFCTreeCoverLoss',
        tooltip: 'Complete removal of tree cover (Height of at least 5m and a canopy density of at least 30% at 30m resolution) for any reason, including human-caused loss and natural events.'
      },
      // Change in nature land
      {
        key: 'changeInNatureLandHeading',
        label: 'Change in nature land',
        isHeading: true
      },
      {
        key: 'lu',
        label: 'Land Use',
        defaultOption: '1992',
        stateKey: 'show_Land_Use_Layer',
        actionImport: 'setShow_Land_Use_Layer',
        options: [
          {
            key: '1992',
            label: '1992'
          },
          {
            key: '1995',
            label: '1995' 
          },
          {
            key: '2000',
            label: '2000' 
          },
          {
            key: '2005',
            label: '2005' 
          },
          {
            key: '2010',
            label: '2010'
          },
          {
            key: '2015',
            label: '2015'
          },
          {
            key: '2020',
            label: '2020'
          }
        ],
        tooltip: 'The transformation of forests, grasslands, and other natural areas through land use and other human actions from 1992 - 2020.'
      }
    ],
  },
  {
    sectionKey: 'freshWaterUse',
    title: 'B. Fresh water use',
    oneCheckBoxAtATime: true,
    checkboxes: [
      {
        key: 'waterBasslineStress',
        label: 'Baseline Water Stress',
        stateKey: 'aquaductBassline_Layer',
        actionImport: 'setShow_AquaductBassline_Layer',
        tooltip: 'Ratio of total water demand to available renewable surface and groundwater supplies.'
      },
      {
        key: 'bod',
        label: 'Biochemical Oxygen Demand',
        stateKey: 'show_BOD_Layer',
        actionImport: 'setShow_BOD_Layer',
        tooltip: 'Measures the amount of oxygen consumed by microorganisms while decomposing organic matter in water.',
        renderFile: () => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=dynqual/bod_png_3857/BODload_annualAvg_1980_2019_2019_3857.png`),
      },
    ],
  },
  {
    sectionKey: 'aerosol',
    title: 'C. Aerosol',
    oneCheckBoxAtATime: true,
    checkboxes: [
      {
        key: 'edgar_pm25',
        label: 'PM2.5',
        stateKey: 'show_Edgar_PM25_Layer',
        actionImport: 'setShow_Edgar_PM25_Layer',
        tooltip: 'Fine particulate matter that are 2.5 microns or less in diameter, which is associated with the greatest proportion of adverse health effects related to air pollution.',
        renderFile: (year: number | string) => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=edgar/pm25_png_3857/v8.1_FT2022_AP_PM2.5_${year}_TOTALS_emi_3857.png`),
      },
      {
        key: 'edgar_co',
        label: 'Carbon Monoxide (CO)',
        stateKey: 'show_Edgar_CO_Layer',
        actionImport: 'setShow_Edgar_CO_Layer',
        tooltip: 'Tooltip for CO',
        renderFile: (year: number | string) => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=edgar/co_png_3857/v8.1_FT2022_AP_CO_${year}_TOTALS_emi_3857.png`),
      },
      {
        key: 'edgar_nh3',
        label: 'Ammonia (NH3)',
        stateKey: 'show_Edgar_NH3_Layer',
        actionImport: 'setShow_Edgar_NH3_Layer',
        tooltip: 'Tooltip for NH3',
        renderFile: (year: number | string) => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=edgar/nh3_png_3857/v8.1_FT2022_AP_NH3_${year}_TOTALS_emi_3857.png`),
      },
      {
        key: 'edgar_so2',
        label: 'Sulfur Dioxide (SO2)',
        stateKey: 'show_Edgar_SO2_Layer',
        actionImport: 'setShow_Edgar_SO2_Layer',
        tooltip: 'Tooltip for SO2',
        renderFile: (year: number | string) => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=edgar/so2_png_3857/v8.1_FT2022_AP_SO2_${year}_TOTALS_emi_3857.png`),
      },
      {
        key: 'edgar_nox',
        label: 'Nitrogen Oxides (NOx)',
        stateKey: 'show_Edgar_NOx_Layer',
        actionImport: 'setShow_Edgar_NOx_Layer',
        tooltip: 'Tooltip for NOx',
        renderFile: (year: number | string) => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=edgar/nox_png_3857/v8.1_FT2022_AP_NOx_${year}_TOTALS_emi_3857.png`),
      },
      {
        key: 'edgar_hg',
        label: 'Mercury (Hg)',
        stateKey: 'show_Edgar_Hg_Layer',
        actionImport: 'setShow_Edgar_Hg_Layer',
        tooltip: 'Tooltip for Hg',
        renderFile: (year: number | string) => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=edgar/tox_hg_png_3857/v8.1_FT2022_TOX_Hg_${year}_TOTALS_emi_3857.png`),
      },
    ],
  },
  {
    sectionKey: 'biogeochemicalFlows',
    title: 'D. Biogeochemical flows',
    checkboxes: [
      {
        key: 'tds',
        label: 'Total Dissolved Solids (TDS)',
        stateKey: 'show_TDS_Layer',
        actionImport: 'setShow_TDS_Layer',
        tooltip: 'Total weight of all dissolved inorganic solids in a given volume of water.',
        renderFile: () => getBackendImageUrl(`${API_ENDPOINTS.GET_PNG}?path=dynqual/tds_png_3857/TDSload_annualAvg_1980_2019_2019_3857.png`),
      },
    ],
  },
  {
    sectionKey: 'biosphereIntegrity',
    title: 'E. Biosphere Integrity',
    checkboxes: [
      {
        key: 'msa',
        label: 'Mean Species Abundance',
        defaultOption: 'SSP5',
        stateKey: 'show_MSA_Layer',
        actionImport: 'setShow_MSA_Layer',
        tooltip: 'The average abundance of native species in a specific area compared to their abundance in an undisturbed, pristine environment. Ranges from 0 (no native species present) to 1 (no human interference).'
      },
    ],
  },
];
