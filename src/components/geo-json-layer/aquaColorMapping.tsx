import { BASELINE_1_COLOR, BASELINE_2_COLOR, BASELINE_3_COLOR, BASELINE_4_COLOR, BASELINE_5_COLOR, BASELINE_6_COLOR, BASELINE_NO_DATA_COLOR } from "./color-constants";

export const labelColorMap: Record<string, string> = {
    "Arid and Low Water Use": BASELINE_1_COLOR,
    "Low (<10%)": BASELINE_2_COLOR,
    "Low - Medium (10-20%)": BASELINE_3_COLOR,
    "Medium - High (20-40%)": BASELINE_4_COLOR,
    "High (40-80%)": BASELINE_5_COLOR,
    "Extremely High (>80%)": BASELINE_6_COLOR,
    "No Data": BASELINE_NO_DATA_COLOR,
};